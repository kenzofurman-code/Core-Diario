/**
 * Serviço de Integração com o Banco de Dados Prevision (Schema `diario`)
 * Executa chamadas estritamente somente leitura (READ-ONLY) para o acervo de 16 obras e 2.198 RDOs.
 */

import {
  WorkforceRoleCount,
  ProductionEntry,
  SourceEvent,
} from '../types/diary.types';

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
    return itens.map((item) => {
      const empreiteiraLimpa = item.empreiteira?.trim() || 'Empreiteira Contratada';
      const isPropria =
        empreiteiraLimpa.toUpperCase().includes('PIEMONTE') ||
        empreiteiraLimpa.toUpperCase().includes('CONSTRUKORE');

      return {
        role_code: item.funcao.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X'),
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
  public static mapearFotos(fotos: PrevisionFotoItem[], reportingDayId: string, dataIso: string): SourceEvent[] {
    return fotos.map((foto, idx) => ({
      id: `prev-foto-${idx + 1}`,
      tenant_id: 'tenant-prevision',
      project_id: 'poty-01',
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
    ];
  }
}
