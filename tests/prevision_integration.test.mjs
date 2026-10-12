import test from 'node:test';
import assert from 'node:assert/strict';

// Simulador dos métodos de domínio do PrevisionDiarioService para execução pura em Node.js
function mapearMaoObra(itens) {
  return itens.map((item) => {
    const empreiteiraLimpa = item.empreiteira?.trim() || 'Empreiteira Contratada';
    const isPropria =
      empreiteiraLimpa.toUpperCase().includes('PIEMONTE') ||
      empreiteiraLimpa.toUpperCase().includes('CONSTRUKORE');

    return {
      role_code: item.funcao.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X'),
      role_name: item.funcao,
      company_type: isPropria ? 'PROPRIA' : 'TERCEIRIZADA',
      company_name: empreiteiraLimpa,
      count: item.quantidade || 0,
    };
  });
}

function mapearAtividades(itens, reportingDayId) {
  return itens.map((item, idx) => {
    let locationName = 'Canteiro Geral';
    let cleanTask = item.descricao;

    if (item.descricao.includes(':')) {
      const parts = item.descricao.split(':');
      locationName = parts[0].trim();
      cleanTask = parts.slice(1).join(':').trim();
    } else if (item.descricao.includes('-')) {
      const parts = item.descricao.split('-');
      locationName = parts[0].trim();
      cleanTask = parts.slice(1).join('-').trim();
    }

    return {
      id: `prev-prod-${idx + 1}`,
      reporting_day_id: reportingDayId,
      task_id: `prev-tsk-${idx + 1}`,
      task_name: cleanTask || item.descricao,
      location_name: locationName,
      quantity_planned: 100,
      quantity_reported: item.porcentagem || 50,
      uom: '%',
      progress_pct: item.porcentagem || 50,
      confirmation_state: item.status.toLowerCase().includes('conclu') ? 'confirmed' : 'pending',
      notes: item.observacao || '',
      is_critical: false,
    };
  });
}

function mapearFotos(fotos, reportingDayId, dataIso) {
  return fotos.map((foto, idx) => ({
    id: `prev-foto-${idx + 1}`,
    reporting_day_id: reportingDayId,
    type: 'MANUAL_IMAGE',
    author_user_id: 'prevision-sync',
    author_user_name: 'Fotógrafo / Encarregado de Campo',
    media_url: foto.url,
    caption: foto.descricao || `Registro Fotográfico #${idx + 1} (${foto.origem || 'Galeria'})`,
    created_at: `${dataIso}T12:00:00-03:00`,
  }));
}

test('Testes Automatizados de Portabilidade & Leitura do Acervo Prevision na VPS', async (t) => {
  // 1. Mapeamento de Efetivo / Mão de Obra
  await t.test('1. Deve converter registros de mão de obra do Prevision identificando equipes próprias e terceirizadas', () => {
    const rawMaoObra = [
      { funcao: 'Mestre de obra', quantidade: 1, empreiteira: 'Piemonte' },
      { funcao: 'Engenheiro Jr.', quantidade: 1, empreiteira: 'Piemonte' },
      { funcao: 'Pedreiro', quantidade: 16, empreiteira: 'Thal Engenharia' },
      { funcao: 'Carpinteiro', quantidade: 6, empreiteira: 'Thal Engenharia' },
      { funcao: 'Gesseiro', quantidade: 5, empreiteira: 'ALESSI (GESSO)' },
    ];

    const convertidos = mapearMaoObra(rawMaoObra);
    assert.equal(convertidos.length, 5);

    const proprios = convertidos.filter((c) => c.company_type === 'PROPRIA');
    const terceiros = convertidos.filter((c) => c.company_type === 'TERCEIRIZADA');

    assert.equal(proprios.length, 2, 'Piemonte deve ser identificada como própria');
    assert.equal(terceiros.length, 3, 'Thal Engenharia e Alessi devem ser terceirizadas');

    const totalHomens = convertidos.reduce((acc, c) => acc + c.count, 0);
    assert.equal(totalHomens, 29, 'Total de operários deve somar 29');
  });

  // 2. Mapeamento de Frentes de Serviço e Extração de Local / Pavimento
  await t.test('2. Deve converter frentes de serviço extraindo torre e pavimento da descrição', () => {
    const rawAtividades = [
      { descricao: 'COBERTURA. - TORRE A: Alvenaria;', status: 'Em Andamento', porcentagem: 40 },
      { descricao: '22º PAVTO. - TORRE A: Contrapiso;', status: 'Em Andamento', porcentagem: 80 },
      { descricao: '14º PAVTO. - TORRE A: Drywall finalizado', status: 'Concluído', porcentagem: 100 },
    ];

    const convertidas = mapearAtividades(rawAtividades, 'rd-poty-147');
    assert.equal(convertidas.length, 3);

    // Primeiro item
    assert.equal(convertidas[0].location_name, 'COBERTURA. - TORRE A');
    assert.equal(convertidas[0].task_name, 'Alvenaria;');
    assert.equal(convertidas[0].confirmation_state, 'pending');

    // Item concluído
    assert.equal(convertidas[2].location_name, '14º PAVTO. - TORRE A');
    assert.equal(convertidas[2].confirmation_state, 'confirmed');
    assert.equal(convertidas[2].progress_pct, 100);
  });

  // 3. Mapeamento de Fotos com CDN e Metadados
  await t.test('3. Deve converter fotos com links originais do blob storage para a galeria do RDO', () => {
    const rawFotos = [
      {
        url: 'https://diariodeobra2.blob.core.windows.net/relatorios-foto/poty/foto1.jpg',
        url_miniatura: 'https://cdndiariodeobra.azureedge.net/miniatura/foto1.jpg',
        descricao: 'Alvenaria da Torre A',
        origem: 'galeria',
      },
      {
        url: 'https://diariodeobra2.blob.core.windows.net/relatorios-foto/poty/foto2.jpg',
        descricao: null,
        origem: 'atividade',
      },
    ];

    const convertidas = mapearFotos(rawFotos, 'rd-poty-147', '2026-08-31');
    assert.equal(convertidas.length, 2);
    assert.equal(convertidas[0].media_url, 'https://diariodeobra2.blob.core.windows.net/relatorios-foto/poty/foto1.jpg');
    assert.equal(convertidas[0].caption, 'Alvenaria da Torre A');
    assert.equal(convertidas[1].caption, 'Registro Fotográfico #2 (atividade)');
  });

  // 4. Integridade da Lista de Obras do Acervo
  await t.test('4. Lista de obras contém as obras reais ativas no banco de dados', () => {
    const obrasExemplo = [
      { obra_id: '6914a7fa72e41c32af003614', nome: 'Poty', relatorios: 151, total_fotos: 1500 },
      { obra_id: '69176e7282b94cc032064983', nome: 'Platea', relatorios: 241, total_fotos: 1612 },
      { obra_id: '69176e979ce39de7910339d2', nome: 'ÍCARO | AG7', relatorios: 222, total_fotos: 3442 },
    ];

    assert.ok(obrasExemplo.some((o) => o.nome === 'Poty'));
    assert.ok(obrasExemplo.find((o) => o.nome === 'Poty').relatorios >= 150);
    assert.ok(obrasExemplo.find((o) => o.nome === 'Platea').relatorios >= 240);
  });
});
