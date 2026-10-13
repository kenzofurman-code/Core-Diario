import React from 'react';
import { Smartphone, Monitor, Sun, Moon, RotateCcw, Wifi, WifiOff, HardHat, Shield, LogOut, Building2 } from 'lucide-react';
import { UserContext, ProjectContext } from '../../modules/diary/types/diary.types';
import { sampleUsers } from '../../modules/diary/services/diaryStorage';

interface HeaderProps {
  project: ProjectContext;
  currentUser: UserContext;
  currentView: 'CANTEIRO' | 'ENGENHARIA';
  isDarkMode: boolean;
  availableProjects?: ProjectContext[];
  onSelectProject?: (project: ProjectContext) => void;
  onToggleView: (view: 'CANTEIRO' | 'ENGENHARIA') => void;
  onToggleTheme: () => void;
  onSelectUser: (user: UserContext) => void;
  onReset: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  currentUser,
  currentView,
  isDarkMode,
  availableProjects = [],
  onSelectProject,
  onToggleView,
  onToggleTheme,
  onSelectUser,
  onReset,
  onLogout,
}) => {
  return (
    <header className="bg-panel border-b border-rule sticky top-0 z-40 px-4 py-2.5 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Lado Esquerdo: Logo & Identificação da Obra */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-field bg-action text-white font-bold flex items-center justify-center text-sm shadow-xs tracking-wider">
              CK
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-ink leading-none">ConstruKore</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-action-soft text-action uppercase">
                  RDO
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-action shrink-0" />
                {availableProjects.length > 0 && onSelectProject ? (
                  <select
                    value={project.id}
                    onChange={(e) => {
                      const found = availableProjects.find((p) => p.id === e.target.value);
                      if (found) onSelectProject(found);
                    }}
                    className="bg-transparent text-[11px] font-semibold text-ink focus:outline-none cursor-pointer border-b border-dashed border-rule hover:border-action transition-colors max-w-[200px] truncate"
                    title="Alternar entre as obras cadastradas"
                  >
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-panel text-ink">
                        {p.nome} ({p.codigo})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-ink-secondary">
                    {project.nome} <span className="text-ink-muted">({project.codigo})</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Indicador Offline */}
          <div className="flex items-center gap-1 text-[11px] font-medium bg-success-soft text-success px-2 py-0.5 rounded-pill border border-success/30">
            <Wifi className="w-3 h-3" />
            <span>100% Offline Ready</span>
          </div>
        </div>

        {/* Centro: Alternador de Visão (Canteiro vs Engenharia) */}
        <div className="flex items-center bg-paper p-1 rounded-pill border border-rule">
          <button
            type="button"
            onClick={() => onToggleView('CANTEIRO')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              currentView === 'CANTEIRO'
                ? 'bg-action text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Modo Canteiro (Mobile)
          </button>
          <button
            type="button"
            onClick={() => onToggleView('ENGENHARIA')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              currentView === 'ENGENHARIA'
                ? 'bg-action text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Modo Engenharia (Desktop)
          </button>
        </div>

        {/* Lado Direito: Seletor de Perfil, Tema e Reset */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Seletor de Usuário Ativo */}
          <div className="flex items-center gap-1.5 text-xs bg-paper-subtle border border-rule px-2 py-1 rounded-field">
            <HardHat className="w-3.5 h-3.5 text-action" />
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = sampleUsers.find((u) => u.id === e.target.value);
                if (found) onSelectUser(found);
              }}
              className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer"
            >
              {sampleUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-panel text-ink">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-ink-muted hover:text-action p-0.5 rounded transition-colors"
                title="Trocar de Usuário / Sair para Tela Inicial"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Tema Claro / Escuro */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-field border border-rule hover:bg-paper text-ink transition-colors"
            title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Reset Demo State */}
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-field border border-rule hover:bg-paper text-ink-muted hover:text-ink transition-colors"
            title="Restaurar dados iniciais da demo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
