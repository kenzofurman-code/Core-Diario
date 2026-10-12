import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Phone,
  ShieldAlert,
  Play,
  Sparkles,
  Plus,
  ArrowRight,
  UserCheck,
  Zap,
  CornerDownRight,
  Flame,
  Check,
} from 'lucide-react';
import { InformationRequest, InformationRequestType, WhatsAppContact } from '../../types/diary.types';
import { DiaryStorageService } from '../../services/diaryStorage';

interface InformationRequestsPanelProps {
  requests: InformationRequest[];
  contacts?: WhatsAppContact[];
  onOpenSimulator: (requestId?: string) => void;
  onEscalateRequest: (requestId: string) => void;
  onApproveSuggestion: (requestId: string) => void;
  onCreateRequest: (data: Partial<InformationRequest>) => void;
}

export const InformationRequestsPanel: React.FC<InformationRequestsPanelProps> = ({
  requests,
  contacts = [],
  onOpenSimulator,
  onEscalateRequest,
  onApproveSuggestion,
  onCreateRequest,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('+55 (41) 9');
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<InformationRequestType>('PRODUCTION_PROGRESS');
  const [newTime, setNewTime] = useState('16:00');
  const [newBlocking, setNewBlocking] = useState(false);

  const pendingCount = requests.filter(
    (r) => r.request_state !== 'ANSWERED' && r.request_state !== 'REVIEWED' && r.request_state !== 'CLOSED'
  ).length;

  const answeredCount = requests.filter(
    (r) => r.request_state === 'ANSWERED' || r.request_state === 'REVIEWED' || r.request_state === 'CLOSED'
  ).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient || !newText) return;
    onCreateRequest({
      requested_from_user_name: newRecipient,
      requested_from_phone: newPhone,
      request_text: newText,
      request_type: newType,
      scheduled_send_time: newTime,
      blocking_rule: newBlocking,
    });
    setNewRecipient('');
    setNewText('');
    setIsCreating(false);
  };

  const getStateBadge = (req: InformationRequest) => {
    switch (req.request_state) {
      case 'ANSWERED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Respondida via WhatsApp
          </span>
        );
      case 'CLOSED':
      case 'REVIEWED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-600" /> Homologada no RDO
          </span>
        );
      case 'REMINDED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 animate-pulse">
            <Bell className="w-3 h-3 text-amber-600" /> Lembrete Enviado (+30m)
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-600" /> Escalado Engenharia
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" /> Aguardando Encarregado
          </span>
        );
    }
  };

  return (
    <div className="bg-panel border border-rule rounded-card p-4 space-y-4">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-chip bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                Motor de Coleta Ativa & WhatsApp Inbound
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                Evolution API + n8n
              </span>
            </div>
            <h3 className="text-sm font-bold text-ink">
              Cobranças Proativas de Canteiro ({pendingCount} pendente{pendingCount !== 1 ? 's' : ''} • {answeredCount} respondida{answeredCount !== 1 ? 's' : ''})
            </h3>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenSimulator()}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-field flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Simular respostas reais via webhook de WhatsApp (Evolution API / n8n)"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            Simulador Inbound WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="px-3 py-1.5 text-xs font-semibold bg-panel-subtle hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-action" />
            Nova Cobrança
          </button>
        </div>
      </div>

      {/* Rationale de Canteiro */}
      <div className="p-3 bg-action-soft/20 border border-action/30 rounded-field flex items-start gap-2.5 text-xs text-ink-secondary">
        <Sparkles className="w-4 h-4 text-action shrink-0 mt-0.5" />
        <div>
          <p className="text-ink font-semibold">
            Tese ConstruKore: &quot;Captura primeiro, formulário depois&quot;
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            O encarregado na obra não preenche formulários. O bot do n8n / Evolution API dispara perguntas nos horários estratégicos (11:30 e 16:00). As respostas por áudio ou foto são transcritas com Whisper e entram como sugestões na timeline.
          </p>
        </div>
      </div>

      {/* Formulário Inline de Nova Solicitação */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-3.5 bg-paper rounded-card border border-rule space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-action" /> Programar Nova Cobrança Ativa
            </h4>
            <span className="text-[10px] text-ink-muted">Disparo via WhatsApp Bot</span>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Selecionar do Catálogo de Contatos / Grupos da Obra:
              </label>
              <select
                onChange={(e) => {
                  const c = contacts.find((item) => item.id === e.target.value);
                  if (c) {
                    setNewRecipient(c.name);
                    setNewPhone(c.phone_or_jid);
                    const randomPhrase = DiaryStorageService.getRandomQuestionVariation({
                      category: newType,
                      contactName: c.name,
                      taskName: c.assigned_wbs_tasks?.[0] || 'produção',
                      locationName: c.assigned_location || 'canteiro',
                      targetType: c.type,
                    });
                    setNewText(randomPhrase);
                  }
                }}
                defaultValue=""
                className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
              >
                <option value="" disabled>-- Escolha um contato ou grupo cadastrado --</option>
                {contacts.filter((c) => c.is_active).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'GROUP' ? '👥 [Grupo]' : '👤'} {c.name} ({c.phone_or_jid}) — {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Destinatário (Mestre / Encarregado / Grupo):
              </label>
              <input
                type="text"
                required
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Ex: Carlos Silva (Mestre)"
                className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                WhatsApp com DDD ou JID:
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+55 41 99999-8888 ou ...@g.us"
                className="w-full p-2 rounded-field bg-panel border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Horário do Disparo:
              </label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="Ex: 11:30 ou 16:00"
                className="w-full p-2 rounded-field bg-panel border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase text-ink-secondary">
                Pergunta / Cobrança Enviada ao WhatsApp:
              </label>
              <button
                type="button"
                onClick={() => {
                  const phrase = DiaryStorageService.getRandomQuestionVariation({
                    category: newType,
                    contactName: newRecipient || 'Mestre',
                    taskName: 'Alvenaria',
                    locationName: 'Pavimento 08',
                  });
                  setNewText(phrase);
                }}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                title="Gera uma variação natural em português de canteiro para evitar soar robótico"
              >
                <Sparkles className="w-3.5 h-3.5" /> Sortear Variação Natural
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ex: Fala mestre! Como tá o avanço da concretagem da laje hoje e manda a foto do ensaio de abatimento (slump)."
              className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-ink select-none">
              <input
                type="checkbox"
                checked={newBlocking}
                onChange={(e) => setNewBlocking(e.target.checked)}
                className="w-4 h-4 text-action rounded border-rule"
              />
              <span className="font-semibold text-danger">Regra Bloqueante:</span>
              <span className="text-ink-muted text-[11px]">Bloqueia emissão do RDO se não responder até as 18h</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-action hover:opacity-90 text-white rounded-field shadow-xs"
              >
                Salvar & Agendar Disparo
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Solicitações Ativas */}
      <div className="space-y-3">
        {requests.map((req) => {
          const isAnswered = req.request_state === 'ANSWERED' || req.request_state === 'REVIEWED' || req.request_state === 'CLOSED';

          return (
            <div
              key={req.id}
              className={`p-3.5 rounded-card border transition-all ${
                req.blocking_rule && !isAnswered
                  ? 'bg-danger-soft/20 border-danger/40'
                  : isAnswered
                  ? 'bg-panel-subtle border-rule'
                  : 'bg-paper border-rule hover:border-rule-strong'
              }`}
            >
              {/* Topo do Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-chip bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-ink">{req.requested_from_user_name}</strong>
                      <span className="font-mono text-[10px] text-ink-muted">{req.requested_from_phone}</span>
                    </div>
                    <p className="text-[11px] text-ink-secondary">
                      {req.wbs_task_name || 'Geral'} • {req.location_name || 'Canteiro'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {req.blocking_rule && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-danger text-white uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Bloqueante
                    </span>
                  )}
                  {getStateBadge(req)}
                </div>
              </div>

              {/* Corpo: Texto da Solicitação e Régua */}
              <div className="py-2.5 space-y-2 text-xs">
                <div className="p-2.5 rounded-field bg-panel border border-rule flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                      Disparo automático das {req.scheduled_send_time}:
                    </span>
                    <p className="text-ink text-xs font-medium mt-0.5 leading-relaxed">
                      &quot;{req.request_text}&quot;
                    </p>
                  </div>
                </div>

                {/* Resposta Recebida se houver */}
                {isAnswered && (
                  <div className="p-2.5 rounded-field bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Resposta Capturada no WhatsApp:
                      </span>
                      {req.response_received_at && (
                        <span className="font-mono text-[10px] text-ink-muted">
                          {new Date(req.response_received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-900 dark:text-neutral-100 font-sans italic pl-1 border-l-2 border-emerald-500">
                      &quot;{req.response_transcription || req.response_raw_content}&quot;
                    </p>

                    {/* Dados Extraídos pela IA */}
                    {req.extracted_data && (
                      <div className="pt-1.5 border-t border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          {req.extracted_data.suggested_production_delta !== undefined && (
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                              Produção Sugerida: +{req.extracted_data.suggested_production_delta} {req.extracted_data.suggested_uom || 'm²'}
                            </span>
                          )}
                          {req.extracted_data.material_shortage && (
                            <span className="text-[11px] font-bold text-danger bg-danger-soft px-2 py-0.5 rounded border border-danger/30">
                              Falta de {req.extracted_data.material_shortage.material_name} ({req.extracted_data.material_shortage.workers_idle} parados)
                            </span>
                          )}
                        </div>

                        {req.request_state === 'ANSWERED' && (
                          <button
                            type="button"
                            onClick={() => onApproveSuggestion(req.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Homologar no RDO (1-Clique)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rodapé / Ações de Escalonamento */}
              {!isAnswered && (
                <div className="pt-2 border-t border-rule/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                    <span>Régua:</span>
                    <span className={req.escalation_level >= 1 ? 'font-bold text-amber-600' : ''}>+30m Lembrete</span>
                    <span>→</span>
                    <span className={req.escalation_level >= 2 ? 'font-bold text-red-600' : ''}>+1h Escalar Engenheiro</span>
                    <span>→</span>
                    <span className={req.escalation_level >= 3 ? 'font-bold text-danger' : ''}>Bloquear Fechamento</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEscalateRequest(req.id)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-panel hover:bg-panel-subtle border border-rule rounded text-ink flex items-center gap-1 transition-colors"
                      title="Avançar nível na régua de cobrança ativa"
                    >
                      <Bell className="w-3 h-3 text-amber-500" />
                      Disparar Cobrança (+1)
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSimulator(req.id)}
                      className="px-3 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                    >
                      <Zap className="w-3 h-3 fill-white" />
                      Simular Resposta WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
