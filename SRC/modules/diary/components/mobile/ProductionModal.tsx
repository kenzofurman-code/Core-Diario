import React, { useState } from 'react';
import { Hammer, X, Check, TrendingUp, Filter, UserCheck, Layers } from 'lucide-react';
import { ProductionEntry, UserContext } from '../../types/diary.types';

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productionList: ProductionEntry[];
  currentUser?: UserContext;
  onUpdateProduction: (taskId: string, reported: number) => void;
}

export const ProductionModal: React.FC<ProductionModalProps> = ({
  isOpen,
  onClose,
  productionList,
  currentUser,
  onUpdateProduction,
}) => {
  const isEncarregado = currentUser?.role === 'encarregado';
  const [showOnlyMine, setShowOnlyMine] = useState<boolean>(isEncarregado);

  const displayedList = showOnlyMine && isEncarregado
    ? productionList.filter((p) => p.assigned_user_id === currentUser?.id || !p.assigned_user_id)
    : productionList;

  const [selectedTask, setSelectedTask] = useState<ProductionEntry>(displayedList[0] || productionList[0] || null);
  const [reportedQty, setReportedQty] = useState<number>(selectedTask?.quantity_reported || 0);

  if (!isOpen || !selectedTask) return null;

  const handleSelectTask = (task: ProductionEntry) => {
    setSelectedTask(task);
    setReportedQty(task.quantity_reported);
  };

  const handleSave = () => {
    onUpdateProduction(selectedTask.task_id, reportedQty);
    onClose();
  };

  const progressPct = Math.min(100, Math.round((reportedQty / selectedTask.quantity_planned) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-action text-white flex items-center justify-center">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">APONTAMENTO DE PRODUÇÃO FÍSICA</h2>
              <p className="text-[11px] text-ink-muted">Avanço diário das frentes de serviço ativas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Seletor de Filtro de Atribuição (Curto Prazo) */}
          {isEncarregado && (
            <div className="p-2.5 bg-action-soft/20 border border-action/30 rounded-field flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-action" />
                <span className="text-ink text-[11px]">
                  Filtro Ativo: <strong>{currentUser?.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOnlyMine(!showOnlyMine)}
                className="text-[10px] font-bold text-action underline hover:opacity-80"
              >
                {showOnlyMine ? 'Ver todas as frentes' : 'Ver só minhas frentes'}
              </button>
            </div>
          )}

          {/* Seletor de Tarefas Previstas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                Selecione a Frente / Tarefa:
              </label>
              <span className="text-[10px] text-ink-muted font-mono">
                {displayedList.length} frente{displayedList.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {displayedList.map((t) => (
                <button
                  type="button"
                  key={t.task_id}
                  onClick={() => handleSelectTask(t)}
                  className={`p-2.5 rounded-field border text-left flex flex-col gap-1 transition-all ${
                    selectedTask.task_id === t.task_id
                      ? 'border-action bg-action-soft ring-2 ring-action/20'
                      : 'border-rule bg-paper hover:bg-panel'
                  }`}
                >
                  <span className="text-xs font-bold text-ink truncate">{t.task_name}</span>
                  <span className="text-[11px] text-ink-secondary">{t.location_name}</span>
                  <span className="text-[10px] font-mono text-action font-semibold">
                    Previsto: {t.quantity_planned} {t.uom}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Medição Rápida da Tarefa Selecionada */}
          <div className="bg-paper p-4 rounded-card border border-rule space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">{selectedTask.task_name}</h3>
                <p className="text-xs text-ink-secondary">{selectedTask.location_name}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-muted">Meta do Dia</span>
                <p className="text-sm font-mono font-bold text-ink">
                  {selectedTask.quantity_planned} {selectedTask.uom}
                </p>
              </div>
            </div>

            {/* Contador / Input de Quantidade Realizada */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-ink-secondary flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-action" />
                  Quantidade Executada Hoje:
                </label>
                <span className="text-lg font-mono font-bold text-action">
                  {reportedQty} {selectedTask.uom} ({progressPct}%)
                </span>
              </div>

              {/* Slider Tátil */}
              <input
                type="range"
                min={0}
                max={selectedTask.quantity_planned * 1.3}
                step={1}
                value={reportedQty}
                onChange={(e) => setReportedQty(Number(e.target.value))}
                className="w-full accent-action cursor-pointer h-2 bg-rule rounded-lg"
              />

              {/* Atalhos Rápidos de Porcentagem */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
                  const val = Math.round(selectedTask.quantity_planned * ratio);
                  return (
                    <button
                      type="button"
                      key={ratio}
                      onClick={() => setReportedQty(val)}
                      className="py-1.5 text-xs font-semibold rounded-field bg-panel border border-rule hover:border-action hover:text-action transition-colors"
                    >
                      {ratio * 100}% ({val})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="w-full h-3 bg-panel border border-rule-subtle rounded-pill overflow-hidden">
              <div
                className="h-full bg-action transition-all duration-300"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-panel-subtle border-t border-rule flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-ink-secondary hover:bg-paper rounded-field"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Salvar Apontamento
          </button>
        </div>
      </div>
    </div>
  );
};
