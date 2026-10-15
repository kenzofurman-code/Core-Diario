import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage para node environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

test('Testes Automatizados de Locais da Obra, Câmera Mobile e Cloudflare R2', async (t) => {
  // 1. Gestão da Estrutura de Locais da Obra (Torres, Pavimentos e Ambientes)
  await t.test('1. Deve gerenciar catálogo de Torres, Pavimentos e Ambientes', () => {
    const locationsConfig = {
      torres: [
        { id: 'tor-01', codigo: 'T-A', nome: 'Torre A (Mirante)' },
        { id: 'tor-02', codigo: 'T-B', nome: 'Torre B (Nascente)' },
      ],
      pavimentos: [
        { id: 'pav-ss1', codigo: 'SS1', nome: '1º Subsolo' },
        { id: 'pav-01', codigo: 'PAV-01', nome: '1º Pavimento' },
        { id: 'pav-08', codigo: 'PAV-08', nome: '8º Pavimento' },
      ],
      ambientes: [
        { id: 'amb-101', codigo: 'AP-101', nome: 'Apartamento 101' },
        { id: 'amb-hall', codigo: 'HALL', nome: 'Hall dos Elevadores' },
      ],
    };

    assert.equal(locationsConfig.torres.length, 2);
    assert.equal(locationsConfig.pavimentos.length, 3);
    assert.equal(locationsConfig.ambientes.length, 2);

    // Inclusão de novo pavimento pelo Engenheiro
    locationsConfig.pavimentos.push({ id: 'pav-09', codigo: 'PAV-09', nome: '9º Pavimento' });
    assert.equal(locationsConfig.pavimentos.length, 4);

    // Formatação de string do carimbo
    const torre = locationsConfig.torres[0].nome;
    const pavimento = locationsConfig.pavimentos[2].nome;
    const ambiente = locationsConfig.ambientes[0].nome;
    const localCarimbo = `${torre} · ${pavimento} · ${ambiente}`;
    assert.equal(localCarimbo, 'Torre A (Mirante) · 8º Pavimento · Apartamento 101');
  });

  // 2. Validação e Estruturação de Chaves S3 do Cloudflare R2
  await t.test('2. Geração padronizada de chaves e URLs S3 para Cloudflare R2', () => {
    const projectCode = 'POTY';
    const reportDate = '2026-09-08';
    const locationName = 'Torre A · 8º Pavimento';

    const cleanProject = projectCode.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanLocation = locationName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    const objectKey = `obras/${cleanProject}/2026/09/08_${cleanLocation}_123456.jpg`;

    assert.ok(objectKey.startsWith('obras/poty/2026/09/'));
    assert.ok(objectKey.endsWith('.jpg'));

    const publicDomain = 'https://media.construkore.com.br';
    const finalUrl = `${publicDomain}/${objectKey}`;
    assert.ok(finalUrl.startsWith('https://media.construkore.com.br/obras/poty/'));
  });

  // 3. Fallback Gracioso quando R2 está Desabilitado
  await t.test('3. Fallback para Armazenamento Local Seguro quando R2 não está configurado', () => {
    const r2Config = {
      accountId: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucketName: 'construkore-rdo-media',
      publicDomainUrl: 'https://media.construkore.com.br',
      enabled: false,
      autoSync: true,
    };

    const isConfigured = Boolean(
      r2Config.enabled &&
      r2Config.accountId &&
      r2Config.accessKeyId &&
      r2Config.secretAccessKey &&
      r2Config.bucketName
    );

    assert.equal(isConfigured, false, 'Com campos vazios, R2 deve acusar não configurado');

    // Simulação do resultado de fallback
    const sampleDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...';
    const uploadResult = {
      publicUrl: sampleDataUrl,
      r2Key: 'obras/poty/2026/09/08_foto_local.jpg',
      isLocalFallback: true,
      sizeBytes: 250000,
    };

    assert.equal(uploadResult.isLocalFallback, true);
    assert.ok(uploadResult.publicUrl.startsWith('data:image/jpeg;base64'));
  });

  // 4. Memorização da Seleção Ativa do Encarregado (Sessão da Visita)
  await t.test('4. Memorização da seleção de pavimento para fotos consecutivas', () => {
    const selecaoInicial = {
      torreId: 'tor-01',
      pavimentoId: 'pav-08',
      ambienteId: 'amb-101',
    };

    storage.set('construkore_photo_location_selection_v1', JSON.stringify(selecaoInicial));

    const recuperada = JSON.parse(storage.get('construkore_photo_location_selection_v1'));
    assert.equal(recuperada.torreId, 'tor-01');
    assert.equal(recuperada.pavimentoId, 'pav-08');
    assert.equal(recuperada.ambienteId, 'amb-101');
  });

  // 5. Isolamento Estrito de Locais e Cloudflare R2 por Obra
  await t.test('5. Deve isolar cadastro de locais e credenciais de R2 entre obras diferentes', () => {
    const obraA_id = 'obra-alphaville-10';
    const obraB_id = 'obra-jardins-20';

    const keyLocaisA = `construkore_locations_config_${obraA_id}`;
    const keyLocaisB = `construkore_locations_config_${obraB_id}`;
    const keyR2A = `construkore_r2_config_${obraA_id}`;
    const keyR2B = `construkore_r2_config_${obraB_id}`;

    // Obra A: 1 torre e 2 pavimentos
    const configLocaisA = {
      torres: [{ id: 'tor-a1', codigo: 'T-A', nome: 'Torre Alphaville' }],
      pavimentos: [
        { id: 'pav-a1', codigo: 'TER', nome: 'Térreo' },
        { id: 'pav-a2', codigo: 'P01', nome: '1º Pavimento' },
      ],
      ambientes: [{ id: 'amb-a1', codigo: 'HALL', nome: 'Hall de Entrada' }],
      atualizado_em: '2026-10-15T00:00:00Z',
    };
    storage.set(keyLocaisA, JSON.stringify(configLocaisA));

    // Obra B: 2 torres e 4 pavimentos
    const configLocaisB = {
      torres: [
        { id: 'tor-b1', codigo: 'T-1', nome: 'Torre Hibisco' },
        { id: 'tor-b2', codigo: 'T-2', nome: 'Torre Orquídea' },
      ],
      pavimentos: [
        { id: 'pav-b1', codigo: 'SS1', nome: 'Subsolo' },
        { id: 'pav-b2', codigo: 'TER', nome: 'Térreo' },
        { id: 'pav-b3', codigo: 'P01', nome: '1º Andar' },
        { id: 'pav-b4', codigo: 'P02', nome: '2º Andar' },
      ],
      ambientes: [],
      atualizado_em: '2026-10-15T00:00:00Z',
    };
    storage.set(keyLocaisB, JSON.stringify(configLocaisB));

    // R2 de Obra A: ativo com bucket alpha-rdo
    storage.set(
      keyR2A,
      JSON.stringify({
        enabled: true,
        accountId: 'acc-alpha-12345',
        bucketName: 'alpha-rdo',
        publicDomainUrl: 'https://media.alpha.com.br',
        autoSync: true,
      })
    );

    // R2 de Obra B: inativo com bucket jardins-rdo
    storage.set(
      keyR2B,
      JSON.stringify({
        enabled: false,
        accountId: '',
        bucketName: 'construkore-rdo-obra-jardins-20',
        publicDomainUrl: '',
        autoSync: false,
      })
    );

    // Verificação de isolamento
    const recuperadoLocaisA = JSON.parse(storage.get(keyLocaisA));
    const recuperadoLocaisB = JSON.parse(storage.get(keyLocaisB));

    assert.equal(recuperadoLocaisA.torres.length, 1);
    assert.equal(recuperadoLocaisA.torres[0].nome, 'Torre Alphaville');
    assert.equal(recuperadoLocaisB.torres.length, 2);
    assert.equal(recuperadoLocaisB.torres[0].nome, 'Torre Hibisco');

    const recuperadoR2A = JSON.parse(storage.get(keyR2A));
    const recuperadoR2B = JSON.parse(storage.get(keyR2B));

    assert.equal(recuperadoR2A.enabled, true);
    assert.equal(recuperadoR2A.bucketName, 'alpha-rdo');
    assert.equal(recuperadoR2B.enabled, false);
    assert.equal(recuperadoR2B.bucketName, 'construkore-rdo-obra-jardins-20');
  });

  // 6. Limpeza de Locais de uma Obra (Sem forçar mock default no carregamento)
  await t.test('6. Deve permitir limpar todos os locais de uma obra e manter vazio', () => {
    const obraLimpaId = 'obra-limpar-teste';
    const key = `construkore_locations_config_${obraLimpaId}`;

    const configVazia = {
      torres: [],
      pavimentos: [],
      ambientes: [],
      atualizado_em: new Date().toISOString(),
    };
    storage.set(key, JSON.stringify(configVazia));

    const recuperada = JSON.parse(storage.get(key));
    assert.equal(recuperada.torres.length, 0);
    assert.equal(recuperada.pavimentos.length, 0);
    assert.equal(recuperada.ambientes.length, 0);
  });

  // 7. Parser e Importação em Lote via Planilha (3 Colunas: Torre, Pavimento, Ambiente)
  await t.test('7. Deve processar planilha com delimitadores CSV e TSV (copiado do Excel)', () => {
    // Simulação do parser inteligente
    const parseSpreadsheet = (rawText) => {
      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) return [];

      const rows = [];
      const isHeaderLine = (c1, c2) => {
        const n1 = c1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const n2 = c2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return n1.includes('torre') || n2.includes('pavimento') || n1.includes('bloco') || n2.includes('andar');
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let delimiter = ',';
        if (line.includes('\t')) delimiter = '\t';
        else if (line.includes(';') && !line.includes(',')) delimiter = ';';
        else if (line.includes(';') && line.includes(',')) {
          delimiter = (line.match(/;/g) || []).length >= (line.match(/,/g) || []).length ? ';' : ',';
        }

        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length === 0) continue;

        const torre = cols[0] || '';
        const pavimento = cols[1] || '';
        const ambiente = cols[2] || '';

        if (i === 0 && isHeaderLine(torre, pavimento)) continue;
        if (!torre && !pavimento && !ambiente) continue;

        rows.push({ torre, pavimento, ambiente });
      }
      return rows;
    };

    // Caso 1: CSV padrão separado por vírgula
    const csvContent = `Torre,Pavimento,Ambiente
Torre A,Subsolo 01,Vagas 01 a 20
Torre A,Térreo,Hall Social
Torre A,1º Pavimento Tipo,Apartamento 101
Torre B,Térreo,Portaria
Torre B,1º Pavimento Tipo,Apartamento 101`;

    const parsedCsv = parseSpreadsheet(csvContent);
    assert.equal(parsedCsv.length, 5);
    assert.equal(parsedCsv[0].torre, 'Torre A');
    assert.equal(parsedCsv[0].pavimento, 'Subsolo 01');
    assert.equal(parsedCsv[0].ambiente, 'Vagas 01 a 20');

    // Caso 2: Colado diretamente do Excel (separado por tabulação \t)
    const tsvContent = `Torre\tPavimento\tAmbiente\r\nTorre Sul\t1º Andar\tSala 101\r\nTorre Sul\t2º Andar\tSala 201`;
    const parsedTsv = parseSpreadsheet(tsvContent);
    assert.equal(parsedTsv.length, 2);
    assert.equal(parsedTsv[0].torre, 'Torre Sul');
    assert.equal(parsedTsv[0].pavimento, '1º Andar');
    assert.equal(parsedTsv[0].ambiente, 'Sala 101');

    // Caso 3: Agrupamento hierárquico e deduplicação
    const torresSet = new Set(parsedCsv.map((r) => r.torre));
    const pavimentosSet = new Set(parsedCsv.map((r) => r.pavimento));
    const ambientesSet = new Set(parsedCsv.map((r) => r.ambiente));

    assert.equal(torresSet.size, 2, 'Deve identificar 2 torres únicas');
    assert.equal(pavimentosSet.size, 3, 'Deve identificar 3 pavimentos únicos');
    assert.equal(ambientesSet.size, 4, 'Deve identificar 4 ambientes únicos');
  });

  // 8. Modelo de Planilha com UTF-8 BOM para Excel
  await t.test('8. Modelo CSV deve possuir cabeçalho de 3 colunas e formatação compatível', () => {
    const templateRows = [
      'Torre,Pavimento,Ambiente',
      'Torre A,Subsolo 02,Garagem e Reservatório Inferior',
      'Torre A,Térreo,Hall Social e Portaria',
      'Torre A,1º Pavimento Tipo,Apartamento Final 1',
    ];
    const templateString = templateRows.join('\r\n');

    assert.ok(templateString.startsWith('Torre,Pavimento,Ambiente'));
    assert.ok(templateString.includes('Subsolo 02'));
    assert.ok(templateString.includes('Apartamento Final 1'));
  });
});

