import React, { useState, useEffect } from 'react';
import {
  PrevisionDiarioService,
  PrevisionObra,
  PrevisionRelatorioListItem,
  PrevisionRelatorioDetalhe,
} from '../../services/previsionDiarioService';
import { DiaryState } from '../../services/diaryStorage';
import {
  Building2,
  Calendar,
  Camera,
  Users,
  HardHat,
  Search,
  Filter,
  Eye,
  DownloadCloud,
  FileText,
  CloudRain,
  Sun,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  Wrench,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface PrevisionArchiveViewerPanelProps {
  diaryState: DiaryState;
  onUpdateState: (newState: DiaryState) => void;
  onNavigateToSection?: (section: any) => void;
}

export const PrevisionArchiveViewerPanel: React.FC<PrevisionArchiveViewerPanelProps> = ({
  diaryState,
  onUpdateState,
  onNavigateToSection,
}) => {
  const [obras, setObras] = useState<PrevisionObra[]>([]);
  const [selectedObraId, setSelectedObraId] = useState<string>('');
  const [relatorios, setRelatorios] = useState<PrevisionRelatorioListItem[]>([]);
  const [totalRelatorios, setTotalRelatorios] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'DRAFT' | 'RAIN'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [inspectedDetalhe, setInspectedDetalhe] = useState<PrevisionRelatorioDetalhe | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKFORCE' | 'ACTIVITIES' | 'PHOTOS' | 'EQUIPMENT'>('OVERVIEW');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [selectedPhotoZoom, setSelectedPhotoZoom] = useState<string | null>(null);

  // Carrega lista de obras na montagem
  useEffect(() => {
    async function loadObras() {
      setIsLoading(true);
      const list = await PrevisionDiarioService.fetchObras();
      setObras(list);
      if (list.length > 0) {
        // Seleciona Poty como default ou a primeira obra
        const defaultObra = list.find((o) => o.nome.toLowerCase().includes('poty')) || list[0];
        setSelectedObraId(defaultObra.obra_id);
      }
      setIsLoading(false);
    }
    loadObras();
  }, []);

  // Carrega relatórios quando a obra selecionada, página ou busca mudam
  useEffect(() => {
    if (!selectedObraId) return;

    async function loadReports() {
      setIsLoading(true);
      const res = await PrevisionDiarioService.fetchRelatorios({
        obraId: selectedObraId,
        page,
        limit: 30,
        search: searchTerm,
      });
      setRelatorios(res.records);
      setTotalRelatorios(res.total);
      setIsLoading(false);
    }

    loadReports();
  }, [selectedObraId, page, searchTerm]);

  const selectedObra = obras.find((o) => o.obra_id === selectedObraId);

  // Filtra relatórios por status no front
  const filteredRelatorios = relatorios.filter((r) => {
    if (statusFilter === 'APPROVED') return r.status?.toLowerCase().includes('aprovado');
    if (statusFilter === 'DRAFT') return !r.status?.toLowerCase().includes('aprovado');
    if (statusFilter === 'RAIN') return r.dia_chuvoso || r.dia_impraticavel;
    return true;
  });

  // Abre modal para inspecionar um RDO em detalhes
  const handleInspect = async (relatorioId: string) => {
    setIsLoading(true);
    const detalhe = await PrevisionDiarioService.fetchDetalheRelatorio(relatorioId);
    if (detalhe) {
      setInspectedDetalhe(detalhe);
      setActiveTab('OVERVIEW');
      setInspectModalOpen(true);
    }
    setIsLoading(false);
  };

  // Clona o efetivo e frentes de serviço do RDO histórico para o dia de hoje no Core Diário
  const handleAdoptAsBase = (detalhe: PrevisionRelatorioDetalhe) => {
    const novosCargos = PrevisionDiarioService.mapearMaoObra(detalhe.maoObra || []);
    const novasAtividades = PrevisionDiarioService.mapearAtividades(detalhe.atividades || [], diaryState.reportingDay.id);
    const novasFotos = PrevisionDiarioService.mapearFotos(detalhe.fotos || [], diaryState.reportingDay.id, diaryState.reportingDay.report_date);

    const totalOperarios = novosCargos.reduce((acc, c) => acc + c.count, 0);

    const updatedState: DiaryState = {
      ...diaryState,
      project: {
        ...diaryState.project,
        nome: `${detalhe.relatorio.obra_nome || selectedObra?.nome || 'Obra'} (Base Prevision)`,
      },
      workforceSnapshot: {
        ...diaryState.workforceSnapshot,
        total_workers: totalOperarios,
        entries: novosCargos,
        copied_from_yesterday: true,
      },
      productionEntries: novasAtividades.length > 0 ? novasAtividades : diaryState.productionEntries,
      sourceEvents: novasFotos.length > 0 ? [...novasFotos, ...diaryState.sourceEvents] : diaryState.sourceEvents,
    };

    onUpdateState(updatedState);
    setFeedbackMsg(`Dados do RDO #${detalhe.relatorio.numero} importados com sucesso! ${totalOperarios} operários e ${novasAtividades.length} frentes carregadas para hoje.`);
    setTimeout(() => setFeedbackMsg(null), 6000);
    setInspectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast de Feedback */}
      {feedbackMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-100 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header com Seletor de Obras e Estatísticas */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                PostgreSQL • VPS Integrada
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Modo Somente Leitura
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Acervo de Diários de Obra (Prevision)
            </h1>
            <p className="text-sm text-slate-500">
              Acesse e navegue pelo acervo de 16 obras e mais de 2.100 relatórios diários arquivados na sua VPS.
            </p>
          </div>

          {/* Seletor de Obra */}
          <div className="min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Selecionar Obra Ativa:
            </label>
            <select
              value={selectedObraId}
              onChange={(e) => {
                setSelectedObraId(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {obras.map((obra) => (
                <option key={obra.obra_id} value={obra.obra_id}>
                  {obra.nome} ({obra.relatorios} RDOs) • {obra.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo da Obra Selecionada */}
        {selectedObra && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-xs text-slate-500 block">Total de RDOs</span>
              <span className="text-xl font-bold text-slate-900">{selectedObra.relatorios}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-xs text-slate-500 block">Fotos Registradas</span>
              <span className="text-xl font-bold text-slate-900">{selectedObra.total_fotos || 'Centenas'}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-xs text-slate-500 block">Primeiro Relatório</span>
              <span className="text-sm font-semibold text-slate-800">
                {selectedObra.primeira_data ? selectedObra.primeira_data.split('-').reverse().join('/') : 'Início da Obra'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-xs text-slate-500 block">Último Relatório</span>
              <span className="text-sm font-semibold text-slate-800">
                {selectedObra.ultima_data ? selectedObra.ultima_data.split('-').reverse().join('/') : 'Recente'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número do RDO (ex: 147) ou termo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({relatorios.length})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovados
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Em Aberto / Rascunho
          </button>
          <button
            onClick={() => setStatusFilter('RAIN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              statusFilter === 'RAIN'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Chuva / Intempérie
          </button>
        </div>
      </div>

      {/* Lista de Relatórios */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-medium">Carregando acervo de diários da VPS...</p>
        </div>
      ) : filteredRelatorios.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">Nenhum diário encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros ou selecionar outra obra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRelatorios.map((rdo) => {
            const isApproved = rdo.status?.toLowerCase().includes('aprovado');
            const dataFormatada = rdo.data ? rdo.data.split('-').reverse().join('/') : rdo.data;

            return (
              <div
                key={rdo.relatorio_id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        RDO #{rdo.numero}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1">{dataFormatada}</h3>
                      <span className="text-xs text-slate-500">{rdo.dia_semana}</span>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rdo.status}
                    </span>
                  </div>

                  {/* Condições Climáticas */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-3 bg-slate-50 p-2 rounded-lg">
                    {rdo.dia_chuvoso ? (
                      <CloudRain className="w-4 h-4 text-indigo-500 shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span>
                      {rdo.clima_manha || 'Claro'} • {rdo.condicao_manha || 'Praticável'}
                    </span>
                    {rdo.dia_impraticavel && (
                      <span className="text-red-600 font-bold ml-auto text-[10px] uppercase">Impraticável</span>
                    )}
                  </div>

                  {/* Meta informações */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      {rdo.total_fotos} fotos
                    </span>
                    {rdo.criado_por && (
                      <span className="truncate max-w-[150px]" title={rdo.criado_por}>
                        Por: {rdo.criado_por}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleInspect(rdo.relatorio_id)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspecionar RDO
                  </button>

                  {rdo.link_pdf && (
                    <a
                      href={rdo.link_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Abrir PDF Original"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600 shadow-sm">
        <span>
          Exibindo página <strong>{page + 1}</strong> de <strong>{Math.max(1, Math.ceil(totalRelatorios / 30))}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * 30 >= totalRelatorios}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Próxima <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal de Leitura Integral do RDO */}
      {inspectModalOpen && inspectedDetalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Cabeçalho do Modal */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    RDO #{inspectedDetalhe.relatorio.numero}
                  </span>
                  <span className="text-xs text-slate-400">
                    Obra: {inspectedDetalhe.relatorio.obra_nome || selectedObra?.nome}
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-1">
                  {inspectedDetalhe.relatorio.data?.split('-').reverse().join('/')} ({inspectedDetalhe.relatorio.dia_semana})
                </h2>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas de Navegação no Modal */}
            <div className="bg-slate-100 px-5 pt-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-white text-blue-700 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Geral & Clima
              </button>
              <button
                onClick={() => setActiveTab('WORKFORCE')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'WORKFORCE'
                    ? 'bg-white text-blue-700 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                Efetivo ({inspectedDetalhe.maoObra?.reduce((acc, c) => acc + c.quantidade, 0) || 0})
              </button>
              <button
                onClick={() => setActiveTab('ACTIVITIES')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'ACTIVITIES'
                    ? 'bg-white text-blue-700 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Atividades ({inspectedDetalhe.atividades?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('PHOTOS')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'PHOTOS'
                    ? 'bg-white text-blue-700 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Fotos ({inspectedDetalhe.fotos?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('EQUIPMENT')}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'EQUIPMENT'
                    ? 'bg-white text-blue-700 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Equipamentos ({inspectedDetalhe.equipamentos?.length || 0})
              </button>
            </div>

            {/* Conteúdo da Aba */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Status Oficial</span>
                      <span className="font-bold text-slate-900">{inspectedDetalhe.relatorio.status}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Total de Operários</span>
                      <span className="font-bold text-slate-900">
                        {inspectedDetalhe.maoObra?.reduce((acc, c) => acc + c.quantidade, 0) || 0} homens
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Responsável</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {inspectedDetalhe.relatorio.criado_por || 'Engenharia'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Sincronizado em</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {inspectedDetalhe.relatorio.created_api || inspectedDetalhe.relatorio.criado_em || 'Original'}
                      </span>
                    </div>
                  </div>

                  {/* Detalhe de Clima */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Condições Meteorológicas por Turno
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Manhã</span>
                        <span className="font-bold text-xs text-slate-900">
                          {inspectedDetalhe.relatorio.clima_manha || 'Claro'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {inspectedDetalhe.relatorio.condicao_manha || 'Praticável'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Tarde</span>
                        <span className="font-bold text-xs text-slate-900">
                          {inspectedDetalhe.relatorio.clima_tarde || 'Claro'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {inspectedDetalhe.relatorio.condicao_tarde || 'Praticável'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Noite</span>
                        <span className="font-bold text-xs text-slate-900">
                          {inspectedDetalhe.relatorio.clima_noite || 'Claro'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {inspectedDetalhe.relatorio.condicao_noite || 'Praticável'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Link PDF */}
                  {inspectedDetalhe.relatorio.link_pdf && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-blue-900 font-medium">
                        Documento oficial original arquivado na plataforma de origem
                      </span>
                      <a
                        href={inspectedDetalhe.relatorio.link_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver PDF Original
                      </a>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'WORKFORCE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                    <span>Função / Cargo</span>
                    <span>Qtd / Empreiteira</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {inspectedDetalhe.maoObra?.map((item, idx) => {
                      const isPropria =
                        item.empreiteira?.toUpperCase().includes('PIEMONTE') ||
                        item.empreiteira?.toUpperCase().includes('CONSTRUKORE');

                      return (
                        <div key={idx} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{item.funcao}</span>
                            <span className="text-xs text-slate-500">{item.empreiteira}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-blue-600 block">{item.quantidade} un</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isPropria ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isPropria ? 'Própria' : 'Terceirizada'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'ACTIVITIES' && (
                <div className="space-y-2">
                  {inspectedDetalhe.atividades?.map((ativ, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{ativ.descricao}</p>
                        {ativ.observacao && <p className="text-xs text-slate-500 mt-1">{ativ.observacao}</p>}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                        {ativ.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'PHOTOS' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inspectedDetalhe.fotos?.map((foto, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 group cursor-pointer"
                      onClick={() => setSelectedPhotoZoom(foto.url)}
                    >
                      <img
                        src={foto.url_miniatura || foto.url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="p-2 text-[11px] text-slate-600 truncate bg-white">
                        {foto.descricao || `Foto #${idx + 1} (${foto.origem || 'Canteiro'})`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'EQUIPMENT' && (
                <div className="grid grid-cols-2 gap-3">
                  {inspectedDetalhe.equipamentos?.map((eq, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-800">{eq.descricao}</span>
                      </div>
                      <span className="font-bold text-sm text-blue-600">{eq.quantidade} un</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rodapé com Ação de Portabilidade */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Leitura protegida contra escrita no PostgreSQL
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleAdoptAsBase(inspectedDetalhe)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Importar Efetivo & Frentes para Hoje
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom da Foto */}
      {selectedPhotoZoom && (
        <div
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setSelectedPhotoZoom(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedPhotoZoom} alt="Foto ampliada" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            <button
              onClick={() => setSelectedPhotoZoom(null)}
              className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
