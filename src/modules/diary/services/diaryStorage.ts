import {
  ReportingDay,
  SourceEvent,
  ProductionEntry,
  WorkforceSnapshot,
  OperationalOccurrence,
  WeatherObservation,
  DayWeatherSummary,
  WeatherShiftRecord,
  DailyReport,
  ReportVersion,
  ApprovalWorkflow,
  ProjectContext,
  UserContext,
  RdoSnapshotData,
  SourceConflict,
  SupplyEscalationTicket,
  BlockingRulesConfig,
  BlockingValidationResult,
  WorkflowStep,
  InformationRequest,
  InformationRequestState,
  InformationRequestType,
  WhatsAppInboundWebhookPayload,
  WeeklyPlanTask,
  WorkforceRoleCount,
  WhatsAppContact,
  QuestionTemplate,
  LocationItem,
  ObraLocationsConfig,
  R2StorageConfig,
  CurrentPhotoLocationSelection,
  DailyReportSummaryItem,
} from '../types/diary.types';
import { WeatherService } from './weatherService';

const STORAGE_KEY = 'construkore_diary_state_v7';
const PHOTO_LOCATION_SELECTION_KEY = 'construkore_photo_location_selection_v1';
const ARCHIVE_STORAGE_KEY = 'construkore_diary_archive_v1';

export interface DiaryState {
  project: ProjectContext;
  currentUser: UserContext;
  reportingDay: ReportingDay;
  sourceEvents: SourceEvent[];
  productionEntries: ProductionEntry[];
  workforceSnapshot: WorkforceSnapshot;
  occurrences: OperationalOccurrence[];
  weather: WeatherObservation[];
  weatherSummary: DayWeatherSummary;
  workflow: ApprovalWorkflow;
  dailyReport: DailyReport;
  versions: ReportVersion[];
  generalNotes: string;
  // Fases 3 e 4
  conflicts: SourceConflict[];
  supplyTickets: SupplyEscalationTicket[];
  blockingRules: BlockingRulesConfig;
  // WhatsApp Inbound & Coleta Ativa (Evolution + n8n)
  informationRequests: InformationRequest[];
  // Curto Prazo (Planejamento Semanal)
  weeklyPlanTasks: WeeklyPlanTask[];
  // Contatos de Campo & Grupos do WhatsApp (LGPD)
  contacts: WhatsAppContact[];
  questionTemplates: QuestionTemplate[];
  // Locais da Obra & Cloudflare R2
  locationsConfig: ObraLocationsConfig;
  r2Config: R2StorageConfig;
}

// ---------------------------------------------------------------------
// DADOS INICIAIS (SEED)
// ---------------------------------------------------------------------
const initialProject: ProjectContext = {
  id: 'poty-01',
  codigo: 'POTY',
  nome: 'Residencial Poty Mirante — Torre A',
  cidade: 'Curitiba, PR',
  timezone: 'America/Sao_Paulo',
  gps_lat: -25.4284,
  gps_lng: -49.2733,
  rain_contractual_threshold_mm: 5.0,
  nearest_inmet_station_code: 'A807',
  nearest_inmet_station_name: 'Estação Oficial INMET A807 (Curitiba - PR)',
};

export const sampleUsers: UserContext[] = [
  { id: 'usr-01', name: 'Carlos Silva', email: 'carlos.mestre@poty.com', role: 'mestre' },
  { id: 'usr-02', name: 'Antônio Santos', email: 'antonio.encarregado@poty.com', role: 'encarregado' },
  { id: 'usr-03', name: 'Engª. Mariana Costa', email: 'mariana.costa@construkore.com', role: 'engenheiro_residente' },
  { id: 'usr-04', name: 'Roberto Albuquerque', email: 'roberto.gerente@construkore.com', role: 'gerente_obra' },
  { id: 'usr-05', name: 'Dr. Fernando Linhares', email: 'fernando.fiscal@caixa.gov.br', role: 'fiscal_cliente' },
];

const initialReportingDay: ReportingDay = {
  id: 'rep-day-2026-09-08',
  tenant_id: 'tenant-kore-01',
  project_id: 'poty-01',
  report_date: '2026-09-08',
  shift_name: 'Turno Integral (07:00 às 17:00)',
  workflow_state: 'OPEN',
  responsible_user_id: 'usr-03',
  responsible_user_name: 'Engª. Mariana Costa',
  completion_percentage: 72,
  data_quality_score: 94,
  opened_at: '2026-09-08T07:00:00-03:00',
  status: 'active',
  created_at: '2026-09-08T07:00:00-03:00',
  updated_at: '2026-09-08T15:30:00-03:00',
};

const initialEvents: SourceEvent[] = [
  {
    id: 'evt-01',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    source_type: 'WORKFORCE_COUNT',
    occurred_at: '2026-09-08T07:15:00-03:00',
    recorded_at: '2026-09-08T07:18:00-03:00',
    author_id: 'usr-01',
    author_name: 'Carlos Silva (Mestre)',
    author_role: 'mestre',
    raw_text: 'Efetivo inicial de 25 operários confirmado na portaria. Portaria liberada.',
    review_state: 'confirmed',
    confidence: 1.0,
    status: 'active',
    created_at: '2026-09-08T07:18:00-03:00',
  },
  {
    id: 'evt-02',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    source_type: 'PRODUCTION_DELTA',
    occurred_at: '2026-09-08T08:10:00-03:00',
    recorded_at: '2026-09-08T08:15:00-03:00',
    author_id: 'usr-02',
    author_name: 'Antônio Santos (Encarregado)',
    author_role: 'encarregado',
    raw_text: 'Início do assentamento de alvenaria estrutural no Pavimento 08.',
    location_name: 'Pavimento 08',
    wbs_task_name: 'Alvenaria Estrutural',
    review_state: 'confirmed',
    confidence: 0.95,
    status: 'active',
    created_at: '2026-09-08T08:15:00-03:00',
  },
  {
    id: 'evt-03',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    source_type: 'MANUAL_IMAGE',
    occurred_at: '2026-09-08T10:30:00-03:00',
    recorded_at: '2026-09-08T10:32:00-03:00',
    author_id: 'usr-03',
    author_name: 'Engª. Mariana Costa',
    author_role: 'engenheiro_residente',
    raw_text: 'Inspeção de armadura das vigas V-101 a V-105 do Pavimento 09 aprovada com FVS.',
    location_name: 'Pavimento 09',
    wbs_task_name: 'Armação de Vigas',
    media_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop',
    review_state: 'confirmed',
    confidence: 1.0,
    status: 'active',
    created_at: '2026-09-08T10:32:00-03:00',
  },
  {
    id: 'evt-04',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    source_type: 'MATERIAL_SHORTAGE',
    occurred_at: '2026-09-08T14:20:00-03:00',
    recorded_at: '2026-09-08T14:25:00-03:00',
    author_id: 'usr-02',
    author_name: 'Antônio Santos (Encarregado)',
    author_role: 'encarregado',
    raw_text: 'Falta de Bloco Estrutural 14x19x39 classe B. 4 pedreiros ficaram parados aguardando reposição da carreta.',
    location_name: 'Pavimento 08',
    wbs_task_name: 'Alvenaria Estrutural',
    review_state: 'pending_review',
    confidence: 0.9,
    status: 'active',
    created_at: '2026-09-08T14:25:00-03:00',
  },
];

const initialProduction: ProductionEntry[] = [
  {
    id: 'prod-01',
    reporting_day_id: 'rep-day-2026-09-08',
    task_id: 'tsk-01',
    task_name: 'Alvenaria Estrutural',
    location_name: 'Pavimento 08',
    quantity_planned: 120,
    quantity_reported: 85,
    uom: 'm²',
    progress_pct: 71,
    confirmation_state: 'confirmed',
    notes: 'Produção reduzida às 14:20 devido à quebra de estoque temporária de blocos.',
    is_critical: false,
    assigned_user_id: 'usr-02',
    assigned_user_name: 'Antônio Santos (Encarregado)',
    weekly_plan_task_id: 'wpt-01',
    weekly_goal: 160,
  },
  {
    id: 'prod-02',
    reporting_day_id: 'rep-day-2026-09-08',
    task_id: 'tsk-02',
    task_name: 'Concretagem de Vigas e Lajes',
    location_name: 'Pavimento 09',
    quantity_planned: 24,
    quantity_reported: 24,
    uom: 'm³',
    progress_pct: 100,
    confirmation_state: 'confirmed',
    notes: 'Concluído 100% no prazo. Liberado para cura química.',
    is_critical: true, // Atividade crítica: exige foto no fechamento
    assigned_user_id: 'usr-01',
    assigned_user_name: 'Carlos Silva (Mestre)',
    weekly_plan_task_id: 'wpt-02',
    weekly_goal: 48,
  },
  {
    id: 'prod-03',
    reporting_day_id: 'rep-day-2026-09-08',
    task_id: 'tsk-03',
    task_name: 'Instalações Hidrossanitárias',
    location_name: 'Pavimento 06',
    quantity_planned: 8,
    quantity_reported: 7,
    uom: 'pontos',
    progress_pct: 87.5,
    confirmation_state: 'confirmed',
    notes: 'Execução de shafts de esgoto.',
    is_critical: false,
    assigned_user_id: 'usr-02',
    assigned_user_name: 'Antônio Santos (Encarregado)',
    weekly_plan_task_id: 'wpt-03',
    weekly_goal: 25,
  },
  {
    id: 'prod-04',
    reporting_day_id: 'rep-day-2026-09-08',
    task_id: 'tsk-04',
    task_name: 'Reboco Interno Gesso',
    location_name: 'Pavimento 05',
    quantity_planned: 95,
    quantity_reported: 90,
    uom: 'm²',
    progress_pct: 95,
    confirmation_state: 'confirmed',
    notes: 'Ritmo normal da equipe de acabamento.',
    is_critical: false,
    assigned_user_id: 'usr-02',
    assigned_user_name: 'Antônio Santos (Encarregado)',
    weekly_plan_task_id: 'wpt-04',
    weekly_goal: 300,
  },
];

// Tarefas do Planejamento de Curto Prazo (Weekly Work Plan / LPS)
export const initialWeeklyPlanTasks: WeeklyPlanTask[] = [
  {
    id: 'wpt-01',
    project_id: 'poty-01',
    week_label: 'Semana 37 (07/09 a 12/09/2026)',
    wbs_code: '02.04.01',
    task_name: 'Alvenaria de Vedação — Pavimento 08',
    location_name: 'Pavimento 08 — Torre A',
    assigned_user_id: 'usr-02',
    assigned_user_name: 'Antônio Santos (Encarregado)',
    company_type: 'TERCEIRIZADA',
    company_name: 'Empreiteira Silva & Santos',
    quantity_planned_week: 160,
    quantity_planned_today: 120,
    quantity_executed_week: 85,
    uom: 'm²',
    is_critical: false,
    status: 'IN_PROGRESS',
    created_at: '2026-09-07T08:00:00-03:00',
    updated_at: '2026-09-08T15:30:00-03:00',
  },
  {
    id: 'wpt-02',
    project_id: 'poty-01',
    week_label: 'Semana 37 (07/09 a 12/09/2026)',
    wbs_code: '01.03.04',
    task_name: 'Concretagem de Vigas e Lajes — Laje L-09',
    location_name: 'Pavimento 09 — Laje L-09',
    assigned_user_id: 'usr-01',
    assigned_user_name: 'Carlos Silva (Mestre)',
    company_type: 'PROPRIA',
    company_name: 'ConstruKore Estruturas',
    quantity_planned_week: 48,
    quantity_planned_today: 24,
    quantity_executed_week: 24,
    uom: 'm³',
    is_critical: true,
    status: 'COMPLETED',
    created_at: '2026-09-07T08:00:00-03:00',
    updated_at: '2026-09-08T16:00:00-03:00',
  },
  {
    id: 'wpt-03',
    project_id: 'poty-01',
    week_label: 'Semana 37 (07/09 a 12/09/2026)',
    wbs_code: '03.01.02',
    task_name: 'Instalações Hidrossanitárias — Prumadas Pav. 06',
    location_name: 'Pavimento 06 — Torre A',
    assigned_user_id: 'usr-02',
    assigned_user_name: 'Antônio Santos (Encarregado)',
    company_type: 'TERCEIRIZADA',
    company_name: 'Volt Engenharia',
    quantity_planned_week: 25,
    quantity_planned_today: 8,
    quantity_executed_week: 7,
    uom: 'pontos',
    is_critical: false,
    status: 'IN_PROGRESS',
    created_at: '2026-09-07T08:00:00-03:00',
    updated_at: '2026-09-08T14:30:00-03:00',
  },
  {
    id: 'wpt-04',
    project_id: 'poty-01',
    week_label: 'Semana 37 (07/09 a 12/09/2026)',
    wbs_code: '04.02.01',
    task_name: 'Reboco Interno Gesso — Pavimento 05',
    location_name: 'Pavimento 05 — Aptos 501 a 504',
    assigned_user_id: 'usr-02',
    assigned_user_name: 'Antônio Santos (Encarregado)',
    company_type: 'TERCEIRIZADA',
    company_name: 'Gesso Master',
    quantity_planned_week: 300,
    quantity_planned_today: 95,
    quantity_executed_week: 90,
    uom: 'm²',
    is_critical: false,
    status: 'IN_PROGRESS',
    created_at: '2026-09-07T08:00:00-03:00',
    updated_at: '2026-09-08T15:00:00-03:00',
  },
];

const initialWorkforce: WorkforceSnapshot = {
  id: 'wf-snap-01',
  reporting_day_id: 'rep-day-2026-09-08',
  captured_at: '2026-09-08T07:15:00-03:00',
  total_workers: 25,
  entries: [
    { role_code: 'PED', role_name: 'Pedreiro', company_type: 'TERCEIRIZADA', company_name: 'Empreiteira Roma', count: 12 },
    { role_code: 'SRV', role_name: 'Servente de Obras', company_type: 'TERCEIRIZADA', company_name: 'Empreiteira Roma', count: 8 },
    { role_code: 'ELE', role_name: 'Eletricista Instalador', company_type: 'TERCEIRIZADA', company_name: 'Volt Engenharia', count: 3 },
    { role_code: 'ENC', role_name: 'Encarregado de Campo', company_type: 'PROPRIA', company_name: 'ConstruKore', count: 2 },
  ],
};

// Histórico de ontem para simulação do "Repetir Efetivo de Ontem"
export const yesterdayWorkforceEntries = [
  { role_code: 'PED', role_name: 'Pedreiro', company_type: 'TERCEIRIZADA', company_name: 'Empreiteira Roma', count: 14 },
  { role_code: 'SRV', role_name: 'Servente de Obras', company_type: 'TERCEIRIZADA', company_name: 'Empreiteira Roma', count: 9 },
  { role_code: 'ELE', role_name: 'Eletricista Instalador', company_type: 'TERCEIRIZADA', company_name: 'Volt Engenharia', count: 3 },
  { role_code: 'ENC', role_name: 'Encarregado de Campo', company_type: 'PROPRIA', company_name: 'ConstruKore', count: 2 },
];

const initialOccurrences: OperationalOccurrence[] = [
  {
    id: 'occ-01',
    reporting_day_id: 'rep-day-2026-09-08',
    code: 'OCORR-0184-01',
    title: 'Falta de Bloco Cerâmico 14x19x39',
    description: 'Paralisação parcial da frente de elevação no Pavimento 08 por atraso na entrega do fornecedor cerâmico.',
    category: 'material',
    severity: 'medium',
    location_name: 'Pavimento 08',
    responsible_party_name: 'Fornecedor Cerâmica Sul',
    occurred_at: '2026-09-08T14:20:00-03:00',
    immediate_impact: {
      workers_idle_count: 4,
      hours_lost: 2.5,
      activity_blocked: true,
      cost_estimate: 450.0,
    },
    approved_for_rdo: false,
    recurrence_count: 2, // 2ª ocorrência
    status: 'OPEN',
  },
];

const initialWeather: WeatherObservation[] = [
  { shift: 'MANHA', condition: 'ENSOLARADO', impact: 'SEM_IMPACTO', notes: 'Temperatura 21°C, tempo firme e seco.' },
  { shift: 'TARDE', condition: 'NUBLADO', impact: 'SEM_IMPACTO', notes: 'Pancada rápida de chuva de 10 min, sem retenção de trabalho.' },
];

const initialWeatherSummary: DayWeatherSummary = WeatherService.generateOfflineFallback(
  initialProject.nearest_inmet_station_name || 'Estação Oficial INMET A807 (Curitiba - PR)',
  initialProject.rain_contractual_threshold_mm || 5.0
);

const initialWorkflow: ApprovalWorkflow = {
  id: 'wf-rdo-poty',
  project_id: 'poty-01',
  current_step_number: 1,
  steps: [
    {
      step_number: 1,
      role_code: 'ENCARREGADO',
      role_title: '1. Apontador / Encarregado',
      approver_name: 'Antônio Santos',
      status: 'APPROVED',
      approved_at: '2026-09-08T15:45:00-03:00',
      notes: 'Todos os apontamentos de campo e horas ociosas foram lançados.',
      can_be_removed: false,
    },
    {
      step_number: 2,
      role_code: 'ENG_RESIDENTE',
      role_title: '2. Engenheiro(a) Residente',
      approver_name: 'Engª. Mariana Costa',
      status: 'IN_PROGRESS',
      notes: 'Aguardando validação das ocorrências e fechamento do dia.',
      can_be_removed: false,
    },
    {
      step_number: 3,
      role_code: 'GERENTE_OBRA',
      role_title: '3. Gerente de Produção / Obras',
      approver_name: 'Roberto Albuquerque',
      status: 'PENDING',
      can_be_removed: true,
    },
    {
      step_number: 4,
      role_code: 'FISCAL_CLIENTE',
      role_title: '4. Fiscal do Contratante / Cliente',
      approver_name: 'Dr. Fernando Linhares',
      status: 'PENDING',
      can_be_removed: true,
    },
  ],
};

const initialDailyReport: DailyReport = {
  id: 'rdo-poty-0184',
  tenant_id: 'tenant-kore-01',
  project_id: 'poty-01',
  reporting_day_id: 'rep-day-2026-09-08',
  report_number: 184,
  formatted_number: 'POTY-RDO-0184',
  report_date: '2026-09-08',
  workflow_state: 'IN_REVIEW',
  current_version_number: 1,
  responsible_engineer_name: 'Engª. Mariana Costa',
};

// Conflito inicial de fontes (Empreiteiro vs Medição Oficial)
const initialConflicts: SourceConflict[] = [
  {
    id: 'conf-01',
    reporting_day_id: 'rep-day-2026-09-08',
    task_id: 'tsk-01',
    task_name: 'Alvenaria Estrutural',
    location_name: 'Pavimento 08',
    contractor_party_name: 'Empreiteira Roma',
    contractor_value: 120, // Empreiteiro afirma ter feito 120 m²
    engineer_value: 85,    // Medição técnica aponta 85 m²
    uom: 'm²',
    variance_pct: 41.2,
    tolerance_pct: 5.0,
    status: 'PENDING', // Requer mediação do engenheiro
  },
];

// Regras de Bloqueio Padrão do Projeto
const initialBlockingRules: BlockingRulesConfig = {
  require_photo_for_critical_tasks: true, // Concretagem exige foto
  block_on_pending_occurrences: true,     // Não fecha se houver ocorrência aberta
  max_deviation_without_notes_pct: 15.0,  // Desvio > 15% exige justificativa
  require_all_workflow_signatures: true, // Todas etapas assinadas
};

// ---------------------------------------------------------------------
// SOLICITAÇÕES DE INFORMAÇÃO & COBRANÇA ATIVA (Inbound WhatsApp / n8n)
// ---------------------------------------------------------------------
export const initialInformationRequests: InformationRequest[] = [
  {
    id: 'req-01',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    schedule_task_id: 'tsk-02',
    wbs_task_name: 'Alvenaria de Vedação — Pavimento 08',
    location_name: 'Pavimento 08 — Torre A',
    requested_from_party_name: 'Empreiteira Silva & Santos',
    requested_from_user_name: 'Antônio Santos (Encarregado)',
    requested_from_phone: '+55 (41) 99888-7711',
    request_type: 'PRODUCTION_PROGRESS',
    request_text: 'Fala Antônio! Tudo certo no Pavimento 08? Como tá o avanço da elevação de alvenaria hoje e manda a foto do alinhamento pra gente liberar a medição.',
    scheduled_send_time: '11:30',
    requested_at: '2026-09-08T11:30:00-03:00',
    due_at: '2026-09-08T16:30:00-03:00',
    request_state: 'PENDING',
    escalation_level: 0,
    blocking_rule: false,
    created_at: '2026-09-08T07:30:00-03:00',
    updated_at: '2026-09-08T11:30:00-03:00',
  },
  {
    id: 'req-02',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    schedule_task_id: 'tsk-01',
    wbs_task_name: 'Concretagem de Vigas e Lajes — Laje L-09',
    location_name: 'Pavimento 09 — Laje L-09',
    requested_from_party_name: 'Estruturas Poty Mirante',
    requested_from_user_name: 'Carlos Silva (Mestre de Obras)',
    requested_from_phone: '+55 (41) 98765-4321',
    request_type: 'PHOTO_EVIDENCE',
    request_text: 'Carlos, antes de liberar a usina de concreto da Laje L-09, precisamos da foto do escoramento metálico e do laudo de abatimento (slump test).',
    scheduled_send_time: '14:00',
    requested_at: '2026-09-08T14:00:00-03:00',
    due_at: '2026-09-08T15:30:00-03:00',
    request_state: 'REMINDED',
    escalation_level: 1,
    blocking_rule: true, // Bloqueia RDO se não responder!
    created_at: '2026-09-08T08:00:00-03:00',
    updated_at: '2026-09-08T14:30:00-03:00',
  },
  {
    id: 'req-03',
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    schedule_task_id: 'tsk-03',
    wbs_task_name: 'Instalações Hidráulicas — Prumadas Pav. 04',
    location_name: 'Pavimento 04 — Torre A',
    requested_from_party_name: 'Instaladora TuboForte',
    requested_from_user_name: 'Marcos Oliveira (Encarregado)',
    requested_from_phone: '+55 (41) 99123-4567',
    request_type: 'MATERIAL_STATUS',
    request_text: 'Marcos, os tubos de PVC de 100mm chegaram da transportadora hoje de manhã para fechar as prumadas?',
    scheduled_send_time: '09:30',
    requested_at: '2026-09-08T09:30:00-03:00',
    due_at: '2026-09-08T12:00:00-03:00',
    request_state: 'ANSWERED',
    escalation_level: 0,
    blocking_rule: false,
    response_source_event_id: 'evt-02',
    response_received_at: '2026-09-08T10:15:00-03:00',
    response_raw_content: 'Chegaram sim às 10h, tudo conferido e estocado no térreo.',
    response_transcription: 'Chegaram sim às 10h, tudo conferido e estocado no térreo.',
    created_at: '2026-09-08T08:00:00-03:00',
    updated_at: '2026-09-08T10:15:00-03:00',
  },
];

// ---------------------------------------------------------------------
// CONTATOS DE CAMPO, GRUPOS WHATSAPP & LGPD (SEED)
// ---------------------------------------------------------------------
export const initialContacts: WhatsAppContact[] = [
  {
    id: 'grp-01',
    name: 'Grupo Frente de Estrutura — Torre A',
    type: 'GROUP',
    role: 'GRUPO_FRENTE',
    phone_or_jid: '1203630248291823@g.us',
    company_name: 'ConstruKore & Parceiros',
    company_type: 'PROPRIA',
    assigned_wbs_tasks: ['Concretagem de Vigas e Lajes', 'Armação de Pilares'],
    assigned_location: 'Pavimento 09 — Torre A',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-08-01T08:00:00-03:00',
    notes: 'Grupo oficial de WhatsApp da frente de estrutura pesada da Torre A.',
    created_at: '2026-08-01T08:00:00-03:00',
    updated_at: '2026-09-08T08:00:00-03:00',
  },
  {
    id: 'grp-02',
    name: 'Grupo Acabamentos & Gesso — Torres A e B',
    type: 'GROUP',
    role: 'GRUPO_FRENTE',
    phone_or_jid: '1203639482110294@g.us',
    company_name: 'Empreiteira Roma & Terceiros',
    company_type: 'TERCEIRIZADA',
    assigned_wbs_tasks: ['Alvenaria de Vedação', 'Reboco Interno Gesso'],
    assigned_location: 'Pavimentos 05 a 08',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-08-10T08:00:00-03:00',
    notes: 'Canal de alinhamento com encarregados de acabamento, gesso e alvenaria.',
    created_at: '2026-08-10T08:00:00-03:00',
    updated_at: '2026-09-08T08:00:00-03:00',
  },
  {
    id: 'cnt-01',
    name: 'Antônio Santos',
    type: 'INDIVIDUAL',
    role: 'ENCARREGADO',
    phone_or_jid: '+55 (41) 99888-7711',
    company_name: 'ConstruKore Engenharia',
    company_type: 'PROPRIA',
    assigned_wbs_tasks: ['Alvenaria Estrutural', 'Reboco Interno Gesso', 'Instalações Hidrossanitárias'],
    assigned_location: 'Torre A — Pavimentos 05 a 08',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-08-01T09:00:00-03:00',
    notes: 'Encarregado geral de campo. Responde áudios rapidamente pelo WhatsApp.',
    created_at: '2026-08-01T09:00:00-03:00',
    updated_at: '2026-09-08T09:00:00-03:00',
  },
  {
    id: 'cnt-02',
    name: 'Carlos Silva',
    type: 'INDIVIDUAL',
    role: 'MESTRE',
    phone_or_jid: '+55 (41) 99777-6622',
    company_name: 'ConstruKore Engenharia',
    company_type: 'PROPRIA',
    assigned_wbs_tasks: ['Concretagem de Vigas e Lajes', 'Logística de Canteiro'],
    assigned_location: 'Canteiro Geral e Pavimento 09',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-07-15T09:00:00-03:00',
    notes: 'Mestre de obras geral da ConstruKore responsável por todas as frentes.',
    created_at: '2026-07-15T09:00:00-03:00',
    updated_at: '2026-09-08T09:00:00-03:00',
  },
  {
    id: 'cnt-03',
    name: 'Marcos Oliveira',
    type: 'INDIVIDUAL',
    role: 'EMPREITEIRO',
    phone_or_jid: '+55 (41) 99123-4567',
    company_name: 'Instaladora TuboForte Ltda',
    company_type: 'TERCEIRIZADA',
    assigned_wbs_tasks: ['Instalações Hidráulicas — Prumadas Pav. 04'],
    assigned_location: 'Pavimento 04 — Torre A',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-08-20T10:00:00-03:00',
    notes: 'Líder da equipe terceirizada de instalações hidrossanitárias.',
    created_at: '2026-08-20T10:00:00-03:00',
    updated_at: '2026-09-08T10:00:00-03:00',
  },
  {
    id: 'cnt-04',
    name: 'Tiago Pereira',
    type: 'INDIVIDUAL',
    role: 'ENCARREGADO',
    phone_or_jid: '+55 (41) 98844-3322',
    company_name: 'Empreiteira Roma',
    company_type: 'TERCEIRIZADA',
    assigned_wbs_tasks: ['Reboco Interno Gesso', 'Alvenaria de Vedação'],
    assigned_location: 'Pavimento 05 — Aptos 501 a 504',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-08-15T10:00:00-03:00',
    notes: 'Encarregado terceirizado de acabamentos internos e gesso.',
    created_at: '2026-08-15T10:00:00-03:00',
    updated_at: '2026-09-08T10:00:00-03:00',
  },
  {
    id: 'cnt-05',
    name: 'Engª. Mariana Costa',
    type: 'INDIVIDUAL',
    role: 'ENGENHEIRO',
    phone_or_jid: '+55 (41) 99222-1100',
    company_name: 'ConstruKore Engenharia',
    company_type: 'PROPRIA',
    assigned_wbs_tasks: ['Coordenação Geral de Engenharia'],
    assigned_location: 'Escritório Técnico do Canteiro',
    is_active: true,
    lgpd_consent_status: 'ACCEPTED',
    lgpd_legal_basis: 'EXECUCAO_CONTRATO',
    lgpd_consent_date: '2026-07-01T08:00:00-03:00',
    notes: 'Engenheira residente responsável técnica pelo RDO.',
    created_at: '2026-07-01T08:00:00-03:00',
    updated_at: '2026-09-08T08:00:00-03:00',
  },
];

// ---------------------------------------------------------------------
// BIBLIOTECA DE TEMPLATES & VARIAÇÕES NATURAIS DE PERGUNTAS (n8n / BOT)
// ---------------------------------------------------------------------
export const initialQuestionTemplates: QuestionTemplate[] = [
  // 1. AVANÇO FÍSICO / PRODUÇÃO (Variações Amigáveis e Diretas)
  {
    id: 'tpl-prod-01',
    category: 'PRODUCTION_PROGRESS',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Boa tarde {nome}! Como está o andamento da {tarefa} no {local} hoje? Conseguiu fechar quantos {uom}?',
  },
  {
    id: 'tpl-prod-02',
    category: 'PRODUCTION_PROGRESS',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Fala {nome}, beleza? Me passa o resumo de produção de {tarefa} no {local} para fecharmos o diário de hoje.',
  },
  {
    id: 'tpl-prod-03',
    category: 'PRODUCTION_PROGRESS',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Olá {nome}, tudo certo? A equipe conseguiu bater a meta diária de {tarefa} no {local}? Quanto rendeu aproximadamente?',
  },
  {
    id: 'tpl-prod-04',
    category: 'PRODUCTION_PROGRESS',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Opa {nome}! A equipe avançou bem em {tarefa} ({local})? Manda um áudio rápido com a metragem aproximada fechada hoje.',
  },
  {
    id: 'tpl-prod-05',
    category: 'PRODUCTION_PROGRESS',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'E aí {nome}! Como foi o rendimento da equipe de {tarefa} hoje no {local}? Teve alguma trava ou fluiu normal?',
  },
  {
    id: 'tpl-prod-06',
    category: 'PRODUCTION_PROGRESS',
    tone: 'DIRETO',
    target_type: 'GROUP',
    template_text: 'Boa tarde pessoal da frente de {tarefa}! Como foi a produção do dia no {local}? Quem puder dar um alô com o quantitativo ({uom}) ajuda a fechar o diário.',
  },
  {
    id: 'tpl-prod-07',
    category: 'PRODUCTION_PROGRESS',
    tone: 'AMIGAVEL',
    target_type: 'GROUP',
    template_text: 'Fala time da {tarefa}! Conseguiram finalizar o trecho previsto para hoje no {local}? Mandem aqui o fechamento do turno.',
  },
  {
    id: 'tpl-prod-08',
    category: 'PRODUCTION_PROGRESS',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Mestre {nome}, como estamos de avanço em {tarefa} no {local}? Conseguiu liberar a frente toda hoje?',
  },
  {
    id: 'tpl-prod-09',
    category: 'PRODUCTION_PROGRESS',
    tone: 'URGENTE',
    target_type: 'INDIVIDUAL',
    template_text: '{nome}, fechamento de medição agora às 16:30: favor confirmar a produção de {tarefa} no {local} para inserção no RDO.',
  },
  {
    id: 'tpl-prod-10',
    category: 'PRODUCTION_PROGRESS',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Tudo bem {nome}? Pode me atualizar como ficou a etapa de {tarefa} no {local}? Obrigado!',
  },

  // 2. STATUS DE INSUMOS & MATERIAIS
  {
    id: 'tpl-mat-01',
    category: 'MATERIAL_STATUS',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Fala {nome}! Os {material} chegaram da transportadora hoje de manhã para a frente de {tarefa} no {local}?',
  },
  {
    id: 'tpl-mat-02',
    category: 'MATERIAL_STATUS',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Opa {nome}, o caminhão de {material} já descarregou no canteiro? Tudo conferido e liberado com a nota fiscal?',
  },
  {
    id: 'tpl-mat-03',
    category: 'MATERIAL_STATUS',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Olá {nome}, tudo bem? Como está o estoque de {material} aí no {local}? Vai dar para o turno de amanhã ou tá no limite?',
  },
  {
    id: 'tpl-mat-04',
    category: 'MATERIAL_STATUS',
    tone: 'URGENTE',
    target_type: 'INDIVIDUAL',
    template_text: '{nome}, confirmação urgente para Suprimentos: o lote de {material} já está no canteiro ou a equipe está com risco de paralisação?',
  },
  {
    id: 'tpl-mat-05',
    category: 'MATERIAL_STATUS',
    tone: 'DIRETO',
    target_type: 'GROUP',
    template_text: 'Pessoal do canteiro, os {material} foram descarregados na frente de {tarefa}? Favor confirmar para darmos baixa no recebimento.',
  },

  // 3. EVIDÊNCIAS FOTOGRÁFICAS / QUALIDADE
  {
    id: 'tpl-photo-01',
    category: 'PHOTO_EVIDENCE',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: '{nome}, consegue mandar uma foto da {tarefa} no {local} antes de fechar o turno para o dossiê da obra?',
  },
  {
    id: 'tpl-photo-02',
    category: 'PHOTO_EVIDENCE',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Fala {nome}! Manda uma foto aí do pano de {tarefa} no {local} pra fiscalização aprovar a medição do dia.',
  },
  {
    id: 'tpl-photo-03',
    category: 'PHOTO_EVIDENCE',
    tone: 'URGENTE',
    target_type: 'INDIVIDUAL',
    template_text: '{nome}, a fiscalização exige foto da armação e escoramento de {tarefa} no {local} antes da concretagem. Pode mandar por aqui agora?',
  },
  {
    id: 'tpl-photo-04',
    category: 'PHOTO_EVIDENCE',
    tone: 'AMIGAVEL',
    target_type: 'GROUP',
    template_text: 'Quem estiver no {local}, manda uma foto geral de como ficou a frente de {tarefa} hoje para registrarmos no relatório pericial.',
  },

  // 4. EFETIVO & CONFERÊNCIA DE EQUIPES
  {
    id: 'tpl-wf-01',
    category: 'WORKFORCE_CHECK',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: '{nome}, confirma pra gente quantos operários da {empresa} estão na ativa hoje no canteiro na frente de {tarefa}?',
  },
  {
    id: 'tpl-wf-02',
    category: 'WORKFORCE_CHECK',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Fala {nome}! Teve alguma falta na equipe de {tarefa} hoje ou veio o time completo?',
  },
  {
    id: 'tpl-wf-03',
    category: 'WORKFORCE_CHECK',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Opa {nome}, confirma pra gente o efetivo que trabalhou em {tarefa} hoje de manhã e à tarde para o fechamento do ponto.',
  },

  // 5. ATUALIZAÇÕES GERAIS / CLIMA / OCORRÊNCIAS
  {
    id: 'tpl-gen-01',
    category: 'GENERAL_UPDATE',
    tone: 'AMIGAVEL',
    target_type: 'INDIVIDUAL',
    template_text: 'Boa tarde {nome}! Teve alguma parada por chuva ou imprevisto aí no {local} no turno de hoje?',
  },
  {
    id: 'tpl-gen-02',
    category: 'GENERAL_UPDATE',
    tone: 'DIRETO',
    target_type: 'INDIVIDUAL',
    template_text: 'Fala {nome}! Tudo tranquilo no fechamento do dia? Alguma ocorrência ou alerta que a engenharia precisa apoiar?',
  },
  {
    id: 'tpl-gen-03',
    category: 'GENERAL_UPDATE',
    tone: 'AMIGAVEL',
    target_type: 'GROUP',
    template_text: 'Equipe de campo: alguma interferência externa ou paralisação hoje? Se estiver tudo 100%, só responder "ok tudo normal".',
  },
];

// ---------------------------------------------------------------------
// ESTRUTURA DE LOCAIS DA OBRA (TORRES, PAVIMENTOS, AMBIENTES) (SEED)
// ---------------------------------------------------------------------
export const initialLocationsConfig: ObraLocationsConfig = {
  torres: [
    { id: 'tor-01', codigo: 'T-A', nome: 'Torre A (Mirante)', ordem: 1 },
    { id: 'tor-02', codigo: 'T-B', nome: 'Torre B (Nascente)', ordem: 2 },
    { id: 'tor-03', codigo: 'GERAL', nome: 'Áreas Comuns & Lazer', ordem: 3 },
  ],
  pavimentos: [
    { id: 'pav-ss2', codigo: 'SS2', nome: '2º Subsolo (Garagem)', ordem: 1 },
    { id: 'pav-ss1', codigo: 'SS1', nome: '1º Subsolo (Garagem)', ordem: 2 },
    { id: 'pav-terreo', codigo: 'TERREO', nome: 'Térreo (Acesso / Pilotis)', ordem: 3 },
    { id: 'pav-01', codigo: 'PAV-01', nome: '1º Pavimento', ordem: 4 },
    { id: 'pav-02', codigo: 'PAV-02', nome: '2º Pavimento', ordem: 5 },
    { id: 'pav-03', codigo: 'PAV-03', nome: '3º Pavimento', ordem: 6 },
    { id: 'pav-04', codigo: 'PAV-04', nome: '4º Pavimento', ordem: 7 },
    { id: 'pav-08', codigo: 'PAV-08', nome: '8º Pavimento', ordem: 8 },
    { id: 'pav-09', codigo: 'PAV-09', nome: '9º Pavimento', ordem: 9 },
    { id: 'pav-12', codigo: 'PAV-12', nome: '12º Pavimento', ordem: 10 },
    { id: 'pav-15', codigo: 'PAV-15', nome: '15º Pavimento', ordem: 11 },
    { id: 'pav-atico', codigo: 'ATICO', nome: 'Ático & Barrilete', ordem: 12 },
    { id: 'pav-cob', codigo: 'COB', nome: 'Cobertura', ordem: 13 },
  ],
  ambientes: [
    { id: 'amb-101', codigo: 'AP-01', nome: 'Apartamento Final 1' },
    { id: 'amb-102', codigo: 'AP-02', nome: 'Apartamento Final 2' },
    { id: 'amb-hall', codigo: 'HALL', nome: 'Hall dos Elevadores' },
    { id: 'amb-fach-n', codigo: 'FACH-N', nome: 'Fachada Norte' },
    { id: 'amb-fach-s', codigo: 'FACH-S', nome: 'Fachada Sul' },
    { id: 'amb-garagem', codigo: 'GAR', nome: 'Garagem / Estacionamento' },
    { id: 'amb-laje', codigo: 'LAJE', nome: 'Laje Estrutural' },
    { id: 'amb-geral', codigo: 'GERAL', nome: 'Geral / Estrutura Externa' },
  ],
  atualizado_em: '2026-09-08T08:00:00-03:00',
};

// ---------------------------------------------------------------------
// CONFIGURAÇÃO DO CLOUDFLARE R2 (SEED)
// ---------------------------------------------------------------------
export const initialR2Config: R2StorageConfig = {
  accountId: '',
  bucketName: 'construkore-rdo-media',
  publicDomainUrl: 'https://media.construkore.com.br',
  uploadEndpointUrl: '',
  apiKey: '',
  enabled: false,
  autoSync: true,
};

// ---------------------------------------------------------------------
// MOTOR DE ARMAZENAMENTO LOCAL (OFFLINE FIRST)
// ---------------------------------------------------------------------
export class DiaryStorageService {
  private static loadState(): DiaryState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.weatherSummary) {
          parsed.weatherSummary = initialWeatherSummary;
        }
        if (parsed.informationRequests === undefined) {
          parsed.informationRequests = initialInformationRequests;
        }
        if (parsed.weeklyPlanTasks === undefined) {
          parsed.weeklyPlanTasks = initialWeeklyPlanTasks;
        }
        if (parsed.contacts === undefined) {
          parsed.contacts = initialContacts;
        }
        if (parsed.questionTemplates === undefined) {
          parsed.questionTemplates = initialQuestionTemplates;
        }
        if (!parsed.locationsConfig || !parsed.locationsConfig.pavimentos?.length) {
          parsed.locationsConfig = initialLocationsConfig;
        }
        if (!parsed.r2Config) {
          parsed.r2Config = initialR2Config;
        }
        return parsed;
      } catch (e) {
        console.error('Falha ao restaurar estado do RDO:', e);
      }
    }
    const defaultState: DiaryState = {
      project: initialProject,
      currentUser: sampleUsers[2], // Default: Engª. Mariana Costa
      reportingDay: initialReportingDay,
      sourceEvents: initialEvents,
      productionEntries: initialProduction,
      workforceSnapshot: initialWorkforce,
      occurrences: initialOccurrences,
      weather: initialWeather,
      weatherSummary: initialWeatherSummary,
      workflow: initialWorkflow,
      dailyReport: initialDailyReport,
      versions: [],
      generalNotes: 'Serviços transcorreram dentro do cronograma geral, com atenção à logística de reposição de blocos da Torre A.',
      conflicts: initialConflicts,
      supplyTickets: [],
      blockingRules: initialBlockingRules,
      informationRequests: initialInformationRequests,
      weeklyPlanTasks: initialWeeklyPlanTasks,
      contacts: initialContacts,
      questionTemplates: initialQuestionTemplates,
      locationsConfig: initialLocationsConfig,
      r2Config: initialR2Config,
    };
    this.saveState(defaultState);
    return defaultState;
  }

  private static getArchiveStorageKey(projectId?: string): string {
    if (!projectId || projectId === 'poty-01' || projectId === '6914a7fa72e41c32af003614') {
      return ARCHIVE_STORAGE_KEY;
    }
    return `construkore_diary_archive_${projectId}`;
  }

  private static loadArchive(projectId?: string): Record<string, DiaryState> {
    const isPoty = !projectId || projectId === 'poty-01' || projectId === '6914a7fa72e41c32af003614';
    const storageKey = this.getArchiveStorageKey(projectId);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.error('Falha ao restaurar arquivo de múltiplos dias do RDO:', e);
      }
    }

    // Se for outra obra e ainda não houver diários locais gravados, retorna vazio (sem seed do Poty!)
    if (!isPoty) {
      return {};
    }

    // Seed inicial de múltiplos dias para demonstração e navegação pericial (Apenas Obra Poty)
    const baseCurrent = this.loadState();
    const currentDate = baseCurrent.reportingDay.report_date;

    // 1. Dia anterior já emitido e congelado (05/09/2026 - Sexta-feira)
    const issuedReportDay: ReportingDay = {
      id: 'rep-day-2026-09-05',
      tenant_id: baseCurrent.project.id,
      project_id: baseCurrent.project.id,
      report_date: '2026-09-05',
      shift_name: 'Turno Integral (07:00 às 17:00)',
      workflow_state: 'CLOSED',
      responsible_user_id: 'usr-03',
      responsible_user_name: 'Engª. Mariana Costa',
      completion_percentage: 100,
      data_quality_score: 98,
      opened_at: '2026-09-05T07:00:00-03:00',
      status: 'active',
      created_at: '2026-09-05T07:00:00-03:00',
      updated_at: '2026-09-05T17:30:00-03:00',
    };

    const issuedDailyReport: DailyReport = {
      id: 'rdo-poty-0183',
      tenant_id: baseCurrent.project.id,
      project_id: baseCurrent.project.id,
      reporting_day_id: issuedReportDay.id,
      report_number: 183,
      formatted_number: 'POTY-RDO-0183',
      report_date: '2026-09-05',
      workflow_state: 'ISSUED',
      current_version_number: 1,
      responsible_engineer_name: 'Engª. Mariana Costa',
      issued_at: '2026-09-05T17:30:00-03:00',
    };

    const issuedState: DiaryState = {
      ...JSON.parse(JSON.stringify(baseCurrent)),
      reportingDay: issuedReportDay,
      dailyReport: issuedDailyReport,
      workflow: {
        ...baseCurrent.workflow,
        current_step_number: 4,
        steps: baseCurrent.workflow.steps.map((s) => ({
          ...s,
          status: 'APPROVED' as const,
          approved_at: '2026-09-05T17:15:00-03:00',
          signature_hash: 'sig-sha256-approved-step',
        })),
      },
      versions: [
        {
          id: 'ver-rdo-0183-v1',
          daily_report_id: issuedDailyReport.id,
          version_number: 1,
          document_hash: '3f8e4b7c9a1d2e5f6a0b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f',
          created_by: 'Engª. Mariana Costa',
          created_at: '2026-09-05T17:30:00-03:00',
          snapshot_json: {
            report_id: issuedDailyReport.id,
            report_number: issuedDailyReport.formatted_number,
            report_date: '2026-09-05',
            project: baseCurrent.project,
            responsible_engineer: 'Engª. Mariana Costa',
            issued_at: '2026-09-05T17:30:00-03:00',
            weather: baseCurrent.weather,
            weather_summary: baseCurrent.weatherSummary,
            workforce: baseCurrent.workforceSnapshot,
            production: baseCurrent.productionEntries,
            occurrences: baseCurrent.occurrences,
            conflicts: [],
            supply_tickets: [],
            photo_evidences: [],
            workflow_signatures: baseCurrent.workflow.steps,
            general_notes: 'Serviços de concretagem e forma concluídos com aprovação.',
          },
        },
      ],
      conflicts: [],
    };

    // 2. Dia posterior em rascunho (09/09/2026 - Terça-feira)
    const draftTuesdayDay: ReportingDay = {
      id: 'rep-day-2026-09-09',
      tenant_id: baseCurrent.project.id,
      project_id: baseCurrent.project.id,
      report_date: '2026-09-09',
      shift_name: 'Turno Integral (07:00 às 17:00)',
      workflow_state: 'OPEN',
      responsible_user_id: 'usr-03',
      responsible_user_name: 'Engª. Mariana Costa',
      completion_percentage: 45,
      data_quality_score: 85,
      opened_at: '2026-09-09T07:00:00-03:00',
      status: 'active',
      created_at: '2026-09-09T07:00:00-03:00',
      updated_at: '2026-09-09T14:30:00-03:00',
    };

    const draftTuesdayReport: DailyReport = {
      id: 'rdo-poty-0185',
      tenant_id: baseCurrent.project.id,
      project_id: baseCurrent.project.id,
      reporting_day_id: draftTuesdayDay.id,
      report_number: 185,
      formatted_number: 'POTY-RDO-0185',
      report_date: '2026-09-09',
      workflow_state: 'DRAFT',
      current_version_number: 1,
      responsible_engineer_name: 'Engª. Mariana Costa',
    };

    const draftTuesdayState: DiaryState = {
      ...JSON.parse(JSON.stringify(baseCurrent)),
      reportingDay: draftTuesdayDay,
      dailyReport: draftTuesdayReport,
      workflow: {
        ...baseCurrent.workflow,
        current_step_number: 1,
        steps: baseCurrent.workflow.steps.map((s) => ({
          ...s,
          status: s.step_number === 1 ? ('IN_PROGRESS' as const) : ('PENDING' as const),
          approved_at: undefined,
          signature_hash: undefined,
        })),
      },
      versions: [],
    };

    const initialArchive: Record<string, DiaryState> = {
      '2026-09-05': issuedState,
      [currentDate]: baseCurrent,
      '2026-09-09': draftTuesdayState,
    };

    this.saveArchive(initialArchive, projectId);
    return initialArchive;
  }

  private static saveArchive(archive: Record<string, DiaryState>, projectId?: string): void {
    try {
      const storageKey = this.getArchiveStorageKey(projectId);
      localStorage.setItem(storageKey, JSON.stringify(archive));
    } catch (e) {
      console.warn('[DiaryStorageService] Falha ao persistir arquivo de dias:', e);
    }
  }

  public static saveState(state: DiaryState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Sincroniza automaticamente a data salva no arquivo específico da obra
    if (state.reportingDay?.report_date && state.project?.id) {
      const storageKey = this.getArchiveStorageKey(state.project.id);
      const raw = localStorage.getItem(storageKey);
      let archive: Record<string, DiaryState> = {};
      if (raw) {
        try {
          archive = JSON.parse(raw) || {};
        } catch {}
      }
      archive[state.reportingDay.report_date] = state;
      try {
        localStorage.setItem(storageKey, JSON.stringify(archive));
      } catch (e) {
        console.warn('[DiaryStorageService] Falha ao sincronizar dia ativo no arquivo da obra:', e);
      }
    }
  }

  public static getState(): DiaryState {
    return this.loadState();
  }

  /**
   * Lista o resumo de todos os dias registrados no arquivo com métricas e status
   */
  /**
   * Lista o resumo de todos os dias registrados no arquivo com métricas e status para a obra informada
   */
  public static listDailyReportsSummaries(projectId?: string): DailyReportSummaryItem[] {
    const currentState = this.loadState();
    const targetProjectId = projectId || currentState.project?.id;
    const archive = this.loadArchive(targetProjectId);
    const currentDate = currentState.reportingDay.report_date;

    // Se o estado ativo atual pertencer a esta mesma obra, garante que esteja atualizado no arquivo
    if (currentState.project?.id === targetProjectId) {
      archive[currentDate] = currentState;
    }

    const dates = Object.keys(archive).sort((a, b) => b.localeCompare(a));

    return dates.map((date) => {
      const dayState = archive[date];
      const isCurrent = date === currentDate && currentState.project?.id === targetProjectId;
      const report = dayState.dailyReport;
      const totalWorkers = dayState.workforceSnapshot?.total_workers || 0;
      const planned = dayState.productionEntries?.reduce((acc, curr) => acc + curr.quantity_planned, 0) || 0;
      const reported = dayState.productionEntries?.reduce((acc, curr) => acc + curr.quantity_reported, 0) || 0;
      const progressPct = planned > 0 ? Math.round((reported / planned) * 100) : 0;
      const photosCount = dayState.sourceEvents?.filter((e) => e.media_url).length || 0;
      const occurrencesCount = dayState.occurrences?.length || 0;
      const conflictsCount = dayState.conflicts?.filter((c) => c.status === 'PENDING').length || 0;

      // Formatação amigável de data e dia da semana
      const parts = date.split('-');
      let formattedDate = date;
      let weekday = 'Dia Útil';
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
        weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      }

      const weatherCond = dayState.weatherSummary?.shifts?.[0]?.condition || 'BOM_TEMPO';
      const isRain = dayState.weatherSummary?.is_contractual_rain_day || false;

      const hasBlocking =
        conflictsCount > 0 || dayState.occurrences?.some((o) => !o.approved_for_rdo);

      return {
        date,
        formatted_date: formattedDate,
        weekday,
        report_id: report.id,
        report_number: report.report_number,
        formatted_number: report.formatted_number,
        workflow_state: report.workflow_state,
        total_workers: totalWorkers,
        production_progress_pct: Math.min(100, progressPct),
        photos_count: photosCount,
        occurrences_count: occurrencesCount,
        conflicts_count: conflictsCount,
        weather_condition: weatherCond,
        is_contractual_rain_day: isRain,
        responsible_engineer_name: report.responsible_engineer_name,
        has_blocking_issues: Boolean(hasBlocking),
        document_hash: dayState.versions?.[dayState.versions.length - 1]?.document_hash,
        is_current_active: isCurrent,
      };
    });
  }

  /**
   * Salva um dia específico no arquivo persistente da respectiva obra
   */
  public static saveDayToArchive(targetState: DiaryState, projectId?: string): void {
    const targetProjectId = projectId || targetState.project?.id;
    const archive = this.loadArchive(targetProjectId);
    archive[targetState.reportingDay.report_date] = targetState;
    this.saveArchive(archive, targetProjectId);
  }

  /**
   * Alterna a obra ativa da aplicação de forma isolada, sem herdar dados de outras obras
   */
  public static switchProject(newProject: ProjectContext): DiaryState {
    const currentState = this.loadState();
    if (currentState.project?.id === newProject.id) {
      return currentState;
    }

    // 1. Salva o dia atual da obra anterior no arquivo da obra anterior
    this.saveDayToArchive(currentState, currentState.project?.id);

    // 2. Tenta carregar o arquivo ou estado já existente para a nova obra
    const projectArchive = this.loadArchive(newProject.id);
    const dates = Object.keys(projectArchive).sort((a, b) => b.localeCompare(a));
    if (dates.length > 0) {
      const targetState = projectArchive[dates[0]];
      targetState.project = newProject;
      this.saveState(targetState);
      return targetState;
    }

    // 3. Caso não haja diários salvos localmente para a nova obra, instancia um novo estado base LIMPO para ela
    const todayStr = new Date().toISOString().split('T')[0];
    const cleanReportingDay: ReportingDay = {
      id: `rep-day-${newProject.codigo.toLowerCase()}-${todayStr}`,
      tenant_id: newProject.id,
      project_id: newProject.id,
      report_date: todayStr,
      shift_name: 'Turno Integral (07:00 às 17:00)',
      workflow_state: 'OPEN',
      responsible_user_id: currentState.currentUser?.id || 'usr-03',
      responsible_user_name: currentState.currentUser?.name || 'Engenharia Residente',
      completion_percentage: 0,
      data_quality_score: 100,
      opened_at: `${todayStr}T07:00:00-03:00`,
      status: 'active',
      created_at: `${todayStr}T07:00:00-03:00`,
      updated_at: `${todayStr}T07:00:00-03:00`,
    };

    const cleanDailyReport: DailyReport = {
      id: `rdo-${newProject.codigo.toLowerCase()}-0001`,
      tenant_id: newProject.id,
      project_id: newProject.id,
      reporting_day_id: cleanReportingDay.id,
      report_number: 1,
      formatted_number: `${newProject.codigo}-RDO-0001`,
      report_date: todayStr,
      workflow_state: 'DRAFT',
      current_version_number: 1,
      responsible_engineer_name: currentState.currentUser?.name || 'Engenharia Residente',
    };

    const nextState: DiaryState = {
      ...JSON.parse(JSON.stringify(currentState)),
      project: newProject,
      reportingDay: cleanReportingDay,
      dailyReport: cleanDailyReport,
      workforceSnapshot: {
        id: `wf-${newProject.id}-${todayStr}`,
        reporting_day_id: cleanReportingDay.id,
        captured_at: `${todayStr}T07:15:00-03:00`,
        total_workers: 0,
        entries: [],
        copied_from_yesterday: false,
      },
      sourceEvents: [],
      productionEntries: [],
      occurrences: [],
      conflicts: [],
      supplyTickets: [],
      versions: [],
      generalNotes: '',
    };

    this.saveState(nextState);
    return nextState;
  }

  /**
   * Alterna o dia ativo da aplicação para uma data retroativa ou futura da obra atual
   */
  public static switchReportingDay(targetDate: string, projectId?: string): DiaryState {
    const currentState = this.loadState();
    const targetProjectId = projectId || currentState.project?.id;
    const currentDate = currentState.reportingDay.report_date;

    // Se já estiver na mesma data, não faz nada
    if (targetDate === currentDate) {
      return currentState;
    }

    const archive = this.loadArchive(targetProjectId);
    // 1. Salva o dia atual no arquivo
    archive[currentDate] = currentState;

    // 2. Se o dia de destino já existe, carrega e ativa
    if (archive[targetDate]) {
      const targetState = archive[targetDate];
      this.saveArchive(archive, targetProjectId);
      this.saveState(targetState);
      return targetState;
    }

    // 3. Se não existe, cria novo diário para aquela data
    this.saveArchive(archive, targetProjectId);
    return this.createNewReportingDay({ targetDate, copyYesterdayWorkforce: true, projectId: targetProjectId });
  }

  /**
   * Cria um novo Diário de Obra para uma data selecionada na obra ativa
   */
  public static createNewReportingDay(params: {
    targetDate: string;
    copyYesterdayWorkforce?: boolean;
    projectId?: string;
  }): DiaryState {
    const { targetDate, copyYesterdayWorkforce = true, projectId } = params;
    const currentState = this.loadState();
    const targetProjectId = projectId || currentState.project?.id;
    const archive = this.loadArchive(targetProjectId);

    // Salva o dia atual no arquivo
    archive[currentState.reportingDay.report_date] = currentState;

    // Calcula próximo número de relatório sequencial da obra
    const existingNumbers = Object.values(archive).map((s) => s.dailyReport?.report_number || 0);
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const formattedNumber = `${currentState.project.codigo}-RDO-${String(nextNumber).padStart(4, '0')}`;

    const newReportingDay: ReportingDay = {
      id: `rep-day-${targetDate}`,
      tenant_id: currentState.project.id,
      project_id: currentState.project.id,
      report_date: targetDate,
      shift_name: 'Turno Integral (07:00 às 17:00)',
      workflow_state: 'OPEN',
      responsible_user_id: currentState.currentUser.id,
      responsible_user_name: currentState.currentUser.name,
      completion_percentage: 0,
      data_quality_score: 90,
      opened_at: `${targetDate}T07:00:00-03:00`,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newDailyReport: DailyReport = {
      id: `rdo-${currentState.project.codigo.toLowerCase()}-${String(nextNumber).padStart(4, '0')}`,
      tenant_id: currentState.project.id,
      project_id: currentState.project.id,
      reporting_day_id: newReportingDay.id,
      report_number: nextNumber,
      formatted_number: formattedNumber,
      report_date: targetDate,
      workflow_state: 'DRAFT',
      current_version_number: 1,
      responsible_engineer_name: currentState.dailyReport.responsible_engineer_name,
    };

    // Copia efetivo da obra
    const workforceEntries = copyYesterdayWorkforce
      ? JSON.parse(JSON.stringify(currentState.workforceSnapshot.entries))
      : JSON.parse(JSON.stringify(initialWorkforce.entries));
    const totalWorkers = workforceEntries.reduce((acc: number, c: WorkforceRoleCount) => acc + c.count, 0);

    const newWorkforce: WorkforceSnapshot = {
      id: `wf-snap-${Date.now()}`,
      reporting_day_id: newReportingDay.id,
      captured_at: `${targetDate}T07:15:00-03:00`,
      total_workers: totalWorkers,
      entries: workforceEntries,
      copied_from_yesterday: copyYesterdayWorkforce,
    };

    // Preenche as frentes de produção previstas a partir do planejamento de curto prazo
    const productionEntries: ProductionEntry[] = (currentState.weeklyPlanTasks || []).map((wpt, idx) => ({
      id: `prod-${targetDate}-${idx + 1}`,
      reporting_day_id: newReportingDay.id,
      task_id: wpt.id,
      task_name: wpt.task_name,
      wbs_code: wpt.wbs_code,
      wbs_task_name: wpt.task_name,
      location_name: wpt.location_name,
      quantity_planned: wpt.quantity_planned_today,
      quantity_reported: 0,
      uom: wpt.uom,
      progress_pct: 0,
      confirmation_state: 'pending',
      is_critical: wpt.is_critical,
      assigned_user_id: wpt.assigned_user_id,
      assigned_user_name: wpt.assigned_user_name,
      weekly_plan_task_id: wpt.id,
      weekly_goal: wpt.quantity_planned_week,
    }));

    // Workflow zerado para novas aprovações
    const newWorkflow: ApprovalWorkflow = {
      id: `wf-${targetDate}`,
      project_id: currentState.project.id,
      current_step_number: 1,
      steps: initialWorkflow.steps.map((st) => ({
        ...st,
        status: st.step_number === 1 ? ('IN_PROGRESS' as const) : ('PENDING' as const),
        approved_at: undefined,
        signature_hash: undefined,
      })),
    };

    const newState: DiaryState = {
      project: currentState.project,
      currentUser: currentState.currentUser,
      reportingDay: newReportingDay,
      sourceEvents: [],
      productionEntries,
      workforceSnapshot: newWorkforce,
      occurrences: [],
      weather: initialWeather,
      weatherSummary: initialWeatherSummary,
      workflow: newWorkflow,
      dailyReport: newDailyReport,
      versions: [],
      generalNotes: '',
      conflicts: [],
      supplyTickets: [],
      blockingRules: currentState.blockingRules,
      informationRequests: [],
      weeklyPlanTasks: currentState.weeklyPlanTasks,
      contacts: currentState.contacts,
      questionTemplates: currentState.questionTemplates,
      locationsConfig: currentState.locationsConfig,
      r2Config: currentState.r2Config,
    };

    archive[targetDate] = newState;
    this.saveArchive(archive, targetProjectId);
    this.saveState(newState);
    return newState;
  }

  /**
   * Exclui um rascunho de data anterior que ainda não foi emitido
   */
  public static deleteReportingDayDraft(targetDate: string, projectId?: string): DiaryState {
    const currentState = this.loadState();
    const targetProjectId = projectId || currentState.project?.id;
    const archive = this.loadArchive(targetProjectId);
    const dayState = archive[targetDate];
    if (!dayState) return currentState;

    if (dayState.dailyReport.workflow_state === 'ISSUED') {
      throw new Error('Não é permitido excluir um Diário de Obra já emitido e congelado pericialmente.');
    }

    delete archive[targetDate];
    this.saveArchive(archive, targetProjectId);

    if (currentState.reportingDay.report_date === targetDate) {
      const remainingDates = Object.keys(archive).sort((b, a) => a.localeCompare(b));
      const nextDate = remainingDates[0];
      if (nextDate && archive[nextDate]) {
        this.saveState(archive[nextDate]);
        return archive[nextDate];
      }
    }
    return currentState;
  }

  public static setCurrentUser(user: UserContext): DiaryState {
    const state = this.loadState();
    state.currentUser = user;
    this.saveState(state);
    return state;
  }

  // Copiar Efetivo de Ontem (Fase 2)
  public static copyYesterdayWorkforce(): DiaryState {
    const state = this.loadState();
    state.workforceSnapshot.entries = JSON.parse(JSON.stringify(yesterdayWorkforceEntries));
    state.workforceSnapshot.total_workers = state.workforceSnapshot.entries.reduce((acc, curr) => acc + curr.count, 0);
    state.workforceSnapshot.copied_from_yesterday = true;

    // Registra o evento na timeline
    state.sourceEvents.unshift({
      id: `evt-${Date.now()}`,
      tenant_id: state.reportingDay.tenant_id,
      project_id: state.project.id,
      reporting_day_id: state.reportingDay.id,
      source_type: 'WORKFORCE_COUNT',
      occurred_at: new Date().toISOString(),
      recorded_at: new Date().toISOString(),
      author_id: state.currentUser.id,
      author_name: state.currentUser.name,
      author_role: state.currentUser.role,
      raw_text: `Efetivo copiado do dia anterior com sucesso (${state.workforceSnapshot.total_workers} operários). Ajustes finos aplicados pelo encarregado.`,
      review_state: 'confirmed',
      confidence: 1.0,
      status: 'active',
      created_at: new Date().toISOString(),
    });

    this.saveState(state);
    return state;
  }

  // Adicionar Evento de Entrada Rápido
  public static addSourceEvent(params: {
    source_type: SourceEvent['source_type'];
    raw_text: string;
    location_name?: string;
    wbs_task_name?: string;
    media_url?: string;
    audio_duration_seconds?: number;
    audio_blob_url?: string;
  }): { state: DiaryState; event: SourceEvent } {
    const state = this.loadState();
    const now = new Date().toISOString();
    const newEvent: SourceEvent = {
      id: `evt-${Date.now()}`,
      tenant_id: state.reportingDay.tenant_id,
      project_id: state.project.id,
      reporting_day_id: state.reportingDay.id,
      source_type: params.source_type,
      occurred_at: now,
      recorded_at: now,
      author_id: state.currentUser.id,
      author_name: state.currentUser.name,
      author_role: state.currentUser.role,
      raw_text: params.raw_text,
      location_name: params.location_name,
      wbs_task_name: params.wbs_task_name,
      media_url: params.media_url,
      audio_duration_seconds: params.audio_duration_seconds,
      audio_blob_url: params.audio_blob_url,
      review_state: 'pending_review',
      confidence: 1.0,
      status: 'active',
      created_at: now,
    };
    state.sourceEvents.unshift(newEvent);
    this.saveState(state);
    return { state, event: newEvent };
  }

  // Apontamento de Falta de Material com Verificação da 3ª Reincidência (Fase 3)
  public static addMaterialShortage(params: {
    material_name: string;
    location_name: string;
    wbs_task_name: string;
    workers_idle: number;
    hours_lost: number;
    notes: string;
  }): DiaryState {
    const state = this.loadState();
    const now = new Date().toISOString();

    // 1. Conta quantas vezes esse insumo já faltou
    const previousShortages = state.occurrences.filter(
      (o) => o.category === 'material' && o.title.toLowerCase().includes(params.material_name.toLowerCase())
    );
    const newRecurrenceCount = previousShortages.length + 1;

    // 2. Cria Source Event
    const sourceEvtId = `evt-${Date.now()}`;
    const sourceEvent: SourceEvent = {
      id: sourceEvtId,
      tenant_id: state.reportingDay.tenant_id,
      project_id: state.project.id,
      reporting_day_id: state.reportingDay.id,
      source_type: 'MATERIAL_SHORTAGE',
      occurred_at: now,
      recorded_at: now,
      author_id: state.currentUser.id,
      author_name: state.currentUser.name,
      author_role: state.currentUser.role,
      raw_text: `FALTA DE MATERIAL (${newRecurrenceCount}ª ocorrência): ${params.material_name} no ${params.location_name}. ${params.workers_idle} operários paralisados por ${params.hours_lost}h. ${params.notes}`,
      location_name: params.location_name,
      wbs_task_name: params.wbs_task_name,
      review_state: 'pending_review',
      confidence: 1.0,
      status: 'active',
      created_at: now,
    };
    state.sourceEvents.unshift(sourceEvent);

    // 3. Cria Ocorrência com Impacto Imediato
    const occCode = `OCORR-0184-0${state.occurrences.length + 1}`;
    const costEstimate = params.workers_idle * params.hours_lost * 45.0; // R$ 45/h/homem estimado

    const newOccurrence: OperationalOccurrence = {
      id: `occ-${Date.now()}`,
      reporting_day_id: state.reportingDay.id,
      code: occCode,
      title: `Falta de ${params.material_name}`,
      description: params.notes || `Insumo ${params.material_name} em falta durante execução da tarefa ${params.wbs_task_name}.`,
      category: 'material',
      severity: newRecurrenceCount >= 3 ? 'critical' : params.workers_idle >= 4 ? 'high' : 'medium',
      location_name: params.location_name,
      occurred_at: now,
      immediate_impact: {
        workers_idle_count: params.workers_idle,
        hours_lost: params.hours_lost,
        activity_blocked: true,
        cost_estimate: costEstimate,
      },
      approved_for_rdo: false, // Espera aprovação da engenharia
      status: 'OPEN',
      recurrence_count: newRecurrenceCount,
    };
    state.occurrences.unshift(newOccurrence);

    // 4. Se for a 3ª VEZ, GERA O CHAMADO PRIORITÁRIO PARA SUPRIMENTOS (Regra solicitada pelo usuário)
    if (newRecurrenceCount >= 3) {
      // Agrupa perdas acumuladas
      const totalWorkersIdle =
        previousShortages.reduce((acc, curr) => acc + (curr.immediate_impact?.workers_idle_count || 0), 0) +
        params.workers_idle;
      const totalHoursLost =
        previousShortages.reduce((acc, curr) => acc + (curr.immediate_impact?.hours_lost || 0), 0) +
        params.hours_lost;
      const totalCost =
        previousShortages.reduce((acc, curr) => acc + (curr.immediate_impact?.cost_estimate || 0), 0) +
        costEstimate;

      const ticket: SupplyEscalationTicket = {
        id: `ticket-${Date.now()}`,
        ticket_code: `SUP-ALERT-0184-${state.supplyTickets.length + 1}`,
        material_name: params.material_name,
        recurrence_count: newRecurrenceCount,
        occurrence_ids: [...previousShortages.map((p) => p.id), newOccurrence.id],
        total_workers_idle: totalWorkersIdle,
        total_hours_lost: totalHoursLost,
        total_cost_estimate: totalCost,
        status: 'OPEN',
        created_at: now,
      };
      state.supplyTickets.unshift(ticket);
    }

    this.saveState(state);
    return state;
  }

  // Despachar Chamado de Auditoria para Suprimentos & Compras (Fase 3)
  public static dispatchSupplyTicket(ticketId: string, notes?: string): DiaryState {
    const state = this.loadState();
    const ticket = state.supplyTickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = 'DISPATCHED_TO_SUPRIMENTOS';
      ticket.dispatched_at = new Date().toISOString();
      ticket.dispatch_notes = notes || 'Alerta automático emitido por 3 faltas consecutivas do mesmo insumo na obra.';
      ticket.dispatched_by = state.currentUser.name;

      // Gera evento formal de integração
      state.sourceEvents.unshift({
        id: `evt-${Date.now()}`,
        tenant_id: state.reportingDay.tenant_id,
        project_id: state.project.id,
        reporting_day_id: state.reportingDay.id,
        source_type: 'OCCURRENCE_LOG',
        occurred_at: new Date().toISOString(),
        recorded_at: new Date().toISOString(),
        author_id: state.currentUser.id,
        author_name: state.currentUser.name,
        author_role: state.currentUser.role,
        raw_text: `INTEGRAÇÃO SUPRIMENTOS: Chamado ${ticket.ticket_code} despachado formalmente para o setor de compras. Prejuízo acumulado de ${ticket.total_hours_lost}h ociosas.`,
        review_state: 'confirmed',
        confidence: 1.0,
        status: 'active',
        created_at: new Date().toISOString(),
      });
    }
    this.saveState(state);
    return state;
  }

  // Conciliação de Conflito de Fontes (Empreiteiro vs Medição Engenharia — Fase 3)
  public static resolveSourceConflict(conflictId: string, resolvedValue: number, rationale: string): DiaryState {
    const state = this.loadState();
    const conflict = state.conflicts.find((c) => c.id === conflictId);
    if (conflict) {
      conflict.status = 'RESOLVED';
      conflict.resolved_value = resolvedValue;
      conflict.resolved_by = state.currentUser.name;
      conflict.resolution_rationale = rationale;
      conflict.resolved_at = new Date().toISOString();

      // Atualiza a produção oficial com o valor homologado
      const prod = state.productionEntries.find((p) => p.task_id === conflict.task_id);
      if (prod) {
        prod.quantity_reported = resolvedValue;
        prod.progress_pct = Math.min(100, Math.round((resolvedValue / prod.quantity_planned) * 100));
        prod.confirmation_state = 'confirmed';
        prod.notes = `Homologado via conciliação técnica com ${conflict.contractor_party_name}. Parecer: ${rationale}`;
      }

      // Adiciona na timeline de auditoria
      state.sourceEvents.unshift({
        id: `evt-${Date.now()}`,
        tenant_id: state.reportingDay.tenant_id,
        project_id: state.project.id,
        reporting_day_id: state.reportingDay.id,
        source_type: 'SOURCE_CONFLICT',
        occurred_at: new Date().toISOString(),
        recorded_at: new Date().toISOString(),
        author_id: state.currentUser.id,
        author_name: state.currentUser.name,
        author_role: state.currentUser.role,
        raw_text: `CONCILIAÇÃO TÉCNICA: Divergência na tarefa ${conflict.task_name} resolvida para ${resolvedValue} ${conflict.uom} (Empreiteiro apontou ${conflict.contractor_value}, Medição foi ${conflict.engineer_value}). Motivo: ${rationale}`,
        location_name: conflict.location_name,
        wbs_task_name: conflict.task_name,
        review_state: 'confirmed',
        confidence: 1.0,
        status: 'active',
        created_at: new Date().toISOString(),
      });
    }
    this.saveState(state);
    return state;
  }

  // Sincronizar Clima da API Open-Meteo (Opção 1)
  public static async syncWeatherFromApi(): Promise<DiaryState> {
    const state = this.loadState();
    const summary = await WeatherService.fetchDayWeather(
      state.project,
      state.reportingDay.report_date
    );

    // Preserva overrides manuais anteriores se houver
    const mergedShifts = summary.shifts.map((newShift) => {
      const existing = state.weatherSummary?.shifts?.find((s) => s.shift === newShift.shift);
      if (existing && existing.is_overridden) {
        return {
          ...existing,
          original_api_precipitation_mm: newShift.precipitation_mm,
          original_api_condition: newShift.condition,
        };
      }
      return newShift;
    });

    const totalPrecip = Math.round(mergedShifts.reduce((acc, s) => acc + s.precipitation_mm, 0) * 10) / 10;
    const isContractualRain = totalPrecip >= (state.project.rain_contractual_threshold_mm || 5.0);

    state.weatherSummary = {
      ...summary,
      total_precipitation_day_mm: totalPrecip,
      is_contractual_rain_day: isContractualRain,
      shifts: mergedShifts,
    };

    // Sincroniza o array legado `weather` para manter relatórios e views compatíveis
    this.syncLegacyWeatherArray(state);

    this.saveState(state);
    return state;
  }

  // Ajuste Pericial de Clima / Override Humano (Opção 1)
  public static overrideWeatherShift(
    shift: 'MANHA' | 'TARDE' | 'NOITE',
    params: {
      condition: any;
      workability: any;
      precipitation_mm: number;
      hours_lost_to_weather: number;
      override_reason: string;
      evidence_photo_url?: string;
      affected_trades?: string[];
      notes?: string;
    }
  ): DiaryState {
    const state = this.loadState();
    if (!state.weatherSummary) {
      state.weatherSummary = WeatherService.generateOfflineFallback(
        state.project.nearest_inmet_station_name || 'Estação Oficial INMET A807 (Curitiba - PR)',
        state.project.rain_contractual_threshold_mm || 5.0
      );
    }

    const shifts = [...state.weatherSummary.shifts];
    const index = shifts.findIndex((s) => s.shift === shift);

    if (index !== -1) {
      const current = shifts[index];
      shifts[index] = {
        ...current,
        condition: params.condition,
        workability: params.workability,
        precipitation_mm: params.precipitation_mm,
        hours_lost_to_weather: params.hours_lost_to_weather,
        override_reason: params.override_reason,
        overridden_by_name: state.currentUser.name,
        is_overridden: true,
        evidence_photo_url: params.evidence_photo_url || current.evidence_photo_url,
        affected_trades: params.affected_trades || current.affected_trades,
        notes: params.notes || current.notes,
        original_api_precipitation_mm: current.original_api_precipitation_mm ?? current.precipitation_mm,
        original_api_condition: current.original_api_condition ?? current.condition,
      };
    }

    const totalPrecip = Math.round(shifts.reduce((acc, s) => acc + s.precipitation_mm, 0) * 10) / 10;
    const isContractualRain = totalPrecip >= (state.project.rain_contractual_threshold_mm || 5.0);

    state.weatherSummary = {
      ...state.weatherSummary,
      total_precipitation_day_mm: totalPrecip,
      is_contractual_rain_day: isContractualRain,
      shifts,
    };

    this.syncLegacyWeatherArray(state);
    this.saveState(state);
    return state;
  }

  private static syncLegacyWeatherArray(state: DiaryState): void {
    if (!state.weatherSummary) return;
    state.weather = state.weatherSummary.shifts.map((s) => ({
      shift: s.shift,
      condition: s.condition,
      impact:
        s.workability === 'IMPRATICAVEL'
          ? 'PARALISACAO_TOTAL'
          : s.workability === 'PARCIALMENTE_PRATICAVEL'
          ? 'PARALISACAO_PARCIAL'
          : 'SEM_IMPACTO',
      notes: `${s.precipitation_mm}mm chuva • Vento: ${s.wind_speed_max_kmh}km/h • ${
        s.is_overridden ? `[Ajuste por ${s.overridden_by_name}: ${s.override_reason}]` : s.notes || ''
      }`.trim(),
      precipitation_mm: s.precipitation_mm,
      temperature_c: s.temperature_avg_c,
      workability: s.workability,
    }));
  }

  // Validação Determinística de Regras de Bloqueio no Fechamento (Fase 4 + Opção 1)
  public static validateRdoClosure(): BlockingValidationResult {
    const state = this.loadState();
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // Regra 1: Atividade crítica sem foto (ex: Concretagem)
    if (state.blockingRules.require_photo_for_critical_tasks) {
      const hasCriticalTask = state.productionEntries.some((p) => p.is_critical);
      const hasPhotos = state.sourceEvents.some((e) => e.media_url);
      if (hasCriticalTask && !hasPhotos) {
        blockingIssues.push('Atividade crítica (Concretagem de Vigas) foi executada sem nenhuma evidência fotográfica anexada.');
      }
    }

    // Regra 2: Ocorrências ou faltas de material pendentes de aprovação técnica
    if (state.blockingRules.block_on_pending_occurrences) {
      const pendingOccs = state.occurrences.filter((o) => !o.approved_for_rdo && o.status === 'OPEN');
      if (pendingOccs.length > 0) {
        blockingIssues.push(`Existem ${pendingOccs.length} ocorrência(s) ou falta(s) de material aguardando validação técnica na Caixa de Entrada.`);
      }
    }

    // Regra 3: Conflito de fontes não resolvido
    const pendingConflicts = state.conflicts.filter((c) => c.status === 'PENDING');
    if (pendingConflicts.length > 0) {
      blockingIssues.push(`Existe divergência não conciliada com empreiteiro na tarefa "${pendingConflicts[0].task_name}".`);
    }

    // Regra 4: Desvios críticos sem justificativa
    state.productionEntries.forEach((p) => {
      const deviation = Math.abs(p.quantity_planned - p.quantity_reported) / p.quantity_planned;
      if (deviation > state.blockingRules.max_deviation_without_notes_pct / 100 && !p.notes) {
        warnings.push(`A tarefa "${p.task_name}" teve desvio de ${(deviation * 100).toFixed(0)}% sem justificativa preenchida.`);
      }
    });

    // Regra 5: Workflow de aprovação não finalizado
    if (state.blockingRules.require_all_workflow_signatures) {
      const pendingSteps = state.workflow.steps.filter((s) => s.status !== 'APPROVED');
      if (pendingSteps.length > 0) {
        blockingIssues.push(`O fluxo de governança possui ${pendingSteps.length} etapa(s) pendente(s) de assinatura digital.`);
      }
    }

    // Regra 6 (Opção 1): Coerência entre Intempérie e Produção a céu aberto
    const unworkableShifts = state.weatherSummary?.shifts?.filter((s) => s.workability === 'IMPRATICAVEL');
    if (unworkableShifts && unworkableShifts.length > 0) {
      state.productionEntries.forEach((p) => {
        const isOutdoorTask =
          p.is_critical ||
          p.task_name.toLowerCase().includes('concretagem') ||
          p.task_name.toLowerCase().includes('fachada') ||
          p.task_name.toLowerCase().includes('terraplenagem');
        if (isOutdoorTask && p.progress_pct >= 100 && !p.notes) {
          warnings.push(
            `Alerta de Coerência: O turno foi marcado como IMPRATICÁVEL por chuva, mas a tarefa externa "${p.task_name}" reportou 100% de avanço sem observação técnica justificando como o trabalho ocorreu.`
          );
        }
      });
    }

    // Alerta NR-18: Vento forte
    if (state.weatherSummary?.has_nr18_wind_alert) {
      warnings.push(
        `Alerta de Segurança NR-18: Vento máximo de ${state.weatherSummary.max_wind_speed_kmh} km/h detectado. Verifique a paralisação de trabalhos em altura e gruas.`
      );
    }

    // Regra 7 (Coleta Ativa WhatsApp): Solicitação de informação com regra bloqueante sem resposta
    const pendingBlockingRequests = (state.informationRequests || []).filter(
      (r) => r.blocking_rule && r.request_state !== 'ANSWERED' && r.request_state !== 'REVIEWED' && r.request_state !== 'CLOSED'
    );
    if (pendingBlockingRequests.length > 0) {
      pendingBlockingRequests.forEach((req) => {
        blockingIssues.push(
          `Solicitação de informação bloqueante sem resposta via WhatsApp: "${req.requested_from_user_name}" não confirmou "${req.wbs_task_name || req.request_text.substring(0, 45)}...".`
        );
      });
    }

    return {
      can_issue: blockingIssues.length === 0,
      blocking_issues: blockingIssues,
      warnings,
    };
  }

  // Atualizar Etapas do Workflow de Governança (Fase 4 - Editor Visual)
  public static updateWorkflowSteps(steps: WorkflowStep[]): DiaryState {
    const state = this.loadState();
    state.workflow.steps = steps;
    // Recalcula step number atual
    const firstNonApproved = steps.find((s) => s.status !== 'APPROVED');
    state.workflow.current_step_number = firstNonApproved ? firstNonApproved.step_number : steps.length;
    this.saveState(state);
    return state;
  }

  // Atualizar Regras de Bloqueio (Fase 4)
  public static updateBlockingRules(rules: BlockingRulesConfig): DiaryState {
    const state = this.loadState();
    state.blockingRules = rules;
    this.saveState(state);
    return state;
  }

  // Revisar Ocorrência
  public static reviewOccurrence(occurrenceId: string, approved: boolean, feedback?: string): DiaryState {
    const state = this.loadState();
    const occ = state.occurrences.find((o) => o.id === occurrenceId);
    if (occ) {
      occ.approved_for_rdo = approved;
      occ.reviewed_by = state.currentUser.name;
      occ.reviewed_at = new Date().toISOString();
      occ.review_feedback = feedback;
      if (approved) {
        occ.status = 'IN_TREATMENT';
      } else {
        occ.status = 'CLOSED';
      }
    }
    this.saveState(state);
    return state;
  }

  // Atualizar Efetivo Manual
  public static updateWorkforceCount(roleCode: string, delta: number): DiaryState {
    const state = this.loadState();
    const entry = state.workforceSnapshot.entries.find((e) => e.role_code === roleCode);
    if (entry) {
      entry.count = Math.max(0, entry.count + delta);
      state.workforceSnapshot.total_workers = state.workforceSnapshot.entries.reduce((acc, curr) => acc + curr.count, 0);
      state.workforceSnapshot.copied_from_yesterday = false;
    }
    this.saveState(state);
    return state;
  }

  // Atualizar Produção
  public static updateProductionDelta(taskId: string, reported: number): DiaryState {
    const state = this.loadState();
    const prod = state.productionEntries.find((p) => p.task_id === taskId);
    if (prod) {
      prod.quantity_reported = reported;
      prod.progress_pct = Math.min(100, Math.round((reported / prod.quantity_planned) * 100));
      prod.confirmation_state = 'confirmed';
      prod.confirmed_by = state.currentUser.name;
      prod.confirmed_at = new Date().toISOString();
    }
    this.saveState(state);
    return state;
  }

  // Avançar Etapa no Workflow
  public static advanceWorkflow(notes?: string): DiaryState {
    const state = this.loadState();
    const currentStep = state.workflow.steps.find((s) => s.step_number === state.workflow.current_step_number);
    if (currentStep) {
      currentStep.status = 'APPROVED';
      currentStep.approved_at = new Date().toISOString();
      currentStep.notes = notes || currentStep.notes;
      currentStep.signature_hash = `sig-sha256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

      if (state.workflow.current_step_number < state.workflow.steps.length) {
        state.workflow.current_step_number += 1;
        const nextStep = state.workflow.steps.find((s) => s.step_number === state.workflow.current_step_number);
        if (nextStep) {
          nextStep.status = 'IN_PROGRESS';
        }
        state.dailyReport.workflow_state = 'AWAITING_APPROVAL';
      } else {
        state.dailyReport.workflow_state = 'APPROVED';
        state.dailyReport.approved_at = new Date().toISOString();
      }
    }
    this.saveState(state);
    return state;
  }

  // Emitir RDO e Congelar Snapshot Imutável
  public static issueRdoSnapshot(): { state: DiaryState; version: ReportVersion } {
    const state = this.loadState();
    const now = new Date().toISOString();

    const snapshotData: RdoSnapshotData = {
      report_id: state.dailyReport.id,
      report_number: state.dailyReport.formatted_number,
      report_date: state.dailyReport.report_date,
      project: state.project,
      responsible_engineer: state.dailyReport.responsible_engineer_name,
      issued_at: now,
      weather: state.weather,
      weather_summary: state.weatherSummary,
      workforce: state.workforceSnapshot,
      production: state.productionEntries,
      occurrences: state.occurrences.filter((o) => o.approved_for_rdo),
      conflicts: state.conflicts,
      supply_tickets: state.supplyTickets,
      photo_evidences: state.sourceEvents
        .filter((e) => e.media_url)
        .map((e) => ({
          url: e.media_url!,
          caption: e.raw_text,
          location: e.location_name || 'Canteiro Geral',
          timestamp: e.occurred_at,
          author: e.author_name,
        })),
      workflow_signatures: state.workflow.steps,
      general_notes: state.generalNotes,
      information_requests: state.informationRequests,
      weekly_plan_tasks: state.weeklyPlanTasks,
    };

    const hashContent = JSON.stringify(snapshotData);
    let hash = 0;
    for (let i = 0; i < hashContent.length; i++) {
      hash = (hash << 5) - hash + hashContent.charCodeAt(i);
      hash |= 0;
    }
    const documentHash = `SHA256-${Math.abs(hash).toString(16).padStart(16, '0')}-${Date.now().toString(16)}`;

    const newVersion: ReportVersion = {
      id: `ver-${state.versions.length + 1}`,
      daily_report_id: state.dailyReport.id,
      version_number: state.versions.length + 1,
      snapshot_json: snapshotData,
      document_hash: documentHash,
      created_by: state.currentUser.name,
      created_at: now,
    };

    state.versions.push(newVersion);
    state.dailyReport.workflow_state = 'ISSUED';
    state.dailyReport.issued_at = now;
    state.dailyReport.current_version_number = newVersion.version_number;
    state.reportingDay.workflow_state = 'CLOSED';
    state.reportingDay.closed_at = now;

    this.saveState(state);
    return { state, version: newVersion };
  }

  // ---------------------------------------------------------------------
  // MÉTODOS DE COLETA ATIVA & WHATSAPP INBOUND (EVOLUTION API + n8n)
  // Conforme ConstruKore RDO Seções 24, 25, 26, 47, 48
  // ---------------------------------------------------------------------

  // 1. Criar Nova Pergunta Proativa de Cobrança
  public static createInformationRequest(reqData: Partial<InformationRequest>): DiaryState {
    const state = this.loadState();
    const now = new Date().toISOString();
    const newRequest: InformationRequest = {
      id: `req-${Date.now()}`,
      tenant_id: state.reportingDay.tenant_id,
      project_id: state.project.id,
      reporting_day_id: state.reportingDay.id,
      schedule_task_id: reqData.schedule_task_id,
      wbs_task_name: reqData.wbs_task_name,
      location_name: reqData.location_name || 'Canteiro Geral',
      requested_from_party_name: reqData.requested_from_party_name || 'Equipe de Obra',
      requested_from_user_name: reqData.requested_from_user_name || 'Encarregado',
      requested_from_phone: reqData.requested_from_phone || '+55 (41) 99999-0000',
      request_type: reqData.request_type || 'PRODUCTION_PROGRESS',
      request_text: reqData.request_text || 'Favor confirmar produção do turno e enviar evidência fotográfica.',
      scheduled_send_time: reqData.scheduled_send_time || '16:00',
      requested_at: now,
      due_at: reqData.due_at || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      request_state: 'PENDING',
      escalation_level: 0,
      blocking_rule: reqData.blocking_rule ?? false,
      created_at: now,
      updated_at: now,
    };

    state.informationRequests.unshift(newRequest);
    this.saveState(state);
    return state;
  }

  // 2. Escalonar Solicitação (Lembrete -> Escala Engenharia -> Bloqueante)
  public static escalateInformationRequest(requestId: string, targetLevel?: 0 | 1 | 2 | 3): DiaryState {
    const state = this.loadState();
    const req = state.informationRequests.find((r) => r.id === requestId);
    if (req && req.request_state !== 'ANSWERED' && req.request_state !== 'REVIEWED' && req.request_state !== 'CLOSED') {
      const nextLevel = targetLevel !== undefined ? targetLevel : ((Math.min(3, req.escalation_level + 1)) as 0 | 1 | 2 | 3);
      req.escalation_level = nextLevel;
      if (nextLevel === 1) {
        req.request_state = 'REMINDED';
      } else if (nextLevel === 2) {
        req.request_state = 'ESCALATED';
      } else if (nextLevel === 3) {
        req.request_state = 'ESCALATED';
        req.blocking_rule = true;
      }
      req.updated_at = new Date().toISOString();
    }
    this.saveState(state);
    return state;
  }

  // 3. Simular Recebimento de Webhook Inbound do n8n / Evolution API
  public static simulateWhatsAppInbound(payload: WhatsAppInboundWebhookPayload): {
    state: DiaryState;
    event: SourceEvent;
    request?: InformationRequest;
  } {
    const state = this.loadState();
    const now = new Date().toISOString();

    const sourceType: SourceEvent['source_type'] =
      payload.message_type === 'audio'
        ? 'WHATSAPP_AUDIO'
        : payload.message_type === 'image'
        ? 'WHATSAPP_IMAGE'
        : 'WHATSAPP_TEXT';

    const rawText = payload.transcription || payload.raw_text || 'Mensagem recebida via WhatsApp';

    const newEvent: SourceEvent = {
      id: payload.event_id || `evt-wa-${Date.now()}`,
      tenant_id: state.reportingDay.tenant_id,
      project_id: state.project.id,
      reporting_day_id: state.reportingDay.id,
      source_type: sourceType,
      occurred_at: payload.received_at || now,
      recorded_at: now,
      author_id: 'usr-wa-bot',
      author_name: `${payload.sender_name} (via WhatsApp Bot)`,
      author_role: 'encarregado',
      raw_text: rawText,
      location_name: payload.detected_entities?.location_name || 'Canteiro Geral',
      wbs_task_name: payload.detected_entities?.wbs_task_name,
      media_url: payload.media_url,
      audio_duration_seconds: payload.audio_duration_seconds,
      audio_blob_url: payload.message_type === 'audio' ? payload.media_url : undefined,
      whatsapp_sender_phone: payload.sender_phone,
      whatsapp_message_id: payload.whatsapp_message_id,
      information_request_id: payload.matched_request_id,
      review_state: 'pending_review',
      confidence: 0.95,
      status: 'active',
      created_at: now,
    };

    state.sourceEvents.unshift(newEvent);

    // Encontra e atualiza a solicitação correspondente
    let matchedReq = state.informationRequests.find((r) => r.id === payload.matched_request_id);
    if (!matchedReq && payload.sender_phone) {
      const cleanPhone = payload.sender_phone.replace(/\D/g, '').slice(-8);
      matchedReq = state.informationRequests.find(
        (r) =>
          r.requested_from_phone.replace(/\D/g, '').slice(-8) === cleanPhone &&
          r.request_state !== 'CLOSED'
      );
    }

    if (matchedReq) {
      matchedReq.request_state = 'ANSWERED';
      matchedReq.response_source_event_id = newEvent.id;
      matchedReq.response_received_at = payload.received_at || now;
      matchedReq.response_raw_content = payload.raw_text;
      matchedReq.response_media_url = payload.media_url;
      matchedReq.response_transcription = payload.transcription;
      matchedReq.updated_at = now;

      if (payload.detected_entities) {
        matchedReq.extracted_data = {
          task_id: payload.detected_entities.task_id,
          task_name: payload.detected_entities.wbs_task_name,
          suggested_production_delta: payload.detected_entities.production_quantity,
          suggested_uom: payload.detected_entities.uom,
          suggested_occurrence_title: payload.detected_entities.occurrence_title,
          suggested_occurrence_category: payload.detected_entities.occurrence_category,
          suggested_photo_url: payload.media_url,
          material_shortage: payload.detected_entities.material_shortage,
        };
      }
    }

    this.saveState(state);
    return { state, event: newEvent, request: matchedReq };
  }

  // 4. Homologação em 1 Clique pelo Engenheiro (ReviewInbox)
  public static approveWhatsAppSuggestion(requestIdOrEventId: string): DiaryState {
    const state = this.loadState();
    const now = new Date().toISOString();

    const req = state.informationRequests.find(
      (r) => r.id === requestIdOrEventId || r.response_source_event_id === requestIdOrEventId
    );

    const event = state.sourceEvents.find(
      (e) => e.id === requestIdOrEventId || (req && e.id === req.response_source_event_id)
    );

    if (event) {
      event.review_state = 'confirmed';
      event.reviewed_by = state.currentUser.name;
      event.reviewed_at = now;
    }

    if (req) {
      req.request_state = 'CLOSED';
      req.reviewed_by = state.currentUser.name;
      req.reviewed_at = now;
      req.updated_at = now;

      // Se havia produção sugerida, atualiza a tarefa na produção
      if (req.extracted_data?.suggested_production_delta) {
        const prod =
          (req.extracted_data.task_id && state.productionEntries.find((p) => p.task_id === req.extracted_data?.task_id)) ||
          (req.schedule_task_id && state.productionEntries.find((p) => p.task_id === req.schedule_task_id)) ||
          state.productionEntries.find((p) =>
            req.wbs_task_name && p.task_name.toLowerCase().includes(req.wbs_task_name.toLowerCase().split(' ')[0])
          );

        if (prod) {
          prod.quantity_reported = Math.max(prod.quantity_reported, req.extracted_data.suggested_production_delta);
          prod.progress_pct = Math.min(100, Math.round((prod.quantity_reported / prod.quantity_planned) * 100));
          prod.confirmation_state = 'confirmed';
          prod.confirmed_by = state.currentUser.name;
          prod.confirmed_at = now;
        }
      }

      // Se havia falta de material informada, cadastra a ocorrência e checa escalonamento
      if (req.extracted_data?.material_shortage) {
        const ms = req.extracted_data.material_shortage;
        const newOcc: OperationalOccurrence = {
          id: `occ-wa-${Date.now()}`,
          reporting_day_id: state.reportingDay.id,
          code: `OCC-${Date.now().toString().slice(-4)}`,
          title: `Falta de Material Informada via WhatsApp: ${ms.material_name}`,
          description: `Apontamento recebido via bot: falta de ${ms.material_name}. ${ms.workers_idle} operários ociosos por ${ms.hours_lost}h.`,
          category: 'material',
          severity: 'high',
          location_name: req.location_name,
          occurred_at: now,
          immediate_impact: {
            workers_idle_count: ms.workers_idle,
            hours_lost: ms.hours_lost,
            activity_blocked: true,
            cost_estimate: ms.workers_idle * ms.hours_lost * 45,
          },
          approved_for_rdo: true,
          reviewed_by: state.currentUser.name,
          reviewed_at: now,
          status: 'IN_TREATMENT',
        };
        state.occurrences.push(newOcc);
      }
    }

    this.saveState(state);
    return state;
  }

  // ---------------------------------------------------------------------
  // MÉTODOS DE GESTÃO DE EFETIVO (MODO ENGENHARIA & CANTEIRO)
  // ---------------------------------------------------------------------

  // Atualizar contagem exata de uma função de mão de obra
  public static updateWorkforceRole(roleCode: string, count: number, companyName?: string): DiaryState {
    const state = this.loadState();
    let entry = state.workforceSnapshot.entries.find((e) => e.role_code === roleCode);
    if (entry) {
      entry.count = Math.max(0, count);
      if (companyName) entry.company_name = companyName;
    } else {
      entry = {
        role_code: roleCode,
        role_name: roleCode,
        company_type: 'TERCEIRIZADA',
        company_name: companyName || 'Empreiteira Contratada',
        count: Math.max(0, count),
      };
      state.workforceSnapshot.entries.push(entry);
    }
    state.workforceSnapshot.total_workers = state.workforceSnapshot.entries.reduce((acc, curr) => acc + curr.count, 0);
    state.workforceSnapshot.copied_from_yesterday = false;
    this.saveState(state);
    return state;
  }

  // Adicionar nova função / equipe ao efetivo
  public static addWorkforceRole(role: WorkforceRoleCount): DiaryState {
    const state = this.loadState();
    const existing = state.workforceSnapshot.entries.find((e) => e.role_code === role.role_code);
    if (existing) {
      existing.count += role.count;
      existing.company_name = role.company_name;
      existing.company_type = role.company_type;
    } else {
      state.workforceSnapshot.entries.push({ ...role });
    }
    state.workforceSnapshot.total_workers = state.workforceSnapshot.entries.reduce((acc, curr) => acc + curr.count, 0);
    state.workforceSnapshot.copied_from_yesterday = false;
    this.saveState(state);
    return state;
  }

  // Remover função do efetivo
  public static removeWorkforceRole(roleCode: string): DiaryState {
    const state = this.loadState();
    state.workforceSnapshot.entries = state.workforceSnapshot.entries.filter((e) => e.role_code !== roleCode);
    state.workforceSnapshot.total_workers = state.workforceSnapshot.entries.reduce((acc, curr) => acc + curr.count, 0);
    this.saveState(state);
    return state;
  }

  // ---------------------------------------------------------------------
  // MÉTODOS DE GESTÃO DE PRODUÇÃO & CURTO PRAZO
  // ---------------------------------------------------------------------

  // Atualizar detalhes de uma tarefa de produção (quantidade, notas, encarregado)
  public static updateProductionDetails(taskId: string, updates: Partial<ProductionEntry>): DiaryState {
    const state = this.loadState();
    const prod = state.productionEntries.find((p) => p.task_id === taskId);
    if (prod) {
      if (updates.quantity_reported !== undefined) {
        prod.quantity_reported = Math.max(0, updates.quantity_reported);
        prod.progress_pct = Math.min(100, Math.round((prod.quantity_reported / prod.quantity_planned) * 100));
      }
      if (updates.quantity_planned !== undefined) {
        prod.quantity_planned = Math.max(1, updates.quantity_planned);
        prod.progress_pct = Math.min(100, Math.round((prod.quantity_reported / prod.quantity_planned) * 100));
      }
      if (updates.notes !== undefined) prod.notes = updates.notes;
      if (updates.confirmation_state !== undefined) {
        prod.confirmation_state = updates.confirmation_state;
        if (updates.confirmation_state === 'confirmed') {
          prod.confirmed_by = state.currentUser.name;
          prod.confirmed_at = new Date().toISOString();
        }
      }
      if (updates.assigned_user_id !== undefined) prod.assigned_user_id = updates.assigned_user_id;
      if (updates.assigned_user_name !== undefined) prod.assigned_user_name = updates.assigned_user_name;
      if (updates.is_critical !== undefined) prod.is_critical = updates.is_critical;
    }
    this.saveState(state);
    return state;
  }

  // Adicionar nova atividade de produção ao diário
  public static addProductionEntry(entry: Partial<ProductionEntry>): DiaryState {
    const state = this.loadState();
    const newEntry: ProductionEntry = {
      id: `prod-${Date.now()}`,
      reporting_day_id: state.reportingDay.id,
      task_id: entry.task_id || `tsk-${Date.now()}`,
      task_name: entry.task_name || 'Nova Atividade',
      location_name: entry.location_name || 'Canteiro Geral',
      quantity_planned: entry.quantity_planned || 100,
      quantity_reported: entry.quantity_reported || 0,
      uom: entry.uom || 'm²',
      progress_pct: entry.quantity_planned ? Math.round(((entry.quantity_reported || 0) / entry.quantity_planned) * 100) : 0,
      confirmation_state: 'confirmed',
      confirmed_by: state.currentUser.name,
      confirmed_at: new Date().toISOString(),
      notes: entry.notes || '',
      is_critical: entry.is_critical || false,
      assigned_user_id: entry.assigned_user_id || 'usr-02',
      assigned_user_name: entry.assigned_user_name || 'Antônio Santos (Encarregado)',
      weekly_goal: entry.weekly_goal || entry.quantity_planned || 100,
    };
    state.productionEntries.push(newEntry);
    this.saveState(state);
    return state;
  }

  // Adicionar tarefa ao Planejamento Semanal de Curto Prazo
  public static addWeeklyPlanTask(task: Partial<WeeklyPlanTask>): DiaryState {
    const state = this.loadState();
    const now = new Date().toISOString();
    const newTask: WeeklyPlanTask = {
      id: task.id || `wpt-${Date.now()}`,
      project_id: state.project.id,
      week_label: task.week_label || 'Semana 37 (07/09 a 12/09/2026)',
      wbs_code: task.wbs_code || `0${state.weeklyPlanTasks.length + 1}.01`,
      task_name: task.task_name || 'Nova Tarefa Semanal',
      location_name: task.location_name || 'Canteiro',
      assigned_user_id: task.assigned_user_id || 'usr-02',
      assigned_user_name: task.assigned_user_name || 'Antônio Santos (Encarregado)',
      company_type: task.company_type || 'TERCEIRIZADA',
      company_name: task.company_name || 'Empreiteira Parceira',
      quantity_planned_week: task.quantity_planned_week || 100,
      quantity_planned_today: task.quantity_planned_today || 20,
      quantity_executed_week: 0,
      uom: task.uom || 'm²',
      is_critical: task.is_critical || false,
      status: 'IN_PROGRESS',
      created_at: now,
      updated_at: now,
    };
    state.weeklyPlanTasks.push(newTask);

    // Se ainda não existir na produção do dia, inclui automaticamente
    const existsInProd = state.productionEntries.some((p) => p.task_name === newTask.task_name);
    if (!existsInProd) {
      state.productionEntries.push({
        id: `prod-${Date.now()}`,
        reporting_day_id: state.reportingDay.id,
        task_id: `tsk-${newTask.id}`,
        task_name: newTask.task_name,
        location_name: newTask.location_name,
        quantity_planned: newTask.quantity_planned_today,
        quantity_reported: 0,
        uom: newTask.uom,
        progress_pct: 0,
        confirmation_state: 'pending',
        is_critical: newTask.is_critical,
        assigned_user_id: newTask.assigned_user_id,
        assigned_user_name: newTask.assigned_user_name,
        weekly_plan_task_id: newTask.id,
        weekly_goal: newTask.quantity_planned_week,
      });
    }

    this.saveState(state);
    return state;
  }

  // Atualizar tarefa no Planejamento Semanal
  public static updateWeeklyPlanTask(taskId: string, updates: Partial<WeeklyPlanTask>): DiaryState {
    const state = this.loadState();
    const task = state.weeklyPlanTasks.find((t) => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      task.updated_at = new Date().toISOString();

      // Sincroniza com a produção correspondente
      const prod = state.productionEntries.find((p) => p.weekly_plan_task_id === taskId || p.task_name === task.task_name);
      if (prod) {
        if (updates.task_name) prod.task_name = updates.task_name;
        if (updates.assigned_user_id) prod.assigned_user_id = updates.assigned_user_id;
        if (updates.assigned_user_name) prod.assigned_user_name = updates.assigned_user_name;
        if (updates.quantity_planned_today) prod.quantity_planned = updates.quantity_planned_today;
        if (updates.is_critical !== undefined) prod.is_critical = updates.is_critical;
      }
    }
    this.saveState(state);
    return state;
  }

  // ---------------------------------------------------------------------
  // MÉTODOS DE GESTÃO DE CONTATOS DE CAMPO, GRUPOS WHATSAPP & LGPD
  // ---------------------------------------------------------------------

  // Adicionar novo contato ou grupo
  public static addContact(contact: Partial<WhatsAppContact>): DiaryState {
    const state = this.loadState();
    const now = new Date().toISOString();
    const newContact: WhatsAppContact = {
      id: contact.id || `cnt-${Date.now()}`,
      name: contact.name || 'Novo Contato',
      type: contact.type || 'INDIVIDUAL',
      role: contact.role || 'ENCARREGADO',
      phone_or_jid: contact.phone_or_jid || '+55 (41) 99999-0000',
      company_name: contact.company_name || 'ConstruKore Engenharia',
      company_type: contact.company_type || 'PROPRIA',
      assigned_wbs_tasks: contact.assigned_wbs_tasks || [],
      assigned_location: contact.assigned_location || 'Canteiro Geral',
      is_active: contact.is_active ?? true,
      lgpd_consent_status: contact.lgpd_consent_status || 'ACCEPTED',
      lgpd_legal_basis: contact.lgpd_legal_basis || 'EXECUCAO_CONTRATO',
      lgpd_consent_date: now,
      notes: contact.notes || '',
      created_at: now,
      updated_at: now,
    };
    state.contacts.unshift(newContact);
    this.saveState(state);
    return state;
  }

  // Atualizar dados de um contato / grupo
  public static updateContact(contactId: string, updates: Partial<WhatsAppContact>): DiaryState {
    const state = this.loadState();
    const contact = state.contacts.find((c) => c.id === contactId);
    if (contact) {
      Object.assign(contact, updates);
      contact.updated_at = new Date().toISOString();
      this.saveState(state);
    }
    return state;
  }

  // Remover contato / grupo
  public static removeContact(contactId: string): DiaryState {
    const state = this.loadState();
    state.contacts = state.contacts.filter((c) => c.id !== contactId);
    this.saveState(state);
    return state;
  }

  // Alternar status ativo/inativo (Opt-out LGPD)
  public static toggleContactActive(contactId: string): DiaryState {
    const state = this.loadState();
    const contact = state.contacts.find((c) => c.id === contactId);
    if (contact) {
      contact.is_active = !contact.is_active;
      if (!contact.is_active) {
        contact.lgpd_consent_status = 'REVOKED';
      } else {
        contact.lgpd_consent_status = 'ACCEPTED';
      }
      contact.updated_at = new Date().toISOString();
      this.saveState(state);
    }
    return state;
  }

  // Obter variação de pergunta aleatória e natural (para n8n / bot)
  public static getRandomQuestionVariation(params: {
    category: InformationRequestType;
    contactName: string;
    taskName?: string;
    locationName?: string;
    uom?: string;
    materialName?: string;
    companyName?: string;
    targetType?: 'INDIVIDUAL' | 'GROUP';
  }): string {
    const state = this.loadState();
    const templates = state.questionTemplates.filter((t) => {
      if (t.category !== params.category) return false;
      if (params.targetType && t.target_type !== params.targetType) return false;
      return true;
    });

    const chosen = templates.length > 0
      ? templates[Math.floor(Math.random() * templates.length)]
      : state.questionTemplates[0];

    const cleanName = params.contactName.split(' ')[0] || params.contactName;
    return chosen.template_text
      .replace(/{nome}/g, cleanName)
      .replace(/{tarefa}/g, params.taskName || 'atividade')
      .replace(/{local}/g, params.locationName || 'canteiro')
      .replace(/{uom}/g, params.uom || 'm²')
      .replace(/{material}/g, params.materialName || 'materiais')
      .replace(/{empresa}/g, params.companyName || 'equipe');
  }

  // -------------------------------------------------------------------
  // GESTÃO DE LOCAIS DA OBRA (TORRES, PAVIMENTOS, AMBIENTES)
  // -------------------------------------------------------------------
  public static updateLocationsConfig(updates: Partial<ObraLocationsConfig>): DiaryState {
    const state = this.loadState();
    state.locationsConfig = {
      ...state.locationsConfig,
      ...updates,
      atualizado_em: new Date().toISOString(),
    };
    this.saveState(state);
    return state;
  }

  public static addLocationItem(
    type: 'torres' | 'pavimentos' | 'ambientes',
    item: LocationItem
  ): DiaryState {
    const state = this.loadState();
    if (!state.locationsConfig) {
      state.locationsConfig = JSON.parse(JSON.stringify(initialLocationsConfig));
    }
    const list = state.locationsConfig[type] || [];
    // Evita duplicação por código ou id
    const existingIndex = list.findIndex((i) => i.id === item.id || (i.codigo && i.codigo === item.codigo));
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...item };
    } else {
      list.push(item);
    }
    state.locationsConfig[type] = list;
    state.locationsConfig.atualizado_em = new Date().toISOString();
    this.saveState(state);
    return state;
  }

  public static removeLocationItem(
    type: 'torres' | 'pavimentos' | 'ambientes',
    itemId: string
  ): DiaryState {
    const state = this.loadState();
    if (state.locationsConfig && state.locationsConfig[type]) {
      state.locationsConfig[type] = state.locationsConfig[type].filter((i) => i.id !== itemId);
      state.locationsConfig.atualizado_em = new Date().toISOString();
      this.saveState(state);
    }
    return state;
  }

  public static resetLocationsToDefault(): DiaryState {
    const state = this.loadState();
    state.locationsConfig = JSON.parse(JSON.stringify(initialLocationsConfig));
    this.saveState(state);
    return state;
  }

  // -------------------------------------------------------------------
  // GESTÃO DE STORAGE CLOUDFLARE R2
  // -------------------------------------------------------------------
  public static updateR2Config(updates: Partial<R2StorageConfig>): DiaryState {
    const state = this.loadState();
    state.r2Config = {
      ...state.r2Config,
      ...updates,
    };
    this.saveState(state);
    return state;
  }

  // -------------------------------------------------------------------
  // MEMORIZAÇÃO DA SELEÇÃO ATIVA DO CARIMBO / CÂMERA (CANTEIRO)
  // -------------------------------------------------------------------
  public static getPhotoLocationSelection(): CurrentPhotoLocationSelection {
    const raw = localStorage.getItem(PHOTO_LOCATION_SELECTION_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const state = this.loadState();
    return {
      torreId: state.locationsConfig?.torres?.[0]?.id || null,
      pavimentoId: state.locationsConfig?.pavimentos?.[7]?.id || null, // default: 8º Pavimento
      ambienteId: state.locationsConfig?.ambientes?.[0]?.id || null,
    };
  }

  public static setPhotoLocationSelection(selection: CurrentPhotoLocationSelection): void {
    localStorage.setItem(PHOTO_LOCATION_SELECTION_KEY, JSON.stringify(selection));
  }

  // Resetar dados para demonstração
  public static resetState(): DiaryState {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PHOTO_LOCATION_SELECTION_KEY);
    return this.loadState();
  }
}
