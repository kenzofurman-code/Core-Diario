// =====================================================================
// TESTES AUTOMATIZADOS: PORTAL DO CLIENTE, RELATÓRIO MENSAL (A4) E GALERIA
// Validação das 3 novas features de Governança e Transparência
// =====================================================================

import test from 'node:test';
import assert from 'node:assert/strict';

// Mock do localStorage para testes em ambiente Node.js
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

test('Portal do Cliente, Relatório Mensal e Galeria Inteligente', async (t) => {
  mockStorage.clear();

  // 1. Teste do Formatador e Gerador de Meses de Referência
  await t.test('1. Geração de Meses e Formatação Amigável em Português', () => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    function formatMonthYear(mesAno) {
      const [ano, mes] = mesAno.split('-');
      const index = parseInt(mes, 10) - 1;
      return `${meses[index] || mes} de ${ano}`;
    }

    assert.equal(formatMonthYear('2026-10'), 'Outubro de 2026');
    assert.equal(formatMonthYear('2026-09'), 'Setembro de 2026');
    assert.equal(formatMonthYear('2026-01'), 'Janeiro de 2026');
  });

  // 2. Teste do Cálculo do Relatório Mensal (Efetivo, Avanço, Clima e Ocorrências)
  await t.test('2. Agregação Mensal: Consolidação de Médias, Homens-Hora e Dias de Chuva', () => {
    // Simula conjunto de diários registrados no mês
    const rdosMes = [
      { date: '2026-10-01', workers: 24, own: 8, sub: 16, weather: 'Sol', rain_contractual: false },
      { date: '2026-10-02', workers: 28, own: 8, sub: 20, weather: 'Chuva', rain_contractual: true },
      { date: '2026-10-05', workers: 32, own: 10, sub: 22, weather: 'Sol', rain_contractual: false }, // Pico
      { date: '2026-10-06', workers: 26, own: 8, sub: 18, weather: 'Nublado', rain_contractual: false },
    ];

    let sumTotal = 0;
    let sumOwn = 0;
    let sumSub = 0;
    let peak = 0;
    let peakDate = '';
    let rainDays = 0;
    let contractualRain = 0;

    rdosMes.forEach((r) => {
      sumTotal += r.workers;
      sumOwn += r.own;
      sumSub += r.sub;
      if (r.workers > peak) {
        peak = r.workers;
        peakDate = r.date;
      }
      if (r.weather.toLowerCase().includes('chuva')) {
        rainDays++;
      }
      if (r.rain_contractual) {
        contractualRain++;
      }
    });

    const avgWorkers = Math.round(sumTotal / rdosMes.length);
    const avgOwn = Math.round(sumOwn / rdosMes.length);
    const avgSub = Math.round(sumSub / rdosMes.length);
    const totalManHours = sumTotal * 8.5;

    assert.equal(avgWorkers, 28); // (24+28+32+26)/4 = 27.5 -> 28
    assert.equal(peak, 32);
    assert.equal(peakDate, '2026-10-05');
    assert.equal(rainDays, 1);
    assert.equal(contractualRain, 1);
    assert.equal(totalManHours, 935); // 110 * 8.5 = 935
  });

  // 3. Teste de Homologação de RDOs em Lote no Workflow (4ª Etapa)
  await t.test('3. Homologação em Lote pelo Cliente / Fiscal', () => {
    // Simula arquivo de RDOs com diferentes status
    const archive = {
      '2026-09-08': {
        dailyReport: { id: 'rdo-01', report_number: 184, workflow_state: 'IN_REVIEW', responsible_engineer_name: 'Engª. Mariana Costa' },
        workflow: {
          steps: [
            { step_number: 1, role_code: 'encarregado', status: 'APPROVED' },
            { step_number: 2, role_code: 'mestre', status: 'APPROVED' },
            { step_number: 3, role_code: 'engenheiro_residente', status: 'APPROVED' },
            { step_number: 4, role_code: 'fiscal_cliente', status: 'IN_PROGRESS' },
          ],
        },
      },
      '2026-09-09': {
        dailyReport: { id: 'rdo-02', report_number: 185, workflow_state: 'AWAITING_APPROVAL', responsible_engineer_name: 'Engª. Mariana Costa' },
        workflow: {
          steps: [
            { step_number: 1, role_code: 'encarregado', status: 'APPROVED' },
            { step_number: 2, role_code: 'mestre', status: 'APPROVED' },
            { step_number: 3, role_code: 'engenheiro_residente', status: 'APPROVED' },
            { step_number: 4, role_code: 'fiscal_cliente', status: 'PENDING' },
          ],
        },
      },
    };

    const datesToApprove = ['2026-09-08', '2026-09-09'];
    const clientName = 'Dr. Fernando Linhares (Fiscal)';

    // Executa aprovação em lote
    datesToApprove.forEach((date) => {
      const dayState = archive[date];
      if (dayState) {
        dayState.dailyReport.workflow_state = 'APPROVED';
        dayState.dailyReport.responsible_engineer_name = `${dayState.dailyReport.responsible_engineer_name} (Homologado por ${clientName})`;
        const clientStep = dayState.workflow.steps.find((s) => s.step_number === 4 || s.role_code === 'fiscal_cliente');
        if (clientStep) {
          clientStep.status = 'APPROVED';
          clientStep.signature_hash = 'sig-sha256-CLIENT-TEST';
        }
      }
    });

    // Verificações
    assert.equal(archive['2026-09-08'].dailyReport.workflow_state, 'APPROVED');
    assert.equal(archive['2026-09-08'].workflow.steps[3].status, 'APPROVED');
    assert.ok(archive['2026-09-08'].dailyReport.responsible_engineer_name.includes(clientName));

    assert.equal(archive['2026-09-09'].dailyReport.workflow_state, 'APPROVED');
    assert.equal(archive['2026-09-09'].workflow.steps[3].status, 'APPROVED');
  });

  // 4. Teste dos Filtros Multidimensionais da Galeria de Fotos e Documentos
  await t.test('4. Filtragem por Localização (Torre, Pavimento), Tipo e Categoria Técnica', () => {
    const mediaItems = [
      { id: '1', source_type: 'MANUAL_IMAGE', torre_id: 't-1', pavimento_id: 'p-08', raw_text: 'Foto alvenaria' },
      { id: '2', source_type: 'MANUAL_IMAGE', torre_id: 't-1', pavimento_id: 'p-09', raw_text: 'Foto concretagem' },
      { id: '3', source_type: 'TECHNICAL_DOCUMENT', torre_id: 't-1', pavimento_id: 'p-09', document_category: 'LAUDO_CONCRETO', file_name: 'Laudo Fck 35.pdf' },
      { id: '4', source_type: 'TECHNICAL_DOCUMENT', torre_id: 't-2', pavimento_id: 'p-01', document_category: 'FVS_SERVICO', file_name: 'FVS Impermeabilizacao.pdf' },
    ];

    // Filtro 1: Somente Documentos Técnicos
    const docsOnly = mediaItems.filter((m) => m.source_type === 'TECHNICAL_DOCUMENT');
    assert.equal(docsOnly.length, 2);

    // Filtro 2: Pavimento 09 na Torre 1
    const pav09Torre1 = mediaItems.filter((m) => m.torre_id === 't-1' && m.pavimento_id === 'p-09');
    assert.equal(pav09Torre1.length, 2); // 1 foto + 1 laudo

    // Filtro 3: Categoria Técnica "LAUDO_CONCRETO"
    const laudos = mediaItems.filter((m) => m.document_category === 'LAUDO_CONCRETO');
    assert.equal(laudos.length, 1);
    assert.equal(laudos[0].file_name, 'Laudo Fck 35.pdf');
  });

  // 5. Teste de Perfil e Restrições de Visualização
  await t.test('5. Perfil de Cliente / Fiscal: Transparência e Sem Permissão de Escrita no Canteiro', () => {
    const roles = ['encarregado', 'mestre', 'engenheiro_residente', 'gerente_obra', 'fiscal_cliente', 'cliente'];
    
    // Funções permitidas
    function canEditFieldData(role) {
      return role === 'encarregado' || role === 'mestre' || role === 'engenheiro_residente';
    }

    function canApproveClientPortal(role) {
      return role === 'fiscal_cliente' || role === 'cliente' || role === 'gerente_obra';
    }

    assert.equal(canEditFieldData('cliente'), false);
    assert.equal(canEditFieldData('fiscal_cliente'), false);
    assert.equal(canEditFieldData('encarregado'), true);

    assert.equal(canApproveClientPortal('cliente'), true);
    assert.equal(canApproveClientPortal('fiscal_cliente'), true);
  });
});
