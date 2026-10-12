import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  ExternalLink,
  Users,
  Briefcase,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { DiaryState } from '../../services/diaryStorage';
import { WhatsAppShareService, WhatsAppProfile } from '../../services/whatsappShareService';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaryState: DiaryState;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  diaryState,
}) => {
  if (!isOpen) return null;

  const [profile, setProfile] = useState<WhatsAppProfile>('EXECUTIVO');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const messageText = WhatsAppShareService.generateMessage(diaryState, profile);

  const handleCopy = async () => {
    const success = await WhatsAppShareService.copyToClipboard(messageText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = WhatsAppShareService.generateWhatsAppUrl(messageText, phoneNumber);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header do Modal */}
        <div className="p-4 border-b border-rule flex items-center justify-between bg-panel-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-chip bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
                DISPARO RÁPIDO PARA WHATSAPP
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded">
                  1-CLIQUE
                </span>
              </h2>
              <p className="text-[11px] text-ink-muted">
                Resumo pericial formatado para diretoria, clientes e grupos de obra
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Controles e Prévia */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Seletor de Perfil da Mensagem */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
              Perfil da Mensagem:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfile('EXECUTIVO')}
                className={`p-2.5 rounded-field border text-left flex items-center gap-2 transition-all ${
                  profile === 'EXECUTIVO'
                    ? 'bg-action-soft/40 border-action text-action font-bold shadow-xs'
                    : 'bg-paper border-rule text-ink hover:border-action/50'
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block text-xs">Resumo Executivo</span>
                  <span className="text-[10px] text-ink-muted font-normal">Para Diretoria & Clientes</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProfile('OPERACIONAL')}
                className={`p-2.5 rounded-field border text-left flex items-center gap-2 transition-all ${
                  profile === 'OPERACIONAL'
                    ? 'bg-action-soft/40 border-action text-action font-bold shadow-xs'
                    : 'bg-paper border-rule text-ink hover:border-action/50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block text-xs">Resumo Operacional</span>
                  <span className="text-[10px] text-ink-muted font-normal">Para Encarregados & Mestres</span>
                </div>
              </button>
            </div>
          </div>

          {/* Campo Opcional de Telefone ou Grupo */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-secondary flex items-center justify-between">
              <span>Número de Telefone ou Grupo (Opcional)</span>
              <span className="text-[10px] font-normal text-ink-muted">Deixe vazio para escolher na hora</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5541999998888 ou vazio para abrir seletor"
                className="w-full p-2 pl-8 rounded-field bg-paper border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
              />
              <Smartphone className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Pré-Visualização Simulada do WhatsApp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                Pré-Visualização no WhatsApp:
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Markdown Nativo
              </span>
            </div>

            {/* Balão do WhatsApp */}
            <div className="p-3.5 rounded-card bg-[#E7FCE3] dark:bg-[#083329] border border-emerald-300 dark:border-emerald-800 shadow-inner">
              <pre className="whitespace-pre-wrap font-sans text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed break-words">
                {messageText}
              </pre>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações em Destaque */}
        <div className="p-3 bg-panel-subtle border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-field border flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-paper hover:bg-panel border-rule text-ink'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado para Área de Transferência!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-action" />
                Copiar Mensagem
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-field flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            Abrir no WhatsApp
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
