import React, { useState } from 'react';
import { AlertOctagon, Send, CheckCircle2, Clock, Users, DollarSign, PackageX, FileSpreadsheet } from 'lucide-react';
import { SupplyEscalationTicket } from '../../types/diary.types';

interface SupplyEscalationPanelProps {
  tickets: SupplyEscalationTicket[];
  onDispatchTicket: (ticketId: string, notes?: string) => void;
}

export const SupplyEscalationPanel: React.FC<SupplyEscalationPanelProps> = ({ tickets, onDispatchTicket }) => {
  const [dispatchNotes, setDispatchNotes] = useState<{ [key: string]: string }>({});

  if (tickets.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-danger uppercase flex items-center gap-1.5">
          <AlertOctagon className="w-4 h-4 text-danger animate-pulse" />
          Inteligência Operacional — Gatilho de Reincidência (Fase 3)
        </span>
        <span className="text-xs bg-danger-soft text-danger border border-danger/30 font-semibold px-2.5 py-0.5 rounded-pill">
          3x Faltas Consecutivas Detectadas
        </span>
      </div>

      {tickets.map((ticket) => {
        const isDispatched = ticket.status === 'DISPATCHED_TO_SUPRIMENTOS';

        return (
          <div
            key={ticket.id}
            className={`p-4 rounded-card border-2 transition-all space-y-3 ${
              isDispatched
                ? 'bg-success-soft/20 border-success/40'
                : 'bg-danger-soft/30 border-danger/70 shadow-sm'
            }`}
          >
            {/* Cabeçalho do Alerta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-chip text-xs font-mono font-bold bg-danger text-white">
                    {ticket.ticket_code}
                  </span>
                  <h4 className="text-sm font-bold text-ink">
                    Alerta Prioritário: Falta Crítica Reincidente de {ticket.material_name}
                  </h4>
                </div>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Identificada a <strong>3ª paralisação</strong> pelo mesmo insumo. Conforme regra do ConstruKore, é gerada notificação de auditoria para o setor de Suprimentos/Compras.
                </p>
              </div>

              <span
                className={`text-xs px-2.5 py-1 rounded-pill font-bold uppercase shrink-0 ${
                  isDispatched
                    ? 'bg-success text-white'
                    : 'bg-danger text-white animate-pulse'
                }`}
              >
                {isDispatched ? 'Chamado Despachado' : 'Aguardando Despacho'}
              </span>
            </div>

            {/* Painel de Prejuízo Acumulado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-panel border border-rule rounded-field flex items-center gap-3">
                <Users className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-semibold">
                    Operários Afetados
                  </span>
                  <strong className="text-sm font-bold text-ink">
                    {ticket.total_workers_idle} operários no total
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-panel border border-rule rounded-field flex items-center gap-3">
                <Clock className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-semibold">
                    Horas de Ociosidade
                  </span>
                  <strong className="text-sm font-bold text-ink">
                    {ticket.total_hours_lost}h acumuladas
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-panel border border-rule rounded-field flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-semibold">
                    Prejuízo Financeiro Estimado
                  </span>
                  <strong className="text-sm font-bold font-mono text-danger">
                    R$ {ticket.total_cost_estimate.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Ação de Despacho */}
            {!isDispatched ? (
              <div className="pt-2 border-t border-rule-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Justificativa ou nota de urgência para o Comprador..."
                  value={dispatchNotes[ticket.id] || ''}
                  onChange={(e) =>
                    setDispatchNotes({ ...dispatchNotes, [ticket.id]: e.target.value })
                  }
                  className="w-full sm:w-96 px-3 py-1.5 text-xs bg-panel border border-rule rounded-field focus:outline-none focus:border-danger text-ink"
                />

                <button
                  type="button"
                  onClick={() => onDispatchTicket(ticket.id, dispatchNotes[ticket.id])}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-danger text-white rounded-field flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Despachar para Suprimentos & Compras
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-success-soft rounded-field border border-success/30 flex items-center justify-between text-xs text-success font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Chamado despachado em {new Date(ticket.dispatched_at!).toLocaleString('pt-BR')} por {ticket.dispatched_by}.
                </span>
                <span className="text-[11px] text-ink-secondary italic">
                  Nota: {ticket.dispatch_notes}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
