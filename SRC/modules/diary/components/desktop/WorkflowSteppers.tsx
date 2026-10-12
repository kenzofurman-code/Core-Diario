import React, { useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, FileText, Lock, Settings, AlertTriangle } from 'lucide-react';
import { ApprovalWorkflow, DailyReport, BlockingValidationResult } from '../../types/diary.types';

interface WorkflowSteppersProps {
  workflow: ApprovalWorkflow;
  dailyReport: DailyReport;
  blockingValidation: BlockingValidationResult;
  onAdvanceStep: (notes?: string) => void;
  onIssueSnapshot: () => void;
  onOpenReportView: () => void;
  onOpenWorkflowEditor: () => void;
}

export const WorkflowSteppers: React.FC<WorkflowSteppersProps> = ({
  workflow,
  dailyReport,
  blockingValidation,
  onAdvanceStep,
  onIssueSnapshot,
  onOpenReportView,
  onOpenWorkflowEditor,
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showBlockAlert, setShowBlockAlert] = useState(false);

  const currentStep = workflow.steps.find((s) => s.step_number === workflow.current_step_number);
  const isFullyApproved = workflow.steps.every((s) => s.status === 'APPROVED');
  const isIssued = dailyReport.workflow_state === 'ISSUED';

  const handleAdvance = () => {
    onAdvanceStep(approvalNotes);
    setApprovalNotes('');
  };

  const handleIssueClick = () => {
    if (!blockingValidation.can_issue) {
      setShowBlockAlert(true);
      return;
    }
    setShowBlockAlert(false);
    onIssueSnapshot();
  };

  return (
    <div className="bg-panel border border-rule rounded-card p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-action uppercase">
            Governança & Assinaturas Multinível
          </span>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            Fluxo de Aprovação em {workflow.steps.length} Etapas ({dailyReport.formatted_number})
          </h3>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenWorkflowEditor}
            className="px-3 py-1 text-xs font-semibold rounded-field bg-paper hover:bg-panel-subtle border border-rule text-ink flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-action" />
            Configurar Workflow & Regras
          </button>

          <span
            className={`text-xs px-2.5 py-1 rounded-pill font-semibold uppercase ${
              isIssued
                ? 'bg-action-soft text-action border border-action/30'
                : isFullyApproved
                ? 'bg-success-soft text-success'
                : 'bg-warning-soft text-warning-text'
            }`}
          >
            {isIssued
              ? 'EMITIDO & IMUTÁVEL (v1)'
              : isFullyApproved
              ? 'APROVADO'
              : `Etapa ${workflow.current_step_number} de ${workflow.steps.length}`}
          </span>
        </div>
      </div>

      {/* Stepper Horizontal */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {workflow.steps.map((step) => {
          const isDone = step.status === 'APPROVED';
          const isCurrent = step.status === 'IN_PROGRESS' && !isIssued;

          return (
            <div
              key={step.step_number}
              className={`p-3 rounded-card border transition-all flex flex-col justify-between ${
                isDone
                  ? 'border-success/50 bg-success-soft/20'
                  : isCurrent
                  ? 'border-action bg-action-soft/30 ring-2 ring-action/20'
                  : 'border-rule bg-paper opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-ink-muted uppercase">
                    Nível {step.step_number}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-action animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-rule-subtle" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-ink">{step.role_title}</h4>
                <p className="text-[11px] text-ink-secondary mt-0.5">{step.approver_name}</p>
              </div>

              <div className="pt-2 mt-2 border-t border-rule-subtle text-[10px]">
                {isDone ? (
                  <span className="text-success font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Assinado Digitalmente
                  </span>
                ) : isCurrent ? (
                  <span className="text-action font-semibold">Aguardando Aval...</span>
                ) : (
                  <span className="text-ink-muted">Aguardando anteriores</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ação da Etapa Atual */}
      {!isFullyApproved && !isIssued && currentStep && (
        <div className="bg-paper p-3.5 rounded-card border border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-action" />
              Sua Ação: Aprovação como {currentStep.role_title}
            </span>
            <input
              type="text"
              placeholder="Adicionar nota de aprovação ou parecer técnico (opcional)..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full sm:w-96 px-3 py-1.5 text-xs bg-panel border border-rule rounded-field focus:outline-none focus:border-action"
            />
          </div>

          <button
            type="button"
            onClick={handleAdvance}
            className="px-5 py-2.5 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-2 hover:opacity-90 shadow-sm shrink-0"
          >
            Aprovar Esta Etapa
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta caso tente emitir com bloqueios pendentes */}
      {showBlockAlert && !blockingValidation.can_issue && (
        <div className="p-3 bg-danger-soft border-2 border-danger rounded-card flex items-start gap-2 text-xs text-danger animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Emissão Bloqueada pelo Motor de Auditoria:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {blockingValidation.blocking_issues.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Botão de Emissão de RDO e Congelamento de Snapshot */}
      {isFullyApproved && !isIssued && (
        <div className="bg-success-soft/40 border-2 border-success p-4 rounded-card flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div>
            <h4 className="text-sm font-bold text-success flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              Todas as Etapas Foram Concluídas e Aprovadas!
            </h4>
            <p className="text-xs text-ink-secondary mt-0.5">
              {blockingValidation.can_issue
                ? 'Critérios de auditoria cumpridos. O RDO está pronto para emissão e congelamento de snapshot.'
                : 'Atenção: Existem regras de bloqueio ou fotos pendentes antes de emitir.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleIssueClick}
            className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-success text-white rounded-field flex items-center gap-2 shadow-md hover:opacity-90 active:scale-95"
          >
            <Lock className="w-4 h-4" />
            Emitir RDO Oficial & Congelar Snapshot
          </button>
        </div>
      )}

      {/* Relatório Emitido - Acesso ao Documento Imutável */}
      {isIssued && (
        <div className="bg-action-soft/30 border border-action/40 p-4 rounded-card flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-action flex items-center gap-2">
              <Lock className="w-4 h-4" />
              RDO Emitido e Protegido contra Alterações (Versão 1)
            </h4>
            <p className="text-xs text-ink-secondary mt-0.5">
              Documento arquivado com assinatura digital. Quaisquer alterações futuras exigirão retificação formal (v2).
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenReportView}
            className="px-5 py-2.5 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-2 shadow-sm hover:opacity-90"
          >
            <FileText className="w-4 h-4" />
            Visualizar / Imprimir PDF Oficial
          </button>
        </div>
      )}
    </div>
  );
};
