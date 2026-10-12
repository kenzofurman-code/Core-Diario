import React, { useState } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  Edit3,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { DayWeatherSummary, WeatherShiftRecord, WeatherCondition, WorkabilityStatus } from '../../types/diary.types';

interface WeatherWidgetProps {
  summary: DayWeatherSummary;
  onSync: () => Promise<void>;
  onOpenOverride: (shift: 'MANHA' | 'TARDE' | 'NOITE') => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ summary, onSync, onOpenOverride }) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const getWeatherIcon = (cond: WeatherCondition) => {
    switch (cond) {
      case 'ENSOLARADO':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'PARCIALMENTE_NUBLADO':
        return <CloudSun className="w-5 h-5 text-amber-600" />;
      case 'NUBLADO':
        return <Cloud className="w-5 h-5 text-slate-500" />;
      case 'CHUVA_FRACA':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'CHUVA_MODERADA':
        return <CloudRain className="w-5 h-5 text-blue-600" />;
      case 'CHUVA_FORTE':
        return <CloudRain className="w-5 h-5 text-blue-800" />;
      case 'TEMPESTADE':
        return <CloudLightning className="w-5 h-5 text-purple-600" />;
      default:
        return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  const getWorkabilityBadge = (status: WorkabilityStatus) => {
    switch (status) {
      case 'PRATICAVEL':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-bold bg-success-soft text-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Praticável
          </span>
        );
      case 'PARCIALMENTE_PRATICAVEL':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-bold bg-warning-soft text-warning-text flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Parcialmente Praticável
          </span>
        );
      case 'IMPRATICAVEL':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-bold bg-danger-soft text-danger flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Impraticável (Chuva/Vento)
          </span>
        );
    }
  };

  return (
    <div className="bg-panel border border-rule rounded-card p-4 space-y-4 shadow-xs">
      {/* Header do Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-action uppercase">
              Meteorologia Pericial & Intempérie
            </span>
            {summary.is_contractual_rain_day && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-pill text-[10px] font-bold flex items-center gap-1 shadow-xs animate-pulse">
                <Scale className="w-3 h-3" /> Dia de Chuva Impediente (&gt;={summary.rain_threshold_mm}mm)
              </span>
            )}
            {summary.has_nr18_wind_alert && (
              <span className="px-2 py-0.5 bg-danger-soft text-danger border border-danger/30 rounded-pill text-[10px] font-bold flex items-center gap-1">
                <Wind className="w-3 h-3" /> Alerta NR-18 (Vento &gt; 40km/h)
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            Condições Climáticas do Canteiro
            <span className="text-xs font-normal text-ink-muted">
              (Total Hoje: <strong>{summary.total_precipitation_day_mm} mm</strong>)
            </span>
          </h3>
          <p className="text-[11px] text-ink-muted">
            Fonte: {summary.station_source} • Ref: {summary.inmet_reference || 'Estação Oficial INMET Curitiba'}
          </p>
        </div>

        {/* Botão de Sincronização */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-field bg-paper border border-rule hover:border-action text-xs font-semibold text-ink flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-action ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Atualizar Open-Meteo'}
          </button>
        </div>
      </div>

      {/* Grid dos 3 Turnos de Trabalho */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {summary.shifts.map((shift) => (
          <div
            key={shift.shift}
            className={`p-3 rounded-card border transition-all space-y-2.5 ${
              shift.workability === 'IMPRATICAVEL'
                ? 'bg-danger-soft/20 border-danger/40'
                : shift.workability === 'PARCIALMENTE_PRATICAVEL'
                ? 'bg-warning-soft/20 border-warning/40'
                : 'bg-paper border-rule-subtle hover:border-rule'
            }`}
          >
            {/* Linha 1: Nome do Turno + Badge de Praticabilidade */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink uppercase tracking-wider">{shift.shift}</span>
                <span className="text-[11px] text-ink-muted block">{shift.period_label}</span>
              </div>
              {getWorkabilityBadge(shift.workability)}
            </div>

            {/* Linha 2: Ícone + Condição + Temperatura */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {getWeatherIcon(shift.condition)}
                <div>
                  <span className="text-xs font-bold text-ink block">{shift.condition.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-ink-secondary">{shift.temperature_avg_c}°C méd.</span>
                </div>
              </div>

              {/* Pluviometria do Turno */}
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-ink flex items-center gap-1 justify-end">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  {shift.precipitation_mm} mm
                </span>
                <span
                  className={`text-[10px] font-mono flex items-center gap-1 justify-end ${
                    shift.wind_speed_max_kmh >= 40 ? 'text-danger font-bold' : 'text-ink-muted'
                  }`}
                >
                  <Wind className="w-3 h-3" />
                  {shift.wind_speed_max_kmh} km/h
                </span>
              </div>
            </div>

            {/* Horas de Paralisação se houver */}
            {shift.hours_lost_to_weather > 0 && (
              <div className="p-1.5 rounded-field bg-danger-soft/40 border border-danger/30 text-[11px] text-danger flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Paralisação:
                </span>
                <span>{shift.hours_lost_to_weather}h perdidas</span>
              </div>
            )}

            {/* Alerta de Ajuste Pericial (Override) se o usuário tiver alterado */}
            {shift.is_overridden ? (
              <div className="p-2 rounded-field bg-paper border border-action/30 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-action font-bold">
                  <span>Ajuste Pericial de Campo</span>
                  <span className="text-[10px] text-ink-muted">por {shift.overridden_by_name}</span>
                </div>
                {shift.override_reason && (
                  <p className="text-ink-secondary italic">"{shift.override_reason}"</p>
                )}
                {shift.original_api_precipitation_mm !== undefined && (
                  <span className="text-[10px] text-ink-muted block">
                    (Estação registrou {shift.original_api_precipitation_mm}mm)
                  </span>
                )}
              </div>
            ) : null}

            {/* Botão de Ajuste Pericial */}
            <div className="pt-1 border-t border-rule-subtle flex justify-end">
              <button
                type="button"
                onClick={() => onOpenOverride(shift.shift)}
                className="text-[11px] font-semibold text-action hover:text-action-strong flex items-center gap-1 hover:underline"
              >
                <Edit3 className="w-3 h-3" />
                {shift.is_overridden ? 'Editar Parecer' : 'Contestar / Ajustar Campo'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
