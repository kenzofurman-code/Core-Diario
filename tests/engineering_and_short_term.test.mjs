import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage para execução no ambiente Node puro
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

test('Testes Automatizados de Gestão de Engenharia, Efetivo e Curto Prazo (LPS)', async (t) => {
  // 1. Gestão e Edição de Efetivo no Modo Engenharia
  await t.test('1. Engenharia Desktop pode adicionar, ajustar e remover equipes de efetivo', () => {
    let workforceSnapshot = {
      id: 'wf-test',
      reporting_day_id: 'rd-01',
      captured_at: new Date().toISOString(),
      total_workers: 24,
      entries: [
        { role_code: 'PED', role_name: 'Pedreiro', company_type: 'PROPRIA', company_name: 'ConstruKore Engenharia', count: 12 },
        { role_code: 'CAR', role_name: 'Carpinteiro', company_type: 'TERCEIRIZADA', company_name: 'Empreiteira Roma', count: 8 },
        { role_code: 'ENC', role_name: 'Encarregado', company_type: 'PROPRIA', company_name: 'ConstruKore Engenharia', count: 4 },
      ],
      copied_from_yesterday: false,
    };

    // Aumentar pedreiros para 15
    const pedEntry = workforceSnapshot.entries.find((e) => e.role_code === 'PED');
    assert.ok(pedEntry, 'Pedreiro deve existir');
    pedEntry.count = 15;
    workforceSnapshot.total_workers = workforceSnapshot.entries.reduce((acc, c) => acc + c.count, 0);

    assert.equal(workforceSnapshot.total_workers, 27, 'Total recalculado deve ser 27');

    // Adicionar nova equipe terceirizada: Gesseiros (6 operários)
    workforceSnapshot.entries.push({
      role_code: 'GES',
      role_name: 'Gesseiro',
      company_type: 'TERCEIRIZADA',
      company_name: 'Gesso União Ltda',
      count: 6,
    });
    workforceSnapshot.total_workers = workforceSnapshot.entries.reduce((acc, c) => acc + c.count, 0);

    assert.equal(workforceSnapshot.total_workers, 33, 'Total com gesseiros deve ser 33');

    // Total de Próprios vs Terceirizados
    const proprios = workforceSnapshot.entries
      .filter((e) => e.company_type === 'PROPRIA')
      .reduce((acc, c) => acc + c.count, 0);
    const terceiros = workforceSnapshot.entries
      .filter((e) => e.company_type === 'TERCEIRIZADA')
      .reduce((acc, c) => acc + c.count, 0);

    assert.equal(proprios, 19, 'Próprios: 15 pedreiros + 4 encarregados = 19');
    assert.equal(terceiros, 14, 'Terceiros: 8 carpinteiros + 6 gesseiros = 14');
    assert.equal(proprios + terceiros, 33);
  });

  // 2. Curto Prazo (Planejamento Semanal) com Atribuição por Encarregado
  await t.test('2. Cadastro de Tarefas do Curto Prazo com Metas e Vínculo ao Encarregado', () => {
    const weeklyTasks = [
      {
        id: 'wpt-01',
        wbs_code: '02.04.01',
        task_name: 'Formas de Pilares e Vigas — Pav 09',
        assigned_user_id: 'usr-02', // Antônio Santos (Encarregado)
        assigned_user_name: 'Antônio Santos (Encarregado)',
        quantity_planned_week: 180,
        quantity_planned_today: 35,
        uom: 'm²',
        is_critical: false,
      },
      {
        id: 'wpt-02',
        wbs_code: '02.04.02',
        task_name: 'Concretagem Lajes e Vigas — Pav 09',
        assigned_user_id: 'usr-01', // Carlos Silva (Mestre)
        assigned_user_name: 'Carlos Silva (Mestre de Obras)',
        quantity_planned_week: 120,
        quantity_planned_today: 40,
        uom: 'm³',
        is_critical: true,
      },
      {
        id: 'wpt-03',
        wbs_code: '03.01.01',
        task_name: 'Alvenaria de Vedação — Pav 06',
        assigned_user_id: 'usr-02', // Antônio Santos (Encarregado)
        assigned_user_name: 'Antônio Santos (Encarregado)',
        quantity_planned_week: 250,
        quantity_planned_today: 50,
        uom: 'm²',
        is_critical: false,
      },
    ];

    assert.equal(weeklyTasks.length, 3);
    const antonioTasks = weeklyTasks.filter((t) => t.assigned_user_id === 'usr-02');
    assert.equal(antonioTasks.length, 2, 'Antônio Santos deve ter exatamente 2 tarefas atribuídas');

    const totalMetasHoje = weeklyTasks.reduce((acc, t) => acc + t.quantity_planned_today, 0);
    assert.equal(totalMetasHoje, 125, 'Soma das metas diárias deve ser 125');
  });

  // 3. Filtro de Tarefas por Encarregado no Modo Canteiro
  await t.test('3. No Modo Canteiro, Encarregado visualiza apenas suas frentes e Mestre vê todas', () => {
    const productionEntries = [
      {
        task_id: 'tsk-01',
        task_name: 'Armação de Pilares',
        assigned_user_id: 'usr-02',
        assigned_user_name: 'Antônio Santos',
        quantity_planned: 45,
        quantity_reported: 30,
      },
      {
        task_id: 'tsk-02',
        task_name: 'Concretagem de Vigas e Lajes',
        assigned_user_id: 'usr-01',
        assigned_user_name: 'Carlos Silva',
        quantity_planned: 60,
        quantity_reported: 60,
      },
      {
        task_id: 'tsk-03',
        task_name: 'Reboco Interno Gesso',
        assigned_user_id: 'usr-02',
        assigned_user_name: 'Antônio Santos',
        quantity_planned: 120,
        quantity_reported: 75,
      },
    ];

    // Simulação do usuário Encarregado logado
    const encarregadoUser = { id: 'usr-02', role: 'encarregado', name: 'Antônio Santos' };
    const isEncarregado = encarregadoUser.role === 'encarregado';
    const showOnlyMine = isEncarregado;

    const encarregadoView = showOnlyMine && isEncarregado
      ? productionEntries.filter((p) => p.assigned_user_id === encarregadoUser.id || !p.assigned_user_id)
      : productionEntries;

    assert.equal(encarregadoView.length, 2, 'Encarregado deve ver apenas suas 2 tarefas');
    assert.deepEqual(
      encarregadoView.map((p) => p.task_id),
      ['tsk-01', 'tsk-03']
    );

    // Simulação do Mestre logado (vê todas as frentes)
    const mestreUser = { id: 'usr-01', role: 'mestre', name: 'Carlos Silva' };
    const isMestre = mestreUser.role === 'mestre';
    const mestreShowOnlyMine = false; // Mestre não filtra por padrão

    const mestreView = mestreShowOnlyMine && mestreUser.role === 'encarregado'
      ? productionEntries.filter((p) => p.assigned_user_id === mestreUser.id)
      : productionEntries;

    assert.equal(mestreView.length, 3, 'Mestre deve ver todas as 3 frentes de serviço');
  });

  // 4. Edição de Avanço Físico e Recalculo do Progresso %
  await t.test('4. Atualização de quantidade apontada recalcula progresso físico com teto de 100%', () => {
    const task = {
      task_id: 'tsk-01',
      task_name: 'Alvenaria Estrutural',
      quantity_planned: 80,
      quantity_reported: 40,
      progress_pct: 50,
      uom: 'm²',
    };

    // Apontou mais 20m² (total 60m²)
    task.quantity_reported = 60;
    task.progress_pct = Math.min(100, Math.round((task.quantity_reported / task.quantity_planned) * 100));
    assert.equal(task.progress_pct, 75, '60 de 80 deve ser 75%');

    // Apontou 85m² (superou a meta de 80m²)
    task.quantity_reported = 85;
    task.progress_pct = Math.min(100, Math.round((task.quantity_reported / task.quantity_planned) * 100));
    assert.equal(task.progress_pct, 100, 'Teto percentual de progresso deve ser 100%');
  });
});
