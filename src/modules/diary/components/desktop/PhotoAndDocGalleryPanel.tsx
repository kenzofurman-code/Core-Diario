// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — GALERIA INTELIGENTE DE FOTOS & DOCUMENTOS
// Organização por Localização (Torre > Pavimento > Ambiente), Serviço e Categoria
// =====================================================================

import React, { useState, useMemo } from 'react';
import {
  Camera,
  FileText,
  Filter,
  Download,
  Eye,
  MapPin,
  Calendar,
  Building,
  Layers,
  Search,
  Plus,
  X,
  CheckCircle2,
  FileCheck,
  Shield,
  Tag,
  Clock,
  HardHat,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  SourceEvent,
  ObraLocationsConfig,
  TechnicalDocumentCategory,
  ProjectContext,
  UserContext,
} from '../../types/diary.types';
import { DiaryStorageService } from '../../services/diaryStorage';

interface PhotoAndDocGalleryPanelProps {
  project: ProjectContext;
  currentUser: UserContext;
  locationsConfig: ObraLocationsConfig;
  sourceEvents: SourceEvent[];
  onAddEvent?: (event: Partial<SourceEvent>) => void;
  readOnly?: boolean;
}

const DOCUMENT_CATEGORIES: { id: TechnicalDocumentCategory; label: string; color: string }[] = [
  { id: 'LAUDO_CONCRETO', label: 'Laudo de Concreto (Fck)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'FVS_SERVICO', label: 'Ficha de Verificação (FVS)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'SEGURANCA_TRABALHO', label: 'Segurança & NR-18', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'PROJETO_ASBUILT', label: 'Projeto / As-Built', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'NOTA_ENTREGA', label: 'Nota Fiscal / Entrega', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'RELATORIO_TECNICO', label: 'Relatório Técnico / Consultoria', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'OUTROS', label: 'Outros Documentos', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
];

export const PhotoAndDocGalleryPanel: React.FC<PhotoAndDocGalleryPanelProps> = ({
  project,
  currentUser,
  locationsConfig,
  sourceEvents,
  onAddEvent,
  readOnly = false,
}) => {
  // Estados de Filtro
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'PHOTOS' | 'DOCS'>('ALL');
  const [selectedTorreId, setSelectedTorreId] = useState<string>('ALL');
  const [selectedPavimentoId, setSelectedPavimentoId] = useState<string>('ALL');
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de Visualização (Lightbox)
  const [previewItem, setPreviewItem] = useState<SourceEvent | null>(null);

  // Modal de Upload / Inclusão
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'PHOTO' | 'DOCUMENT'>('PHOTO');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newCategory, setNewCategory] = useState<TechnicalDocumentCategory>('LAUDO_CONCRETO');
  const [newTorreId, setNewTorreId] = useState(locationsConfig.torres[0]?.id || '');
  const [newPavimentoId, setNewPavimentoId] = useState(locationsConfig.pavimentos[0]?.id || '');
  const [newAmbienteId, setNewAmbienteId] = useState(locationsConfig.ambientes[0]?.id || '');

  // Amostra de eventos enriquecidos caso ainda não haja fotos
  const allMediaItems = useMemo(() => {
    const items = sourceEvents.filter(
      (e) =>
        e.source_type === 'MANUAL_IMAGE' ||
        e.source_type === 'WHATSAPP_IMAGE' ||
        e.source_type === 'TECHNICAL_DOCUMENT' ||
        e.source_type === 'WHATSAPP_DOCUMENT' ||
        Boolean(e.media_url)
    );

    // Se houver poucos, adiciona fotos e documentos enriquecidos da obra para visualização rica
    if (items.length < 5) {
      const mockItems: SourceEvent[] = [
        {
          id: 'mock-img-01',
          tenant_id: 'tenant-kore-01',
          project_id: project.id,
          reporting_day_id: 'rep-day-cur',
          source_type: 'MANUAL_IMAGE',
          occurred_at: '2026-09-08T10:30:00-03:00',
          recorded_at: '2026-09-08T10:32:00-03:00',
          author_id: 'usr-03',
          author_name: 'Engª. Mariana Costa',
          author_role: 'engenheiro_residente',
          raw_text: 'Inspeção de armadura das vigas V-101 a V-105 aprovada com FVS preenchida.',
          location_name: 'Torre A — Pavimento 09',
          wbs_task_name: 'Armação de Vigas',
          media_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop',
          torre_id: locationsConfig.torres[0]?.id,
          pavimento_id: locationsConfig.pavimentos[8]?.id || locationsConfig.pavimentos[0]?.id,
          service_name: 'Estrutura de Concreto',
          review_state: 'confirmed',
          confidence: 1.0,
          status: 'active',
          created_at: '2026-09-08T10:32:00-03:00',
        },
        {
          id: 'mock-img-02',
          tenant_id: 'tenant-kore-01',
          project_id: project.id,
          reporting_day_id: 'rep-day-cur',
          source_type: 'MANUAL_IMAGE',
          occurred_at: '2026-09-08T14:15:00-03:00',
          recorded_at: '2026-09-08T14:18:00-03:00',
          author_id: 'usr-02',
          author_name: 'Antônio Santos',
          author_role: 'encarregado',
          raw_text: 'Verificação de prumo e alinhamento do assentamento de alvenaria estrutural.',
          location_name: 'Torre A — Pavimento 08',
          wbs_task_name: 'Alvenaria Estrutural',
          media_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop',
          torre_id: locationsConfig.torres[0]?.id,
          pavimento_id: locationsConfig.pavimentos[7]?.id || locationsConfig.pavimentos[0]?.id,
          service_name: 'Alvenaria de Vedação',
          review_state: 'confirmed',
          confidence: 1.0,
          status: 'active',
          created_at: '2026-09-08T14:18:00-03:00',
        },
        {
          id: 'mock-doc-01',
          tenant_id: 'tenant-kore-01',
          project_id: project.id,
          reporting_day_id: 'rep-day-cur',
          source_type: 'TECHNICAL_DOCUMENT',
          occurred_at: '2026-09-08T11:00:00-03:00',
          recorded_at: '2026-09-08T11:05:00-03:00',
          author_id: 'usr-03',
          author_name: 'Engª. Mariana Costa',
          author_role: 'engenheiro_residente',
          raw_text: 'Laudo de ruptura de corpos de prova (7 e 28 dias) — Fck 35 MPa conforme NBR 5739.',
          location_name: 'Torre A — Pavimento 09',
          wbs_task_name: 'Controle Tecnológico Concreto',
          document_category: 'LAUDO_CONCRETO',
          file_name: 'LAUDO_CP_CONCRETO_FCK35_PAV09.pdf',
          file_size_kb: 420,
          file_type: 'application/pdf',
          media_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          torre_id: locationsConfig.torres[0]?.id,
          pavimento_id: locationsConfig.pavimentos[8]?.id || locationsConfig.pavimentos[0]?.id,
          service_name: 'Controle Tecnológico',
          review_state: 'confirmed',
          confidence: 1.0,
          status: 'active',
          created_at: '2026-09-08T11:05:00-03:00',
        },
        {
          id: 'mock-doc-02',
          tenant_id: 'tenant-kore-01',
          project_id: project.id,
          reporting_day_id: 'rep-day-cur',
          source_type: 'TECHNICAL_DOCUMENT',
          occurred_at: '2026-09-08T16:00:00-03:00',
          recorded_at: '2026-09-08T16:10:00-03:00',
          author_id: 'usr-05',
          author_name: 'Dr. Fernando Linhares',
          author_role: 'fiscal_cliente',
          raw_text: 'Ficha de Verificação de Serviço (FVS-EST-042) assinada pela fiscalização.',
          location_name: 'Torre A — Pavimento 08',
          document_category: 'FVS_SERVICO',
          file_name: 'FVS_EST_042_ALVENARIA_ASSINADA.pdf',
          file_size_kb: 285,
          file_type: 'application/pdf',
          media_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          torre_id: locationsConfig.torres[0]?.id,
          pavimento_id: locationsConfig.pavimentos[7]?.id || locationsConfig.pavimentos[0]?.id,
          service_name: 'Qualidade & FVS',
          review_state: 'confirmed',
          confidence: 1.0,
          status: 'active',
          created_at: '2026-09-08T16:10:00-03:00',
        },
      ];
      return [...items, ...mockItems];
    }

    return items;
  }, [sourceEvents, project.id, locationsConfig]);

  // Aplicação dos Filtros
  const filteredItems = useMemo(() => {
    return allMediaItems.filter((item) => {
      const isDoc = item.source_type === 'TECHNICAL_DOCUMENT' || item.source_type === 'WHATSAPP_DOCUMENT' || Boolean(item.document_category);
      const isPhoto = !isDoc;

      // Filtro de Tipo
      if (mediaTypeFilter === 'PHOTOS' && !isPhoto) return false;
      if (mediaTypeFilter === 'DOCS' && !isDoc) return false;

      // Filtro de Torre
      if (selectedTorreId !== 'ALL' && item.torre_id && item.torre_id !== selectedTorreId) {
        return false;
      }

      // Filtro de Pavimento
      if (selectedPavimentoId !== 'ALL' && item.pavimento_id && item.pavimento_id !== selectedPavimentoId) {
        return false;
      }

      // Filtro de Categoria de Documento
      if (selectedCategory !== 'ALL' && item.document_category !== selectedCategory) {
        return false;
      }

      // Filtro de Busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = (item.raw_text || '').toLowerCase().includes(query);
        const fileMatch = (item.file_name || '').toLowerCase().includes(query);
        const locMatch = (item.location_name || '').toLowerCase().includes(query);
        const srvMatch = (item.service_name || item.wbs_task_name || '').toLowerCase().includes(query);
        if (!textMatch && !fileMatch && !locMatch && !srvMatch) return false;
      }

      return true;
    });
  }, [allMediaItems, mediaTypeFilter, selectedTorreId, selectedPavimentoId, selectedCategory, searchQuery]);

  // Contadores para os botões de tipo
  const photosCount = useMemo(
    () => allMediaItems.filter((e) => e.source_type === 'MANUAL_IMAGE' || e.source_type === 'WHATSAPP_IMAGE' || (!e.document_category && e.media_url)).length,
    [allMediaItems]
  );
  const docsCount = useMemo(
    () => allMediaItems.filter((e) => e.source_type === 'TECHNICAL_DOCUMENT' || e.source_type === 'WHATSAPP_DOCUMENT' || Boolean(e.document_category)).length,
    [allMediaItems]
  );

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const torre = locationsConfig.torres.find((t) => t.id === newTorreId);
    const pav = locationsConfig.pavimentos.find((p) => p.id === newPavimentoId);
    const amb = locationsConfig.ambientes.find((a) => a.id === newAmbienteId);

    const locationName = [torre?.nome, pav?.nome, amb?.nome].filter(Boolean).join(' — ');

    const newEvt: Partial<SourceEvent> = {
      id: `evt-media-${Date.now()}`,
      tenant_id: 'tenant-kore-01',
      project_id: project.id,
      reporting_day_id: 'rep-day-cur',
      source_type: uploadType === 'PHOTO' ? 'MANUAL_IMAGE' : 'TECHNICAL_DOCUMENT',
      occurred_at: new Date().toISOString(),
      recorded_at: new Date().toISOString(),
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_role: currentUser.role,
      raw_text: newTitle,
      media_url: newUrl.trim() || (uploadType === 'PHOTO' ? 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=800&auto=format&fit=crop' : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'),
      location_name: locationName,
      service_name: newServiceName || 'Geral de Obra',
      torre_id: newTorreId,
      pavimento_id: newPavimentoId,
      ambiente_id: newAmbienteId,
      document_category: uploadType === 'DOCUMENT' ? newCategory : undefined,
      file_name: uploadType === 'DOCUMENT' ? `${newTitle.replace(/\s+/g, '_')}.pdf` : undefined,
      file_size_kb: uploadType === 'DOCUMENT' ? 340 : undefined,
      review_state: 'confirmed',
      confidence: 1.0,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    if (onAddEvent) {
      onAddEvent(newEvt);
    } else {
      DiaryStorageService.addSourceEvent(newEvt as SourceEvent);
    }

    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewServiceName('');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Cabeçalho & Ações */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-panel border border-rule rounded-card p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Camera className="w-5 h-5 text-action" />
              Galeria Inteligente de Fotos & Documentos Técnicos
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-action-soft text-action border border-action/20">
              {filteredItems.length} itens encontrados
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Organização georreferenciada por Torre, Pavimento, Ambiente e Disciplina com conformidade pericial.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-action hover:bg-action-hover text-white rounded-field text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Anexar Foto / Documento
          </button>
        )}
      </div>

      {/* Barra de Filtros Multidimensionais */}
      <div className="bg-panel border border-rule rounded-card p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Seletor de Tipo de Mídia */}
          <div className="flex items-center bg-paper p-1 rounded-pill border border-rule">
            <button
              type="button"
              onClick={() => setMediaTypeFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition-all ${
                mediaTypeFilter === 'ALL'
                  ? 'bg-action text-white shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Todos ({allMediaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('PHOTOS')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-pill transition-all ${
                mediaTypeFilter === 'PHOTOS'
                  ? 'bg-action text-white shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Fotos ({photosCount})
            </button>
            <button
              type="button"
              onClick={() => setMediaTypeFilter('DOCS')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-pill transition-all ${
                mediaTypeFilter === 'DOCS'
                  ? 'bg-action text-white shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Documentos Técnicos ({docsCount})
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Buscar por descrição, FVS, laudo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-paper border border-rule rounded-field text-ink placeholder:text-ink-muted focus:outline-none focus:border-action"
            />
          </div>
        </div>

        {/* Filtros de Localização & Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-rule/60 text-xs">
          {/* Filtro Torre */}
          <div>
            <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Torre / Bloco</label>
            <select
              value={selectedTorreId}
              onChange={(e) => setSelectedTorreId(e.target.value)}
              className="w-full bg-paper border border-rule rounded-field px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-action cursor-pointer"
            >
              <option value="ALL">Todas as Torres</option>
              {locationsConfig.torres.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Pavimento */}
          <div>
            <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Pavimento</label>
            <select
              value={selectedPavimentoId}
              onChange={(e) => setSelectedPavimentoId(e.target.value)}
              className="w-full bg-paper border border-rule rounded-field px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-action cursor-pointer"
            >
              <option value="ALL">Todos os Pavimentos</option>
              {locationsConfig.pavimentos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Categoria Técnica */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Categoria Técnica (Documentos)</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-paper border border-rule rounded-field px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-action cursor-pointer"
            >
              <option value="ALL">Todas as Categorias Técnicas</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Itens (Fotos & Documentos) */}
      {filteredItems.length === 0 ? (
        <div className="bg-panel border border-dashed border-rule rounded-card p-12 text-center text-ink-secondary">
          <Camera className="w-12 h-12 mx-auto text-ink-muted mb-3 opacity-50" />
          <h3 className="text-sm font-bold text-ink">Nenhuma evidência ou documento encontrado</h3>
          <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
            Ajuste os filtros de localização ou tipo de mídia acima para visualizar as fotos e documentos técnicos desta obra.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isDoc = item.source_type === 'TECHNICAL_DOCUMENT' || item.source_type === 'WHATSAPP_DOCUMENT' || Boolean(item.document_category);
            const catInfo = DOCUMENT_CATEGORIES.find((c) => c.id === item.document_category);

            if (isDoc) {
              return (
                <div
                  key={item.id}
                  className="bg-panel border border-rule rounded-card p-4 flex flex-col justify-between hover:border-action transition-all shadow-xs group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${catInfo?.color || 'bg-slate-100 text-slate-700'}`}>
                        {catInfo?.label.split('(')[0] || 'Documento Técnico'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-ink line-clamp-2 leading-snug group-hover:text-action transition-colors">
                      {item.file_name || item.raw_text}
                    </h4>

                    {item.raw_text && item.file_name && (
                      <p className="text-[11px] text-ink-secondary line-clamp-2 mt-1">
                        {item.raw_text}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-rule space-y-2 text-[10px]">
                    <div className="flex items-center gap-1 text-ink-muted">
                      <MapPin className="w-3 h-3 text-action shrink-0" />
                      <span className="truncate">{item.location_name || 'Canteiro Geral'}</span>
                    </div>

                    <div className="flex items-center justify-between text-ink-muted pt-1">
                      <span>{item.author_name}</span>
                      <span>{item.file_size_kb ? `${item.file_size_kb} KB` : 'PDF'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-paper hover:bg-paper-subtle border border-rule rounded text-ink text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-action" />
                        Visualizar
                      </button>
                      {item.media_url && (
                        <a
                          href={item.media_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-paper hover:bg-paper-subtle border border-rule rounded text-ink transition-colors"
                          title="Download do documento"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Card de Foto
            return (
              <div
                key={item.id}
                className="bg-panel border border-rule rounded-card overflow-hidden flex flex-col hover:border-action transition-all shadow-xs group cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <div className="h-44 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  <img
                    src={item.media_url}
                    alt={item.raw_text}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-action" />
                    <span className="max-w-[140px] truncate">{item.location_name || 'Canteiro'}</span>
                  </div>

                  {item.review_state === 'confirmed' && (
                    <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      RDO
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                    {item.occurred_at ? item.occurred_at.split('T')[0] : 'Hoje'}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-action block uppercase tracking-wider mb-0.5">
                      {item.service_name || item.wbs_task_name || 'Serviço de Campo'}
                    </span>
                    <p className="text-xs font-semibold text-ink line-clamp-2 leading-snug">
                      {item.raw_text || 'Registro fotográfico de controle de qualidade'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-rule flex items-center justify-between text-[10px] text-ink-muted">
                    <span className="truncate max-w-[110px]">{item.author_name}</span>
                    <button
                      type="button"
                      className="text-action hover:underline font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Detalhes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lightbox / Detalhes */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-rule rounded-card max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-rule">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-action-soft text-action uppercase">
                  {previewItem.source_type.replace('_', ' ')}
                </span>
                <h3 className="text-sm font-bold text-ink">
                  {previewItem.file_name || previewItem.service_name || 'Visualização da Evidência'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 text-ink-muted hover:text-ink rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Se for Imagem */}
              {previewItem.media_url && !previewItem.document_category && (
                <div className="rounded-lg overflow-hidden bg-black/10 flex items-center justify-center max-h-[460px]">
                  <img
                    src={previewItem.media_url}
                    alt={previewItem.raw_text}
                    className="max-h-[460px] w-auto object-contain rounded"
                  />
                </div>
              )}

              {/* Se for Documento */}
              {previewItem.document_category && (
                <div className="border border-rule rounded-lg p-6 bg-paper-subtle text-center space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-indigo-600" />
                  <div>
                    <h4 className="text-sm font-bold text-ink">{previewItem.file_name}</h4>
                    <p className="text-xs text-ink-secondary mt-1">{previewItem.raw_text}</p>
                  </div>
                  {previewItem.media_url && (
                    <a
                      href={previewItem.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-action text-white rounded text-xs font-bold shadow-xs hover:bg-action-hover transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Baixar / Abrir Documento PDF
                    </a>
                  )}
                </div>
              )}

              {/* Metadados Técnicos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-paper p-3 rounded-lg border border-rule text-xs">
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-bold">Localização</span>
                  <span className="font-semibold text-ink">{previewItem.location_name || 'Não informada'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-bold">Serviço / Frente</span>
                  <span className="font-semibold text-ink">{previewItem.service_name || previewItem.wbs_task_name || 'Geral'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-bold">Responsável</span>
                  <span className="font-semibold text-ink">{previewItem.author_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block font-bold">Data & Hora</span>
                  <span className="font-mono text-ink text-[11px]">{previewItem.occurred_at || previewItem.created_at}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-rule flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-paper hover:bg-paper-subtle border border-rule rounded text-xs font-bold text-ink transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload / Anexar Nova Evidência */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-rule rounded-card max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Plus className="w-4 h-4 text-action" />
                Anexar Nova Foto ou Documento Técnico
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="space-y-3 text-xs">
              {/* Tipo de Mídia */}
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Tipo de Anexo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadType('PHOTO')}
                    className={`py-2 px-3 rounded border text-center font-bold transition-all ${
                      uploadType === 'PHOTO'
                        ? 'bg-action-soft text-action border-action'
                        : 'bg-paper text-ink-secondary border-rule'
                    }`}
                  >
                    Foto de Canteiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType('DOCUMENT')}
                    className={`py-2 px-3 rounded border text-center font-bold transition-all ${
                      uploadType === 'DOCUMENT'
                        ? 'bg-action-soft text-action border-action'
                        : 'bg-paper text-ink-secondary border-rule'
                    }`}
                  >
                    Documento Técnico (PDF)
                  </button>
                </div>
              </div>

              {/* Título / Descrição */}
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  {uploadType === 'PHOTO' ? 'Descrição da Foto' : 'Título do Documento / Laudo'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={uploadType === 'PHOTO' ? 'Ex: Concretagem das vigas V-101 a V-104' : 'Ex: Laudo de Rompimento de Concreto 28 dias'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-paper border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-action"
                />
              </div>

              {/* URL da Mídia */}
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  URL da Foto ou Documento (R2 / Cloudflare)
                </label>
                <input
                  type="url"
                  placeholder="https://... (deixe em branco para usar simulador padrão)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-paper border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-action"
                />
              </div>

              {/* Categoria Técnica se for Documento */}
              {uploadType === 'DOCUMENT' && (
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Categoria Técnica</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TechnicalDocumentCategory)}
                    className="w-full bg-paper border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-action cursor-pointer"
                  >
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Serviço / Frente */}
              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Serviço / Frente de Trabalho</label>
                <input
                  type="text"
                  placeholder="Ex: Alvenaria, Estrutura, Instalações..."
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-paper border border-rule rounded px-3 py-2 text-ink focus:outline-none focus:border-action"
                />
              </div>

              {/* Atribuição de Localização */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Torre</label>
                  <select
                    value={newTorreId}
                    onChange={(e) => setNewTorreId(e.target.value)}
                    className="w-full bg-paper border border-rule rounded px-2 py-1.5 text-ink text-xs focus:outline-none focus:border-action cursor-pointer"
                  >
                    {locationsConfig.torres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Pavimento</label>
                  <select
                    value={newPavimentoId}
                    onChange={(e) => setNewPavimentoId(e.target.value)}
                    className="w-full bg-paper border border-rule rounded px-2 py-1.5 text-ink text-xs focus:outline-none focus:border-action cursor-pointer"
                  >
                    {locationsConfig.pavimentos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-ink-muted uppercase mb-1">Ambiente</label>
                  <select
                    value={newAmbienteId}
                    onChange={(e) => setNewAmbienteId(e.target.value)}
                    className="w-full bg-paper border border-rule rounded px-2 py-1.5 text-ink text-xs focus:outline-none focus:border-action cursor-pointer"
                  >
                    {locationsConfig.ambientes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-paper hover:bg-paper-subtle border border-rule rounded text-ink font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-action hover:bg-action-hover text-white rounded font-bold shadow-xs transition-colors"
                >
                  Salvar na Galeria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
