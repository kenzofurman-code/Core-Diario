// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA (RDO) — CONTRATOS & TIPAGENS OFICIAIS
// Compatível com os schemas Core, koreObra e koreSuprimentos
// Fases 1, 2, 3 e 4 Unificadas
// =====================================================================

export type RecordStatus = 'active' | 'archived' | 'deleted';

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: 'encarregado' | 'mestre' | 'engenheiro_residente' | 'gerente_obra' | 'fiscal_cliente';
  avatar_url?: string;
}

export interface ProjectContext {
  id: string;
  codigo: string;
  nome: string;
  cidade: string;
  timezone: string;
  gps_lat?: number;
  gps_lng?: number;
  rain_contractual_threshold_mm?: number; // Ex: 5.0 mm para dia de chuva impediente
  nearest_inmet_station_code?: string;    // Ex: "A807"
  nearest_inmet_station_name?: string;    // Ex: "Curitiba (A807)"
}

// ---------------------------------------------------------------------
// 1. DIA OPERACIONAL (Reporting Day)
// ---------------------------------------------------------------------
export type ReportingDayState = 'OPEN' | 'IN_REVIEW' | 'CLOSED';

export interface ReportingDay {
  id: string;
  tenant_id: string;
  project_id: string;
  report_date: string; // YYYY-MM-DD
  shift_name?: string;
  workflow_state: ReportingDayState;
  responsible_user_id: string;
  responsible_user_name: string;
  completion_percentage: number;
  data_quality_score: number;
  opened_at: string;
  closed_at?: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// 2. EVENTO DE ENTRADA (Source Event)
// ---------------------------------------------------------------------
export type SourceEventType =
  | 'MANUAL_TEXT'
  | 'MANUAL_AUDIO'
  | 'MANUAL_IMAGE'
  | 'MATERIAL_SHORTAGE'
  | 'WORKFORCE_COUNT'
  | 'PRODUCTION_DELTA'
  | 'WEATHER_OBSERVATION'
  | 'OCCURRENCE_LOG'
  | 'SOURCE_CONFLICT'
  | 'WHATSAPP_TEXT'
  | 'WHATSAPP_AUDIO'
  | 'WHATSAPP_IMAGE'
  | 'WHATSAPP_DOCUMENT';

export type EventReviewState = 'pending_review' | 'confirmed' | 'conflict' | 'discarded';

export interface SourceEvent {
  id: string;
  tenant_id: string;
  project_id: string;
  reporting_day_id: string;
  source_type: SourceEventType;
  occurred_at: string; // Momento do fato
  recorded_at: string; // Momento do apontamento no app
  author_id: string;
  author_name: string;
  author_role: string;
  raw_text: string;
  location_name?: string;
  wbs_task_name?: string;
  media_url?: string;
  audio_duration_seconds?: number;
  audio_blob_url?: string;
  whatsapp_sender_phone?: string;
  whatsapp_message_id?: string;
  information_request_id?: string;
  review_state: EventReviewState;
  confidence: number;
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  status: RecordStatus;
  created_at: string;
}

// ---------------------------------------------------------------------
// 3. APONTAMENTO DE PRODUÇÃO & CONCILIAÇÃO DE FONTES (Fase 3)
// ---------------------------------------------------------------------
export interface ProductionEntry {
  id: string;
  reporting_day_id: string;
  task_id: string;
  task_name: string;
  location_name: string;
  quantity_planned: number;
  quantity_reported: number;
  uom: string; // m², m³, kg, un
  progress_pct: number;
  source_event_id?: string;
  notes?: string;
  confirmation_state: 'pending' | 'confirmed' | 'rejected' | 'conflict';
  confirmed_by?: string;
  confirmed_at?: string;
  is_critical?: boolean; // Ex: Concretagem é crítica e exige foto
  assigned_user_id?: string; // Encarregado responsável pela frente
  assigned_user_name?: string;
  weekly_plan_task_id?: string; // Vínculo com curto prazo
  weekly_goal?: number; // Meta da semana
}

export interface SourceConflict {
  id: string;
  reporting_day_id: string;
  task_id: string;
  task_name: string;
  location_name: string;
  contractor_party_name: string;
  contractor_value: number;
  engineer_value: number;
  uom: string;
  variance_pct: number;
  tolerance_pct: number;
  status: 'PENDING' | 'RESOLVED';
  resolved_value?: number;
  resolved_by?: string;
  resolution_rationale?: string;
  resolved_at?: string;
}

// ---------------------------------------------------------------------
// 4. EFETIVO DE MÃO DE OBRA (Workforce)
// ---------------------------------------------------------------------
export interface WorkforceRoleCount {
  role_code: string;
  role_name: string;
  company_type: 'PROPRIA' | 'TERCEIRIZADA';
  company_name: string;
  count: number;
}

export interface WorkforceSnapshot {
  id: string;
  reporting_day_id: string;
  captured_at: string;
  total_workers: number;
  entries: WorkforceRoleCount[];
  copied_from_yesterday?: boolean;
}

// ---------------------------------------------------------------------
// 5. FALTA DE MATERIAL & ESCALONAMENTO PARA SUPRIMENTOS (Fase 3)
// ---------------------------------------------------------------------
export type OccurrenceCategory =
  | 'material'
  | 'safety'
  | 'quality'
  | 'weather'
  | 'equipment'
  | 'planning'
  | 'external'
  | 'other';

export type OccurrenceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface OperationalOccurrence {
  id: string;
  reporting_day_id: string;
  code: string;
  title: string;
  description: string;
  category: OccurrenceCategory;
  severity: OccurrenceSeverity;
  location_name?: string;
  responsible_party_name?: string;
  occurred_at: string;
  immediate_impact?: {
    workers_idle_count: number;
    hours_lost: number;
    activity_blocked: boolean;
    cost_estimate?: number;
  };
  approved_for_rdo: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_feedback?: string;
  recurrence_count?: number; // Contador de reincidência
  status: 'OPEN' | 'IN_TREATMENT' | 'RESOLVED' | 'CLOSED';
}

export interface SupplyEscalationTicket {
  id: string;
  ticket_code: string; // Ex: TICKET-SUP-0184
  material_name: string;
  recurrence_count: number; // 3 vezes
  occurrence_ids: string[];
  total_workers_idle: number;
  total_hours_lost: number;
  total_cost_estimate: number;
  status: 'OPEN' | 'DISPATCHED_TO_SUPRIMENTOS' | 'RESOLVED';
  created_at: string;
  dispatched_at?: string;
  dispatch_notes?: string;
  dispatched_by?: string;
}

// ---------------------------------------------------------------------
// 6. CONDIÇÕES CLIMÁTICAS & PROVA PERICIAL DE CHUVA (Opção 1)
// ---------------------------------------------------------------------
export type WeatherCondition =
  | 'ENSOLARADO'
  | 'PARCIALMENTE_NUBLADO'
  | 'NUBLADO'
  | 'CHUVA_FRACA'
  | 'CHUVA_MODERADA'
  | 'CHUVA_FORTE'
  | 'TEMPESTADE';

export type WeatherImpact = 'SEM_IMPACTO' | 'PARALISACAO_PARCIAL' | 'PARALISACAO_TOTAL';

export type WorkabilityStatus = 'PRATICAVEL' | 'PARCIALMENTE_PRATICAVEL' | 'IMPRATICAVEL';

export interface WeatherShiftRecord {
  shift: 'MANHA' | 'TARDE' | 'NOITE';
  period_label: string; // Ex: "07:00 às 12:00"
  condition: WeatherCondition;
  temperature_avg_c: number;
  precipitation_mm: number;
  wind_speed_max_kmh: number;
  humidity_pct: number;
  workability: WorkabilityStatus;
  hours_lost_to_weather: number; // Horas paralisadas por intempérie
  affected_trades?: string[]; // Ex: ["Fachada", "Concretagem externa"]
  // Auditoria pericial (Override pelo Engenheiro/Mestre)
  is_overridden: boolean;
  original_api_precipitation_mm?: number;
  original_api_condition?: WeatherCondition;
  override_reason?: string;
  overridden_by_name?: string;
  evidence_photo_url?: string; // Foto comprobatória de canteiro alagado / lama
  notes?: string;
}

export interface DayWeatherSummary {
  station_source: string; // "Open-Meteo High-Resolution (ECMWF/GFS)"
  inmet_reference?: string; // "Estação Oficial INMET A807 - Curitiba/PR"
  queried_at: string;
  total_precipitation_day_mm: number;
  max_wind_speed_kmh: number;
  temperature_min_c: number;
  temperature_max_c: number;
  rain_threshold_mm: number; // Teto de chuva impediente contratual (default 5.0 mm)
  is_contractual_rain_day: boolean; // total >= threshold
  has_nr18_wind_alert: boolean; // Vento > 40 km/h (alerta de gruas e trabalho em altura)
  shifts: WeatherShiftRecord[];
}

// Mantido para compatibilidade retroativa com relatórios e snapshots
export interface WeatherObservation {
  shift: 'MANHA' | 'TARDE' | 'NOITE';
  condition: WeatherCondition;
  impact: WeatherImpact;
  notes?: string;
  precipitation_mm?: number;
  temperature_c?: number;
  workability?: WorkabilityStatus;
}

// ---------------------------------------------------------------------
// 7. WORKFLOW CONFIGURÁVEL & REGRAS DE BLOQUEIO (Fase 4)
// ---------------------------------------------------------------------
export type WorkflowStepStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'RETURNED';

export interface WorkflowStep {
  step_number: number;
  role_code: string;
  role_title: string;
  approver_name: string;
  status: WorkflowStepStatus;
  approved_at?: string;
  signature_hash?: string;
  notes?: string;
  can_be_removed?: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  project_id: string;
  steps: WorkflowStep[];
  current_step_number: number;
}

export interface BlockingRulesConfig {
  require_photo_for_critical_tasks: boolean; // Concretagem exige foto
  block_on_pending_occurrences: boolean;      // Falta de material sem revisão bloqueia
  max_deviation_without_notes_pct: number;   // Desvio > 15% exige justificativa
  require_all_workflow_signatures: boolean;  // Todas etapas assinadas
}

export interface BlockingValidationResult {
  can_issue: boolean;
  blocking_issues: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------
// 8. RELATÓRIO DIÁRIO DE OBRA & VERSÕES (RDO Snapshot)
// ---------------------------------------------------------------------
export type RdoState =
  | 'DRAFT'
  | 'COLLECTING'
  | 'IN_REVIEW'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'REVISED';

export interface DailyReport {
  id: string;
  tenant_id: string;
  project_id: string;
  reporting_day_id: string;
  report_number: number;
  formatted_number: string;
  report_date: string;
  workflow_state: RdoState;
  current_version_number: number;
  responsible_engineer_name: string;
  submitted_at?: string;
  approved_at?: string;
  issued_at?: string;
}

export interface RdoSnapshotData {
  report_id: string;
  report_number: string;
  report_date: string;
  project: ProjectContext;
  responsible_engineer: string;
  issued_at: string;
  weather: WeatherObservation[];
  weather_summary?: DayWeatherSummary;
  workforce: WorkforceSnapshot;
  production: ProductionEntry[];
  occurrences: OperationalOccurrence[];
  conflicts: SourceConflict[];
  supply_tickets: SupplyEscalationTicket[];
  photo_evidences: Array<{
    url: string;
    caption: string;
    location: string;
    timestamp: string;
    author: string;
  }>;
  workflow_signatures: WorkflowStep[];
  general_notes: string;
  information_requests?: InformationRequest[];
  weekly_plan_tasks?: WeeklyPlanTask[];
  contacts?: WhatsAppContact[];
  locations_config?: ObraLocationsConfig;
  r2_config?: R2StorageConfig;
}

export interface ReportVersion {
  id: string;
  daily_report_id: string;
  version_number: number;
  parent_version_id?: string;
  reason?: string;
  snapshot_json: RdoSnapshotData;
  document_hash: string; // SHA-256
  created_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------
// 9. SOLICITAÇÕES DE INFORMAÇÃO & COBRANÇA ATIVA (Inbound WhatsApp / n8n)
// Conforme ConstruKore RDO Seções 24, 25, 26, 47, 48
// ---------------------------------------------------------------------
export type InformationRequestState =
  | 'SCHEDULED'   // Agendada para disparo (ex: 11:30 ou 16:00)
  | 'SENT'        // Disparada para o WhatsApp do responsável
  | 'PENDING'     // Aguardando resposta do encarregado/mestre
  | 'REMINDED'    // Lembrete automático enviado (+30 min)
  | 'ESCALATED'   // Escalada para a Engenharia / Mestre geral (+1h)
  | 'ANSWERED'    // Respondida via WhatsApp (áudio, foto ou texto)
  | 'REVIEWED'    // Analisada pelo Engenheiro Residente
  | 'CLOSED';     // Homologada e incorporada ao RDO

export type InformationRequestType =
  | 'PRODUCTION_PROGRESS' // "Como está o avanço da alvenaria no Pav. 8?"
  | 'PHOTO_EVIDENCE'      // "Mande a foto da armação da viga V-12 antes da concretagem"
  | 'WORKFORCE_CHECK'     // "Confirme o número de pedreiros da terceirizada Alfa hoje"
  | 'MATERIAL_STATUS'     // "Chegou o cimento CP-II e aditivo na obra?"
  | 'GENERAL_UPDATE';     // "Alguma ocorrência ou paralisação no turno da tarde?"

export interface InformationRequest {
  id: string;
  tenant_id: string;
  project_id: string;
  reporting_day_id: string;
  schedule_task_id?: string;
  wbs_task_name?: string;
  location_name?: string;

  // Destinatário no canteiro
  requested_from_party_name: string; // Ex: "Empreiteira Silva & Filhos" ou "Equipe Própria"
  requested_from_user_name: string;  // Ex: "Antônio Santos (Encarregado)"
  requested_from_phone: string;      // Ex: "+55 (41) 99888-7711"

  request_type: InformationRequestType;
  request_text: string;              // Mensagem disparada pelo bot
  scheduled_send_time: string;       // Ex: "11:30" ou "16:00"

  requested_at: string;
  due_at: string;                    // Prazo limite

  request_state: InformationRequestState;
  escalation_level: 0 | 1 | 2 | 3;   // 0: Normal, 1: Lembrete 30m, 2: Escala 1h, 3: Bloqueante
  blocking_rule: boolean;            // Se true, impede emissão do RDO se não respondida!

  // Resposta recebida do WhatsApp
  response_source_event_id?: string;
  response_received_at?: string;
  response_raw_content?: string;
  response_media_url?: string;
  response_transcription?: string;

  // Extração inteligente pelo n8n / IA (Whisper + LLM)
  extracted_data?: {
    task_id?: string;
    task_name?: string;
    suggested_production_delta?: number;
    suggested_uom?: string;
    suggested_occurrence_title?: string;
    suggested_occurrence_category?: OccurrenceCategory;
    suggested_photo_url?: string;
    material_shortage?: {
      material_name: string;
      workers_idle: number;
      hours_lost: number;
    };
  };

  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Payload do Webhook Inbound vindo do n8n / Evolution API
export interface WhatsAppInboundWebhookPayload {
  event_id?: string;
  whatsapp_message_id: string;
  sender_phone: string;
  sender_name: string;
  message_type: 'text' | 'audio' | 'image';
  raw_text?: string;
  media_url?: string;
  audio_duration_seconds?: number;
  transcription?: string; // Whisper STT
  received_at: string;
  matched_request_id?: string;
  detected_entities?: {
    task_id?: string;
    wbs_task_name?: string;
    location_name?: string;
    production_quantity?: number;
    uom?: string;
    occurrence_title?: string;
    occurrence_category?: OccurrenceCategory;
    is_critical_activity?: boolean;
    material_shortage?: {
      material_name: string;
      workers_idle: number;
      hours_lost: number;
    };
  };
}

// ---------------------------------------------------------------------
// 10. CURTO PRAZO (Planejamento Semanal) & NAVEGAÇÃO DA ENGENHARIA
// ---------------------------------------------------------------------
export type EngineeringNavSection =
  | 'OVERVIEW'            // Visão Geral & Governança (KPIs, Assinaturas, Fechamento)
  | 'REPORTS_HISTORY'     // Histórico & Calendário de RDOs Anteriores (Navegação & Edição Retroativa)
  | 'PREVISION_ARCHIVE'   // Acervo de Diários Prevision (16 Obras na VPS & Leitura de 2.198 RDOs)
  | 'WORKFORCE'           // Gestão & Edição de Efetivo (Próprios vs Terceirizados)
  | 'PRODUCTION'          // Apontamento & Edição de Produção Diária
  | 'SHORT_TERM_PLANNING' // Planejamento Semanal de Curto Prazo (Atribuição por Encarregado)
  | 'LOCATIONS'           // Estrutura de Pavimentos, Ambientes & Cloudflare R2
  | 'WHATSAPP_COLLECTION' // Coleta Ativa WhatsApp (Evolution + n8n)
  | 'CONTACTS'            // Contatos de Campo & Grupos do WhatsApp (LGPD)
  | 'VALIDATIONS'         // Validações & Inbox (Conflitos, Ocorrências, Suprimentos)
  | 'WEATHER'             // Clima & Intempérie Pericial
  | 'TIMELINE';           // Linha do Tempo Auditável

export interface DailyReportSummaryItem {
  date: string; // ISO "2026-09-08"
  formatted_date: string; // "08/09/2026"
  weekday: string; // "Segunda-feira"
  report_id: string;
  report_number: number;
  formatted_number: string; // "POTY-RDO-0184"
  workflow_state: RdoState;
  total_workers: number;
  production_progress_pct: number;
  photos_count: number;
  occurrences_count: number;
  conflicts_count: number;
  weather_condition: string;
  is_contractual_rain_day: boolean;
  responsible_engineer_name: string;
  has_blocking_issues: boolean;
  document_hash?: string;
  is_current_active?: boolean;
}

export interface WeeklyPlanTask {
  id: string;
  project_id: string;
  week_label: string; // Ex: "Semana 37 (07/09 a 12/09/2026)"
  wbs_code: string;   // Ex: "02.04.01"
  task_name: string;  // Ex: "Alvenaria de Vedação — Pavimento 08"
  location_name: string; // Ex: "Pavimento 08 — Torre A"
  assigned_user_id: string; // Ex: "usr-02"
  assigned_user_name: string; // Ex: "Antônio Santos (Encarregado)"
  company_type: 'PROPRIA' | 'TERCEIRIZADA';
  company_name: string;
  quantity_planned_week: number;
  quantity_planned_today: number;
  quantity_executed_week: number;
  uom: string; // "m²", "m³", "pontos", etc.
  is_critical: boolean;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// 11. CONTATOS DE CAMPO, GRUPOS WHATSAPP & LGPD (Lei 13.709/2018)
// ---------------------------------------------------------------------
export type WhatsAppContactType = 'INDIVIDUAL' | 'GROUP';

export type WhatsAppContactRole =
  | 'MESTRE'
  | 'ENCARREGADO'
  | 'ENGENHEIRO'
  | 'EMPREITEIRO'
  | 'FORNECEDOR'
  | 'GRUPO_FRENTE';

export interface WhatsAppContact {
  id: string;
  name: string;                         // Nome do contato ou do grupo (ex: "Antônio Santos" ou "Grupo Estrutura — Torre A")
  type: WhatsAppContactType;            // INDIVIDUAL ou GROUP
  role: WhatsAppContactRole;
  phone_or_jid: string;                 // Telefone E.164 (+5541999998888) ou Group JID (1203630248291823@g.us)
  company_name: string;                 // "ConstruKore" ou nome da empreiteira
  company_type: 'PROPRIA' | 'TERCEIRIZADA';
  assigned_wbs_tasks?: string[];        // Tarefas sob responsabilidade do contato
  assigned_location?: string;           // Local principal (ex: "Torre A - Pav. 08")
  is_active: boolean;                   // Se false, inativado / opt-out
  
  // Conformidade LGPD (Bases legais na Construção Civil)
  lgpd_consent_status: 'ACCEPTED' | 'PENDING' | 'REVOKED';
  lgpd_legal_basis: 'EXECUCAO_CONTRATO' | 'LEGITIMO_INTERESSE' | 'OBRIGACAO_LEGAL_NR18';
  lgpd_consent_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionTemplate {
  id: string;
  category: InformationRequestType;
  tone: 'DIRETO' | 'AMIGAVEL' | 'URGENTE';
  target_type: 'INDIVIDUAL' | 'GROUP';
  template_text: string; // Variação textual com placeholders: {nome}, {tarefa}, {local}, {uom}, {material}
}

// ---------------------------------------------------------------------
// 12. ESTRUTURA DE LOCAIS DA OBRA & CLOUDFLARE R2 STORAGE
// ---------------------------------------------------------------------
export interface LocationItem {
  id: string;
  codigo: string;
  nome: string;
  ordem?: number;
}

export interface ObraLocationsConfig {
  torres: LocationItem[];
  pavimentos: LocationItem[];
  ambientes: LocationItem[];
  atualizado_em?: string;
}

export interface R2StorageConfig {
  accountId: string;          // Cloudflare Account ID (32 chars hex)
  bucketName: string;         // Nome do bucket (ex: construkore-rdo-media)
  publicDomainUrl: string;    // URL pública / custom domain (ex: https://pub-xxx.r2.dev ou https://media.suaobra.com.br)
  uploadEndpointUrl?: string; // Endpoint seguro de upload (Cloudflare Worker ou Webhook n8n na VPS)
  apiKey?: string;            // Opcional: Token bearer simples para proteger o webhook do n8n / worker
  enabled: boolean;           // Se true, envia diretamente para a nuvem
  autoSync: boolean;          // Sincronizar automaticamente quando online
}

export interface CurrentPhotoLocationSelection {
  torreId: string | null;
  pavimentoId: string | null;
  ambienteId: string | null;
}



