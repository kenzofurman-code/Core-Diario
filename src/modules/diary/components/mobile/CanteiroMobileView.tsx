import React, { useState } from 'react';
import {
  Mic,
  Camera,
  AlertTriangle,
  Users,
  Hammer,
  MessageSquare,
  HardHat,
  Calendar,
  Building2,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ProjectContext,
  UserContext,
  ObraLocationsConfig,
  R2StorageConfig,
  WorkforceSnapshot,
  ProductionEntry,
  SourceEvent,
  DailyReport,
} from '../../types/diary.types';
import { DiaryState } from '../../services/diaryStorage';
import { AudioRecordModal } from './AudioRecordModal';
import { ObraCameraOverlayModal } from './ObraCameraOverlayModal';
import { MaterialAlertModal } from './MaterialAlertModal';
import { WorkforceModal } from './WorkforceModal';
import { ProductionModal } from './ProductionModal';
import { WhatsAppShareModal } from '../report/WhatsAppShareModal';

interface CanteiroMobileViewProps {
  diaryState: DiaryState;
  project: ProjectContext;
  currentUser: UserContext;
  locationsConfig: ObraLocationsConfig;
  r2Config: R2StorageConfig;
  workforce: WorkforceSnapshot;
  productionList: ProductionEntry[];
  sourceEvents: SourceEvent[];
  dailyReport: DailyReport;
  todayDateStr: string;
  onAddAudioEvent: (text: string, duration: number, audioBlobUrl?: string) => void;
  onAddPhotoEvent: (imageUrl: string, caption: string, location: string, audioBlobUrl?: string) => void;
  onAddMaterialShortage: (data: {
    material_name: string;
    location_name: string;
    wbs_task_name: string;
    workers_idle: number;
    hours_lost: number;
    notes: string;
  }) => void;
  onUpdateWorkforceCount: (roleCode: string, delta: number) => void;
  onCopyYesterdayWorkforce: () => void;
  onUpdateProduction: (taskId: string, reported: number) => void;
  onRequestEngineeringView?: () => void;
  onLogout?: () => void;
}

export const CanteiroMobileView: React.FC<CanteiroMobileViewProps> = ({
  diaryState,
  project,
  currentUser,
  locationsConfig,
  r2Config,
  workforce,
  productionList,
  sourceEvents,
  dailyReport,
  todayDateStr,
  onAddAudioEvent,
  onAddPhotoEvent,
  onAddMaterialShortage,
  onUpdateWorkforceCount,
  onCopyYesterdayWorkforce,
  onUpdateProduction,
  onRequestEngineeringView,
  onLogout,
}) => {
  const [modalOpen, setModalOpen] = useState<
    'audio' | 'photo' | 'material' | 'workforce' | 'production' | 'whatsapp' | null
  >(null);

  // Filtragem de tarefas atribuídas ao encarregado logado
  const isEncarregado = currentUser.role === 'encarregado';
  const myTasks = isEncarregado
    ? productionList.filter((p) => p.assigned_user_id === currentUser.id || !p.assigned_user_id)
    : productionList;
  const completedMyTasks = myTasks.filter((p) => p.progress_pct >= 100).length;

  // Total de evidências colhidas hoje
  const totalEvidencesCount = sourceEvents.length;

  // Formata data de hoje em português
  const formatTodayDisplay = () => {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      };
      const formatted = now.toLocaleDateString('pt-BR', options);
      // Capitaliza primeira letra
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return 'Hoje';
    }
  };

  const firstName = currentUser.name.split(' ')[0] || currentUser.name;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-10">
      {/* ========================================================================= */}
      {/* CABEÇALHO COMPACTO MOBILE (DIRETO AO PONTO)                               */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Modo Canteiro
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {project.codigo}
                </span>
              </div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight mt-0.5">
                Olá, {firstName}!
              </h1>
              <p className="text-xs text-slate-400 truncate max-w-[210px] sm:max-w-xs">
                {project.nome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                title="Sair ou trocar de usuário"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Faixa do Dia de Hoje & Contadores Rápidos */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">Data de Hoje</span>
              <span className="text-xs font-bold text-slate-200 truncate">
                {formatTodayDisplay()}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block font-medium">Efetivo</span>
                <span className="text-xs font-bold text-white">
                  {workforce.total_workers} presentes
                </span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-1" />
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* GRADE PRINCIPAL DE BOTÕES GIGANTES TÁTEIS (6 AÇÕES ESSENCIAIS)           */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Apontamento de Campo
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Toque para Registrar
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* 1. GRAVAR ÁUDIO */}
          <button
            type="button"
            onClick={() => setModalOpen('audio')}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border-2 border-indigo-500/40 hover:border-indigo-400 flex flex-col items-center justify-center gap-3 text-center transition-all active:scale-95 shadow-lg shadow-indigo-950/30 group min-h-[145px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all shadow-inner">
              <Mic className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white group-hover:text-indigo-300">
                Gravar Áudio
              </span>
              <span className="text-[11px] text-slate-400">
                Fale o relato do dia
              </span>
            </div>
          </button>

          {/* 2. TIRAR FOTO */}
          <button
            type="button"
            onClick={() => setModalOpen('photo')}
            className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/80 to-slate-900 border-2 border-sky-500/40 hover:border-sky-400 flex flex-col items-center justify-center gap-3 text-center transition-all active:scale-95 shadow-lg shadow-sky-950/30 group min-h-[145px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-500 group-hover:text-slate-950 transition-all shadow-inner">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white group-hover:text-sky-300">
                Tirar Foto
              </span>
              <span className="text-[11px] text-slate-400">
                Carimbo e GPS
              </span>
            </div>
          </button>

          {/* 3. REGISTRAR ACONTECIMENTO / FALTA DE MATERIAL */}
          <button
            type="button"
            onClick={() => setModalOpen('material')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/80 to-slate-900 border-2 border-amber-500/50 hover:border-amber-400 flex flex-col items-center justify-center gap-3 text-center transition-all active:scale-95 shadow-lg shadow-amber-950/30 group min-h-[145px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-bold text-amber-300 group-hover:text-amber-200">
                Acontecimento
              </span>
              <span className="text-[11px] text-amber-400/80 font-medium">
                Paralisação / Falta
              </span>
            </div>
          </button>

          {/* 4. AVANÇO DE PRODUÇÃO */}
          <button
            type="button"
            onClick={() => setModalOpen('production')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border-2 border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center justify-center gap-3 text-center transition-all active:scale-95 shadow-lg shadow-emerald-950/30 group min-h-[145px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-inner">
              <Hammer className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white group-hover:text-emerald-300">
                Avanço Físico
              </span>
              <span className="text-[11px] text-slate-400">
                {completedMyTasks} de {myTasks.length} frentes
              </span>
            </div>
          </button>

          {/* 5. REGISTRAR EFETIVO */}
          <button
            type="button"
            onClick={() => setModalOpen('workforce')}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/80 to-slate-900 border-2 border-purple-500/40 hover:border-purple-400 flex flex-col items-center justify-center gap-3 text-center transition-all active:scale-95 shadow-lg shadow-purple-950/30 group min-h-[145px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-500 group-hover:text-slate-950 transition-all shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white group-hover:text-purple-300">
                Registrar Efetivo
              </span>
              <span className="text-[11px] font-mono text-purple-300 font-semibold">
                {workforce.total_workers} operários
              </span>
            </div>
          </button>

          {/* 6. RESUMO DO DIA (WHATSAPP) */}
          <button
            type="button"
            onClick={() => setModalOpen('whatsapp')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 flex flex-col items-center justify-center gap-3 text-center transition-all active:scale-95 shadow-lg shadow-emerald-950/40 group min-h-[145px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-inner">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <span className="block text-sm font-bold text-emerald-300 group-hover:text-emerald-200">
                Resumo do Dia
              </span>
              <span className="text-[11px] text-emerald-400/80 font-medium">
                Enviar no WhatsApp
              </span>
            </div>
          </button>
        </div>

        {/* Status Rápido do Dia */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">
                {totalEvidencesCount} registro{totalEvidencesCount !== 1 ? 's' : ''} hoje
              </span>
              <span className="text-[11px] text-slate-400">
                Gravados com segurança no diário
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700">
            AUTO-SALVO
          </span>
        </div>

        {/* Link discreto para Engenharia Desktop (apenas se solicitado) */}
        {onRequestEngineeringView && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={onRequestEngineeringView}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-2 px-3 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <span>Acessar Modo Engenharia / Painéis Técnicos</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAIS DISPARADOS PELOS BOTÕES                                            */}
      {/* ========================================================================= */}
      <AudioRecordModal
        isOpen={modalOpen === 'audio'}
        onClose={() => setModalOpen(null)}
        onSubmit={(text, duration, blobUrl) => {
          onAddAudioEvent(text, duration, blobUrl);
          setModalOpen(null);
        }}
      />

      <ObraCameraOverlayModal
        isOpen={modalOpen === 'photo'}
        onClose={() => setModalOpen(null)}
        project={project}
        currentUser={currentUser}
        locationsConfig={locationsConfig}
        r2Config={r2Config}
        onSubmit={(url, caption, loc, audioBlobUrl) => {
          onAddPhotoEvent(url, caption, loc, audioBlobUrl);
          setModalOpen(null);
        }}
      />

      <MaterialAlertModal
        isOpen={modalOpen === 'material'}
        onClose={() => setModalOpen(null)}
        onSubmit={(data) => {
          onAddMaterialShortage(data);
          setModalOpen(null);
        }}
      />

      <WorkforceModal
        isOpen={modalOpen === 'workforce'}
        onClose={() => setModalOpen(null)}
        workforce={workforce}
        onUpdateCount={onUpdateWorkforceCount}
        onCopyYesterday={onCopyYesterdayWorkforce}
      />

      <ProductionModal
        isOpen={modalOpen === 'production'}
        onClose={() => setModalOpen(null)}
        productionList={productionList}
        currentUser={currentUser}
        onUpdateProduction={onUpdateProduction}
      />

      <WhatsAppShareModal
        isOpen={modalOpen === 'whatsapp'}
        onClose={() => setModalOpen(null)}
        diaryState={diaryState}
      />
    </div>
  );
};
