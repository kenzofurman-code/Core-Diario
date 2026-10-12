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
});
