import React from 'react';
import { Users, X, Plus, Minus, Check, History, Sparkles } from 'lucide-react';
import { WorkforceSnapshot } from '../../types/diary.types';

interface WorkforceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workforce: WorkforceSnapshot;
  onUpdateCount: (roleCode: string, delta: number) => void;
  onCopyYesterday: () => void;
}

export const WorkforceModal: React.FC<WorkforceModalProps> = ({
  isOpen,
  onClose,
  workforce,
  onUpdateCount,
  onCopyYesterday,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-action-soft text-action flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">EFETIVO DE MÃO DE OBRA DO DIA</h2>
              <p className="text-[11px] text-ink-muted">
                Total presente: <strong>{workforce.total_workers} operários</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botão de Agilidade de Canteiro: Repetir Efetivo de Ontem */}
        <div className="p-3 bg-action-soft/20 border-b border-rule flex items-center justify-between gap-2">
          <div className="text-xs text-ink">
            <span className="font-bold flex items-center gap-1 text-action">
              <History className="w-3.5 h-3.5" />
              Agilidade de Campo:
            </span>
            <span className="text-[11px] text-ink-secondary">
              Economize tempo importando as equipes do dia anterior.
            </span>
          </div>
          <button
            type="button"
            onClick={onCopyYesterday}
            className="px-3 py-1.5 rounded-field bg-action text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Repetir de Ontem
          </button>
        </div>

        {/* Badge Informativo se já copiou */}
        {workforce.copied_from_yesterday && (
          <div className="px-4 py-1.5 bg-success-soft text-success text-[11px] font-semibold border-b border-success/30 flex items-center justify-between">
            <span>✓ Efetivo baseado no dia anterior. Faça apenas os ajustes do dia:</span>
          </div>
        )}

        {/* Lista Tátil com Contadores */}
        <div className="p-4 overflow-y-auto space-y-3">
          {workforce.entries.map((entry) => (
            <div
              key={entry.role_code}
              className="p-3 bg-paper rounded-card border border-rule flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-ink">{entry.role_name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-ink-secondary mt-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-chip text-[10px] font-semibold ${
                      entry.company_type === 'PROPRIA'
                        ? 'bg-action-soft text-action'
                        : 'bg-paper-subtle border border-rule text-ink-secondary'
                    }`}
                  >
                    {entry.company_type}
                  </span>
                  <span>{entry.company_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateCount(entry.role_code, -1)}
                  className="w-9 h-9 rounded-field bg-panel border border-rule flex items-center justify-center font-bold text-ink hover:bg-action-soft active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-base font-bold text-ink">
                  {entry.count}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateCount(entry.role_code, 1)}
                  className="w-9 h-9 rounded-field bg-panel border border-rule flex items-center justify-center font-bold text-ink hover:bg-action-soft active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-panel-subtle border-t border-rule flex items-center justify-between">
          <span className="text-xs text-ink-muted">Apontamento consolidado em tempo real</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Salvar Efetivo
          </button>
        </div>
      </div>
    </div>
  );
};
