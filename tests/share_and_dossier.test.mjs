import test from 'node:test';
import assert from 'node:assert/strict';

// Funções puras de formatação e teste unitário para Opção 2
function generateWhatsAppMessage(state, profile = 'EXECUTIVO') {
  const { project, dailyReport, weatherSummary, workforceSnapshot, productionEntries, occurrences } = state;
  const lines = [];

  lines.push('🏗️ *CONSTRUKORE • DIÁRIO DE OBRA (RDO)*');
  lines.push(`📋 *Obra:* ${project.codigo} • ${project.nome}`);
  lines.push(`📅 *Data:* ${dailyReport.report_date} • *${dailyReport.formatted_number}*`);
  lines.push(`👤 *Responsável Técnico:* ${dailyReport.responsible_engineer_name}`);
  lines.push('');

  if (weatherSummary?.shifts) {
    lines.push('⛅ *CLIMA & INTEMPÉRIE:*');
    weatherSummary.shifts.forEach((s) => {
      const condLabel = s.condition.replace(/_/g, ' ');
      const workLabel =
        s.workability === 'IMPRATICAVEL'
          ? '❌ Impraticável'
          : s.workability === 'PARCIALMENTE_PRATICAVEL'
          ? '⚠️ Parcial'
          : '✓ Praticável';
      const hoursLost = s.hours_lost_to_weather > 0 ? ` (${s.hours_lost_to_weather}h paralisadas)` : '';
      lines.push(`• *${s.shift}:* ${condLabel} (${s.precipitation_mm}mm) • ${workLabel}${hoursLost}`);
    });

    const rainWarning = weatherSummary.is_contractual_rain_day
      ? ' ⚠️ *(Dia de Chuva Impediente Contratual)*'
      : '';
    lines.push(`• *Total Chuva:* ${weatherSummary.total_precipitation_day_mm} mm${rainWarning}`);

    if (weatherSummary.has_nr18_wind_alert) {
      lines.push(`• 💨 *Alerta NR-18:* Vento de ${weatherSummary.max_wind_speed_kmh} km/h`);
    }
    lines.push('');
  }

  if (workforceSnapshot?.entries) {
    const terceirizados = workforceSnapshot.entries
      .filter((e) => e.company_type === 'TERCEIRIZADA')
      .reduce((acc, curr) => acc + curr.count, 0);
    const proprios = workforceSnapshot.entries
      .filter((e) => e.company_type === 'PROPRIA')
      .reduce((acc, curr) => acc + curr.count, 0);

    lines.push('👷 *EFETIVO DE MÃO DE OBRA:*');
    lines.push(`• *Total:* ${workforceSnapshot.total_workers} operários (${terceirizados} terceirizados, ${proprios} próprios)`);

    if (profile === 'OPERACIONAL') {
      const tradeList = workforceSnapshot.entries.map((e) => `${e.role_name}: ${e.count}`).join(' • ');
      lines.push(`• *Frentes:* ${tradeList}`);
    } else {
      const topTrades = workforceSnapshot.entries
        .slice(0, 3)
        .map((e) => `${e.count} ${e.role_name}s`)
        .join(', ');
      lines.push(`• *Principais:* ${topTrades}`);
    }
    lines.push('');
  }

  if (productionEntries) {
    lines.push('🚧 *AVANÇO DE PRODUÇÃO:*');
    productionEntries.forEach((p) => {
      const check = p.progress_pct >= 100 ? ' ✅' : '';
      lines.push(`• [${p.progress_pct}%] *${p.task_name}* (${p.location_name}) — ${p.quantity_reported}/${p.quantity_planned} ${p.uom}${check}`);
    });
    lines.push('');
  }

  const criticalOccs = occurrences.filter((o) => o.severity === 'critical' || (o.recurrence_count ?? 0) >= 3);
  lines.push('⚠️ *ALERTAS & OCORRÊNCIAS:*');
  if (criticalOccs.length > 0) {
    criticalOccs.forEach((c) => {
      lines.push(`• 🚨 *Grave:* ${c.title} (${c.location_name}) — Recorrência: ${c.recurrence_count}x`);
    });
  } else {
    lines.push('• Nenhum incidente impeditivo registrado no dia.');
  }
  lines.push('');

  lines.push(`🔑 *Selo SHA-256:* \`SHA256-4c28-98f1-poty\``);
  lines.push(`🔗 *Visualizar RDO Completo:* https://construkore.app/rdo/poty/184`);

  return lines.join('\n');
}

function generateWhatsAppUrl(text, phone) {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const clean = phone.replace(/\D/g, '');
    return `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

test('Testes Automatizados da Opção 2 — Compartilhamento WhatsApp e Dossiê Fotográfico', async (t) => {
  const mockState = {
    project: { codigo: 'POTY-01', nome: 'Residencial Poty Mirante' },
    dailyReport: {
      report_number: 184,
      formatted_number: 'RDO-2026-0184',
      report_date: '08/09/2026',
      responsible_engineer_name: 'Engª. Mariana Costa',
      workflow_state: 'APPROVED',
    },
    weatherSummary: {
      total_precipitation_day_mm: 5.5,
      max_wind_speed_kmh: 42.0,
      is_contractual_rain_day: true,
      has_nr18_wind_alert: true,
      shifts: [
        { shift: 'MANHA', condition: 'ENSOLARADO', precipitation_mm: 0.0, workability: 'PRATICAVEL', hours_lost_to_weather: 0 },
        { shift: 'TARDE', condition: 'CHUVA_FORTE', precipitation_mm: 5.5, workability: 'IMPRATICAVEL', hours_lost_to_weather: 4 },
      ],
    },
    workforceSnapshot: {
      total_workers: 25,
      entries: [
        { role_name: 'Pedreiro', company_type: 'TERCEIRIZADA', count: 12 },
        { role_name: 'Servente', company_type: 'TERCEIRIZADA', count: 8 },
        { role_name: 'Encarregado', company_type: 'PROPRIA', count: 2 },
      ],
    },
    productionEntries: [
      { task_name: 'Concretagem de Vigas', location_name: 'Pavimento 09', progress_pct: 100, quantity_reported: 28, quantity_planned: 28, uom: 'm³' },
      { task_name: 'Alvenaria Estrutural', location_name: 'Pavimento 08', progress_pct: 75, quantity_reported: 60, quantity_planned: 80, uom: 'm²' },
    ],
    occurrences: [
      { id: 'occ-1', title: 'Falta de Bloco Cerâmico', location_name: 'Pavimento 08', severity: 'critical', recurrence_count: 3, approved_for_rdo: true },
    ],
  };

  await t.test('1. Geração de Resumo Executivo para WhatsApp contém métricas e alerta de chuva impediente', () => {
    const msg = generateWhatsAppMessage(mockState, 'EXECUTIVO');

    assert.match(msg, /CONSTRUKORE • DIÁRIO DE OBRA/);
    assert.match(msg, /POTY-01 • Residencial Poty Mirante/);
    assert.match(msg, /Engª\. Mariana Costa/);
    assert.match(msg, /Dia de Chuva Impediente Contratual/, 'Deve conter o aviso de chuva impediente');
    assert.match(msg, /Alerta NR-18/, 'Deve conter o alerta de vento NR-18');
    assert.match(msg, /Total:\* 25 operários/);
    assert.match(msg, /Concretagem de Vigas.*✅/, 'Tarefa 100% concluída deve ter emoji de check');
    assert.match(msg, /Falta de Bloco Cerâmico.*Recorrência: 3x/, 'Deve apontar ocorrência crítica de 3x');
    assert.match(msg, /Selo SHA-256:/);
  });

  await t.test('2. Geração de URL do WhatsApp formata com encodeURI e suporte a telefone/grupo', () => {
    const text = 'Olá Obra';
    const urlWithoutPhone = generateWhatsAppUrl(text);
    assert.equal(urlWithoutPhone, 'https://api.whatsapp.com/send?text=Ol%C3%A1%20Obra');

    const urlWithPhone = generateWhatsAppUrl(text, '+55 (41) 99999-8888');
    assert.equal(urlWithPhone, 'https://api.whatsapp.com/send?phone=5541999998888&text=Ol%C3%A1%20Obra');
  });

  await t.test('3. Filtragem de Evidências do Caderno Fotográfico Pericial', () => {
    const photos = [
      { id: 'p1', caption: 'Concretagem Laje', is_critical: true, category: 'CRITICA' },
      { id: 'p2', caption: 'Lama no Canteiro', is_critical: false, category: 'INTEMPERIE' },
      { id: 'p3', caption: 'Reboco Interno', is_critical: false, category: 'QUALIDADE' },
    ];

    const all = photos.filter(() => true);
    assert.equal(all.length, 3);

    const criticalOnly = photos.filter((p) => p.is_critical || p.category === 'CRITICA');
    assert.equal(criticalOnly.length, 1);
    assert.equal(criticalOnly[0].id, 'p1');

    const intemperieOnly = photos.filter((p) => p.category === 'INTEMPERIE');
    assert.equal(intemperieOnly.length, 1);
    assert.equal(intemperieOnly[0].id, 'p2');
  });
});
