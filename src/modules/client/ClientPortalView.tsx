// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — PORTAL EXCLUSIVO DO CLIENTE & FISCAL
// Visualização executiva, governança de aprovações (individual & lote) e transparência total
// =====================================================================

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  FileCheck,
  Camera,
  FileText,
  Clock,
  ArrowRight,
  Printer,
  TrendingUp,
  Users,
  CloudSun,
  AlertCircle,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  ProjectContext,
  UserContext,
  DailyReportSummaryItem,
  ObraLocationsConfig,
  SourceEvent,
  DailyReport,
} from '../diary/types/diary.types';
import { DiaryStorageService, DiaryState } from '../diary/services/diaryStorage';
import { PhotoAndDocGalleryPanel } from '../diary/components/desktop/PhotoAndDocGalleryPanel';
import { MonthlyClientReportView } from '../diary/components/report/MonthlyClientReportView';
import { RdoDocumentView } from '../diary/components/report/RdoDocumentView';

interface ClientPortalViewProps {
  project: ProjectContext;
  currentUser: UserContext;
  availableProjects?: ProjectContext[];
  onSelectProject?: (p: ProjectContext) => void;
  onLogout?: () => void;
  onSwitchToEngineering?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  project,
  currentUser,
  availableProjects = [],
  onSelectProject,
  onLogout,
  onSwitchToEngineering,
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'APPROVALS' | 'GALLERY' | 'MONTHLY_REPORT'>('DASHBOARD');
  const [diaryState, setDiaryState] = useState<DiaryState>(DiaryStorageService.getState());
  const [archive, setArchive] = useState<DailyReportSummaryItem[]>(() =>
    DiaryStorageService.listDailyReportsSummaries(project.id)
  );

  // Seleção para Aprovação em Lote
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Visualizador de RDO Individual
  const [viewingReportItem, setViewingReportItem] = useState<DailyReportSummaryItem | null>(null);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);

  // Lista de RDOs disponíveis
  const projectReports = useMemo(() => {
    return archive.filter((r) => !r.project_id || r.project_id === project.id);
  }, [archive, project.id]);

  // RDOs aguardando aprovação do cliente / fiscal (Workflow Etapa 4)
  const pendingApprovalReports = useMemo(() => {
    return projectReports.filter(
      (r) => r.workflow_state !== 'APPROVED' && r.workflow_state !== 'ISSUED'
    );
  }, [projectReports]);

  // Alterna seleção individual para lote
  const toggleSelectReport = (reportId: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  // Seleciona todos os pendentes
  const toggleSelectAll = () => {
    if (selectedReportIds.length === pendingApprovalReports.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(pendingApprovalReports.map((r) => r.report_id));
    }
  };

  // Aprovação em lote
  const handleBatchApprove = () => {
    if (selectedReportIds.length === 0) return;
    setIsBatchApproving(true);

    const selectedDates = archive
      .filter((item) => selectedReportIds.includes(item.report_id))
      .map((item) => item.date);

    DiaryStorageService.approveReportsByDates(selectedDates, currentUser.name, project.id);

    const updated = DiaryStorageService.listDailyReportsSummaries(project.id);
    setArchive(updated);
    setDiaryState(DiaryStorageService.getState());

    setBatchSuccessMessage(`${selectedReportIds.length} Diários de Obra homologados com sucesso!`);
    setSelectedReportIds([]);
    setIsBatchApproving(false);

    setTimeout(() => {
      setBatchSuccessMessage(null);
    }, 4000);
  };

  // Aprovação individual a partir da visualização
  const handleSingleApprove = (reportId: string) => {
    const item = archive.find((r) => r.report_id === reportId);
    if (item) {
      DiaryStorageService.approveReportsByDates([item.date], currentUser.name, project.id);
      const updated = DiaryStorageService.listDailyReportsSummaries(project.id);
      setArchive(updated);
      setDiaryState(DiaryStorageService.getState());
    }
    setViewingReportItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Topo do Portal do Cliente */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3 sticky top-0 z-40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-md">
            CK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">ConstruKore Portal</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Espaço do Cliente & Fiscalização
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              {availableProjects.length > 0 && onSelectProject ? (
                <select
                  value={project.id}
                  onChange={(e) => {
                    const found = availableProjects.find((p) => p.id === e.target.value);
                    if (found) onSelectProject(found);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-200 border-b border-dashed border-slate-700 hover:border-amber-400 cursor-pointer focus:outline-none max-w-[220px] truncate"
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-300 font-semibold">{project.nome}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navegação entre Abas do Portal */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-full border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'DASHBOARD'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Dashboard Executivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('APPROVALS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all relative ${
              activeTab === 'APPROVALS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Homologação de RDOs
            {pendingApprovalReports.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                {pendingApprovalReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GALLERY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all ${
              activeTab === 'GALLERY'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Galeria & Laudos
          </button>
          <button
            type="button"
            onClick={() => setIsMonthlyReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Relatório Mensal (A4)
          </button>
        </div>

        {/* Perfil Conectado & Ações */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-white block">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400 block">{currentUser.email}</span>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Encerrar sessão"
            >
              Sair
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Principal do Portal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Notificação de Sucesso */}
        {batchSuccessMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {batchSuccessMessage}
          </div>
        )}

        {/* 1. ABA: DASHBOARD EXECUTIVO */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* Banner de Boas-Vindas & Métricas-Chave */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1 block">
                    Portal de Transparência & Governança
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-white">
                    Bem-vindo(a), {currentUser.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Acompanhe em tempo real as evidências periciais de execução, controle tecnológico de concreto, FVS e homologue os Diários de Obra do empreendimento <strong className="text-white">{project.nome}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMonthlyReportModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all shrink-0 active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Relatório Mensal A4
                </button>
              </div>

              {/* Grid de KPIs Rápidos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">RDOs Registrados</span>
                  <span className="text-2xl font-black text-white">{projectReports.length}</span>
                  <span className="text-[10px] text-slate-500 block">no histórico</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Pendentes de Aceite</span>
                  <span className="text-2xl font-black text-amber-400">
                    {pendingApprovalReports.length}
                  </span>
                  <span className="text-[10px] text-slate-500 block">aguardando fiscal</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Efetivo de Hoje</span>
                  <span className="text-2xl font-black text-indigo-400">
                    {diaryState.workforceSnapshot.total_workers}
                  </span>
                  <span className="text-[10px] text-slate-500 block">operários ativos</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Índice de Qualidade</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {diaryState.reportingDay.data_quality_score}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">conformidade técnica</span>
                </div>
              </div>
            </div>

            {/* Seções em Duas Colunas: Últimos Diários e Frentes Ativas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1 e 2: Últimos Diários Registrados */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Últimos Diários de Obra Emitidos
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('APPROVALS')}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    Ver todos ({projectReports.length})
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {projectReports.slice(0, 5).map((rdo) => (
                    <div
                      key={rdo.report_id}
                      className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                          #{rdo.report_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{rdo.formatted_number}</span>
                            <span className="text-[11px] text-slate-400">• {rdo.formatted_date} ({rdo.weekday})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {rdo.total_workers} operários • {rdo.photos_count} fotos • {rdo.weather_condition}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            rdo.workflow_state === 'APPROVED' || rdo.workflow_state === 'ISSUED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {rdo.workflow_state === 'APPROVED' || rdo.workflow_state === 'ISSUED' ? 'Aprovado' : 'Aguardando'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingReportItem(rdo)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Visualizar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna 3: Frentes Ativas de Hoje */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Frentes Ativas da Obra
                </h3>

                <div className="space-y-3">
                  {diaryState.productionEntries.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{entry.task_name}</span>
                        <span className="font-mono text-amber-400 text-[11px]">
                          {entry.quantity_reported} / {entry.quantity_planned} {entry.uom}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, entry.progress_pct)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{entry.location_name}</span>
                        <span>{entry.progress_pct}% concluído</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ABA: HOMOLOGAÇÃO DE RDOS (Individual & Lote) */}
        {activeTab === 'APPROVALS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Homologação Oficial de Diários de Obra
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quarta e última etapa do workflow de governança. O cliente/fiscal valida os apontamentos antes do arquivamento permanente.
                </p>
              </div>

              {/* Botão de Homologação em Lote */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  {selectedReportIds.length === pendingApprovalReports.length && pendingApprovalReports.length > 0
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </button>
                <button
                  type="button"
                  disabled={selectedReportIds.length === 0 || isBatchApproving}
                  onClick={handleBatchApprove}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                    selectedReportIds.length > 0
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Homologar Selecionados ({selectedReportIds.length})
                </button>
              </div>
            </div>

            {/* Tabela de RDOs para Homologação */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <span className="sr-only">Seleção</span>
                    </th>
                    <th className="p-3">RDO & Número</th>
                    <th className="p-3">Data & Dia</th>
                    <th className="p-3">Efetivo</th>
                    <th className="p-3">Clima</th>
                    <th className="p-3">Responsável Técnico</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {projectReports.map((rdo) => {
                    const isPending = rdo.workflow_state !== 'APPROVED' && rdo.workflow_state !== 'ISSUED';
                    const isSelected = selectedReportIds.includes(rdo.report_id);

                    return (
                      <tr key={rdo.report_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 text-center">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => toggleSelectReport(rdo.report_id)}
                              className="text-slate-400 hover:text-white"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="p-3 font-bold text-white font-mono">{rdo.formatted_number}</td>
                        <td className="p-3 text-slate-300">
                          {rdo.formatted_date} <span className="text-[10px] text-slate-500">({rdo.weekday})</span>
                        </td>
                        <td className="p-3 text-slate-300">{rdo.total_workers} operários</td>
                        <td className="p-3 text-slate-300">{rdo.weather_condition}</td>
                        <td className="p-3 text-slate-300">{rdo.responsible_engineer_name}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              !isPending
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {!isPending ? 'Homologado' : 'Aguardando Aceite'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingReportItem(rdo)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-slate-200 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              Analisar
                            </button>
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleSingleApprove(rdo.report_id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-bold text-white transition-colors"
                              >
                                Homologar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ABA: GALERIA DE FOTOS & DOCUMENTOS TÉCNICOS */}
        {activeTab === 'GALLERY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <PhotoAndDocGalleryPanel
              project={project}
              currentUser={currentUser}
              locationsConfig={diaryState.locationsConfig}
              sourceEvents={diaryState.sourceEvents}
              readOnly={true} // Cliente não cria/edita dados de campo
            />
          </div>
        )}
      </main>

      {/* Modal de Relatório Mensal Executivo (A4) */}
      {isMonthlyReportModalOpen && (
        <MonthlyClientReportView
          project={project}
          onClose={() => setIsMonthlyReportModalOpen(false)}
        />
      )}

      {/* Modal de Visualização do RDO Pericial Individual */}
      {viewingReportItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 block">
                  Auditoria de Diário Individual
                </span>
                <h3 className="text-base font-bold text-white">
                  {viewingReportItem.formatted_number} — {viewingReportItem.formatted_date}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {viewingReportItem.workflow_state !== 'APPROVED' && viewingReportItem.workflow_state !== 'ISSUED' && (
                  <button
                    type="button"
                    onClick={() => handleSingleApprove(viewingReportItem.report_id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Homologar Este Diário
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingReportItem(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Resumo do RDO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800/60 p-4 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Efetivo de Campo</span>
                <span className="text-lg font-black text-white">{viewingReportItem.total_workers} operários</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Condições do Clima</span>
                <span className="text-sm font-bold text-slate-200">{viewingReportItem.weather_condition}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Evidências Fotográficas</span>
                <span className="text-lg font-black text-amber-400">{viewingReportItem.photos_count} fotos</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Chuva Contratual</span>
                <span className="text-sm font-bold text-slate-200">
                  {viewingReportItem.is_contractual_rain_day ? 'Sim (Impeditiva)' : 'Não'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Parecer de Homologação da Fiscalização
              </h4>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Este Diário de Obra foi emitido sob responsabilidade de <strong>{viewingReportItem.responsible_engineer_name}</strong>. A homologação confirma o recebimento dos registros de campo e controle tecnológico sem prejuízo de eventuais apontamentos em vistorias presenciais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
