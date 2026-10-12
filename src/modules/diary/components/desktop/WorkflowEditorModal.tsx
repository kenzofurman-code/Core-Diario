import React, { useState } from 'react';
import { Settings, Shield, Plus, Trash2, Check, X, Lock, Sliders, AlertTriangle } from 'lucide-react';
import { WorkflowStep, BlockingRulesConfig } from '../../types/diary.types';

interface WorkflowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSteps: WorkflowStep[];
  currentRules: BlockingRulesConfig;
  onSaveWorkflow: (steps: WorkflowStep[]) => void;
  onSaveRules: (rules: BlockingRulesConfig) => void;
}

export const WorkflowEditorModal: React.FC<WorkflowEditorModalProps> = ({
  isOpen,
  onClose,
  currentSteps,
  currentRules,
  onSaveWorkflow,
  onSaveRules,
}) => {
  const [steps, setSteps] = useState<WorkflowStep[]>(JSON.parse(JSON.stringify(currentSteps)));
  const [rules, setRules] = useState<BlockingRulesConfig>({ ...currentRules });
  const [newStepRole, setNewStepRole] = useState('');
  const [newStepApprover, setNewStepApprover] = useState('');

  if (!isOpen) return null;

  const handleAddStep = () => {
    if (!newStepRole.trim() || !newStepApprover.trim()) return;
    const nextStepNum = steps.length + 1;
    const newStep: WorkflowStep = {
      step_number: nextStepNum,
      role_code: `ETAPA_${nextStepNum}`,
      role_title: `${nextStepNum}. ${newStepRole.trim()}`,
      approver_name: newStepApprover.trim(),
      status: 'PENDING',
      can_be_removed: true,
    };
    setSteps([...steps, newStep]);
    setNewStepRole('');
    setNewStepApprover('');
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      step_number: i + 1,
      role_title: `${i + 1}. ${s.role_title.replace(/^\d+\.\s*/, '')}`,
    }));
    setSteps(updated);
  };

  const handleSave = () => {
    onSaveWorkflow(steps);
    onSaveRules(rules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-action text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">CONFIGURADOR DE GOVERNANÇA & WORKFLOW (FASE 4)</h2>
              <p className="text-[11px] text-ink-muted">Personalize etapas de assinatura e regras de bloqueio do RDO</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Seção 1: Etapas de Aprovação */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-action" />
                  Etapas de Aprovação da Obra ({steps.length} Níveis)
                </h3>
                <p className="text-[11px] text-ink-secondary">
                  A sequência obrigatória de revisão antes da emissão do RDO.
                </p>
              </div>
            </div>

            {/* Lista de Etapas */}
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={step.step_number}
                  className="p-3 bg-paper rounded-field border border-rule flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-action text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                      {step.step_number}
                    </span>
                    <div>
                      <strong className="text-ink block">{step.role_title}</strong>
                      <span className="text-ink-secondary">{step.approver_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {step.status === 'APPROVED' && (
                      <span className="px-2 py-0.5 rounded-chip text-[10px] font-bold bg-success-soft text-success">
                        Assinado
                      </span>
                    )}
                    {step.can_be_removed !== false ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1.5 text-danger hover:bg-danger-soft rounded-chip transition-colors"
                        title="Remover esta etapa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-ink-muted italic">Obrigatório</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Formulário para Adicionar Nova Etapa */}
            <div className="p-3 rounded-card bg-panel-subtle border border-rule-subtle flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Cargo (ex: Fiscal da Caixa, Diretor...)"
                value={newStepRole}
                onChange={(e) => setNewStepRole(e.target.value)}
                className="w-full sm:flex-1 px-3 py-1.5 text-xs bg-panel border border-rule rounded-field focus:outline-none focus:border-action"
              />
              <input
                type="text"
                placeholder="Nome do Responsável..."
                value={newStepApprover}
                onChange={(e) => setNewStepApprover(e.target.value)}
                className="w-full sm:flex-1 px-3 py-1.5 text-xs bg-panel border border-rule rounded-field focus:outline-none focus:border-action"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold rounded-field bg-action text-white hover:opacity-90 flex items-center justify-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Nível
              </button>
            </div>
          </div>

          {/* Seção 2: Regras Determinísticas de Bloqueio no Fechamento */}
          <div className="space-y-3 pt-4 border-t border-rule">
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-warning" />
                Regras de Bloqueio no Fechamento do RDO
              </h3>
              <p className="text-[11px] text-ink-secondary">
                Critérios que impedem o encerramento do dia caso não sejam cumpridos.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {/* Regra 1 */}
              <label className="p-3 bg-paper rounded-field border border-rule flex items-center justify-between gap-3 cursor-pointer hover:bg-panel transition-colors">
                <div>
                  <strong className="text-ink block">Evidência Fotográfica Obrigatória para Concretagem</strong>
                  <span className="text-[11px] text-ink-secondary">
                    Bloqueia a emissão se a tarefa 'Concretagem de Vigas e Lajes' não possuir foto anexada com carimbo.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.require_photo_for_critical_tasks}
                  onChange={(e) =>
                    setRules({ ...rules, require_photo_for_critical_tasks: e.target.checked })
                  }
                  className="w-4 h-4 accent-action cursor-pointer shrink-0"
                />
              </label>

              {/* Regra 2 */}
              <label className="p-3 bg-paper rounded-field border border-rule flex items-center justify-between gap-3 cursor-pointer hover:bg-panel transition-colors">
                <div>
                  <strong className="text-ink block">Bloquear com Ocorrências / Faltas de Material Pendentes</strong>
                  <span className="text-[11px] text-ink-secondary">
                    Impede a emissão do RDO se houver apontamentos sem avaliação da Engenharia Residente.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.block_on_pending_occurrences}
                  onChange={(e) =>
                    setRules({ ...rules, block_on_pending_occurrences: e.target.checked })
                  }
                  className="w-4 h-4 accent-action cursor-pointer shrink-0"
                />
              </label>

              {/* Regra 3 */}
              <label className="p-3 bg-paper rounded-field border border-rule flex items-center justify-between gap-3 cursor-pointer hover:bg-panel transition-colors">
                <div>
                  <strong className="text-ink block">Exigir Justificativa em Desvios de Produção Superiores a 15%</strong>
                  <span className="text-[11px] text-ink-secondary">
                    Exige anotação técnica obrigatória quando a meta diária apresentar desvio significativo.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rules.max_deviation_without_notes_pct > 0}
                  onChange={(e) =>
                    setRules({
                      ...rules,
                      max_deviation_without_notes_pct: e.target.checked ? 15.0 : 0,
                    })
                  }
                  className="w-4 h-4 accent-action cursor-pointer shrink-0"
                />
              </label>
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
            Salvar Configurações da Obra
          </button>
        </div>
      </div>
    </div>
  );
};
