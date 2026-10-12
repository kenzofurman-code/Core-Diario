import React, { useState } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  Scale,
  Camera,
  CloudRain,
  Clock,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import {
  WeatherShiftRecord,
  WeatherCondition,
  WorkabilityStatus,
} from '../../types/diary.types';

interface WeatherOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftRecord: WeatherShiftRecord | null;
  onSaveOverride: (params: {
    condition: WeatherCondition;
    workability: WorkabilityStatus;
    precipitation_mm: number;
    hours_lost_to_weather: number;
    override_reason: string;
    affected_trades?: string[];
    evidence_photo_url?: string;
  }) => void;
}

export const WeatherOverrideModal: React.FC<WeatherOverrideModalProps> = ({
  isOpen,
  onClose,
  shiftRecord,
  onSaveOverride,
}) => {
  if (!isOpen || !shiftRecord) return null;

  const [condition, setCondition] = useState<WeatherCondition>(shiftRecord.condition);
  const [workability, setWorkability] = useState<WorkabilityStatus>(shiftRecord.workability);
  const [precipitation, setPrecipitation] = useState<number>(shiftRecord.precipitation_mm);
  const [hoursLost, setHoursLost] = useState<number>(shiftRecord.hours_lost_to_weather);
  const [overrideReason, setOverrideReason] = useState<string>(shiftRecord.override_reason || '');
  const [selectedTrades, setSelectedTrades] = useState<string[]>(
    shiftRecord.affected_trades || ['Concretagem Externa', 'Trabalho em Altura / Balancim']
  );
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>(shiftRecord.evidence_photo_url || '');

  const availableTrades = [
    'Concretagem Externa',
    'Trabalho em Altura / Balancim',
    'Pintura de Fachada',
    'Terraplenagem / Escavação',
    'Armação de Vigas / Lajes',
    'Alvenaria Perimetral',
  ];

  const toggleTrade = (trade: string) => {
    if (selectedTrades.includes(trade)) {
      setSelectedTrades(selectedTrades.filter((t) => t !== trade));
    } else {
      setSelectedTrades([...selectedTrades, trade]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('Por favor, informe a justificativa técnica para o ajuste pericial.');
      return;
    }

    onSaveOverride({
      condition,
      workability,
      precipitation_mm: Number(precipitation) || 0,
      hours_lost_to_weather: Number(hoursLost) || 0,
      override_reason: overrideReason.trim(),
      affected_trades: selectedTrades,
      evidence_photo_url: evidencePhotoUrl || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-action-soft text-action flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                AJUSTE PERICIAL DE INTEMPÉRIE — TURNO {shiftRecord.shift}
              </h2>
              <p className="text-[11px] text-ink-muted">
                Registro de soberania de campo contra glosas contratuais
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Alerta Pericial */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-card flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Respaldo Jurídico do Livro de Ordem:</span>
              <p className="text-[11px] leading-relaxed">
                Este ajuste sobrepõe a estimativa de satélite para retratar as condições reais no
                canteiro. O dado original ({shiftRecord.original_api_precipitation_mm ?? shiftRecord.precipitation_mm}mm)
                será preservado para auditoria cruzada.
              </p>
            </div>
          </div>

          {/* Condição do Tempo e Praticabilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[10px]">
                Condição Observada
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as WeatherCondition)}
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink font-medium"
              >
                <option value="ENSOLARADO">Ensolarado (Céu Limpo)</option>
                <option value="PARCIALMENTE_NUBLADO">Parcialmente Nublado</option>
                <option value="NUBLADO">Nublado / Encoberto</option>
                <option value="CHUVA_FRACA">Chuva Fraca / Garoa</option>
                <option value="CHUVA_MODERADA">Chuva Moderada</option>
                <option value="CHUVA_FORTE">Chuva Forte / Torrencial</option>
                <option value="TEMPESTADE">Tempestade / Raios</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[10px]">
                Praticabilidade do Turno
              </label>
              <select
                value={workability}
                onChange={(e) => setWorkability(e.target.value as WorkabilityStatus)}
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink font-bold"
              >
                <option value="PRATICAVEL">Praticável (Trabalho Normal)</option>
                <option value="PARCIALMENTE_PRATICAVEL">Parcialmente Praticável</option>
                <option value="IMPRATICAVEL">Impraticável (Paralisação por Intempérie)</option>
              </select>
            </div>
          </div>

          {/* Precipitação (mm) e Horas Paradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[10px]">
                Chuva Medida no Canteiro (mm)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={precipitation}
                  onChange={(e) => setPrecipitation(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 pr-10 rounded-field bg-paper border border-rule text-ink font-mono font-bold"
                />
                <span className="absolute right-3 top-2 text-ink-muted text-xs font-mono">mm</span>
              </div>
              <span className="text-[10px] text-ink-muted mt-0.5 block">
                Valor estimado por pluviômetro local da obra
              </span>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[10px]">
                Horas Paralisadas no Turno
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="12"
                  value={hoursLost}
                  onChange={(e) => setHoursLost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 pr-10 rounded-field bg-paper border border-rule text-ink font-mono font-bold"
                />
                <span className="absolute right-3 top-2 text-ink-muted text-xs font-mono">horas</span>
              </div>
              <span className="text-[10px] text-ink-muted mt-0.5 block">
                Alimenta a contabilidade de pleitos de prazo (claim)
              </span>
            </div>
          </div>

          {/* Frentes de Serviço Afetadas */}
          <div>
            <label className="block font-bold text-ink mb-1.5 uppercase tracking-wider text-[10px]">
              Frentes de Serviço Paralisadas / Afetadas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTrades.map((trade) => {
                const isSelected = selectedTrades.includes(trade);
                return (
                  <button
                    type="button"
                    key={trade}
                    onClick={() => toggleTrade(trade)}
                    className={`px-2.5 py-1 rounded-pill text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-action text-white shadow-xs'
                        : 'bg-paper text-ink-secondary border border-rule-subtle hover:text-ink hover:bg-panel'
                    }`}
                  >
                    {trade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Justificativa Técnica Obrigatória */}
          <div>
            <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[10px]">
              Justificativa Técnica Pericial <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Ex: Pancada torrencial localizada das 14:10 às 15:40 inviabilizou a concretagem da laje e o trânsito da autobomba. Equipes realocadas para alvenaria interna."
              className="w-full p-2.5 rounded-field bg-paper border border-rule text-ink text-xs focus:border-action focus:outline-none"
            />
          </div>

          {/* URL da Foto Comprobatória */}
          <div>
            <label className="block font-bold text-ink mb-1 uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>Evidência Fotográfica de Intempérie (Opcional)</span>
              <span className="text-action text-[10px] font-normal">Poças / Lama / Canteiro</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={evidencePhotoUrl}
                onChange={(e) => setEvidencePhotoUrl(e.target.value)}
                placeholder="URL da foto com carimbo d'água"
                className="flex-1 p-2 rounded-field bg-paper border border-rule text-ink font-mono text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  setEvidencePhotoUrl(
                    'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop'
                  )
                }
                className="px-3 py-2 rounded-field bg-panel-subtle border border-rule hover:bg-paper text-ink text-xs font-semibold"
              >
                Foto Exemplo
              </button>
            </div>
          </div>

          {/* Footer com Ações */}
          <div className="pt-3 border-t border-rule flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Homologar Parecer de Campo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
