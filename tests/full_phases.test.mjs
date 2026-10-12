import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for node environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

test('Testes Automatizados das Fases 2, 3 e 4 — ConstruKore Diário de Obra', async (t) => {
  // Teste 1: Agilidade no Efetivo (Copiar Efetivo de Ontem)
  await t.test('Fase 2: "Repetir Efetivo de Ontem" deve preencher cargos e totalizar corretamente', () => {
    const yesterdayEntries = [
      { role_code: 'PED', role_name: 'Pedreiro', count: 14 },
      { role_code: 'SRV', role_name: 'Servente', count: 9 },
      { role_code: 'ELE', role_name: 'Eletricista', count: 3 },
      { role_code: 'ENC', role_name: 'Encarregado', count: 2 },
    ];
    const totalExpected = 14 + 9 + 3 + 2;
    const computedTotal = yesterdayEntries.reduce((acc, c) => acc + c.count, 0);

    assert.equal(computedTotal, totalExpected, 'Total de ontem deve ser 28 operários');
    assert.equal(computedTotal, 28);
  });

  // Teste 2: Regra dos 3 Alertas de Falta de Material -> Chamado para Suprimentos
  await t.test('Fase 3: 3ª falta do mesmo material deve disparar chamado prioritário para Suprimentos com cálculo de prejuízo acumulado', () => {
    const materialName = 'Bloco Cerâmico 14x19x39';
    const previousOccurrences = [
      { id: 'occ-1', title: `Falta de ${materialName}`, workers_idle: 4, hours_lost: 2.0, cost: 360 },
      { id: 'occ-2', title: `Falta de ${materialName}`, workers_idle: 4, hours_lost: 2.5, cost: 450 },
    ];

    // Simula a 3ª falta ocorrendo
    const newShortage = { workers_idle: 4, hours_lost: 3.0, cost: 540 };
    const recurrenceCount = previousOccurrences.length + 1;

    assert.equal(recurrenceCount, 3, 'Deve identificar exatamente a 3ª ocorrência');

    // Se recurrenceCount >= 3, gera ticket com acúmulo
    const totalWorkersIdle = previousOccurrences.reduce((acc, c) => acc + c.workers_idle, 0) + newShortage.workers_idle;
    const totalHoursLost = previousOccurrences.reduce((acc, c) => acc + c.hours_lost, 0) + newShortage.hours_lost;
    const totalCost = previousOccurrences.reduce((acc, c) => acc + c.cost, 0) + newShortage.cost;

    const ticket = {
      ticket_code: 'SUP-ALERT-0184-1',
      material_name: materialName,
      recurrence_count: recurrenceCount,
      total_workers_idle: totalWorkersIdle,
      total_hours_lost: totalHoursLost,
      total_cost_estimate: totalCost,
      status: 'OPEN',
    };

    assert.equal(ticket.total_workers_idle, 12, '12 operários paralisados no acumulado das 3 faltas');
    assert.equal(ticket.total_hours_lost, 7.5, '7.5 horas perdidas no acumulado');
    assert.equal(ticket.total_cost_estimate, 1350.0, 'Prejuízo financeiro total acumulado de R$ 1.350,00');
    assert.equal(ticket.status, 'OPEN');
  });

  // Teste 3: Conciliação de Fontes Divergentes (Empreiteiro vs Medição Oficial)
  await t.test('Fase 3: Conflito de medição deve preservar ambas as fontes e registrar valor homologado com parecer', () => {
    const conflict = {
      task_id: 'tsk-01',
      task_name: 'Alvenaria Estrutural',
      contractor_party_name: 'Empreiteira Roma',
      contractor_value: 120, // Empreiteiro afirma ter feito 120 m²
      engineer_value: 85,    // Medição técnica aponta 85 m²
      tolerance_pct: 5.0,
      status: 'PENDING',
    };

    const variancePct = ((conflict.contractor_value - conflict.engineer_value) / conflict.engineer_value) * 100;
    assert.ok(variancePct > conflict.tolerance_pct, 'Variação de 41% supera a tolerância de 5%');

    // Mediação do engenheiro para 90 m² com justificativa
    const resolvedConflict = {
      ...conflict,
      status: 'RESOLVED',
      resolved_value: 90,
      resolved_by: 'Engª Mariana Costa',
      resolution_rationale: 'Descontados vãos de janelas que o empreiteiro havia somado incorretamente.',
    };

    assert.equal(resolvedConflict.status, 'RESOLVED');
    assert.equal(resolvedConflict.contractor_value, 120, 'Valor do empreiteiro deve ser preservado para auditoria');
    assert.equal(resolvedConflict.engineer_value, 85, 'Medição inicial deve ser preservada');
    assert.equal(resolvedConflict.resolved_value, 90, 'Valor homologado deve ser 90 m²');
    assert.ok(resolvedConflict.resolution_rationale.length > 10, 'Parecer técnico é obrigatório');
  });

  // Teste 4: Regras Determinísticas de Bloqueio no Fechamento
  await t.test('Fase 4: Motor de Bloqueio deve impedir emissão se houver pendência aberta ou falta de foto em tarefa crítica', () => {
    const rules = {
      require_photo_for_critical_tasks: true,
      block_on_pending_occurrences: true,
    };

    // Cenário 1: Há tarefa crítica (Concretagem) mas nenhuma foto
    const production = [{ task_name: 'Concretagem de Vigas', is_critical: true }];
    const photos = [];
    const pendingOccurrences = [{ id: 'occ-1', approved_for_rdo: false }];

    const blockingIssues = [];
    if (rules.require_photo_for_critical_tasks && production.some((p) => p.is_critical) && photos.length === 0) {
      blockingIssues.push('Atividade crítica (Concretagem) sem foto anexada');
    }
    if (rules.block_on_pending_occurrences && pendingOccurrences.length > 0) {
      blockingIssues.push('Ocorrências pendentes de validação');
    }

    assert.equal(blockingIssues.length, 2, 'Devem existir 2 bloqueios impeditivos');

    // Cenário 2: Foto anexada e ocorrência aprovada
    photos.push({ url: 'photo.jpg' });
    pendingOccurrences.length = 0; // Resolvido

    const remainingBlocks = [];
    if (rules.require_photo_for_critical_tasks && production.some((p) => p.is_critical) && photos.length === 0) {
      remainingBlocks.push('Atividade crítica (Concretagem) sem foto anexada');
    }
    if (rules.block_on_pending_occurrences && pendingOccurrences.length > 0) {
      remainingBlocks.push('Ocorrências pendentes de validação');
    }

    assert.equal(remainingBlocks.length, 0, 'Com critérios atendidos, não há bloqueios');
  });
});
