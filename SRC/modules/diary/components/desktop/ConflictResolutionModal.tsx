import React, { useState } from 'react';
import { Scale, Check, X, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { SourceConflict } from '../../types/diary.types';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: SourceConflict | null;
  onResolveConflict: (conflictId: string, resolvedValue: number, rationale: string) => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolveConflict,
}) => {
  const [resolvedValue, setResolvedValue] = useState<number>(conflict?.engineer_value || 85);
  const [rationale, setRationale] = useState('');

  if (!isOpen || !conflict) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    onResolveConflict(conflict.id, Number(resolvedValue), rationale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between bg-warning-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-warning text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-warning-text">CONCILIAÇÃO DE FONTES DIVERGENTES</h2>
              <p className="text-[11px] text-ink-secondary">
                Divergência entre o apontamento do empreiteiro e a medição técnica
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Dados da Tarefa */}
          <div className="p-3 bg-paper rounded-card border border-rule flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-ink-muted uppercase block">Tarefa & Frente</span>
              <strong className="text-sm font-bold text-ink">{conflict.task_name}</strong>
              <p className="text-ink-secondary">{conflict.location_name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-danger uppercase block">Variação Detectada</span>
              <span className="text-base font-mono font-bold text-danger">
                +{conflict.variance_pct}%
              </span>
              <span className="text-[10px] text-ink-muted block">(Tolerância: {conflict.tolerance_pct}%)</span>
            </div>
          </div>

          {/* Comparativo Lado a Lado das Duas Fontes */}
          <div className="grid grid-cols-2 gap-3">
            {/* Fonte A: Empreiteiro */}
            <div className="p-3.5 rounded-card bg-panel border-2 border-rule space-y-1">
              <span className="text-[10px] font-bold text-ink-muted uppercase block">
                Fonte A • Subcontratado
              </span>
              <strong className="text-sm font-bold text-ink block">{conflict.contractor_party_name}</strong>
              <div className="pt-2">
                <span className="text-2xl font-mono font-bold text-ink">
                  {conflict.contractor_value}
                </span>{' '}
                <span className="text-xs text-ink-muted font-medium">{conflict.uom}</span>
              </div>
              <p className="text-[11px] text-ink-muted pt-1">
                Lançado pelo encarregado terceirizado no canteiro.
              </p>
            </div>

            {/* Fonte B: Medição Oficial */}
            <div className="p-3.5 rounded-card bg-panel border-2 border-action/40 space-y-1">
              <span className="text-[10px] font-bold text-action uppercase block">
                Fonte B • Medição Técnica
              </span>
              <strong className="text-sm font-bold text-action block">Engenharia Residente</strong>
              <div className="pt-2">
                <span className="text-2xl font-mono font-bold text-action">
                  {conflict.engineer_value}
                </span>{' '}
                <span className="text-xs text-ink-muted font-medium">{conflict.uom}</span>
              </div>
              <p className="text-[11px] text-ink-muted pt-1">
                Conferência física in loco realizada com trena laser.
              </p>
            </div>
          </div>

          {/* Invariante Core - Mensagem de Auditoria */}
          <div className="p-2.5 rounded-field bg-action-soft/20 border border-action/30 text-[11px] text-ink-secondary">
            💡 <strong>Invariante ConstruKore:</strong> Ambos os valores permanecerão salvos na base histórica para fins de auditoria de medição. A conciliação definirá o valor oficial para o RDO e pagamento.
          </div>

          {/* Definição do Valor Consolidado Homologado */}
          <div className="space-y-3 bg-paper p-4 rounded-card border border-rule">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Valor Final Homologado pelo Engenheiro ({conflict.uom}) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  required
                  value={resolvedValue}
                  onChange={(e) => setResolvedValue(Number(e.target.value))}
                  className="w-36 px-3 py-2 text-base font-mono font-bold bg-panel border border-rule rounded-field focus:outline-none focus:border-action text-ink"
                />
                <span className="text-xs text-ink-secondary">
                  Valor que entrará na produção oficial de hoje
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Parecer Técnico da Conciliação (Justificativa Obrigatória) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Medição refeita em conjunto com encarregado. Descontados vãos de janelas que o empreiteiro havia somado incorretamente..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-panel border border-rule rounded-field focus:outline-none focus:border-action text-ink"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-rule-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-field text-ink-secondary hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold rounded-field bg-action text-white hover:opacity-90 flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Homologar Conciliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
