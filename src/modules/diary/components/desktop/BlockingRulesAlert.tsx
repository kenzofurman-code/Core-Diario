import React from 'react';
import { Lock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BlockingValidationResult } from '../../types/diary.types';

interface BlockingRulesAlertProps {
  validation: BlockingValidationResult;
  onOpenReviewInbox?: () => void;
  onOpenWorkflowEditor?: () => void;
}

export const BlockingRulesAlert: React.FC<BlockingRulesAlertProps> = ({
  validation,
  onOpenReviewInbox,
  onOpenWorkflowEditor,
}) => {
  if (validation.can_issue) {
    return (
      <div className="p-3.5 bg-success-soft/30 border border-success/40 rounded-card flex items-center justify-between text-xs text-success">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>Todas as regras de fechamento e auditoria foram cumpridas com sucesso.</span>
        </div>
        <span className="text-[11px] font-bold uppercase bg-success text-white px-2 py-0.5 rounded-chip">
          Pronto para Emissão
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-warning-soft/30 border-2 border-warning rounded-card space-y-2.5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0" />
          <h4 className="text-xs font-bold text-warning-text uppercase tracking-wider">
            Critérios de Fechamento Pendentes ({validation.blocking_issues.length} Bloqueios)
          </h4>
        </div>
        {onOpenWorkflowEditor && (
          <button
            type="button"
            onClick={onOpenWorkflowEditor}
            className="text-[11px] text-action font-semibold hover:underline"
          >
            Ajustar Regras da Obra
          </button>
        )}
      </div>

      <ul className="space-y-1.5 pl-6 list-disc text-xs text-ink">
        {validation.blocking_issues.map((issue, idx) => (
          <li key={idx} className="leading-relaxed">
            <span className="font-semibold text-danger">Bloqueante:</span> {issue}
          </li>
        ))}
      </ul>

      {validation.warnings.length > 0 && (
        <div className="pt-2 border-t border-warning/20">
          <span className="text-[11px] font-bold text-warning-text flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Alertas Técnicos Não Bloqueantes:
          </span>
          <ul className="space-y-1 pl-6 list-disc text-[11px] text-ink-secondary mt-1">
            {validation.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
