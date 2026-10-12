import test from 'node:test';
import assert from 'node:assert/strict';

// Mock do localStorage para testes em Node.js
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Simulador dos Contratos de Domínio de Histórico de RDO e Múltiplos Dias
const ARCHIVE_KEY = 'construkore_diary_archive_v1';
const CURRENT_KEY = 'construkore_diary_state_v7';

function createMockDayState(date, workflowState, reportNumber, workersCount) {
  return {
    project: { id: 'poty-01', codigo: 'POTY', nome: 'Residencial Poty Mirante' },
    currentUser: { id: 'usr-03', name: 'Engª. Mariana Costa', role: 'engenheiro_residente' },
    reportingDay: { id: `rep-day-${date}`, report_date: date, workflow_state: workflowState === 'ISSUED' ? 'CLOSED' : 'OPEN' },
    dailyReport: {
      id: `rdo-poty-${String(reportNumber).padStart(4, '0')}`,
      report_number: reportNumber,
      formatted_number: `POTY-RDO-${String(reportNumber).padStart(4, '0')}`,
      report_date: date,
      workflow_state: workflowState,
      responsible_engineer_name: 'Engª. Mariana Costa',
    },
    workforceSnapshot: {
      id: `wf-${date}`,
      total_workers: workersCount,
      entries: [
        { role_code: 'PED', role_name: 'Pedreiro', count: Math.floor(workersCount * 0.6), company_name: 'ConstruKore', company_type: 'PROPRIA' },
        { role_code: 'AJU', role_name: 'Ajudante', count: Math.ceil(workersCount * 0.4), company_name: 'ConstruKore', company_type: 'PROPRIA' },
      ],
      copied_from_yesterday: false,
    },
    productionEntries: [
      { id: `prod-${date}-1`, task_name: 'Alvenaria', quantity_planned: 100, quantity_reported: workflowState === 'ISSUED' ? 100 : 45 },
    ],
    versions: workflowState === 'ISSUED' ? [{ version_number: 1, document_hash: `SHA256-RDO-${reportNumber}-XYZ` }] : [],
    weatherSummary: { shifts: [{ condition: 'BOM_TEMPO' }], is_contractual_rain_day: false },
    sourceEvents: [{ id: 'se-1', media_url: 'https://media.poty.com/foto1.jpg' }],
    occurrences: [],
    conflicts: [],
    weeklyPlanTasks: [
      { id: 'wpt-01', task_name: 'Alvenaria', wbs_code: '01.01', location_name: 'Pav 08', quantity_planned_today: 20, quantity_planned_week: 100, is_critical: false, assigned_user_id: 'usr-02', assigned_user_name: 'Antônio Santos' },
    ],
    blockingRules: {},
  };
}

const ArchiveService = {
  getArchive() {
    const raw = globalThis.localStorage.getItem(ARCHIVE_KEY);
    if (!raw) {
      const initial = {
        '2026-09-09': createMockDayState('2026-09-09', 'DRAFT', 185, 24),
        '2026-09-08': createMockDayState('2026-09-08', 'IN_REVIEW', 184, 26),
        '2026-09-05': createMockDayState('2026-09-05', 'ISSUED', 183, 22),
      };
      globalThis.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  },
  saveArchive(archive) {
    globalThis.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  },
  getCurrentState() {
    const raw = globalThis.localStorage.getItem(CURRENT_KEY);
    if (!raw) {
      const archive = this.getArchive();
      const st = archive['2026-09-08'];
      globalThis.localStorage.setItem(CURRENT_KEY, JSON.stringify(st));
      return st;
    }
    return JSON.parse(raw);
  },
  saveCurrentState(st) {
    globalThis.localStorage.setItem(CURRENT_KEY, JSON.stringify(st));
  },
  listDailyReportsSummaries() {
    const archive = this.getArchive();
    const current = this.getCurrentState();
    archive[current.reportingDay.report_date] = current;

    const dates = Object.keys(archive).sort((a, b) => b.localeCompare(a));
    return dates.map((date) => {
      const day = archive[date];
      return {
        date,
        report_number: day.dailyReport.report_number,
        formatted_number: day.dailyReport.formatted_number,
        workflow_state: day.dailyReport.workflow_state,
        total_workers: day.workforceSnapshot?.total_workers || 0,
        document_hash: day.versions?.[day.versions.length - 1]?.document_hash,
        is_current_active: date === current.reportingDay.report_date,
      };
    });
  },
  switchReportingDay(targetDate) {
    const archive = this.getArchive();
    const current = this.getCurrentState();
    archive[current.reportingDay.report_date] = current;

    if (archive[targetDate]) {
      const targetState = archive[targetDate];
      this.saveArchive(archive);
      this.saveCurrentState(targetState);
      return targetState;
    }

    return this.createNewReportingDay({ targetDate, copyYesterdayWorkforce: true });
  },
  createNewReportingDay({ targetDate, copyYesterdayWorkforce = true }) {
    const archive = this.getArchive();
    const current = this.getCurrentState();
    archive[current.reportingDay.report_date] = current;

    const nextNumber = 186;
    const workers = copyYesterdayWorkforce ? current.workforceSnapshot.total_workers : 0;
    const newState = createMockDayState(targetDate, 'DRAFT', nextNumber, workers);
    newState.workforceSnapshot.copied_from_yesterday = copyYesterdayWorkforce;

    archive[targetDate] = newState;
    this.saveArchive(archive);
    this.saveCurrentState(newState);
    return newState;
  },
  deleteReportingDayDraft(targetDate) {
    const archive = this.getArchive();
    const day = archive[targetDate];
    if (!day) return this.getCurrentState();

    if (day.dailyReport.workflow_state === 'ISSUED') {
      throw new Error('Não é permitido excluir um Diário de Obra já emitido e congelado pericialmente.');
    }

    delete archive[targetDate];
    this.saveArchive(archive);

    const current = this.getCurrentState();
    if (current.reportingDay.report_date === targetDate) {
      const dates = Object.keys(archive).sort((a, b) => b.localeCompare(a));
      const nextDate = dates[0] || '2026-09-08';
      this.saveCurrentState(archive[nextDate]);
      return archive[nextDate];
    }
    return current;
  }
};

test('Histórico de Diários & Dias Anteriores — ConstruKore RDO', async (t) => {
  mockStorage.clear();

  await t.test('1. Deve listar relatórios diários de múltiplos dias com ordenação decrescente', () => {
    const list = ArchiveService.listDailyReportsSummaries();
    assert.ok(Array.isArray(list), 'Deve retornar array de relatórios');
    assert.ok(list.length >= 3, 'Deve conter pelo menos 3 relatórios no seed inicial');

    // Verifica ordenação por data decrescente
    for (let i = 0; i < list.length - 1; i++) {
      assert.ok(
        list[i].date >= list[i + 1].date,
        `Data ${list[i].date} deve ser mais recente ou igual a ${list[i + 1].date}`
      );
    }

    // Deve identificar dias emitidos e dias em rascunho
    const issued = list.find((r) => r.workflow_state === 'ISSUED');
    assert.ok(issued, 'Deve existir pelo menos um diário já emitido e congelado');
    assert.ok(issued.document_hash, 'Diário emitido deve ter hash de integridade');

    const draft = list.find((r) => r.workflow_state !== 'ISSUED');
    assert.ok(draft, 'Deve existir diário em rascunho / aberto para edição');
  });

  await t.test('2. Deve alternar para um dia anterior (switchReportingDay) e carregar seus dados', () => {
    // Alterna para o dia emitido 05/09/2026
    const state05 = ArchiveService.switchReportingDay('2026-09-05');
    assert.equal(state05.reportingDay.report_date, '2026-09-05');
    assert.equal(state05.dailyReport.report_date, '2026-09-05');
    assert.equal(state05.dailyReport.workflow_state, 'ISSUED');

    // Alterna para o dia 08/09/2026
    const state08 = ArchiveService.switchReportingDay('2026-09-08');
    assert.equal(state08.reportingDay.report_date, '2026-09-08');
    assert.equal(state08.dailyReport.report_date, '2026-09-08');
    assert.notEqual(state08.dailyReport.workflow_state, 'ISSUED', 'Dia 08 deve estar aberto para edição');
  });

  await t.test('3. Deve criar um novo Diário de Obra para data futura ou retroativa com cópia de efetivo', () => {
    const targetDate = '2026-09-15';
    const newState = ArchiveService.createNewReportingDay({
      targetDate,
      copyYesterdayWorkforce: true,
    });

    assert.equal(newState.reportingDay.report_date, targetDate);
    assert.equal(newState.dailyReport.report_date, targetDate);
    assert.equal(newState.dailyReport.workflow_state, 'DRAFT', 'Novo dia deve nascer como rascunho');
    assert.ok(newState.workforceSnapshot.total_workers > 0, 'Deve ter copiado o efetivo de ontem');
    assert.ok(newState.workforceSnapshot.copied_from_yesterday, 'Flag de cópia deve estar ativa');

    // Deve aparecer na listagem geral de dias
    const list = ArchiveService.listDailyReportsSummaries();
    const createdItem = list.find((r) => r.date === targetDate);
    assert.ok(createdItem, 'O novo dia deve estar indexado no histórico');
    assert.equal(createdItem.workflow_state, 'DRAFT');
  });

  await t.test('4. Não deve permitir excluir diários já emitidos (imutabilidade pericial)', () => {
    // Tentar apagar o dia 05/09 que está ISSUED
    assert.throws(
      () => {
        ArchiveService.deleteReportingDayDraft('2026-09-05');
      },
      /Não é permitido excluir um Diário de Obra já emitido/,
      'Deve lançar erro impedindo a exclusão de documento congelado'
    );
  });

  await t.test('5. Deve permitir descartar rascunhos não emitidos com sucesso', () => {
    const listBefore = ArchiveService.listDailyReportsSummaries();
    const countBefore = listBefore.length;

    // Exclui o rascunho criado anteriormente (15/09/2026)
    ArchiveService.deleteReportingDayDraft('2026-09-15');

    const listAfter = ArchiveService.listDailyReportsSummaries();
    assert.equal(listAfter.length, countBefore - 1, 'Deve ter removido o rascunho do histórico');
    assert.ok(!listAfter.some((r) => r.date === '2026-09-15'));
  });
});
