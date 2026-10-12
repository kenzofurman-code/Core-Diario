import React, { useState } from 'react';
import { PackageOpen, AlertTriangle, Check, X, ShieldAlert, Clock, Users, Scale, ArrowRight, Zap, CheckCircle2, MessageSquare, Sparkles, Phone } from 'lucide-react';
import { OperationalOccurrence, SourceConflict, InformationRequest } from '../../types/diary.types';

interface ReviewInboxProps {
  occurrences: OperationalOccurrence[];
  conflicts?: SourceConflict[];
  informationRequests?: InformationRequest[];
  onReviewOccurrence: (occurrenceId: string, approved: boolean, feedback?: string) => void;
  onOpenConflictModal?: (conflict: SourceConflict) => void;
  onApproveWhatsAppRequest?: (requestId: string) => void;
}

export const ReviewInbox: React.FC<ReviewInboxProps> = ({
  occurrences,
  conflicts = [],
  informationRequests = [],
  onReviewOccurrence,
  onOpenConflictModal,
  onApproveWhatsAppRequest,
}) => {
  const [feedbackNotes, setFeedbackNotes] = useState<{ [key: string]: string }>({});

  const pendingOccurrences = occurrences.filter((o) => !o.approved_for_rdo && o.status === 'OPEN');
  const approvedOccurrences = occurrences.filter((o) => o.approved_for_rdo);
  const pendingConflicts = conflicts.filter((c) => c.status === 'PENDING');
  const pendingWhatsAppAnswers = informationRequests.filter((r) => r.request_state === 'ANSWERED');

  const totalPending = pendingOccurrences.length + pendingConflicts.length + pendingWhatsAppAnswers.length;

  return (
    <div className="bg-panel border border-rule rounded-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-chip bg-warning text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-action uppercase">
              Caixa de Validação da Engenharia (Inbox)
            </span>
            <h3 className="text-sm font-bold text-ink">
              Validações & Conciliações ({totalPending} pendentes)
            </h3>
          </div>
        </div>
        <span className="text-xs text-ink-muted">
          Revisão técnica obrigatória antes de compor o RDO oficial
        </span>
      </div>

      {/* SEÇÃO DE RESPOSTAS DE WHATSAPP RECEBIDAS (Evolution API + n8n) */}
      {pendingWhatsAppAnswers.length > 0 && (
        <div className="p-3.5 rounded-card bg-emerald-50/60 dark:bg-emerald-950/30 border-2 border-emerald-500/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Respostas Inbound do WhatsApp Pendentes de Homologação ({pendingWhatsAppAnswers.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-chip">
              Evolution Bot • Whisper STT
            </span>
          </div>

          <div className="space-y-2">
            {pendingWhatsAppAnswers.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-panel rounded-field border border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-ink text-sm">{req.requested_from_user_name}</strong>
                    <span className="text-ink-muted font-mono text-[10px]">{req.requested_from_phone}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold">
                      {req.wbs_task_name || 'Canteiro'}
                    </span>
                  </div>
                  <p className="text-neutral-800 dark:text-neutral-200 italic font-sans text-xs bg-panel-subtle p-2 rounded border border-rule-subtle">
                    &quot;{req.response_transcription || req.response_raw_content}&quot;
                  </p>
                  {req.extracted_data && (
                    <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                      {req.extracted_data.suggested_production_delta !== undefined && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Sugerido: +{req.extracted_data.suggested_production_delta} {req.extracted_data.suggested_uom || 'm²'}
                        </span>
                      )}
                      {req.extracted_data.material_shortage && (
                        <span className="text-danger font-bold">
                          Alerta: Falta de {req.extracted_data.material_shortage.material_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {onApproveWhatsAppRequest && (
                  <button
                    type="button"
                    onClick={() => onApproveWhatsAppRequest(req.id)}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-field flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Homologar no RDO
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO DE CONFLITOS DE MEDIÇÃO ENTRE FONTES (Fase 3) */}
      {pendingConflicts.length > 0 && (
        <div className="p-3.5 rounded-card bg-action-soft/20 border-2 border-action/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-action" />
              <h4 className="text-xs font-bold text-action uppercase tracking-wider">
                Divergência de Medição Detectada ({pendingConflicts.length})
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold bg-action text-white px-2 py-0.5 rounded-chip">
              Fase 3 • Conciliação
            </span>
          </div>

          {pendingConflicts.map((conf) => (
            <div
              key={conf.id}
              className="p-3 bg-panel rounded-field border border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <strong className="text-ink text-sm block">{conf.task_name}</strong>
                <p className="text-ink-secondary">
                  {conf.location_name} • {conf.contractor_party_name}
                </p>
                <div className="flex items-center gap-3 pt-1 font-mono text-xs">
                  <span>
                    Empreiteiro apontou: <strong>{conf.contractor_value} {conf.uom}</strong>
                  </span>
                  <span>vs</span>
                  <span className="text-action">
                    Medição Técnica: <strong>{conf.engineer_value} {conf.uom}</strong>
                  </span>
                  <span className="text-danger font-bold">(Variação: +{conf.variance_pct}%)</span>
                </div>
              </div>

              {onOpenConflictModal && (
                <button
                  type="button"
                  onClick={() => onOpenConflictModal(conf)}
                  className="px-4 py-2 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Conciliar Divergência
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista de Ocorrências Pendentes de Validação */}
      <div className="space-y-3">
        {pendingOccurrences.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-muted border border-dashed border-rule rounded-card bg-paper">
            🎉 Nenhuma ocorrência ou falta de material pendente de validação.
          </div>
        ) : (
          pendingOccurrences.map((occ) => (
            <div
              key={occ.id}
              className="p-4 rounded-card border-2 border-warning/60 bg-warning-soft/20 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-chip text-[11px] font-mono font-bold bg-warning text-white">
                    {occ.code}
                  </span>
                  <h4 className="text-sm font-bold text-ink">{occ.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-secondary">
                  <span>Local: <strong>{occ.location_name}</strong></span>
                  <span>•</span>
                  <span>Gravidade: <strong className="text-warning uppercase">{occ.severity}</strong></span>
                </div>
              </div>

              <p className="text-xs text-ink">{occ.description}</p>

              {/* Impacto Imediato */}
              {occ.immediate_impact && (
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-field bg-panel border border-rule text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-ink-muted" />
                    <div>
                      <span className="text-[10px] text-ink-muted block">Operários Parados</span>
                      <strong className="text-ink">{occ.immediate_impact.workers_idle_count} pessoas</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-ink-muted" />
                    <div>
                      <span className="text-[10px] text-ink-muted block">Tempo Ocioso</span>
                      <strong className="text-ink">{occ.immediate_impact.hours_lost} horas</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted block">Custo Estimado</span>
                    <strong className="text-danger font-mono">
                      R$ {occ.immediate_impact.cost_estimate?.toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Campo de Parecer da Engenharia */}
              <div>
                <input
                  type="text"
                  placeholder="Parecer do(a) Engenheiro(a) para constar no RDO oficial (opcional)..."
                  value={feedbackNotes[occ.id] || ''}
                  onChange={(e) =>
                    setFeedbackNotes({ ...feedbackNotes, [occ.id]: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-panel border border-rule rounded-field focus:outline-none focus:border-action"
                />
              </div>

              {/* Ações de Aprovação */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-ink-muted italic">
                  * Ao aprovar, o fato passa a integrar oficialmente o relatório diário e o histórico de obra.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onReviewOccurrence(occ.id, false, 'Descartado pela Engenharia')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-field text-danger hover:bg-danger-soft transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewOccurrence(occ.id, true, feedbackNotes[occ.id])}
                    className="px-4 py-1.5 text-xs font-semibold rounded-field bg-success text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprovar para o RDO
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Ocorrências Já Aprovadas */}
        {approvedOccurrences.length > 0 && (
          <div className="pt-2 border-t border-rule-subtle">
            <h4 className="text-xs font-bold text-ink-secondary mb-2">
              Ocorrências Já Aprovadas para o RDO Oficial ({approvedOccurrences.length}):
            </h4>
            <div className="space-y-1.5">
              {approvedOccurrences.map((occ) => (
                <div
                  key={occ.id}
                  className="p-2.5 bg-paper rounded-field border border-rule-subtle flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="font-mono font-bold text-ink">{occ.code}</span>
                    <span className="text-ink">{occ.title} ({occ.location_name})</span>
                  </div>
                  <span className="text-[11px] text-success font-semibold">
                    Aprovado por {occ.reviewed_by || 'Engenheiro'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
