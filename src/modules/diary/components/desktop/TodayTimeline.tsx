import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, Camera, Mic, PackageOpen, Users, Hammer, MapPin, MessageSquare, Zap, Phone } from 'lucide-react';
import { SourceEvent, SourceEventType } from '../../types/diary.types';

interface TodayTimelineProps {
  events: SourceEvent[];
}

export const TodayTimeline: React.FC<TodayTimelineProps> = ({ events }) => {
  const [filter, setFilter] = useState<'ALL' | 'WHATSAPP' | SourceEventType>('ALL');

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'WHATSAPP') {
      return e.source_type.startsWith('WHATSAPP');
    }
    return e.source_type === filter;
  });

  const getEventIcon = (type: SourceEventType) => {
    switch (type) {
      case 'WHATSAPP_AUDIO':
        return <Mic className="w-4 h-4 text-emerald-600" />;
      case 'WHATSAPP_IMAGE':
        return <Camera className="w-4 h-4 text-emerald-600" />;
      case 'WHATSAPP_TEXT':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'MANUAL_AUDIO':
        return <Mic className="w-4 h-4 text-action" />;
      case 'MANUAL_IMAGE':
        return <Camera className="w-4 h-4 text-action" />;
      case 'MATERIAL_SHORTAGE':
        return <PackageOpen className="w-4 h-4 text-warning" />;
      case 'WORKFORCE_COUNT':
        return <Users className="w-4 h-4 text-ink" />;
      case 'PRODUCTION_DELTA':
        return <Hammer className="w-4 h-4 text-success" />;
      default:
        return <Clock className="w-4 h-4 text-ink-muted" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-panel border border-rule rounded-card p-4 space-y-4">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-action uppercase">
            Linha do Tempo Auditável
          </span>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            Fatos Capturados Hoje ({filteredEvents.length})
          </h3>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Todos', value: 'ALL' },
            { label: 'WhatsApp', value: 'WHATSAPP' },
            { label: 'Produção', value: 'PRODUCTION_DELTA' },
            { label: 'Falta Material', value: 'MATERIAL_SHORTAGE' },
            { label: 'Fotos', value: 'MANUAL_IMAGE' },
            { label: 'Áudios', value: 'MANUAL_AUDIO' },
            { label: 'Efetivo', value: 'WORKFORCE_COUNT' },
          ].map((f) => (
            <button
              type="button"
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`text-[11px] px-2.5 py-1 rounded-pill font-medium transition-colors ${
                filter === f.value
                  ? 'bg-action text-white'
                  : 'bg-paper text-ink-secondary hover:text-ink border border-rule-subtle'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista da Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-rule">
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-ink-muted py-4">Nenhum evento registrado nesta categoria hoje.</p>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              {/* Ponto / Ícone na Linha */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-panel border-2 border-rule flex items-center justify-center group-hover:border-action transition-colors">
                <span className="scale-75">{getEventIcon(event.source_type)}</span>
              </div>

              {/* Card do Evento */}
              <div className="bg-paper p-3 rounded-card border border-rule-subtle hover:border-rule transition-all space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">
                      {formatTime(event.occurred_at)}
                    </span>
                    <span className="text-xs font-semibold text-ink-secondary">
                      {event.author_name}
                    </span>
                    {event.source_type.startsWith('WHATSAPP') && (
                      <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-emerald-600" /> WhatsApp Bot
                      </span>
                    )}
                  </div>

                  {/* Estado da Revisão */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-chip font-semibold uppercase ${
                      event.review_state === 'confirmed'
                        ? 'bg-success-soft text-success'
                        : event.review_state === 'pending_review'
                        ? 'bg-warning-soft text-warning-text'
                        : 'bg-paper text-ink-muted'
                    }`}
                  >
                    {event.review_state === 'confirmed' ? 'Confirmado' : 'Aguardando Revisão'}
                  </span>
                </div>

                {/* Texto do Fato */}
                <p className="text-xs text-ink leading-relaxed">{event.raw_text}</p>

                {/* Localização e Atividade se houver */}
                {event.location_name && (
                  <div className="flex items-center gap-3 text-[11px] text-ink-muted pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-action" />
                      {event.location_name}
                    </span>
                    {event.wbs_task_name && <span>• {event.wbs_task_name}</span>}
                  </div>
                )}

                {/* Foto se houver */}
                {event.media_url && (
                  <div className="pt-2">
                    <img
                      src={event.media_url}
                      alt="Evidência"
                      className="w-full sm:max-w-xs h-32 object-cover rounded-field border border-rule"
                    />
                  </div>
                )}

                {/* Áudio se houver */}
                {event.audio_blob_url && (
                  <div className="pt-2">
                    <audio controls src={event.audio_blob_url} className="w-full max-w-sm h-8" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
