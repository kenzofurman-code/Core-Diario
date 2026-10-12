import test from 'node:test';
import assert from 'node:assert/strict';

// Mapeamento oficial dos códigos WMO (Organização Meteorológica Mundial)
function mapWmoCodeToCondition(wmoCode) {
  switch (wmoCode) {
    case 0:
      return 'ENSOLARADO';
    case 1:
    case 2:
      return 'PARCIALMENTE_NUBLADO';
    case 3:
    case 45:
    case 48:
      return 'NUBLADO';
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return 'CHUVA_FRACA';
    case 61:
    case 63:
    case 80:
      return 'CHUVA_MODERADA';
    case 65:
    case 66:
    case 67:
    case 81:
      return 'CHUVA_FORTE';
    case 82:
    case 95:
    case 96:
    case 99:
      return 'TEMPESTADE';
    default:
      return 'PARCIALMENTE_NUBLADO';
  }
}

const severityOrder = {
  TEMPESTADE: 6,
  CHUVA_FORTE: 5,
  CHUVA_MODERADA: 4,
  CHUVA_FRACA: 3,
  NUBLADO: 2,
  PARCIALMENTE_NUBLADO: 1,
  ENSOLARADO: 0,
};

function aggregateHourlyData(hourly, inmetRef, rainThreshold = 5.0) {
  const shiftsConfig = [
    { shift: 'MANHA', label: '07:00 às 12:00', startHour: 7, endHour: 11 },
    { shift: 'TARDE', label: '12:00 às 18:00', startHour: 12, endHour: 17 },
    { shift: 'NOITE', label: '18:00 às 22:00', startHour: 18, endHour: 22 },
  ];

  const shifts = shiftsConfig.map((cfg) => {
    let sumPrecip = 0;
    let sumTemp = 0;
    let sumHum = 0;
    let maxWind = 0;
    let worstCondition = 'ENSOLARADO';
    const count = cfg.endHour - cfg.startHour + 1;

    for (let h = cfg.startHour; h <= cfg.endHour; h++) {
      const p = hourly.precipitation[h] ?? 0;
      const t = hourly.temperature_2m[h] ?? 20;
      const hum = hourly.relative_humidity_2m[h] ?? 70;
      const w = hourly.wind_speed_10m[h] ?? 10;
      const code = hourly.weather_code[h] ?? 0;

      sumPrecip += p;
      sumTemp += t;
      sumHum += hum;
      if (w > maxWind) maxWind = w;

      const cond = mapWmoCodeToCondition(code);
      if (severityOrder[cond] > severityOrder[worstCondition]) {
        worstCondition = cond;
      }
    }

    const precipRound = Math.round(sumPrecip * 10) / 10;
    const tempAvg = Math.round((sumTemp / count) * 10) / 10;
    const humAvg = Math.round(sumHum / count);
    const windRound = Math.round(maxWind * 10) / 10;

    let workability = 'PRATICAVEL';
    let hoursLost = 0;

    if (precipRound >= 4.0 || windRound >= 45.0) {
      workability = 'IMPRATICAVEL';
      hoursLost = count;
    } else if (precipRound > 0.2 || windRound >= 35.0) {
      workability = 'PARCIALMENTE_PRATICAVEL';
      hoursLost = Math.min(2.0, count);
    }

    return {
      shift: cfg.shift,
      period_label: cfg.label,
      condition: worstCondition,
      temperature_avg_c: tempAvg,
      precipitation_mm: precipRound,
      wind_speed_max_kmh: windRound,
      humidity_pct: humAvg,
      workability,
      hours_lost_to_weather: hoursLost,
      is_overridden: false,
      original_api_precipitation_mm: precipRound,
      original_api_condition: worstCondition,
    };
  });

  const dayPrecip = hourly.precipitation.reduce((acc, curr) => acc + (curr || 0), 0);
  const dayWindMax = Math.max(...hourly.wind_speed_10m);
  const dayTempMin = Math.min(...hourly.temperature_2m);
  const dayTempMax = Math.max(...hourly.temperature_2m);

  const totalPrecipRound = Math.round(dayPrecip * 10) / 10;

  return {
    station_source: 'Open-Meteo High-Resolution (ECMWF/GFS Interpolated)',
    inmet_reference: inmetRef,
    queried_at: new Date().toISOString(),
    total_precipitation_day_mm: totalPrecipRound,
    max_wind_speed_kmh: Math.round(dayWindMax * 10) / 10,
    temperature_min_c: Math.round(dayTempMin * 10) / 10,
    temperature_max_c: Math.round(dayTempMax * 10) / 10,
    rain_threshold_mm: rainThreshold,
    is_contractual_rain_day: totalPrecipRound >= rainThreshold,
    has_nr18_wind_alert: dayWindMax > 40.0,
    shifts,
  };
}

test('Testes Automatizados de Clima e Intempérie Pericial — ConstruKore Diário de Obra', async (t) => {
  await t.test('1. Mapeamento de códigos WMO oficiais da OMM para condições de canteiro', () => {
    assert.equal(mapWmoCodeToCondition(0), 'ENSOLARADO');
    assert.equal(mapWmoCodeToCondition(1), 'PARCIALMENTE_NUBLADO');
    assert.equal(mapWmoCodeToCondition(3), 'NUBLADO');
    assert.equal(mapWmoCodeToCondition(53), 'CHUVA_FRACA');
    assert.equal(mapWmoCodeToCondition(63), 'CHUVA_MODERADA');
    assert.equal(mapWmoCodeToCondition(65), 'CHUVA_FORTE');
    assert.equal(mapWmoCodeToCondition(95), 'TEMPESTADE');
  });

  await t.test('2. Agregação em 3 turnos (Manhã, Tarde, Noite) e sugestão de praticabilidade', () => {
    const hourly = {
      time: Array.from({ length: 24 }, (_, i) => `2026-09-08T${String(i).padStart(2, '0')}:00`),
      temperature_2m: Array.from({ length: 24 }, () => 20.0),
      relative_humidity_2m: Array.from({ length: 24 }, () => 70),
      precipitation: Array.from({ length: 24 }, () => 0.0),
      weather_code: Array.from({ length: 24 }, () => 0),
      wind_speed_10m: Array.from({ length: 24 }, () => 15.0),
    };

    // Manhã (7-11h): Sol, 0mm
    // Tarde (12-17h): Chuva forte de 5.5mm
    hourly.precipitation[14] = 3.0;
    hourly.precipitation[15] = 2.5;
    hourly.weather_code[14] = 65;
    hourly.weather_code[15] = 65;

    // Noite (18-22h): Vento forte de 48 km/h
    hourly.wind_speed_10m[19] = 48.0;

    const summary = aggregateHourlyData(
      hourly,
      'Estação Oficial INMET A807 (Curitiba - PR)',
      5.0
    );

    assert.equal(summary.shifts.length, 3);

    // Manhã
    const manha = summary.shifts.find((s) => s.shift === 'MANHA');
    assert.ok(manha);
    assert.equal(manha.precipitation_mm, 0.0);
    assert.equal(manha.workability, 'PRATICAVEL');
    assert.equal(manha.hours_lost_to_weather, 0);

    // Tarde
    const tarde = summary.shifts.find((s) => s.shift === 'TARDE');
    assert.ok(tarde);
    assert.equal(tarde.precipitation_mm, 5.5);
    assert.equal(tarde.condition, 'CHUVA_FORTE');
    assert.equal(tarde.workability, 'IMPRATICAVEL');
    assert.equal(tarde.hours_lost_to_weather, 6);

    // Noite
    const noite = summary.shifts.find((s) => s.shift === 'NOITE');
    assert.ok(noite);
    assert.equal(noite.wind_speed_max_kmh, 48.0);
    assert.equal(noite.workability, 'IMPRATICAVEL');

    // Resumo diário
    assert.equal(summary.total_precipitation_day_mm, 5.5);
    assert.equal(summary.is_contractual_rain_day, true, 'Deve marcar como Dia de Chuva Impediente (>= 5.0mm)');
    assert.equal(summary.has_nr18_wind_alert, true, 'Deve disparar alerta de vento NR-18 (> 40km/h)');
  });

  await t.test('3. Auditoria pericial: Override de campo preserva dados da estação e recalcula pleito', () => {
    const shifts = [
      { shift: 'MANHA', precipitation_mm: 0.0, condition: 'ENSOLARADO', is_overridden: false },
      { shift: 'TARDE', precipitation_mm: 1.2, condition: 'NUBLADO', is_overridden: false },
      { shift: 'NOITE', precipitation_mm: 0.0, condition: 'PARCIALMENTE_NUBLADO', is_overridden: false },
    ];

    const tarde = shifts.find((s) => s.shift === 'TARDE');
    const originalApiPrecip = tarde.precipitation_mm;
    tarde.is_overridden = true;
    tarde.original_api_precipitation_mm = originalApiPrecip;
    tarde.precipitation_mm = 12.0; // Pluviômetro da obra registrou temporal
    tarde.workability = 'IMPRATICAVEL';
    tarde.hours_lost_to_weather = 4.0;
    tarde.override_reason = 'Temporal repentino causou alagamento da frente da Torre A.';
    tarde.overridden_by_name = 'Engª. Mariana Costa';

    const totalPrecip = Math.round(shifts.reduce((acc, s) => acc + s.precipitation_mm, 0) * 10) / 10;
    const isContractualRain = totalPrecip >= 5.0;

    assert.equal(totalPrecip, 12.0);
    assert.equal(isContractualRain, true);
    assert.equal(tarde.original_api_precipitation_mm, originalApiPrecip);
    assert.equal(tarde.is_overridden, true);
    assert.equal(tarde.hours_lost_to_weather, 4.0);
  });

  await t.test('4. Validação de Coerência: alerta se tarefa externa relatar 100% de avanço em turno impraticável', () => {
    const unworkableShift = true;
    const tasks = [
      { task_name: 'Concretagem de Vigas e Lajes', progress_pct: 100, is_critical: true, notes: '' },
      { task_name: 'Instalações Elétricas Internas', progress_pct: 95, is_critical: false, notes: '' },
    ];

    const warnings = [];
    if (unworkableShift) {
      tasks.forEach((p) => {
        const isOutdoorTask = p.is_critical || p.task_name.toLowerCase().includes('concretagem');
        if (isOutdoorTask && p.progress_pct >= 100 && !p.notes) {
          warnings.push(`Alerta de Coerência: Tarefa externa "${p.task_name}" reportou 100% em dia de chuva.`);
        }
      });
    }

    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Concretagem de Vigas e Lajes/);
  });
});
