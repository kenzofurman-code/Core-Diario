import React, { useState } from 'react';
import {
  X,
  Zap,
  Mic,
  Camera,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  Send,
  Play,
  FileAudio,
  User,
  ShieldCheck,
} from 'lucide-react';
import { InformationRequest, WhatsAppInboundWebhookPayload } from '../../types/diary.types';

interface WhatsAppInboundSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: InformationRequest[];
  initialRequestId?: string;
  onDispatchWebhook: (payload: WhatsAppInboundWebhookPayload) => void;
}

export const WhatsAppInboundSimulatorModal: React.FC<WhatsAppInboundSimulatorModalProps> = ({
  isOpen,
  onClose,
  requests,
  initialRequestId,
  onDispatchWebhook,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'AUDIO_CONCRETO' | 'FOTO_ALVENARIA' | 'FALTA_MATERIAL' | 'CUSTOM'>('AUDIO_CONCRETO');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequestId || (requests[0]?.id || ''));

  // Campos customizáveis
  const [customSenderName, setCustomSenderName] = useState('Carlos Silva (Mestre)');
  const [customPhone, setCustomPhone] = useState('+5541987654321');
  const [customMessageType, setCustomMessageType] = useState<'audio' | 'image' | 'text'>('audio');
  const [customText, setCustomText] = useState('Mariana, concretamos a laje L-09 hoje à tarde. Deu 18 m³ aplicados, slump deu 12 cm no teste do caminhão.');
  const [customQuantity, setCustomQuantity] = useState<number>(18);
  const [customTaskName, setCustomTaskName] = useState('Concretagem de Vigas e Lajes — Laje L-09');

  const [isDispatched, setIsDispatched] = useState(false);

  if (!isOpen) return null;

  // Monta o payload baseado no preset selecionado
  const buildCurrentPayload = (): WhatsAppInboundWebhookPayload => {
    const now = new Date().toISOString();

    if (selectedPreset === 'AUDIO_CONCRETO') {
      return {
        event_id: `evt-wa-audio-${Date.now()}`,
        whatsapp_message_id: `WAMID-AUDIO-${Math.random().toString(36).substring(2, 9)}`,
        sender_phone: '+5541987654321',
        sender_name: 'Carlos Silva (Mestre de Obras)',
        message_type: 'audio',
        audio_duration_seconds: 22,
        media_url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_construction.ogg',
        transcription:
          'Engenheira Mariana, aqui é o Carlos. A concretagem da laje L-09 foi concluída com sucesso. Foram 18 m³ aplicados pela equipe da Estruturas Poty. O ensaio de slump deu 12 cm conforme projeto e o escoramento permaneceu 100% nivelado.',
        received_at: now,
        matched_request_id: selectedRequestId || 'req-02',
        detected_entities: {
          task_id: 'tsk-01',
          wbs_task_name: 'Concretagem de Vigas e Lajes — Laje L-09',
          location_name: 'Pavimento 09 — Laje L-09',
          production_quantity: 18,
          uom: 'm³',
          is_critical_activity: true,
        },
      };
    }

    if (selectedPreset === 'FOTO_ALVENARIA') {
      return {
        event_id: `evt-wa-photo-${Date.now()}`,
        whatsapp_message_id: `WAMID-IMG-${Math.random().toString(36).substring(2, 9)}`,
        sender_phone: '+5541998887711',
        sender_name: 'Antônio Santos (Encarregado)',
        message_type: 'image',
        media_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?w=800&auto=format&fit=crop',
        raw_text:
          'Boa tarde Engª Mariana! Alvenaria de vedação do 8º pavimento avançou muito hoje. Fechamos 45 m² no apto 802 com todas as vergas conferidas.',
        transcription:
          'Boa tarde Engª Mariana! Alvenaria de vedação do 8º pavimento avançou muito hoje. Fechamos 45 m² no apto 802 com todas as vergas conferidas.',
        received_at: now,
        matched_request_id: selectedRequestId || 'req-01',
        detected_entities: {
          task_id: 'tsk-02',
          wbs_task_name: 'Alvenaria de Vedação — Pavimento 08',
          location_name: 'Pavimento 08 — Torre A',
          production_quantity: 45,
          uom: 'm²',
          is_critical_activity: false,
        },
      };
    }

    if (selectedPreset === 'FALTA_MATERIAL') {
      return {
        event_id: `evt-wa-shortage-${Date.now()}`,
        whatsapp_message_id: `WAMID-ALERT-${Math.random().toString(36).substring(2, 9)}`,
        sender_phone: '+5541991234567',
        sender_name: 'Marcos Oliveira (Encarregado)',
        message_type: 'audio',
        audio_duration_seconds: 16,
        media_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
        transcription:
          'Mariana, precisamos de apoio urgente de Suprimentos. Acabou todo o cimento CP-II no canteiro às 14h. Estou com 4 pedreiros e 2 serventes parados no 4º pavimento.',
        received_at: now,
        matched_request_id: selectedRequestId || 'req-03',
        detected_entities: {
          wbs_task_name: 'Reboco e Instalações — Pavimento 04',
          location_name: 'Pavimento 04 — Torre A',
          occurrence_title: 'Falta Crítica de Cimento CP-II',
          occurrence_category: 'material',
          material_shortage: {
            material_name: 'Cimento CP-II',
            workers_idle: 6,
            hours_lost: 3,
          },
        },
      };
    }

    // Custom
    return {
      event_id: `evt-wa-custom-${Date.now()}`,
      whatsapp_message_id: `WAMID-CUSTOM-${Math.random().toString(36).substring(2, 9)}`,
      sender_phone: customPhone,
      sender_name: customSenderName,
      message_type: customMessageType,
      raw_text: customText,
      transcription: customText,
      media_url:
        customMessageType === 'image'
          ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop'
          : undefined,
      audio_duration_seconds: customMessageType === 'audio' ? 18 : undefined,
      received_at: now,
      matched_request_id: selectedRequestId || undefined,
      detected_entities: {
        wbs_task_name: customTaskName,
        production_quantity: customQuantity || undefined,
        uom: 'm²',
      },
    };
  };

  const currentPayload = buildCurrentPayload();

  const handleSend = () => {
    setIsDispatched(true);
    onDispatchWebhook(currentPayload);
    setTimeout(() => {
      setIsDispatched(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between bg-panel-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-chip bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink">
                  SIMULADOR DE COLETA ATIVA & WEBHOOK WHATSAPP
                </h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                  Evolution API + n8n
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Simule o recebimento em tempo real de mensagens de voz, fotos e textos dos mestres de obra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 rounded-field"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Seletor de Solicitação Vinculada */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
              Vincular a qual Solicitação de Informação do Dia?
            </label>
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="w-full p-2.5 rounded-field bg-paper border border-rule text-ink text-xs focus:border-action focus:outline-none"
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} — {r.requested_from_user_name} ({r.wbs_task_name || 'Geral'}) [Status: {r.request_state}]
                </option>
              ))}
              <option value="">Mensagem espontânea (sem solicitação prévia)</option>
            </select>
          </div>

          {/* Seletor de Cenários de Teste Rápidos */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
              Selecione um Cenário Real de Canteiro:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedPreset('AUDIO_CONCRETO')}
                className={`p-3 rounded-field border text-left flex flex-col justify-between transition-all ${
                  selectedPreset === 'AUDIO_CONCRETO'
                    ? 'bg-action-soft/30 border-action text-action font-bold shadow-xs'
                    : 'bg-paper border-rule text-ink hover:border-action/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs">1. Áudio Whisper: Concretagem</span>
                </div>
                <span className="text-[10px] text-ink-muted font-normal">
                  Carlos manda áudio (18 m³, slump 12cm). IA extrai avanço físico.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('FOTO_ALVENARIA')}
                className={`p-3 rounded-field border text-left flex flex-col justify-between transition-all ${
                  selectedPreset === 'FOTO_ALVENARIA'
                    ? 'bg-action-soft/30 border-action text-action font-bold shadow-xs'
                    : 'bg-paper border-rule text-ink hover:border-action/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="w-4 h-4 text-action shrink-0" />
                  <span className="text-xs">2. Foto + Legenda: Alvenaria</span>
                </div>
                <span className="text-[10px] text-ink-muted font-normal">
                  Antônio manda foto da alvenaria (45 m² concluídos no Pav. 8).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('FALTA_MATERIAL')}
                className={`p-3 rounded-field border text-left flex flex-col justify-between transition-all ${
                  selectedPreset === 'FALTA_MATERIAL'
                    ? 'bg-action-soft/30 border-action text-action font-bold shadow-xs'
                    : 'bg-paper border-rule text-ink hover:border-action/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <span className="text-xs">3. Alerta de Falta de Cimento</span>
                </div>
                <span className="text-[10px] text-ink-muted font-normal">
                  Marcos relata 6 operários ociosos por falta de cimento CP-II.
                </span>
              </button>
            </div>
          </div>

          {/* Grid: Preview WhatsApp vs Payload Inbound Webhook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Coluna 1: Mockup da Conversa no WhatsApp */}
            <div className="p-3.5 rounded-card bg-[#ECE5DD] dark:bg-[#0B141A] border border-neutral-300 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                    CK
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    ConstruKore Bot • Obra Poty
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                  Online
                </span>
              </div>

              {/* Bolha 1: Pergunta do Bot */}
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white dark:bg-[#202C33] p-2.5 rounded-lg rounded-tl-none shadow-xs text-xs space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                    ConstruKore RDO
                  </span>
                  <p className="text-neutral-900 dark:text-neutral-100 leading-snug">
                    {requests.find((r) => r.id === selectedRequestId)?.request_text ||
                      'Carlos, favor confirmar o andamento da concretagem e enviar evidência fotográfica.'}
                  </p>
                  <span className="text-[9px] text-neutral-500 text-right block">14:00</span>
                </div>
              </div>

              {/* Bolha 2: Resposta do Encarregado (Inbound) */}
              <div className="flex justify-end">
                <div className="max-w-[88%] bg-[#D9FDD3] dark:bg-[#005C4B] p-2.5 rounded-lg rounded-tr-none shadow-xs text-xs space-y-2">
                  <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 block">
                    {currentPayload.sender_name}
                  </span>

                  {/* Foto se houver */}
                  {currentPayload.media_url && currentPayload.message_type === 'image' && (
                    <div className="relative rounded overflow-hidden border border-emerald-400">
                      <img
                        src={currentPayload.media_url}
                        alt="Foto enviada"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1 rounded">
                        GPS & Data Queimados
                      </div>
                    </div>
                  )}

                  {/* Player de Áudio se houver */}
                  {currentPayload.message_type === 'audio' && (
                    <div className="p-2 bg-white/80 dark:bg-black/40 rounded flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1 bg-emerald-400 rounded-full w-full"></div>
                        <div className="flex justify-between text-[9px] text-neutral-600 dark:text-neutral-300 font-mono">
                          <span>0:00</span>
                          <span>0:{currentPayload.audio_duration_seconds || 22}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transcrição / Texto */}
                  <p className="text-neutral-900 dark:text-neutral-100 leading-snug italic font-sans">
                    &quot;{currentPayload.transcription || currentPayload.raw_text}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-neutral-600 dark:text-neutral-300">
                    <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                      Transcrito via Whisper
                    </span>
                    <span>14:32 ✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 2: Inspecione o Webhook & Extração de IA */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Entidades Extraídas */}
              <div className="p-3 rounded-card bg-panel border border-rule space-y-2">
                <div className="flex items-center justify-between border-b border-rule pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-action flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-action" /> Extração de Dados Estruturados (IA)
                  </span>
                  <span className="text-[10px] font-mono text-success font-bold">95% Confiança</span>
                </div>

                <div className="space-y-1 text-xs">
                  {currentPayload.detected_entities?.wbs_task_name && (
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Tarefa Vinculada:</span>
                      <strong className="text-ink">{currentPayload.detected_entities.wbs_task_name}</strong>
                    </div>
                  )}
                  {currentPayload.detected_entities?.production_quantity !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Avanço Físico Detectado:</span>
                      <strong className="text-success font-mono">
                        +{currentPayload.detected_entities.production_quantity} {currentPayload.detected_entities.uom}
                      </strong>
                    </div>
                  )}
                  {currentPayload.detected_entities?.material_shortage && (
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Ocorrência Crítica:</span>
                      <strong className="text-danger">
                        Falta de {currentPayload.detected_entities.material_shortage.material_name} ({currentPayload.detected_entities.material_shortage.workers_idle} operários ociosos)
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Canal de Origem:</span>
                    <strong className="text-emerald-600 font-mono">Evolution API Webhook</strong>
                  </div>
                </div>
              </div>

              {/* JSON Payload Preview */}
              <div className="p-2.5 rounded-card bg-neutral-900 text-neutral-100 font-mono text-[10px] space-y-1 overflow-x-auto border border-neutral-700 max-h-40">
                <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-700 pb-1">
                  <span className="flex items-center gap-1 text-[9px]">
                    <Code2 className="w-3 h-3 text-emerald-400" /> POST /api/diary/webhooks/whatsapp-inbound
                  </span>
                  <span className="text-[9px]">application/json</span>
                </div>
                <pre className="text-emerald-400 leading-tight">
                  {JSON.stringify(currentPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé / Disparo */}
        <div className="p-3 bg-panel-subtle border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              O evento entrará como <strong>WHATSAPP_{currentPayload.message_type.toUpperCase()}</strong> na timeline e gerará item de homologação em 1 clique.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-ink-muted hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDispatched}
              onClick={handleSend}
              className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-field flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
                isDispatched
                  ? 'bg-success text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isDispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Webhook Recebido com Sucesso!
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Disparar Webhook Inbound para o ConstruKore
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
