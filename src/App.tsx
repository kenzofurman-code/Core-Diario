import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './shared/components/Header';
import { DiaryStorageService, DiaryState, sampleUsers } from './modules/diary/services/diaryStorage';
import { QuickCaptureBar } from './modules/diary/components/mobile/QuickCaptureBar';
import { TodayTimeline } from './modules/diary/components/desktop/TodayTimeline';
import { ReviewInbox } from './modules/diary/components/desktop/ReviewInbox';
import { WorkflowSteppers } from './modules/diary/components/desktop/WorkflowSteppers';
import { SupplyEscalationPanel } from './modules/diary/components/desktop/SupplyEscalationPanel';
import { ConflictResolutionModal } from './modules/diary/components/desktop/ConflictResolutionModal';
import { WorkflowEditorModal } from './modules/diary/components/desktop/WorkflowEditorModal';
import { BlockingRulesAlert } from './modules/diary/components/desktop/BlockingRulesAlert';
import { WeatherWidget } from './modules/diary/components/weather/WeatherWidget';
import { WeatherOverrideModal } from './modules/diary/components/weather/WeatherOverrideModal';
import { RdoDocumentView } from './modules/diary/components/report/RdoDocumentView';
import { WhatsAppShareModal } from './modules/diary/components/report/WhatsAppShareModal';
import { PhotoDossierView, PhotoEvidenceItem } from './modules/diary/components/report/PhotoDossierView';
import { InformationRequestsPanel } from './modules/diary/components/desktop/InformationRequestsPanel';
import { WhatsAppInboundSimulatorModal } from './modules/diary/components/desktop/WhatsAppInboundSimulatorModal';
import { Sidebar } from './shared/components/Sidebar';
import { WorkforceManagerPanel } from './modules/diary/components/desktop/WorkforceManagerPanel';
import { ProductionManagerPanel } from './modules/diary/components/desktop/ProductionManagerPanel';
import { ShortTermPlanningPanel } from './modules/diary/components/desktop/ShortTermPlanningPanel';
import { ContactsManagerPanel } from './modules/diary/components/desktop/ContactsManagerPanel';
import { LocationsAndR2Panel } from './modules/diary/components/desktop/LocationsAndR2Panel';
import { ReportsHistoryPanel } from './modules/diary/components/desktop/ReportsHistoryPanel';
import { PhotoAndDocGalleryPanel } from './modules/diary/components/desktop/PhotoAndDocGalleryPanel';
import { MonthlyClientReportView } from './modules/diary/components/report/MonthlyClientReportView';
import { ClientPortalView } from './modules/client/ClientPortalView';
import { PrevisionDiarioService } from './modules/diary/services/previsionDiarioService';
import { AuthScreen } from './modules/auth/AuthScreen';
import {
  SourceEvent,
  SourceConflict,
  WorkflowStep,
  BlockingRulesConfig,
  WeatherShiftRecord,
  InformationRequest,
  WhatsAppInboundWebhookPayload,
  EngineeringNavSection,
  WorkforceRoleCount,
  WeeklyPlanTask,
  ProductionEntry,
  WhatsAppContact,
  ObraLocationsConfig,
  LocationItem,
  R2StorageConfig,
  UserContext,
  DailyReportSummaryItem,
  ProjectContext,
  LocationsBatchRow,
} from './modules/diary/types/diary.types';
import {
  Calendar,
  Hammer,
  FileText,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Users,
  AlertTriangle,
  Lock,
  Scale,
  MessageSquare,
  Camera,
  Zap,
  ChevronRight,
  ChevronLeft,
  History,
  CalendarDays,
  Clock,
} from 'lucide-react';

export const App: React.FC = () => {
  const [diaryState, setDiaryState] = useState<DiaryState>(DiaryStorageService.getState());
  const [currentView, setCurrentView] = useState<'CANTEIRO' | 'ENGENHARIA' | 'CLIENTE'>('CANTEIRO');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDocumentViewOpen, setIsDocumentViewOpen] = useState(false);
  const [isMonthlyClientReportOpen, setIsMonthlyClientReportOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SourceConflict | null>(null);
  const [isWorkflowEditorOpen, setIsWorkflowEditorOpen] = useState(false);
  const [overrideShift, setOverrideShift] = useState<'MANHA' | 'TARDE' | 'NOITE' | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isPhotoDossierOpen, setIsPhotoDossierOpen] = useState(false);
  const [isWhatsAppSimulatorOpen, setIsWhatsAppSimulatorOpen] = useState(false);
  const [simulatorRequestId, setSimulatorRequestId] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [engineeringSection, setEngineeringSection] = useState<EngineeringNavSection>('OVERVIEW');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(localStorage.getItem('construkore_logged_user_id'))
  );
  
  // Controle de segurança para acesso ao Modo Engenharia (Desktop)
  const [isEngineeringUnlocked, setIsEngineeringUnlocked] = useState<boolean>(() => {
    const loggedUserRole = diaryState.currentUser?.role;
    return loggedUserRole === 'engenheiro_residente' || loggedUserRole === 'gerente_obra';
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTargetView, setPendingTargetView] = useState<'ENGENHARIA' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);

  // Lista de todas as 16 obras da empresa (Prevision VPS)
  const [availableProjects, setAvailableProjects] = useState<ProjectContext[]>(() =>
    PrevisionDiarioService.getAllObrasAsProjects()
  );

  // Sincroniza dinamicamente as obras reais disponíveis na VPS
  useEffect(() => {
    PrevisionDiarioService.fetchObras().then((obras) => {
      if (obras && obras.length > 0) {
        const projects = obras.map((o) => PrevisionDiarioService.obraToProject(o));
        setAvailableProjects(projects);
      }
    });
  }, []);

  const handleSelectProject = async (project: ProjectContext) => {
    // 1. Muda localmente para a obra (carrega do arquivo local se já existir ou cria estado limpo)
    const baseState = DiaryStorageService.switchProject(project);
    setDiaryState({ ...baseState });

    // 2. Se a obra tiver relatórios na VPS, busca automaticamente o diário mais recente para carregar efetivo e fotos reais
    try {
      setIsLoadingReports(true);
      const res = await PrevisionDiarioService.fetchRelatorios({ obraId: project.id, limit: 1 });
      if (res && res.records && res.records.length > 0) {
        const latestItem = res.records[0];
        const detalhe = await PrevisionDiarioService.fetchDetalheRelatorio(latestItem.relatorio_id);
        if (detalhe) {
          const mappedState = PrevisionDiarioService.mapearDetalheParaDiaryState(
            detalhe,
            baseState,
            project
          );
          DiaryStorageService.saveDayToArchive(mappedState, project.id);
          DiaryStorageService.saveState(mappedState);
          setDiaryState({ ...mappedState });
        }
      }
    } catch (err) {
      console.warn('[App] Falha ao sincronizar diário inicial da obra selecionada:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Carregamento dinâmico dos relatórios da obra ativa
  const [obraReports, setObraReports] = useState<DailyReportSummaryItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingReports(true);
    PrevisionDiarioService.fetchRelatorios({ obraId: diaryState.project.id, limit: 150 })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.records && res.records.length > 0) {
          const mapped = res.records.map((r) =>
            PrevisionDiarioService.previsionItemToSummaryItem(
              r,
              diaryState.project.codigo,
              r.data === diaryState.reportingDay.report_date
            )
          );
          setObraReports(mapped);
        } else {
          setObraReports([]);
        }
      })
      .catch((err) => console.warn('[App] Falha ao carregar relatórios da obra:', err))
      .finally(() => {
        if (isMounted) setIsLoadingReports(false);
      });

    return () => {
      isMounted = false;
    };
  }, [diaryState.project.id, diaryState.reportingDay.report_date]);

  // Auto-login instantâneo via link do WhatsApp / Magic Link (?u=usr-02 ou ?user=encarregado)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('u') || params.get('user') || params.get('magic');
    const viewParam = params.get('view');

    if (userParam) {
      const foundUser = sampleUsers.find(
        (u: UserContext) =>
          u.id.toLowerCase() === userParam.toLowerCase() ||
          u.role.toLowerCase() === userParam.toLowerCase() ||
          u.name.toLowerCase().includes(userParam.toLowerCase())
      );
      if (foundUser) {
        const state = DiaryStorageService.setCurrentUser(foundUser);
        setDiaryState({ ...state });
        const targetView = viewParam?.toUpperCase() === 'ENGENHARIA' ? 'ENGENHARIA' : 'CANTEIRO';
        setCurrentView(targetView);
        setIsAuthenticated(true);
        localStorage.setItem('construkore_logged_user_id', foundUser.id);
        localStorage.setItem('construkore_preferred_view', targetView);
        // Limpa parâmetro da URL sem recarregar a página
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleLogin = (user: UserContext, preferredView: 'CANTEIRO' | 'ENGENHARIA' | 'CLIENTE') => {
    const state = DiaryStorageService.setCurrentUser(user);
    setDiaryState({ ...state });
    setCurrentView(preferredView);
    setIsAuthenticated(true);
    if (user.role === 'engenheiro_residente' || user.role === 'gerente_obra') {
      setIsEngineeringUnlocked(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('construkore_logged_user_id');
    setIsAuthenticated(false);
    setIsEngineeringUnlocked(false);
  };

  // Alternador com checagem de PIN de Engenharia
  const handleRequestToggleView = (view: 'CANTEIRO' | 'ENGENHARIA' | 'CLIENTE') => {
    if (view === 'CANTEIRO') {
      setCurrentView('CANTEIRO');
      return;
    }

    if (view === 'CLIENTE') {
      setCurrentView('CLIENTE');
      return;
    }

    // Se já estiver desbloqueado nesta sessão ou se o usuário for engenheiro
    if (isEngineeringUnlocked || diaryState.currentUser.role === 'engenheiro_residente' || diaryState.currentUser.role === 'gerente_obra') {
      setCurrentView('ENGENHARIA');
      return;
    }

    // Caso contrário, solicita PIN de engenharia para liberar acesso
    setPinModalError(null);
    setPinInput('');
    setPendingTargetView('ENGENHARIA');
    setShowPinModal(true);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '1234') {
      setIsEngineeringUnlocked(true);
      setShowPinModal(false);
      setCurrentView('ENGENHARIA');
    } else {
      setPinModalError('Senha incorreta. Acesso restrito ao responsável técnico.');
    }
  };

  // Sincroniza tema dark
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  // Handlers de Meteorologia & Intempérie (Opção 1)
  const handleSyncWeather = async () => {
    const state = await DiaryStorageService.syncWeatherFromApi();
    setDiaryState({ ...state });
  };

  const handleSaveWeatherOverride = (params: any) => {
    if (!overrideShift) return;
    const state = DiaryStorageService.overrideWeatherShift(overrideShift, params);
    setDiaryState({ ...state });
    setOverrideShift(null);
  };

  // Handlers do Modo Canteiro
  const handleAddAudioEvent = (text: string, duration: number, audioBlobUrl?: string) => {
    const { state } = DiaryStorageService.addSourceEvent({
      source_type: 'MANUAL_AUDIO',
      raw_text: text,
      audio_duration_seconds: duration,
      audio_blob_url: audioBlobUrl,
      location_name: 'Canteiro Geral',
    });
    setDiaryState({ ...state });
  };

  const handleAddPhotoEvent = (url: string, caption: string, location: string, audioBlobUrl?: string) => {
    const { state } = DiaryStorageService.addSourceEvent({
      source_type: 'MANUAL_IMAGE',
      raw_text: caption,
      media_url: url,
      location_name: location,
      audio_blob_url: audioBlobUrl,
    });
    setDiaryState({ ...state });
  };

  const handleAddMaterialShortage = (data: {
    material_name: string;
    location_name: string;
    wbs_task_name: string;
    workers_idle: number;
    hours_lost: number;
    notes: string;
  }) => {
    const state = DiaryStorageService.addMaterialShortage(data);
    setDiaryState({ ...state });
  };

  const handleUpdateWorkforce = (roleCode: string, delta: number) => {
    const state = DiaryStorageService.updateWorkforceCount(roleCode, delta);
    setDiaryState({ ...state });
  };

  const handleCopyYesterdayWorkforce = () => {
    const state = DiaryStorageService.copyYesterdayWorkforce();
    setDiaryState({ ...state });
  };

  const handleUpdateProduction = (taskId: string, reported: number) => {
    const state = DiaryStorageService.updateProductionDelta(taskId, reported);
    setDiaryState({ ...state });
  };

  // Handlers de Gestão de Efetivo (Modo Engenharia Desktop)
  const handleUpdateWorkforceRoleCount = (roleCode: string, count: number, companyName?: string) => {
    const state = DiaryStorageService.updateWorkforceRole(roleCode, count, companyName);
    setDiaryState({ ...state });
  };

  const handleAddWorkforceRole = (role: WorkforceRoleCount) => {
    const state = DiaryStorageService.addWorkforceRole(role);
    setDiaryState({ ...state });
  };

  const handleRemoveWorkforceRole = (roleCode: string) => {
    const state = DiaryStorageService.removeWorkforceRole(roleCode);
    setDiaryState({ ...state });
  };

  // Handlers de Gestão de Produção (Modo Engenharia Desktop)
  const handleUpdateProductionDetails = (taskId: string, updates: Partial<ProductionEntry>) => {
    const state = DiaryStorageService.updateProductionDetails(taskId, updates);
    setDiaryState({ ...state });
  };

  const handleAddProductionEntry = (entry: Partial<ProductionEntry>) => {
    const state = DiaryStorageService.addProductionEntry(entry);
    setDiaryState({ ...state });
  };

  // Handlers de Curto Prazo / Planejamento Semanal (LPS)
  const handleAddWeeklyPlanTask = (task: Partial<WeeklyPlanTask>) => {
    const state = DiaryStorageService.addWeeklyPlanTask(task);
    setDiaryState({ ...state });
  };

  const handleUpdateWeeklyPlanTask = (taskId: string, updates: Partial<WeeklyPlanTask>) => {
    const state = DiaryStorageService.updateWeeklyPlanTask(taskId, updates);
    setDiaryState({ ...state });
  };

  // Handlers de Gestão de Contatos de Campo & Grupos do WhatsApp (LGPD)
  const handleAddContact = (contact: Partial<WhatsAppContact>) => {
    const state = DiaryStorageService.addContact(contact);
    setDiaryState({ ...state });
  };

  const handleUpdateContact = (contactId: string, updates: Partial<WhatsAppContact>) => {
    const state = DiaryStorageService.updateContact(contactId, updates);
    setDiaryState({ ...state });
  };

  const handleRemoveContact = (contactId: string) => {
    const state = DiaryStorageService.removeContact(contactId);
    setDiaryState({ ...state });
  };

  const handleToggleContactActive = (contactId: string) => {
    const state = DiaryStorageService.toggleContactActive(contactId);
    setDiaryState({ ...state });
  };

  // Handlers de Locais da Obra & Cloudflare R2 (Modo Engenharia Desktop)
  const handleUpdateLocations = (updates: Partial<ObraLocationsConfig>) => {
    const state = DiaryStorageService.updateLocationsConfig(updates, diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleAddLocationItem = (type: 'torres' | 'pavimentos' | 'ambientes', item: LocationItem) => {
    const state = DiaryStorageService.addLocationItem(type, item, diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleRemoveLocationItem = (type: 'torres' | 'pavimentos' | 'ambientes', id: string) => {
    const state = DiaryStorageService.removeLocationItem(type, id, diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleResetLocationsToDefault = () => {
    const state = DiaryStorageService.resetLocationsToDefault(diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleClearLocations = () => {
    const state = DiaryStorageService.clearLocationsForProject(diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleImportBatchLocations = (rows: LocationsBatchRow[], mode: 'replace' | 'merge') => {
    const state = DiaryStorageService.importLocationsBatch(rows, mode, diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleUpdateR2Config = (updates: Partial<R2StorageConfig>) => {
    const state = DiaryStorageService.updateR2Config(updates, diaryState.project.id);
    setDiaryState({ ...state });
  };

  // Handlers de Histórico & Calendário de RDOs Anteriores
  const handleSwitchReportingDay = async (targetDate: string, reportId?: string) => {
    if (targetDate === diaryState.reportingDay.report_date) {
      return;
    }

    // Se tiver reportId (RDO da VPS), busca o detalhe completo e mapeia nativamente
    if (reportId) {
      try {
        const detalhe = await PrevisionDiarioService.fetchDetalheRelatorio(reportId);
        if (detalhe) {
          const state = PrevisionDiarioService.mapearDetalheParaDiaryState(
            detalhe,
            diaryState,
            diaryState.project
          );
          DiaryStorageService.saveDayToArchive(state, diaryState.project.id);
          DiaryStorageService.saveState(state);
          setDiaryState({ ...state });
          return;
        }
      } catch (err) {
        console.warn('[App] Falha ao carregar detalhe remoto do relatório:', err);
      }
    }

    // Fallback: alterna dia via arquivo local da obra ativa
    const state = DiaryStorageService.switchReportingDay(targetDate, diaryState.project.id);
    setDiaryState({ ...state });
  };

  const handleCreateNewReportingDay = (targetDate: string, copyWorkforce: boolean) => {
    const state = DiaryStorageService.createNewReportingDay({
      targetDate,
      copyYesterdayWorkforce: copyWorkforce,
    });
    setDiaryState({ ...state });
    setEngineeringSection('OVERVIEW');
  };

  const handleDeleteDraftDay = (targetDate: string) => {
    try {
      const state = DiaryStorageService.deleteReportingDayDraft(targetDate);
      setDiaryState({ ...state });
    } catch (err: any) {
      alert(err?.message || 'Não foi possível excluir o rascunho.');
    }
  };

  const handleStateUpdate = (newState: DiaryState) => {
    DiaryStorageService.saveState(newState);
    setDiaryState({ ...newState });
  };

  // Handlers do Modo Engenharia (Fases 3 e 4)
  const handleReviewOccurrence = (occId: string, approved: boolean, feedback?: string) => {
    const state = DiaryStorageService.reviewOccurrence(occId, approved, feedback);
    setDiaryState({ ...state });
  };

  const handleResolveConflict = (conflictId: string, resolvedValue: number, rationale: string) => {
    const state = DiaryStorageService.resolveSourceConflict(conflictId, resolvedValue, rationale);
    setDiaryState({ ...state });
  };

  const handleDispatchSupplyTicket = (ticketId: string, notes?: string) => {
    const state = DiaryStorageService.dispatchSupplyTicket(ticketId, notes);
    setDiaryState({ ...state });
  };

  const handleAdvanceWorkflow = (notes?: string) => {
    const state = DiaryStorageService.advanceWorkflow(notes);
    setDiaryState({ ...state });
  };

  const handleSaveWorkflowSteps = (steps: WorkflowStep[]) => {
    const state = DiaryStorageService.updateWorkflowSteps(steps);
    setDiaryState({ ...state });
  };

  const handleSaveBlockingRules = (rules: BlockingRulesConfig) => {
    const state = DiaryStorageService.updateBlockingRules(rules);
    setDiaryState({ ...state });
  };

  const handleIssueSnapshot = () => {
    const { state } = DiaryStorageService.issueRdoSnapshot();
    setDiaryState({ ...state });
    setIsDocumentViewOpen(true);
  };

  const handleReset = () => {
    const state = DiaryStorageService.resetState();
    setDiaryState({ ...state });
  };

  // Handlers de Coleta Ativa & WhatsApp Inbound (Evolution API + n8n)
  const handleOpenSimulator = (requestId?: string) => {
    setSimulatorRequestId(requestId);
    setIsWhatsAppSimulatorOpen(true);
  };

  const handleCreateInformationRequest = (data: Partial<InformationRequest>) => {
    const state = DiaryStorageService.createInformationRequest(data);
    setDiaryState({ ...state });
  };

  const handleEscalateInformationRequest = (requestId: string) => {
    const state = DiaryStorageService.escalateInformationRequest(requestId);
    setDiaryState({ ...state });
  };

  const handleDispatchWhatsAppWebhook = (payload: WhatsAppInboundWebhookPayload) => {
    const { state } = DiaryStorageService.simulateWhatsAppInbound(payload);
    setDiaryState({ ...state });
  };

  const handleApproveWhatsAppSuggestion = (requestId: string) => {
    const state = DiaryStorageService.approveWhatsAppSuggestion(requestId);
    setDiaryState({ ...state });
  };

  // Cálculos de Validação e KPIs
  const blockingValidation = DiaryStorageService.validateRdoClosure();
  const totalPlanned = diaryState.productionEntries.reduce((acc, curr) => acc + curr.quantity_planned, 0);
  const totalReported = diaryState.productionEntries.reduce((acc, curr) => acc + curr.quantity_reported, 0);
  const globalProgress = Math.round((totalReported / totalPlanned) * 100);
  const pendingOccurrencesCount = diaryState.occurrences.filter((o) => !o.approved_for_rdo).length;
  const pendingConflictsCount = diaryState.conflicts.filter((c) => c.status === 'PENDING').length;

  // Evidências fotográficas reais para o Caderno Pericial (Opção 2)
  const photoEvidences: PhotoEvidenceItem[] = diaryState.sourceEvents
    .filter((e) => e.media_url)
    .map((e, idx) => ({
      id: e.id,
      url: e.media_url!,
      caption: e.raw_text,
      location: e.location_name || 'Canteiro Geral',
      task_name: e.wbs_task_name,
      timestamp: e.occurred_at,
      author: e.author_name,
      category: (e.source_type === 'MATERIAL_SHORTAGE' ? 'INTEMPERIE' : idx === 0 ? 'CRITICA' : 'QUALIDADE') as any,
      is_critical: idx === 0 || (e.wbs_task_name?.toLowerCase().includes('viga') ?? false),
    }));

  // Formata data amigável da obra
  const formatReportDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'Hoje';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    return dateStr;
  };

  // Lista de resumos e navegação entre datas (combina diários da obra na VPS e edições locais)
  const reportsSummaries = useMemo(() => {
    const localList = DiaryStorageService.listDailyReportsSummaries(diaryState.project.id);
    const map = new Map<string, DailyReportSummaryItem>();
    obraReports.forEach((r) => map.set(r.date, r));
    localList.forEach((r) => map.set(r.date, r));
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [obraReports, diaryState.project.id, diaryState.reportingDay.report_date]);
  const currentDateIndex = reportsSummaries.findIndex((r) => r.date === diaryState.dailyReport.report_date);
  const prevDate = currentDateIndex >= 0 && currentDateIndex < reportsSummaries.length - 1
    ? reportsSummaries[currentDateIndex + 1].date
    : undefined;
  const nextDate = currentDateIndex > 0
    ? reportsSummaries[currentDateIndex - 1].date
    : undefined;

  // Soma matemática em tempo real do efetivo total presente hoje no canteiro
  const currentTotalWorkers = useMemo(() => {
    return (diaryState.workforceSnapshot?.entries || []).reduce(
      (acc, curr) => acc + (Number(curr.count) || 0),
      0
    );
  }, [diaryState.workforceSnapshot?.entries]);

  // Banner de Estado do Dia e Ações Globais
  const renderDayBanner = () => {
    const isIssued = diaryState.dailyReport.workflow_state === 'ISSUED';

    return (
      <div className="bg-panel border border-rule rounded-card overflow-hidden shadow-xs space-y-0">
        <div className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-card bg-action-soft text-action flex items-center justify-center shadow-xs shrink-0">
                <Calendar className="w-5 h-5" />
              </div>

              {/* Controles de Navegação Rápida de Datas */}
              <div className="flex items-center bg-paper border border-rule rounded-field p-0.5 shadow-xs">
                <button
                  type="button"
                  disabled={!prevDate}
                  onClick={() => prevDate && handleSwitchReportingDay(prevDate)}
                  className="p-1.5 rounded hover:bg-paper-subtle text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={prevDate ? `Ir para dia anterior (${prevDate})` : 'Não há dia anterior registrado'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-2 flex items-center gap-1.5 border-x border-rule">
                  <input
                    type="date"
                    value={diaryState.dailyReport.report_date}
                    onChange={(e) => e.target.value && handleSwitchReportingDay(e.target.value)}
                    className="bg-transparent text-xs font-bold text-ink cursor-pointer focus:outline-none"
                    title="Clique para escolher qualquer data no calendário"
                  />
                </div>

                <button
                  type="button"
                  disabled={!nextDate}
                  onClick={() => nextDate && handleSwitchReportingDay(nextDate)}
                  className="p-1.5 rounded hover:bg-paper-subtle text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={nextDate ? `Ir para dia seguinte (${nextDate})` : 'Não há dia seguinte registrado'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-ink">
                  {diaryState.dailyReport.formatted_number}
                </span>
                <span className="text-xs text-ink-muted">•</span>
                <span className="text-xs font-semibold text-ink">
                  {formatReportDateLabel(diaryState.dailyReport.report_date)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-chip uppercase ${
                    isIssued
                      ? 'bg-emerald-600 text-white'
                      : 'bg-warning-soft text-warning-text'
                  }`}
                >
                  {isIssued ? 'Emitido & Bloqueado (v1)' : 'Rascunho / Em Aberto'}
                </span>
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">
                Responsável:{' '}
                <strong>{diaryState.dailyReport.responsible_engineer_name}</strong> •{' '}
                {diaryState.reportingDay.shift_name}
              </p>
            </div>
          </div>

          {/* Ações Rápidas de Exportação, WhatsApp & Histórico */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (currentView !== 'ENGENHARIA') {
                  handleRequestToggleView('ENGENHARIA');
                }
                setEngineeringSection('REPORTS_HISTORY');
              }}
              className="px-3.5 py-2 text-xs font-bold bg-action-soft hover:bg-action text-action hover:text-white border border-action/30 rounded-field flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Abrir Calendário e Lista Completa de RDOs Anteriores"
            >
              <History className="w-4 h-4" />
              <span>Histórico de RDOs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentView !== 'ENGENHARIA') {
                  handleRequestToggleView('ENGENHARIA');
                }
                setEngineeringSection('WHATSAPP_COLLECTION');
              }}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-field flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="Gestão de Cobranças e Coleta Ativa WhatsApp (Evolution + n8n)"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              Coleta WhatsApp
            </button>

            <button
              type="button"
              onClick={() => handleOpenSimulator()}
              className="px-3 py-2 text-xs font-semibold bg-panel-subtle hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              title="Simular Webhook Inbound WhatsApp (Ambiente de Testes)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Simular
            </button>

            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-panel-subtle hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              title="Disparo Rápido para WhatsApp (Resumo Executivo / Operacional)"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Resumo
            </button>

            <button
              type="button"
              onClick={() => setIsPhotoDossierOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-panel-subtle hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              title="Caderno Pericial de Evidências Fotográficas A4"
            >
              <Camera className="w-4 h-4 text-action" />
              Dossiê
            </button>

            <button
              type="button"
              onClick={() => setIsDocumentViewOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-panel-subtle hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              title="Visualizar e Imprimir RDO Completo"
            >
              <FileText className="w-4 h-4 text-action" />
              Documento A4
            </button>
          </div>
        </div>

        {/* Faixa Contextual de Status do Dia (Retroativo em Aberto vs Emitido) */}
        {!isIssued ? (
          <div className="bg-amber-500/10 border-t border-amber-500/20 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Edição Ativo:</strong> Você está visualizando o diário de{' '}
                <strong>{formatReportDateLabel(diaryState.dailyReport.report_date)}</strong>. Todas as alterações em Efetivo, Produção, Ocorrências e Fotos serão gravadas neste dia.
              </span>
            </div>
            <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-bold shrink-0">
              RASCUNHO EDITÁVEL
            </span>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border-t border-emerald-500/20 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Documento Oficial Emitido:</strong> O RDO de{' '}
                <strong>{formatReportDateLabel(diaryState.dailyReport.report_date)}</strong> está assinado e congelado com hash pericial imutável.
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
              MODO LEITURA / PERICIAL
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <AuthScreen
        project={diaryState.project}
        availableProjects={availableProjects}
        onSelectProject={handleSelectProject}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans transition-colors">
      {/* Header com Navegação e Controles */}
      <Header
        project={diaryState.project}
        currentUser={diaryState.currentUser}
        currentView={currentView}
        isDarkMode={isDarkMode}
        availableProjects={availableProjects}
        onSelectProject={handleSelectProject}
        onToggleView={(v) => handleRequestToggleView(v)}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onSelectUser={(u) => {
          if (
            (u.role === 'engenheiro_residente' || u.role === 'gerente_obra') &&
            !isEngineeringUnlocked &&
            diaryState.currentUser.role === 'encarregado'
          ) {
            setPinModalError(null);
            setPinInput('');
            setShowPinModal(true);
            return;
          }
          const state = DiaryStorageService.setCurrentUser(u);
          setDiaryState({ ...state });
        }}
        onReset={handleReset}
        onLogout={handleLogout}
      />

      {/* ========================================================================= */}
      {/* VISÃO 1: MODO CANTEIRO (Mobile-First / Raken)                            */}
      {/* ========================================================================= */}
      {currentView === 'CANTEIRO' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
          {renderDayBanner()}

          {/* Aviso de Perfil Canteiro com Destaque de Hardware Real */}
          <div className="bg-action-soft/30 border border-action/20 rounded-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-ink">
              <Sparkles className="w-4 h-4 text-action shrink-0" />
              <span>
                <strong>Modo Canteiro Ágil:</strong> Gravação de voz com microfone real, câmera com carimbo de GPS e cópia rápida de equipes.
              </span>
            </div>
            <span className="text-[10px] font-mono text-action font-bold bg-action-soft px-2 py-0.5 rounded-pill">
              MICROFONE + CÂMERA ATIVOS
            </span>
          </div>

          {/* Barra de Ações Rápidas (Raken Style) */}
          <QuickCaptureBar
            project={diaryState.project}
            locationsConfig={diaryState.locationsConfig}
            r2Config={diaryState.r2Config}
            workforce={diaryState.workforceSnapshot}
            productionList={diaryState.productionEntries}
            currentUser={diaryState.currentUser}
            onAddAudioEvent={handleAddAudioEvent}
            onAddPhotoEvent={handleAddPhotoEvent}
            onAddMaterialShortage={handleAddMaterialShortage}
            onUpdateWorkforceCount={handleUpdateWorkforce}
            onCopyYesterdayWorkforce={handleCopyYesterdayWorkforce}
            onUpdateProduction={handleUpdateProduction}
          />

            {/* Widget de Clima & Intempérie Pericial (Opção 1) */}
            {diaryState.weatherSummary && (
              <WeatherWidget
                summary={diaryState.weatherSummary}
                onSync={handleSyncWeather}
                onOpenOverride={(shift) => setOverrideShift(shift)}
              />
            )}

            {/* Resumo de Produção do Dia com Status Visual */}
            <div className="bg-panel border border-rule rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-action" />
                  Metas de Produção Previstas para Hoje
                </h3>
                <span className="text-xs font-mono font-bold text-action">
                  {globalProgress}% Concluído
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {diaryState.productionEntries.map((prod) => (
                  <div
                    key={prod.task_id}
                    className="p-3 rounded-card bg-paper border border-rule-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-ink">{prod.task_name}</h4>
                          {prod.is_critical && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-danger-soft text-danger uppercase">
                              Crítica (Foto Req.)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-ink-muted">{prod.location_name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-ink">
                        {prod.quantity_reported} / {prod.quantity_planned} {prod.uom}
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full h-2 rounded-pill bg-panel border border-rule-subtle overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          prod.progress_pct >= 100 ? 'bg-success' : 'bg-action'
                        }`}
                        style={{ width: `${Math.min(100, prod.progress_pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-secondary">
                      <span>Progresso: <strong>{prod.progress_pct}%</strong></span>
                      {prod.progress_pct >= 100 ? (
                        <span className="text-success font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Meta Atingida
                        </span>
                      ) : (
                        <span className="text-ink-muted">Em execução</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos Fatos Registrados em Campo */}
            <TodayTimeline events={diaryState.sourceEvents} />
        </main>
      )}

      {/* ========================================================================= */}
      {/* VISÃO 2: MODO ENGENHARIA (Desktop / Sidebar Gemini + Trilha Focada)       */}
      {/* ========================================================================= */}
      {currentView === 'ENGENHARIA' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Retrátil Gemini Style */}
          <Sidebar
            currentSection={engineeringSection}
            onSelectSection={(sec) => setEngineeringSection(sec)}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            currentUser={diaryState.currentUser}
            pendingValidationsCount={pendingOccurrencesCount + pendingConflictsCount}
            pendingWhatsAppCount={diaryState.informationRequests.filter((r) => r.request_state === 'PENDING' || r.request_state === 'REMINDED' || r.request_state === 'ANSWERED').length}
            blockingIssuesCount={blockingValidation.blocking_issues.length}
            pendingReportsCount={reportsSummaries.filter((r) => r.workflow_state !== 'ISSUED').length}
          />

          {/* Área de Trabalho Focada da Engenharia */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Banner de Estado do Dia */}
            {renderDayBanner()}

            {/* Breadcrumb / Título da Seção Ativa */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rule">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Modo Engenharia</span>
                <span className="text-ink-muted">/</span>
                <h2 className="text-base font-bold text-ink">
                  {engineeringSection === 'OVERVIEW' && 'Visão Geral & Governança do RDO'}
                  {engineeringSection === 'REPORTS_HISTORY' && 'Histórico de RDOs, Dias Anteriores & Arquivo'}
                  {engineeringSection === 'PHOTO_GALLERY' && 'Galeria Inteligente de Fotos & Documentos Técnicos'}
                  {engineeringSection === 'CLIENT_REPORT' && 'Relatório Mensal de Relacionamento com o Cliente (A4)'}
                  {engineeringSection === 'WORKFORCE' && 'Gestão & Edição do Efetivo de Obra'}
                  {engineeringSection === 'PRODUCTION' && 'Apontamento & Avanço Físico Diário'}
                  {engineeringSection === 'SHORT_TERM_PLANNING' && 'Curto Prazo — Planejamento Semanal (LPS)'}
                  {engineeringSection === 'LOCATIONS' && 'Locais da Obra & Cloudflare R2 Storage'}
                  {engineeringSection === 'WHATSAPP_COLLECTION' && 'Coleta Ativa & Cobranças via WhatsApp'}
                  {engineeringSection === 'CONTACTS' && 'Contatos de Campo & Grupos do WhatsApp (LGPD)'}
                  {engineeringSection === 'VALIDATIONS' && 'Caixa de Entrada & Validações de Campo'}
                  {engineeringSection === 'WEATHER' && 'Meteorologia & Laudo Pericial de Intempérie'}
                  {engineeringSection === 'TIMELINE' && 'Linha do Tempo Auditável'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-secondary">
                <span className="hidden sm:inline">Perfil ativo:</span>
                <span className="font-bold text-ink px-2 py-0.5 rounded bg-panel border border-rule">
                  {diaryState.currentUser.name} ({diaryState.currentUser.role})
                </span>
              </div>
            </div>

            {/* SEÇÃO 1: VISÃO GERAL & GOVERNANÇA */}
            {engineeringSection === 'OVERVIEW' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Cards de Métricas Analíticas com Navegação Interativa */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setEngineeringSection('WORKFORCE')}
                    className="bg-panel border border-rule hover:border-action p-3.5 rounded-card space-y-1 text-left transition-all group shadow-xs active:scale-95"
                  >
                    <span className="text-[10px] font-bold text-ink-muted uppercase group-hover:text-action">
                      Efetivo de Obra
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-bold text-ink">
                        {currentTotalWorkers}
                      </span>
                      <Users className="w-5 h-5 text-action" />
                    </div>
                    <span className="text-[11px] text-ink-secondary block">
                      {diaryState.workforceSnapshot.copied_from_yesterday
                        ? 'Efetivo copiado de ontem'
                        : 'Clique para gerenciar'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngineeringSection('PRODUCTION')}
                    className="bg-panel border border-rule hover:border-action p-3.5 rounded-card space-y-1 text-left transition-all group shadow-xs active:scale-95"
                  >
                    <span className="text-[10px] font-bold text-ink-muted uppercase group-hover:text-action">
                      Avanço Físico Global
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-bold text-action">
                        {globalProgress}%
                      </span>
                      <TrendingUp className="w-5 h-5 text-action" />
                    </div>
                    <span className="text-[11px] text-ink-secondary block">
                      Clique para editar metas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEngineeringSection('VALIDATIONS')}
                    className="bg-panel border border-rule hover:border-warning p-3.5 rounded-card space-y-1 text-left transition-all group shadow-xs active:scale-95"
                  >
                    <span className="text-[10px] font-bold text-ink-muted uppercase group-hover:text-warning">
                      Pendências & Conflitos
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-bold text-warning">
                        {pendingOccurrencesCount + pendingConflictsCount}
                      </span>
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <span className="text-[11px] text-ink-secondary block">
                      {pendingConflictsCount > 0 ? `${pendingConflictsCount} divergência de medição` : 'Clique para validar'}
                    </span>
                  </button>

                  <div className="bg-panel border border-rule p-3.5 rounded-card space-y-1">
                    <span className="text-[10px] font-bold text-ink-muted uppercase">Governança RDO</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">
                        Etapa {diaryState.workflow.current_step_number} / {diaryState.workflow.steps.length}
                      </span>
                      <Lock className="w-5 h-5 text-ink-muted" />
                    </div>
                    <span className="text-[11px] text-success font-semibold block">
                      {diaryState.dailyReport.workflow_state}
                    </span>
                  </div>
                </div>

                {/* Alerta de Regras de Bloqueio Determinístico no Fechamento */}
                <BlockingRulesAlert
                  validation={blockingValidation}
                  onOpenWorkflowEditor={() => setIsWorkflowEditorOpen(true)}
                />

                {/* Painel de Alerta e Despacho de Chamado para Suprimentos */}
                <SupplyEscalationPanel
                  tickets={diaryState.supplyTickets}
                  onDispatchTicket={handleDispatchSupplyTicket}
                />

                {/* Stepper de Governança em Etapas Configuráveis & Emissão de Snapshot */}
                <WorkflowSteppers
                  workflow={diaryState.workflow}
                  dailyReport={diaryState.dailyReport}
                  blockingValidation={blockingValidation}
                  onAdvanceStep={handleAdvanceWorkflow}
                  onIssueSnapshot={handleIssueSnapshot}
                  onOpenReportView={() => setIsDocumentViewOpen(true)}
                  onOpenWorkflowEditor={() => setIsWorkflowEditorOpen(true)}
                />

                {/* Cards de Atalho Rápido para Módulos Operacionais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-card bg-panel border border-rule space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
                        <Users className="w-4 h-4 text-action" />
                        Efetivo em Campo ({currentTotalWorkers} operários)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEngineeringSection('WORKFORCE')}
                        className="text-xs font-semibold text-action hover:underline flex items-center gap-1"
                      >
                        Gerenciar Efetivo <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {diaryState.workforceSnapshot.entries.map((entry) => (
                        <div
                          key={entry.role_code}
                          className="flex items-center justify-between p-2 rounded bg-paper border border-rule text-xs hover:border-action/40 transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-ink block">{entry.role_name}</span>
                            <span className="text-[10px] text-ink-muted">{entry.company_name}</span>
                          </div>
                          <span className="font-mono font-bold text-ink bg-panel px-2 py-0.5 rounded border border-rule">
                            {entry.count} operários
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-card bg-panel border border-rule space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
                        <Hammer className="w-4 h-4 text-action" />
                        Frentes de Produção Ativas ({diaryState.productionEntries.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEngineeringSection('PRODUCTION')}
                        className="text-xs font-semibold text-action hover:underline flex items-center gap-1"
                      >
                        Apontar Produção <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {diaryState.productionEntries.slice(0, 4).map((prod) => (
                        <div
                          key={prod.task_id}
                          className="flex items-center justify-between p-2 rounded bg-paper border border-rule text-xs"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-ink block truncate">{prod.task_name}</span>
                            <span className="text-[10px] text-ink-muted">{prod.location_name}</span>
                          </div>
                          <span className="font-mono font-bold text-ink shrink-0">
                            {prod.quantity_reported}/{prod.quantity_planned} {prod.uom}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO: HISTÓRICO DE DIÁRIOS & DIAS ANTERIORES */}
            {engineeringSection === 'REPORTS_HISTORY' && (
              <div className="animate-in fade-in duration-200">
                <ReportsHistoryPanel
                  project={diaryState.project}
                  reportsList={reportsSummaries}
                  activeDate={diaryState.dailyReport.report_date}
                  onSelectDate={(date, reportId) => {
                    handleSwitchReportingDay(date, reportId);
                    setEngineeringSection('OVERVIEW');
                  }}
                  onCreateNewDay={handleCreateNewReportingDay}
                  onDeleteDraftDay={handleDeleteDraftDay}
                  onOpenDocumentView={(date, reportId) => {
                    handleSwitchReportingDay(date, reportId);
                    setIsDocumentViewOpen(true);
                  }}
                  onOpenPhotoDossier={(date, reportId) => {
                    handleSwitchReportingDay(date, reportId);
                    setIsPhotoDossierOpen(true);
                  }}
                />
              </div>
            )}

            {/* SEÇÃO 2: GESTÃO & EDIÇÃO DE EFETIVO */}
            {engineeringSection === 'WORKFORCE' && (
              <div className="animate-in fade-in duration-200">
                <WorkforceManagerPanel
                  workforce={diaryState.workforceSnapshot}
                  onUpdateRoleCount={handleUpdateWorkforceRoleCount}
                  onAddRole={handleAddWorkforceRole}
                  onRemoveRole={handleRemoveWorkforceRole}
                  onCopyYesterday={handleCopyYesterdayWorkforce}
                />
              </div>
            )}

            {/* SEÇÃO 3: PRODUÇÃO & AVANÇO FÍSICO */}
            {engineeringSection === 'PRODUCTION' && (
              <div className="animate-in fade-in duration-200">
                <ProductionManagerPanel
                  productionList={diaryState.productionEntries}
                  onUpdateProductionDetails={handleUpdateProductionDetails}
                  onAddProductionEntry={handleAddProductionEntry}
                />
              </div>
            )}

            {/* SEÇÃO 4: CURTO PRAZO / PLANEJAMENTO SEMANAL (LPS) */}
            {engineeringSection === 'SHORT_TERM_PLANNING' && (
              <div className="animate-in fade-in duration-200">
                <ShortTermPlanningPanel
                  tasks={diaryState.weeklyPlanTasks}
                  onAddTask={handleAddWeeklyPlanTask}
                  onUpdateTask={handleUpdateWeeklyPlanTask}
                />
              </div>
            )}

            {/* SEÇÃO: ESTRUTURA DE LOCAIS & CLOUDFLARE R2 */}
            {engineeringSection === 'LOCATIONS' && (
              <div className="animate-in fade-in duration-200">
                <LocationsAndR2Panel
                  project={diaryState.project}
                  locationsConfig={diaryState.locationsConfig}
                  r2Config={diaryState.r2Config}
                  onUpdateLocations={handleUpdateLocations}
                  onAddLocationItem={handleAddLocationItem}
                  onRemoveLocationItem={handleRemoveLocationItem}
                  onResetLocationsToDefault={handleResetLocationsToDefault}
                  onUpdateR2Config={handleUpdateR2Config}
                  onClearLocations={handleClearLocations}
                  onImportBatch={handleImportBatchLocations}
                />
              </div>
            )}

            {/* SEÇÃO 5: COLETA ATIVA & WHATSAPP */}
            {engineeringSection === 'WHATSAPP_COLLECTION' && (
              <div className="animate-in fade-in duration-200">
                <InformationRequestsPanel
                  requests={diaryState.informationRequests}
                  contacts={diaryState.contacts}
                  onOpenSimulator={handleOpenSimulator}
                  onEscalateRequest={handleEscalateInformationRequest}
                  onApproveSuggestion={handleApproveWhatsAppSuggestion}
                  onCreateRequest={handleCreateInformationRequest}
                />
              </div>
            )}

            {/* SEÇÃO: CONTATOS DE CAMPO & GRUPOS WHATSAPP (LGPD) */}
            {engineeringSection === 'CONTACTS' && (
              <div className="animate-in fade-in duration-200">
                <ContactsManagerPanel
                  contacts={diaryState.contacts}
                  onAddContact={handleAddContact}
                  onUpdateContact={handleUpdateContact}
                  onRemoveContact={handleRemoveContact}
                  onToggleActive={handleToggleContactActive}
                  onTestMessage={() => handleOpenSimulator()}
                />
              </div>
            )}

            {/* SEÇÃO 6: VALIDAÇÕES & CAIXA DE ENTRADA */}
            {engineeringSection === 'VALIDATIONS' && (
              <div className="animate-in fade-in duration-200">
                <ReviewInbox
                  occurrences={diaryState.occurrences}
                  conflicts={diaryState.conflicts}
                  informationRequests={diaryState.informationRequests}
                  onReviewOccurrence={handleReviewOccurrence}
                  onOpenConflictModal={(conf) => setSelectedConflict(conf)}
                  onApproveWhatsAppRequest={handleApproveWhatsAppSuggestion}
                />
              </div>
            )}

            {/* SEÇÃO 7: CLIMA & INTEMPÉRIE */}
            {engineeringSection === 'WEATHER' && (
              <div className="animate-in fade-in duration-200">
                {diaryState.weatherSummary && (
                  <WeatherWidget
                    summary={diaryState.weatherSummary}
                    onSync={handleSyncWeather}
                    onOpenOverride={(shift) => setOverrideShift(shift)}
                  />
                )}
              </div>
            )}

            {/* SEÇÃO: GALERIA INTELIGENTE DE FOTOS & DOCUMENTOS TÉCNICOS */}
            {engineeringSection === 'PHOTO_GALLERY' && (
              <div className="animate-in fade-in duration-200">
                <PhotoAndDocGalleryPanel
                  project={diaryState.project}
                  currentUser={diaryState.currentUser}
                  locationsConfig={diaryState.locationsConfig}
                  sourceEvents={diaryState.sourceEvents}
                  onAddEvent={(evt) => {
                    const result = DiaryStorageService.addSourceEvent(evt as SourceEvent);
                    setDiaryState({ ...result.state });
                  }}
                />
              </div>
            )}

            {/* SEÇÃO: RELATÓRIO DO CLIENTE (MENSAL - A4) */}
            {engineeringSection === 'CLIENT_REPORT' && (
              <div className="animate-in fade-in duration-200">
                <MonthlyClientReportView
                  project={diaryState.project}
                  onClose={() => setEngineeringSection('OVERVIEW')}
                />
              </div>
            )}

            {/* SEÇÃO 8: LINHA DO TEMPO */}
            {engineeringSection === 'TIMELINE' && (
              <div className="animate-in fade-in duration-200">
                <TodayTimeline events={diaryState.sourceEvents} />
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISÃO 3: PORTAL DO CLIENTE & FISCAL (Transparência, Aprovação & Relatórios) */}
      {/* ========================================================================= */}
      {currentView === 'CLIENTE' && (
        <ClientPortalView
          project={diaryState.project}
          currentUser={diaryState.currentUser}
          availableProjects={availableProjects}
          onSelectProject={handleSelectProject}
          onLogout={handleLogout}
          onSwitchToEngineering={() => handleRequestToggleView('ENGENHARIA')}
        />
      )}

      {/* Modal de Conciliação de Conflito de Fontes (Fase 3) */}
      <ConflictResolutionModal
        isOpen={Boolean(selectedConflict)}
        onClose={() => setSelectedConflict(null)}
        conflict={selectedConflict}
        onResolveConflict={handleResolveConflict}
      />

      {/* Modal de Edição de Workflow e Regras de Bloqueio (Fase 4) */}
      <WorkflowEditorModal
        isOpen={isWorkflowEditorOpen}
        onClose={() => setIsWorkflowEditorOpen(false)}
        currentSteps={diaryState.workflow.steps}
        currentRules={diaryState.blockingRules}
        onSaveWorkflow={handleSaveWorkflowSteps}
        onSaveRules={handleSaveBlockingRules}
      />

      {/* Modal de Ajuste Pericial de Clima / Override Humano (Opção 1) */}
      <WeatherOverrideModal
        isOpen={overrideShift !== null}
        onClose={() => setOverrideShift(null)}
        shiftRecord={
          overrideShift
            ? diaryState.weatherSummary?.shifts?.find((s) => s.shift === overrideShift) || null
            : null
        }
        onSaveOverride={handleSaveWeatherOverride}
      />

      {/* Modal / Visualizador de PDF Oficial do RDO */}
      <RdoDocumentView
        isOpen={isDocumentViewOpen}
        onClose={() => setIsDocumentViewOpen(false)}
        version={diaryState.versions[diaryState.versions.length - 1]}
        fallbackData={{
          report_id: diaryState.dailyReport.id,
          report_number: diaryState.dailyReport.formatted_number,
          report_date: diaryState.dailyReport.report_date,
          project: diaryState.project,
          responsible_engineer: diaryState.dailyReport.responsible_engineer_name,
          issued_at: new Date().toISOString(),
          weather: diaryState.weather,
          weather_summary: diaryState.weatherSummary,
          workforce: diaryState.workforceSnapshot,
          production: diaryState.productionEntries,
          occurrences: diaryState.occurrences.filter((o) => o.approved_for_rdo),
          conflicts: diaryState.conflicts,
          supply_tickets: diaryState.supplyTickets,
          photo_evidences: diaryState.sourceEvents
            .filter((e) => e.media_url)
            .map((e) => ({
              url: e.media_url!,
              caption: e.raw_text,
              location: e.location_name || 'Canteiro Geral',
              timestamp: e.occurred_at,
              author: e.author_name,
            })),
          workflow_signatures: diaryState.workflow.steps,
          general_notes: diaryState.generalNotes,
        }}
      />

      {/* Modal de Disparo Rápido para WhatsApp (Opção 2) */}
      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        diaryState={diaryState}
      />

      {/* Visualizador A4 do Caderno Pericial de Evidências Fotográficas (Opção 2) */}
      <PhotoDossierView
        isOpen={isPhotoDossierOpen}
        onClose={() => setIsPhotoDossierOpen(false)}
        project={diaryState.project}
        reportNumber={diaryState.dailyReport.formatted_number}
        reportDate={diaryState.dailyReport.report_date}
        responsibleEngineer={diaryState.dailyReport.responsible_engineer_name}
        photos={photoEvidences}
        documentHash={diaryState.versions[diaryState.versions.length - 1]?.document_hash}
      />

      {/* Relatório Mensal Executivo de Relacionamento com o Cliente (A4) */}
      {isMonthlyClientReportOpen && (
        <MonthlyClientReportView
          project={diaryState.project}
          onClose={() => setIsMonthlyClientReportOpen(false)}
        />
      )}

      {/* Modal de Simulação de Coleta Ativa & Webhook Inbound WhatsApp (Evolution + n8n) */}
      <WhatsAppInboundSimulatorModal
        isOpen={isWhatsAppSimulatorOpen}
        onClose={() => setIsWhatsAppSimulatorOpen(false)}
        requests={diaryState.informationRequests}
        initialRequestId={simulatorRequestId}
        onDispatchWebhook={handleDispatchWhatsAppWebhook}
      />

      {/* Modal de Autorização por Senha para Acesso ao Modo Engenharia */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-rule rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-action-soft text-action flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Acesso Engenharia Desktop</h3>
                <p className="text-xs text-ink-muted">Digite a senha do responsável técnico</p>
              </div>
            </div>

            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Senha de Engenharia (Padrão: 1234)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-paper border border-rule rounded-xl py-3 px-4 text-center text-lg font-mono tracking-widest text-ink placeholder-ink-muted focus:outline-none focus:border-action"
                />
                {pinModalError && (
                  <p className="text-xs text-danger flex items-center gap-1 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{pinModalError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-paper border border-rule hover:bg-paper-subtle text-ink text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-action hover:bg-action/90 text-white text-xs font-bold shadow-md"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
