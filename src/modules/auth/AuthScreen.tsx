// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — TELA DE ACESSO & IDENTIFICAÇÃO
// Canteiro (Clique e Use sem senha) vs Engenharia Desktop (Protegido por Senha)
// =====================================================================

import React, { useState } from 'react';
import {
  HardHat,
  Monitor,
  Smartphone,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { ProjectContext, UserContext } from '../diary/types/diary.types';
import { sampleUsers } from '../diary/services/diaryStorage';

interface AuthScreenProps {
  project: ProjectContext;
  availableProjects?: ProjectContext[];
  onSelectProject?: (project: ProjectContext) => void;
  onLogin: (user: UserContext, preferredView: 'CANTEIRO' | 'ENGENHARIA' | 'CLIENTE') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  project,
  availableProjects = [],
  onSelectProject,
  onLogin,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserContext>(sampleUsers[1]); // Default: Antônio Santos (Encarregado)
  const [rememberMe, setRememberMe] = useState(true);
  
  // Senha apenas para o Modo Engenharia Desktop
  const [engineerPin, setEngineerPin] = useState('');
  const [showEngineerPinModal, setShowEngineerPinModal] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Acesso direto ao Canteiro (Sem senha, clique e use!)
  const handleAcessoCanteiro = (user?: UserContext) => {
    const targetUser = user || selectedUser;
    if (rememberMe) {
      localStorage.setItem('construkore_logged_user_id', targetUser.id);
      localStorage.setItem('construkore_preferred_view', 'CANTEIRO');
    }
    onLogin(targetUser, 'CANTEIRO');
  };

  // Acesso direto ao Portal do Cliente / Fiscal (Sem necessidade de senha técnica de engenharia)
  const handleAcessoCliente = () => {
    const clientUser =
      selectedUser.role === 'fiscal_cliente' || selectedUser.role === 'cliente'
        ? selectedUser
        : sampleUsers.find((u) => u.role === 'fiscal_cliente' || u.role === 'cliente') || sampleUsers[4];

    if (rememberMe) {
      localStorage.setItem('construkore_logged_user_id', clientUser.id);
      localStorage.setItem('construkore_preferred_view', 'CLIENTE');
    }
    onLogin(clientUser, 'CLIENTE');
  };

  // Acesso ao Modo Engenharia (Exige validação de senha/PIN de segurança)
  const handleSolicitarEngenharia = () => {
    setPinError(null);
    setShowEngineerPinModal(true);
  };

  const handleConfirmarEngenharia = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha padrão de engenharia técnica
    const SENHA_ENGENHARIA_PADRAO = '1234';

    if (engineerPin.trim() === SENHA_ENGENHARIA_PADRAO) {
      // Se for encarregado entrando no desktop, autentica ou sugere a engenheira
      const targetUser = selectedUser.role === 'encarregado' ? sampleUsers[2] : selectedUser;
      if (rememberMe) {
        localStorage.setItem('construkore_logged_user_id', targetUser.id);
        localStorage.setItem('construkore_preferred_view', 'ENGENHARIA');
      }
      onLogin(targetUser, 'ENGENHARIA');
    } else {
      setPinError('Senha de engenharia incorreta. Acesso restrito ao responsável técnico.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-900">
      {/* Barra Superior */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
            CK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">ConstruKore</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                RDO v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Diário de Obra Pericial & Inteligência de Canteiro
            </p>
          </div>
        </div>

        {/* Seletor de Obra no Topo */}
        <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/80">
          <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {availableProjects.length > 0 && onSelectProject ? (
            <select
              value={project.id}
              onChange={(e) => {
                const found = availableProjects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              title="Selecionar a obra ativa"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.nome} ({p.codigo})
                </option>
              ))}
            </select>
          ) : (
            <>
              <span className="font-semibold text-white">{project.nome}</span>
              <span className="font-mono text-slate-400">({project.codigo})</span>
            </>
          )}
        </div>
      </header>

      {/* Container Central de Login */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-6 space-y-6">
        {/* Banner de Obra Ativa */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Obra Selecionada
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {project.nome}
                <span className="text-xs font-mono text-amber-400 font-semibold">({project.codigo})</span>
              </h3>
            </div>
          </div>

          {availableProjects.length > 0 && onSelectProject && (
            <select
              value={project.id}
              onChange={(e) => {
                const found = availableProjects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  Trocar para: {p.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Canteiro: 1 Clique & Use (Sem Senha)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quem está acessando a obra?
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Selecione seu nome para abrir a câmera carimbada e registrar produção do dia.
          </p>
        </div>

        {/* Grade de Perfis de Usuário */}
        <div className="space-y-2.5">
          {sampleUsers.map((user) => {
            const isSelected = selectedUser.id === user.id;
            const isEncarregado = user.role === 'encarregado';
            const isMestre = user.role === 'mestre';
            const isEngenheiro = user.role === 'engenheiro_residente';

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isEncarregado || isMestre ? (
                      <HardHat className="w-5 h-5" />
                    ) : isEngenheiro ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{user.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-amber-400/90 font-medium capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isEncarregado && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                      <Smartphone className="w-3 h-3" /> Canteiro Rápido
                    </span>
                  )}
                  {isMestre && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
                      <HardHat className="w-3 h-3" /> Campo & Obra
                    </span>
                  )}
                  {isEngenheiro && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold">
                      <Monitor className="w-3 h-3" /> Desktop
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Opção Lembrar Sessão */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/40"
            />
            <span>Lembrar meu usuário neste celular/aparelho</span>
          </label>
        </div>

        {/* Botões de Entrada */}
        <div className="space-y-3 pt-2">
          {/* BOTÃO PRINCIPAL: MODO CANTEIRO (1 CLIQUE E USE) */}
          <button
            type="button"
            onClick={() => handleAcessoCanteiro()}
            className="w-full py-4 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
          >
            <Smartphone className="w-5 h-5 text-slate-950" />
            <span>Entrar no Canteiro como {selectedUser.name.split(' ')[0]} (Sem Senha)</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* BOTÃO SECUNDÁRIO: MODO ENGENHARIA DESKTOP (EXIGE SENHA) */}
          <button
            type="button"
            onClick={handleSolicitarEngenharia}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Acessar Modo Engenharia / Governança Desktop</span>
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* BOTÃO DO PORTAL DO CLIENTE / FISCALIZAÇÃO */}
          <button
            type="button"
            onClick={handleAcessoCliente}
            className="w-full py-3 px-4 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Portal do Cliente & Fiscalização (Transparência & Homologação)</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </main>

      {/* Modal de Senha para Acesso ao Modo Engenharia */}
      {showEngineerPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Acesso Engenharia</h3>
                <p className="text-xs text-slate-400">Digite a senha de responsável técnico</p>
              </div>
            </div>

            <form onSubmit={handleConfirmarEngenharia} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Senha de Engenharia (Padrão: 1234)"
                  value={engineerPin}
                  onChange={(e) => setEngineerPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEngineerPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                >
                  Liberar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rodapé Informativo */}
      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-500">
        ConstruKore Engineering Framework · Offline First · Canteiro sem atrito
      </footer>
    </div>
  );
};
