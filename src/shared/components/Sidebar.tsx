import React from 'react';
import {
  LayoutDashboard,
  Users,
  Hammer,
  CalendarDays,
  MessageSquare,
  ShieldAlert,
  CloudSun,
  Clock,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Wifi,
  Sparkles,
  Phone,
  Layers,
  History,
  Database,
  Camera,
  FileText,
} from 'lucide-react';
import { EngineeringNavSection, UserContext } from '../../modules/diary/types/diary.types';

interface SidebarProps {
  currentSection: EngineeringNavSection;
  onSelectSection: (section: EngineeringNavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: UserContext;
  pendingValidationsCount: number;
  pendingWhatsAppCount: number;
  blockingIssuesCount: number;
  pendingReportsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  pendingValidationsCount,
  pendingWhatsAppCount,
  blockingIssuesCount,
  pendingReportsCount,
}) => {
  const navItems: Array<{
    id: EngineeringNavSection;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    badgeCount?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'OVERVIEW',
      label: 'Painel do Dia',
      sublabel: 'Governança & RDO',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badgeCount: blockingIssuesCount > 0 ? blockingIssuesCount : undefined,
      badgeColor: 'bg-danger text-white',
    },
    {
      id: 'REPORTS_HISTORY',
      label: 'Histórico de RDOs',
      sublabel: 'Dias Anteriores & Arquivo',
      icon: <History className="w-4 h-4 shrink-0" />,
      badgeCount: pendingReportsCount && pendingReportsCount > 0 ? pendingReportsCount : undefined,
      badgeColor: 'bg-warning text-slate-950 font-bold',
    },
    {
      id: 'PHOTO_GALLERY',
      label: 'Fotos & Documentos',
      sublabel: 'Galeria & Laudos',
      icon: <Camera className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'CLIENT_REPORT',
      label: 'Relatório Cliente (A4)',
      sublabel: 'Prestação de Contas',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'WORKFORCE',
      label: 'Efetivo de Obra',
      sublabel: 'Próprios & Terceiros',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'PRODUCTION',
      label: 'Produção Diária',
      sublabel: 'Avanço Físico',
      icon: <Hammer className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'SHORT_TERM_PLANNING',
      label: 'Curto Prazo',
      sublabel: 'Plano Semanal',
      icon: <CalendarDays className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'LOCATIONS',
      label: 'Locais & Cloudflare R2',
      sublabel: 'Pavimentos & Nuvem',
      icon: <Layers className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'WHATSAPP_COLLECTION',
      label: 'Coleta WhatsApp',
      sublabel: 'Cobrança Ativa',
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
      badgeCount: pendingWhatsAppCount > 0 ? pendingWhatsAppCount : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'CONTACTS',
      label: 'Contatos & Grupos',
      sublabel: 'WhatsApp & LGPD',
      icon: <Phone className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'VALIDATIONS',
      label: 'Validações & Inbox',
      sublabel: 'Conflitos & Falhas',
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      badgeCount: pendingValidationsCount > 0 ? pendingValidationsCount : undefined,
      badgeColor: 'bg-warning text-white',
    },
    {
      id: 'WEATHER',
      label: 'Clima & Intempérie',
      sublabel: 'Prova Pericial',
      icon: <CloudSun className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'TIMELINE',
      label: 'Linha do Tempo',
      sublabel: 'Histórico de Fatos',
      icon: <Clock className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <aside
      className={`bg-panel border-r border-rule flex flex-col transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Topo da Sidebar: Botão Estilo Gemini de Recolher/Expandir */}
      <div className="p-3 border-b border-rule flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-action text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
              CK
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-ink block leading-tight truncate">
                Navegação RDO
              </span>
              <span className="text-[10px] text-ink-muted block truncate">
                Trilha de Engenharia
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-field hover:bg-paper text-ink-muted hover:text-ink transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Lista de Itens da Trilha */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center rounded-field text-left transition-all ${
                isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3'
              } ${
                isActive
                  ? 'bg-action text-white font-bold shadow-xs'
                  : 'text-ink-secondary hover:text-ink hover:bg-paper'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={isActive ? 'text-white' : 'text-action'}>{item.icon}</span>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate block leading-tight">{item.label}</span>
                    {item.badgeCount !== undefined && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-pill shrink-0 ${
                          isActive ? 'bg-white text-action' : item.badgeColor
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                  {item.sublabel && (
                    <span
                      className={`text-[10px] block truncate mt-0.5 ${
                        isActive ? 'text-white/80' : 'text-ink-muted'
                      }`}
                    >
                      {item.sublabel}
                    </span>
                  )}
                </div>
              )}

              {/* Indicador de Badge em modo colapsado */}
              {isCollapsed && item.badgeCount !== undefined && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${item.badgeColor}`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé da Sidebar: Usuário Atual & Offline Status */}
      <div className="p-3 border-t border-rule space-y-2 bg-panel-subtle">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-paper border border-rule flex items-center justify-center text-xs font-bold text-ink shrink-0">
              <HardHat className="w-4 h-4 text-action" />
            </div>
            <div className="truncate text-xs">
              <strong className="text-ink block truncate">{currentUser.name}</strong>
              <span className="text-[10px] text-ink-muted capitalize block truncate">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center text-ink-muted hover:text-ink cursor-pointer"
            title={`${currentUser.name} (${currentUser.role})`}
          >
            <HardHat className="w-4 h-4 text-action" />
          </div>
        )}
      </div>
    </aside>
  );
};
