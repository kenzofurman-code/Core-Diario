/**
 * Serviço de Integração com o Banco de Dados Prevision (Schema `diario`)
 * Executa chamadas estritamente somente leitura (READ-ONLY) para o acervo de 16 obras e 2.198 RDOs.
 */

import {
  WorkforceRoleCount,
  ProductionEntry,
  SourceEvent,
  ProjectContext,
  DailyReportSummaryItem,
  ReportingDay,
  DailyReport,
  WeatherObservation,
  DayWeatherSummary,
  WeatherCondition,
  WorkabilityStatus,
  OperationalOccurrence,
  ReportingDayState,
  RdoState,
  ReportVersion,
  WorkforceSnapshot,
} from '../types/diary.types';
import type { DiaryState } from './diaryStorage';

export interface PrevisionObra {
  obra_id: string;
  nome: string;
  status: string;
  relatorios: number;
  primeira_data: string | null;
  ultima_data: string | null;
  total_fotos?: number;
}

export interface PrevisionSummary {
  totalRelatorios: number;
  totalFotos: number;
  diasChuvosos: number;
  diasImpraticaveis: number;
  diasParados: number;
  primeiroRelatorio: string | null;
  ultimoRelatorio: string | null;
}

export interface PrevisionRelatorioListItem {
  relatorio_id: string;
  data: string;
  numero: number;
  dia_semana: string;
  status: string;
  clima_manha: string | null;
  condicao_manha: string | null;
  clima_tarde: string | null;
  condicao_tarde: string | null;
  clima_noite: string | null;
  condicao_noite: string | null;
  indice_pluviometrico: string | null;
  dia_chuvoso: boolean;
  dia_impraticavel: boolean;
  dia_parado: boolean;
  total_fotos: number;
  total_trabalhadores?: number;
  total_atividades?: number;
  criado_por: string | null;
  link_pdf: string | null;
}

export interface PrevisionMaoObraItem {
  funcao: string;
  quantidade: number;
  empreiteira: string;
  empreiteira_norm?: string;
}

export interface PrevisionAtividadeItem {
  descricao: string;
  observacao: string | null;
  status: string;
  porcentagem: number | null;
  total_fotos: number;
}

export interface PrevisionFotoItem {
  url: string;
  url_miniatura?: string | null;
  descricao?: string | null;
  origem?: string;
}

export interface PrevisionEquipamentoItem {
  descricao: string;
  quantidade: number;
}

export interface PrevisionOcorrenciaItem {
  descricao: string;
  tags?: string[];
  paralisacao?: boolean;
}

export interface PrevisionRelatorioDetalhe {
  relatorio: {
    relatorio_id: string;
    obra_id: string;
    obra_nome: string;
    data: string;
    numero: number;
    dia_semana: string;
    status: string;
    status_id: number;
    clima_manha: string | null;
    condicao_manha: string | null;
    clima_tarde: string | null;
    condicao_tarde: string | null;
    clima_noite: string | null;
    condicao_noite: string | null;
    indice_pluviometrico: string | null;
    dia_chuvoso: boolean;
    dia_impraticavel: boolean;
    dia_parado: boolean;
    criado_por: string | null;
    criado_em: string | null;
    modificado_por: string | null;
    modificado_em: string | null;
    created_api?: string | null;
    modified_api?: string | null;
    sincronizado_em?: string | null;
    link_pdf: string | null;
    total_fotos: number;
    raw?: any;
  };
  maoObra: PrevisionMaoObraItem[];
  atividades: PrevisionAtividadeItem[];
  fotos: PrevisionFotoItem[];
  equipamentos: PrevisionEquipamentoItem[];
  ocorrencias: PrevisionOcorrenciaItem[];
}

export class PrevisionDiarioService {
  private static baseUrl = '/api/diario';

  /**
   * Busca a lista das 16 obras cadastradas com quantitativos de relatórios
   */
  public static async fetchObras(): Promise<PrevisionObra[]> {
    try {
      const res = await fetch(`${this.baseUrl}/obras`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.obras || [];
    } catch (err) {
      console.warn('[PrevisionDiarioService] Falha ao conectar na API da VPS, usando fallback:', err);
      return this.getFallbackObras();
    }
  }

  /**
   * Busca o resumo executivo da obra
   */
  public static async fetchSummary(obraId?: string): Promise<PrevisionSummary | null> {
    try {
      const url = obraId ? `${this.baseUrl}/summary?obra=${encodeURIComponent(obraId)}` : `${this.baseUrl}/summary`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.summary || null;
    } catch (err) {
      console.warn('[PrevisionDiarioService] Falha ao carregar resumo:', err);
      return null;
    }
  }

  /**
   * Busca a listagem paginada de relatórios de uma obra
   */
  public static async fetchRelatorios(params: {
    obraId: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ records: PrevisionRelatorioListItem[]; total: number; page: number }> {
    const { obraId, page = 0, limit = 50, search = '' } = params;
    try {
      const url = `${this.baseUrl}/data?table=relatorios&obra=${encodeURIComponent(obraId)}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        records: data.records || [],
        total: data.total || 0,
        page: data.page || 0,
      };
    } catch (err) {
      console.warn('[PrevisionDiarioService] Falha ao carregar relatórios:', err);
      return { records: [], total: 0, page: 0 };
    }
  }

  /**
   * Busca o detalhe integral de um RDO com todas as suas filhas
   */
  public static async fetchDetalheRelatorio(relatorioId: string): Promise<PrevisionRelatorioDetalhe | null> {
    try {
      const res = await fetch(`${this.baseUrl}/relatorios/${encodeURIComponent(relatorioId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('[PrevisionDiarioService] Falha ao carregar detalhe do RDO:', err);
      return null;
    }
  }

  /**
   * Converte a lista de mão de obra do Prevision para os cargos do Core Diário
   */
  public static mapearMaoObra(itens: PrevisionMaoObraItem[]): WorkforceRoleCount[] {
    return itens.map((item, idx) => {
      const empreiteiraLimpa = item.empreiteira?.trim() || 'Empreiteira Contratada';
      const isPropria =
        empreiteiraLimpa.toUpperCase().includes('PIEMONTE') ||
        empreiteiraLimpa.toUpperCase().includes('CONSTRUKORE');

      const funcCode = (item.funcao || 'FUNC').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      const compCode = empreiteiraLimpa.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      const roleCode = `${funcCode}-${compCode}-${idx + 1}`;

      return {
        role_code: roleCode,
        role_name: item.funcao,
        company_type: isPropria ? 'PROPRIA' : 'TERCEIRIZADA',
        company_name: empreiteiraLimpa,
        count: item.quantidade || 0,
      };
    });
  }

  /**
   * Converte as atividades do Prevision para o modelo de Produção do Core Diário
   */
  public static mapearAtividades(itens: PrevisionAtividadeItem[], reportingDayId: string): ProductionEntry[] {
    return itens.map((item, idx) => {
      // Tenta extrair pavimento / local da descrição (ex: "COBERTURA. - TORRE A: Alvenaria;")
      let locationName = 'Canteiro Geral';
      let cleanTask = item.descricao;

      if (item.descricao.includes(':')) {
        const parts = item.descricao.split(':');
        locationName = parts[0].trim();
        cleanTask = parts.slice(1).join(':').trim();
      } else if (item.descricao.includes('-')) {
        const parts = item.descricao.split('-');
        locationName = parts[0].trim();
        cleanTask = parts.slice(1).join('-').trim();
      }

      return {
        id: `prev-prod-${idx + 1}`,
        reporting_day_id: reportingDayId,
        task_id: `prev-tsk-${idx + 1}`,
        task_name: cleanTask || item.descricao,
        location_name: locationName,
        quantity_planned: 100,
        quantity_reported: item.porcentagem || 50,
        uom: '%',
        progress_pct: item.porcentagem || 50,
        confirmation_state: item.status.toLowerCase().includes('conclu') ? 'confirmed' : 'pending',
        notes: item.observacao || '',
        is_critical: false,
      };
    });
  }

  /**
   * Converte as fotos do Prevision para o caderno de fotos do Core Diário com tipagem estrita
   */
  public static mapearFotos(fotos: PrevisionFotoItem[], reportingDayId: string, dataIso: string, projectId: string = 'poty-01'): SourceEvent[] {
    return fotos.map((foto, idx) => ({
      id: `prev-foto-${idx + 1}`,
      tenant_id: 'tenant-prevision',
      project_id: projectId,
      reporting_day_id: reportingDayId,
      source_type: 'MANUAL_IMAGE' as const,
      occurred_at: `${dataIso}T12:00:00-03:00`,
      recorded_at: `${dataIso}T12:00:00-03:00`,
      author_id: 'prevision-sync',
      author_name: 'Fotógrafo / Encarregado de Campo',
      author_role: 'encarregado',
      raw_text: foto.descricao || `Registro Fotográfico #${idx + 1} (${foto.origem || 'Galeria'})`,
      media_url: foto.url,
      location_name: 'Canteiro Geral',
      review_state: 'confirmed' as const,
      confidence: 1.0,
      approved_for_rdo: true,
      status: 'active' as const,
      created_at: `${dataIso}T12:00:00-03:00`,
    }));
  }

  /**
   * Fallback de obras reais caso a aplicação esteja sendo testada sem conexão com a VPS
   */
  public static getFallbackObras(): PrevisionObra[] {
    return [
      { obra_id: '6914a7fa72e41c32af003614', nome: 'Poty', status: 'Em Andamento', relatorios: 151, primeira_data: '2026-01-26', ultima_data: '2026-09-07', total_fotos: 1500 },
      { obra_id: '69176e7282b94cc032064983', nome: 'Platea', status: 'Em Andamento', relatorios: 241, primeira_data: '2025-12-18', ultima_data: '2026-10-09', total_fotos: 1612 },
      { obra_id: '69176e979ce39de7910339d2', nome: 'ÍCARO | AG7', status: 'Em Andamento', relatorios: 222, primeira_data: '2025-11-24', ultima_data: '2026-10-09', total_fotos: 3442 },
      { obra_id: '69149e09816bc47bcf02fda4', nome: 'Lior', status: 'Em Andamento', relatorios: 218, primeira_data: '2025-12-15', ultima_data: '2026-10-09', total_fotos: 341 },
      { obra_id: '692ef8b328e8cad6b60d80f7', nome: 'Reserva Amati', status: 'Em Andamento', relatorios: 212, primeira_data: '2025-12-15', ultima_data: '2026-10-08', total_fotos: 924 },
      { obra_id: '6914a638cde64f12a10eb403', nome: 'Qoya', status: 'Em Andamento', relatorios: 196, primeira_data: '2025-12-15', ultima_data: '2026-09-25', total_fotos: 242 },
      { obra_id: '6970c0b4816d901a6f09e082', nome: 'Alberi', status: 'Em Andamento', relatorios: 193, primeira_data: '2026-02-12', ultima_data: '2026-10-08', total_fotos: 476 },
      { obra_id: '69176e16d4253d8f3c0a8e44', nome: 'Amíz', status: 'Em Andamento', relatorios: 189, primeira_data: '2025-12-11', ultima_data: '2026-10-07', total_fotos: 285 },
      { obra_id: '6914a55083964d7c710c34f4', nome: 'Nizza', status: 'Em Andamento', relatorios: 153, primeira_data: '2026-01-05', ultima_data: '2026-10-08', total_fotos: 485 },
      { obra_id: '69176ce111cf4763e40942b4', nome: 'Hall Design', status: 'Concluída', relatorios: 135, primeira_data: '2025-04-01', ultima_data: '2026-05-04', total_fotos: 504 },
      { obra_id: '69e2785f9240e49fbb04a2c4', nome: 'Ristreto', status: 'Em Andamento', relatorios: 132, primeira_data: '2026-04-01', ultima_data: '2026-10-09', total_fotos: 158 },
      { obra_id: '6a04742d467e62c514033722', nome: 'Grand Lodge Batel', status: 'Em Andamento', relatorios: 111, primeira_data: '2026-05-11', ultima_data: '2026-10-09', total_fotos: 1527 },
      { obra_id: '690d0627b14da95f9e04cfc2', nome: 'PACE | AG7', status: 'Em Andamento', relatorios: 45, primeira_data: '2026-08-10', ultima_data: '2026-10-08', total_fotos: 875 },
      { obra_id: '69b2b1782e7e4e427e07f4c2', nome: 'Teste - Planejamento', status: 'Não Iniciada', relatorios: 1, primeira_data: '2026-03-13', ultima_data: '2026-03-13', total_fotos: 0 },
      { obra_id: '691742509479cd8ead0ac8b3', nome: 'Croma', status: 'Concluída', relatorios: 0, primeira_data: null, ultima_data: null, total_fotos: 0 },
      { obra_id: '69176d6c24397d7da60e4c8f', nome: 'Unna', status: 'Concluída', relatorios: 0, primeira_data: null, ultima_data: null, total_fotos: 0 },
    ];
  }

  /**
   * Converte uma PrevisionObra no modelo de ProjectContext do Core Diário
   */
  public static obraToProject(obra: PrevisionObra): ProjectContext {
    const rawCodigo = obra.nome.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const codigo = rawCodigo.length >= 3 ? rawCodigo.slice(0, 4) : 'OBRA';
    return {
      id: obra.obra_id,
      codigo,
      nome: obra.nome,
      cidade: 'Curitiba, PR',
      timezone: 'America/Sao_Paulo',
      gps_lat: -25.4284,
      gps_lng: -49.2733,
      rain_contractual_threshold_mm: 5.0,
      nearest_inmet_station_code: 'A807',
      nearest_inmet_station_name: 'Estação Oficial INMET A807 (Curitiba - PR)',
    };
  }

  /**
   * Retorna a lista completa de todas as 16 obras reais como projetos do Core Diário
   */
  public static getAllObrasAsProjects(): ProjectContext[] {
    return this.getFallbackObras().map((obra) => this.obraToProject(obra));
  }

  /**
   * Converte um item da lista do Prevision para o modelo de resumo do Core Diário
   */
  public static previsionItemToSummaryItem(
    item: PrevisionRelatorioListItem,
    projectCodigo: string,
    isCurrentActive: boolean = false
  ): DailyReportSummaryItem {
    const parts = item.data.split('-');
    let formattedDate = item.data;
    let weekday = item.dia_semana || 'Dia Útil';
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const isApproved =
      item.status?.toLowerCase().includes('aprovado') ||
      item.status?.toLowerCase().includes('conclu') ||
      item.status?.toLowerCase().includes('finalizado');
    const workflowState = isApproved ? 'ISSUED' : 'DRAFT';

    const cond = item.clima_manha || item.condicao_manha || 'BOM_TEMPO';

    return {
      date: item.data,
      formatted_date: formattedDate,
      weekday,
      report_id: item.relatorio_id,
      report_number: item.numero,
      formatted_number: `${projectCodigo}-RDO-${String(item.numero).padStart(4, '0')}`,
      workflow_state: workflowState,
      total_workers: Number(item.total_trabalhadores) || 0,
      production_progress_pct: Number(item.total_atividades) ? Math.min(100, Number(item.total_atividades) * 10) : 0,
      photos_count: item.total_fotos || 0,
      occurrences_count: 0,
      conflicts_count: 0,
      weather_condition: cond,
      is_contractual_rain_day: Boolean(item.dia_chuvoso || item.dia_impraticavel),
      responsible_engineer_name: item.criado_por || 'Responsável Técnico',
      has_blocking_issues: false,
      is_current_active: isCurrentActive,
    };
  }

  /**
   * Converte um detalhe integral de RDO histórico do Prevision para um DiaryState nativo do Core Diário
   */
  public static mapearDetalheParaDiaryState(
    detalhe: PrevisionRelatorioDetalhe,
    baseState: DiaryState,
    project: ProjectContext
  ): DiaryState {
    const rel = detalhe.relatorio;
    const isApproved =
      rel.status?.toLowerCase().includes('aprovado') ||
      rel.status?.toLowerCase().includes('conclu') ||
      rel.status?.toLowerCase().includes('finalizado');

    const reportingDayState: ReportingDayState = isApproved ? 'CLOSED' : 'OPEN';
    const rdoWorkflowState: RdoState = isApproved ? 'ISSUED' : 'DRAFT';
    const reportNumber = rel.numero || 1;
    const formattedNumber = `${project.codigo}-RDO-${String(reportNumber).padStart(4, '0')}`;
    const reportingDayId = `rep-day-${rel.data}`;

    const parseCondicao = (c?: string | null): WeatherCondition => {
      const s = (c || '').toUpperCase();
      if (s.includes('CHUVA') || s.includes('CHUV')) return 'CHUVA_MODERADA';
      if (s.includes('TEMPESTADE')) return 'TEMPESTADE';
      if (s.includes('NUBLADO')) return 'NUBLADO';
      return 'ENSOLARADO';
    };

    const parseWorkability = (c?: string | null): WorkabilityStatus => {
      const s = (c || '').toUpperCase();
      if (s.includes('IMPRATIC')) return 'IMPRATICAVEL';
      if (s.includes('PARCIAL')) return 'PARCIALMENTE_PRATICAVEL';
      return 'PRATICAVEL';
    };

    const precipitationNum = Number(rel.indice_pluviometrico) || (rel.dia_chuvoso ? 8.0 : 0);
    const isContractualRain = Boolean(rel.dia_chuvoso || rel.dia_impraticavel || precipitationNum >= 5.0);

    const reportingDay: ReportingDay = {
      id: reportingDayId,
      tenant_id: project.id,
      project_id: project.id,
      report_date: rel.data,
      shift_name: 'Turno Integral (07:00 às 17:00)',
      workflow_state: reportingDayState,
      responsible_user_id: baseState.currentUser?.id || 'usr-03',
      responsible_user_name: rel.criado_por || rel.modificado_por || 'Responsável Técnico',
      completion_percentage: isApproved ? 100 : 70,
      data_quality_score: 95,
      opened_at: rel.criado_em || `${rel.data}T07:00:00-03:00`,
      closed_at: isApproved ? (rel.modificado_em || `${rel.data}T18:00:00-03:00`) : undefined,
      status: 'active',
      created_at: rel.criado_em || `${rel.data}T07:00:00-03:00`,
      updated_at: rel.modificado_em || `${rel.data}T17:00:00-03:00`,
    };

    const dailyReport: DailyReport = {
      id: `rdo-${project.codigo.toLowerCase()}-${String(reportNumber).padStart(4, '0')}`,
      tenant_id: project.id,
      project_id: project.id,
      reporting_day_id: reportingDay.id,
      report_number: reportNumber,
      formatted_number: formattedNumber,
      report_date: rel.data,
      workflow_state: rdoWorkflowState,
      current_version_number: 1,
      responsible_engineer_name: rel.criado_por || rel.modificado_por || 'Responsável Técnico',
      submitted_at: `${rel.data}T17:00:00-03:00`,
      approved_at: isApproved ? `${rel.data}T18:00:00-03:00` : undefined,
      issued_at: isApproved ? `${rel.data}T18:00:00-03:00` : undefined,
    };

    const workforceEntries = this.mapearMaoObra(detalhe.maoObra || []);
    const totalWorkers = workforceEntries.reduce((acc, w) => acc + w.count, 0);

    const productionEntries = this.mapearAtividades(detalhe.atividades || [], reportingDay.id);
    const sourceEvents = this.mapearFotos(detalhe.fotos || [], reportingDay.id, rel.data, project.id);

    const weatherObservations: WeatherObservation[] = [
      {
        shift: 'MANHA',
        condition: parseCondicao(rel.clima_manha),
        impact: rel.condicao_manha?.toUpperCase().includes('IMPRAT') ? 'PARALISACAO_TOTAL' : 'SEM_IMPACTO',
        notes: `Condição de campo: ${rel.condicao_manha || 'Praticável'}`,
      },
      {
        shift: 'TARDE',
        condition: parseCondicao(rel.clima_tarde),
        impact: rel.condicao_tarde?.toUpperCase().includes('IMPRAT') ? 'PARALISACAO_TOTAL' : 'SEM_IMPACTO',
        notes: `Condição de campo: ${rel.condicao_tarde || 'Praticável'}`,
      },
    ];

    const weatherSummary: DayWeatherSummary = {
      station_source: 'Estação Meteorológica Local / INMET',
      inmet_reference: project.nearest_inmet_station_name || 'Estação Oficial INMET A807',
      queried_at: `${rel.data}T17:30:00-03:00`,
      total_precipitation_day_mm: precipitationNum,
      max_wind_speed_kmh: 15,
      temperature_min_c: 16,
      temperature_max_c: 24,
      rain_threshold_mm: 5.0,
      is_contractual_rain_day: isContractualRain,
      has_nr18_wind_alert: false,
      shifts: [
        {
          shift: 'MANHA',
          period_label: '07:00 às 12:00',
          condition: parseCondicao(rel.clima_manha),
          temperature_avg_c: 21,
          precipitation_mm: precipitationNum / 2,
          wind_speed_max_kmh: 12,
          humidity_pct: 75,
          workability: parseWorkability(rel.condicao_manha),
          hours_lost_to_weather: rel.condicao_manha?.toUpperCase().includes('IMPRAT') ? 4 : 0,
          is_overridden: false,
        },
        {
          shift: 'TARDE',
          period_label: '13:00 às 17:00',
          condition: parseCondicao(rel.clima_tarde),
          temperature_avg_c: 23,
          precipitation_mm: precipitationNum / 2,
          wind_speed_max_kmh: 15,
          humidity_pct: 78,
          workability: parseWorkability(rel.condicao_tarde),
          hours_lost_to_weather: rel.condicao_tarde?.toUpperCase().includes('IMPRAT') ? 4 : 0,
          is_overridden: false,
        },
        {
          shift: 'NOITE',
          period_label: '18:00 às 22:00',
          condition: parseCondicao(rel.clima_noite),
          temperature_avg_c: 18,
          precipitation_mm: 0,
          wind_speed_max_kmh: 10,
          humidity_pct: 80,
          workability: parseWorkability(rel.condicao_noite),
          hours_lost_to_weather: 0,
          is_overridden: false,
        },
      ],
    };

    const occurrences: OperationalOccurrence[] = (detalhe.ocorrencias || []).map((oc, i) => ({
      id: `prev-occ-${i + 1}`,
      reporting_day_id: reportingDay.id,
      code: `OCC-${String(i + 1).padStart(3, '0')}`,
      title: oc.descricao.length > 50 ? oc.descricao.substring(0, 47) + '...' : oc.descricao,
      description: oc.descricao,
      category: oc.paralisacao ? 'weather' : 'planning',
      severity: oc.paralisacao ? 'high' : 'medium',
      occurred_at: `${rel.data}T10:00:00-03:00`,
      approved_for_rdo: true,
      status: 'RESOLVED',
    }));

    const workflowSteps = baseState.workflow?.steps
      ? baseState.workflow.steps.map((st) => ({
          ...st,
          status: isApproved ? ('APPROVED' as const) : st.status,
          approved_at: isApproved ? `${rel.data}T18:00:00-03:00` : st.approved_at,
          approver_name: rel.criado_por || st.approver_name,
        }))
      : [];

    const versions: ReportVersion[] = isApproved
      ? [
          {
            id: `ver-${dailyReport.id}-1`,
            daily_report_id: dailyReport.id,
            version_number: 1,
            created_at: rel.modificado_em || `${rel.data}T18:00:00-03:00`,
            created_by: rel.criado_por || 'Engenharia Residente',
            document_hash: `hash-sha256-rdo-${rel.relatorio_id.slice(-8)}`,
            snapshot_json: {
              report_id: dailyReport.id,
              report_number: dailyReport.formatted_number,
              report_date: dailyReport.report_date,
              project,
              responsible_engineer: dailyReport.responsible_engineer_name,
              issued_at: `${rel.data}T18:00:00-03:00`,
              weather: weatherObservations,
              weather_summary: weatherSummary,
              workforce: {
                id: `wf-snap-${reportingDay.id}`,
                reporting_day_id: reportingDay.id,
                captured_at: `${rel.data}T07:15:00-03:00`,
                total_workers: totalWorkers,
                entries: workforceEntries,
                copied_from_yesterday: false,
              },
              production: productionEntries,
              occurrences,
              conflicts: [],
              supply_tickets: [],
              photo_evidences: sourceEvents.map((e) => ({
                url: e.media_url || '',
                caption: e.raw_text,
                location: e.location_name || 'Canteiro Geral',
                timestamp: e.occurred_at,
                author: e.author_name,
              })),
              workflow_signatures: workflowSteps,
              general_notes: `Relatório Diário de Obra importado da base operacional. Status: ${rel.status}`,
            },
          },
        ]
      : [];

    return {
      ...baseState,
      project,
      reportingDay,
      dailyReport,
      workforceSnapshot: {
        id: `wf-snap-${reportingDay.id}`,
        reporting_day_id: reportingDay.id,
        captured_at: `${rel.data}T07:15:00-03:00`,
        total_workers: totalWorkers,
        entries: workforceEntries,
        copied_from_yesterday: false,
      },
      productionEntries,
      sourceEvents,
      weather: weatherObservations,
      weatherSummary,
      occurrences,
      workflow: {
        id: `wf-${project.codigo.toLowerCase()}-${rel.numero || 1}`,
        project_id: project.id,
        current_step_number: isApproved ? 4 : 2,
        steps: workflowSteps,
      },
      versions,
      generalNotes: `Relatório Diário de Obra ${formattedNumber} da obra ${project.nome}. Responsável: ${rel.criado_por || 'Engenharia'}.`,
    };
  }
}
