// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — PAINEL DE LOCAIS & CLOUDFLARE R2
// Gestão de Torres, Pavimentos, Ambientes e Armazenamento em Nuvem
// =====================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Building2,
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Eye,
  Key,
  Database,
  Globe,
  HelpCircle,
  Check,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ObraLocationsConfig,
  LocationItem,
  R2StorageConfig,
  ProjectContext,
  LocationsBatchRow,
} from '../../types/diary.types';
import { R2UploadService } from '../../services/r2UploadService';
import { DiaryStorageService } from '../../services/diaryStorage';

interface LocationsAndR2PanelProps {
  project: ProjectContext;
  locationsConfig: ObraLocationsConfig;
  r2Config: R2StorageConfig;
  onUpdateLocations: (updates: Partial<ObraLocationsConfig>) => void;
  onAddLocationItem: (type: 'torres' | 'pavimentos' | 'ambientes', item: LocationItem) => void;
  onRemoveLocationItem: (type: 'torres' | 'pavimentos' | 'ambientes', id: string) => void;
  onResetLocationsToDefault: () => void;
  onUpdateR2Config: (updates: Partial<R2StorageConfig>) => void;
  onClearLocations?: () => void;
  onImportBatch?: (rows: LocationsBatchRow[], mode: 'replace' | 'merge') => void;
}

export const LocationsAndR2Panel: React.FC<LocationsAndR2PanelProps> = ({
  project,
  locationsConfig,
  r2Config,
  onUpdateLocations,
  onAddLocationItem,
  onRemoveLocationItem,
  onResetLocationsToDefault,
  onUpdateR2Config,
  onClearLocations,
  onImportBatch,
}) => {
  const [activeTab, setActiveTab] = useState<'LOCATIONS' | 'R2_CONFIG'>('LOCATIONS');

  // Estados locais para edição do R2
  const [r2Form, setR2Form] = useState<R2StorageConfig>({ ...r2Config });
  const [r2TestStatus, setR2TestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Sincroniza formulário R2 ao trocar de obra
  useEffect(() => {
    setR2Form({ ...r2Config });
    setR2TestStatus(null);
  }, [project.id, r2Config]);

  // Estados para inclusão inline de locais
  const [novoTipo, setNovoTipo] = useState<'torres' | 'pavimentos' | 'ambientes'>('pavimentos');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoNome, setNovoNome] = useState('');

  // Prévia do carimbo
  const [previewTorre, setPreviewTorre] = useState(locationsConfig.torres[0]?.nome || '');
  const [previewPavimento, setPreviewPavimento] = useState(
    locationsConfig.pavimentos[7]?.nome || locationsConfig.pavimentos[0]?.nome || ''
  );
  const [previewAmbiente, setPreviewAmbiente] = useState(locationsConfig.ambientes[0]?.nome || '');

  // Sincroniza prévia ao trocar de obra ou atualizar listas
  useEffect(() => {
    setPreviewTorre(locationsConfig.torres[0]?.nome || '');
    setPreviewPavimento(
      locationsConfig.pavimentos[7]?.nome || locationsConfig.pavimentos[0]?.nome || ''
    );
    setPreviewAmbiente(locationsConfig.ambientes[0]?.nome || '');
  }, [project.id, locationsConfig]);

  // Modais de importação em lote e confirmação de limpeza
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [rawSpreadsheetText, setRawSpreadsheetText] = useState('');
  const [inputTab, setInputTab] = useState<'PASTE' | 'FILE'>('PASTE');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse em tempo real do texto da planilha
  const parsedRows = useMemo(() => {
    return DiaryStorageService.parseLocationsSpreadsheet(rawSpreadsheetText);
  }, [rawSpreadsheetText]);

  // Resumo dos itens únicos identificados na planilha
  const parsedStats = useMemo(() => {
    const torres = new Set<string>();
    const pavimentos = new Set<string>();
    const ambientes = new Set<string>();
    parsedRows.forEach((r) => {
      if (r.torre) torres.add(r.torre.trim());
      if (r.pavimento) pavimentos.add(r.pavimento.trim());
      if (r.ambiente) ambientes.add(r.ambiente.trim());
    });
    return {
      torresCount: torres.size,
      pavimentosCount: pavimentos.size,
      ambientesCount: ambientes.size,
    };
  }, [parsedRows]);

  const handleSalvarR2 = () => {
    onUpdateR2Config(r2Form);
    setR2TestStatus({
      tested: true,
      success: true,
      message: `Configurações do Cloudflare R2 para a obra "${project.nome}" salvas com sucesso!`,
    });
  };

  const handleTestarConexao = async () => {
    const res = await R2UploadService.testConnection(r2Form);
    setR2TestStatus({
      tested: true,
      success: res.success,
      message: res.message,
      details: res.details,
    });
  };

  const handleAdicionarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const id = `${novoTipo.slice(0, 3)}-${Date.now()}`;
    const codigo = novoCodigo.trim() || novoNome.slice(0, 6).toUpperCase();

    onAddLocationItem(novoTipo, {
      id,
      codigo,
      nome: novoNome.trim(),
    });

    setNovoNome('');
    setNovoCodigo('');
  };

  const handleDownloadTemplate = () => {
    DiaryStorageService.downloadLocationsTemplateCsv();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawSpreadsheetText(content);
        setInputTab('PASTE'); // muda para tab de texto para mostrar o conteúdo carregado
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    if (onImportBatch) {
      onImportBatch(parsedRows, importMode);
    } else {
      DiaryStorageService.importLocationsBatch(parsedRows, importMode, project.id);
    }
    setIsImportModalOpen(false);
    setRawSpreadsheetText('');
    setFeedbackToast({
      type: 'success',
      message: `${parsedRows.length} linhas de locais importadas com sucesso para a obra ${project.nome}!`,
    });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleConfirmClear = () => {
    if (onClearLocations) {
      onClearLocations();
    } else {
      DiaryStorageService.clearLocationsForProject(project.id);
    }
    setIsClearConfirmOpen(false);
    setFeedbackToast({
      type: 'success',
      message: `Todos os locais da obra ${project.nome} foram removidos.`,
    });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const totalLocaisCadastrados =
    locationsConfig.torres.length +
    locationsConfig.pavimentos.length +
    locationsConfig.ambientes.length;

  return (
    <div className="space-y-6">
      {/* Toast de Notificação */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-card border flex items-center justify-between text-xs font-semibold shadow-md animate-in fade-in slide-in-from-top-2 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-danger-soft border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="text-ink-muted hover:text-ink p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cabeçalho do Painel com Identificação da Obra Ativa */}
      <div className="bg-panel border border-rule rounded-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-action-soft text-action uppercase tracking-wider">
              ESTRUTURA DE CAMPO & NUVEM
            </span>
            <span className="text-xs font-bold text-ink bg-paper px-2 py-0.5 rounded-chip border border-rule">
              Obra Ativa: {project.nome} ({project.codigo})
            </span>
          </div>
          <h2 className="text-lg font-bold text-ink mt-1.5 flex items-center gap-2">
            <Layers className="w-5 h-5 text-action" />
            Locais da Obra & Cloudflare R2
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Cada obra possui seu cadastro independente de locais e bucket R2. Alterne de obra para visualizar e configurar separadamente.
          </p>
        </div>

        {/* Alternador de Abas */}
        <div className="flex items-center bg-paper p-1 rounded-pill border border-rule">
          <button
            type="button"
            onClick={() => setActiveTab('LOCATIONS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              activeTab === 'LOCATIONS'
                ? 'bg-action text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Locais & Pavimentos ({totalLocaisCadastrados})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('R2_CONFIG')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              activeTab === 'R2_CONFIG'
                ? 'bg-action text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Cloudflare R2
            {r2Config.enabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="text-[10px] bg-paper-subtle px-1.5 rounded text-ink-muted">Local</span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: LOCAIS DA OBRA (TORRES, PAVIMENTOS, AMBIENTES)                      */}
      {/* ========================================================================= */}
      {activeTab === 'LOCATIONS' && (
        <div className="space-y-6">
          {/* Barra de Ações Rápidas da Obra */}
          <div className="bg-panel border border-rule rounded-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">Ações de Locais:</span>
              <span className="text-xs text-ink-muted">
                {locationsConfig.torres.length} Torres · {locationsConfig.pavimentos.length} Pavimentos · {locationsConfig.ambientes.length} Ambientes
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Botão Importar Planilha */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-1.5 rounded-field bg-action hover:bg-action/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                title="Suba ou cole as 3 colunas (Torre, Pavimento, Ambiente) da sua planilha"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar Planilha (3 Colunas)</span>
              </button>

              {/* Botão Baixar Modelo CSV */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-field bg-paper border border-rule hover:border-action text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Baixar planilha modelo no formato CSV para preenchimento"
              >
                <Download className="w-3.5 h-3.5 text-action" />
                <span>Modelo CSV</span>
              </button>

              {/* Botão Limpar Locais */}
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(true)}
                className="px-3 py-1.5 rounded-field bg-paper border border-danger/30 hover:bg-danger-soft text-danger font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Apaga todos os locais cadastrados desta obra para reiniciar limpo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Obra</span>
              </button>

              {/* Botão Restaurar Padrão Predial */}
              <button
                type="button"
                onClick={onResetLocationsToDefault}
                className="px-3 py-1.5 rounded-field bg-paper border border-rule hover:border-rule text-ink-muted hover:text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Restaura os 13 pavimentos e ambientes padrão de demonstração"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Padrão Predial</span>
              </button>
            </div>
          </div>

          {/* Prévia do Carimbo Pericial */}
          <div className="bg-panel border border-rule rounded-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-2">
                <Eye className="w-4 h-4 text-action" />
                Prévia do Carimbo Indelével na Câmera Mobile
              </span>
              <span className="text-[11px] text-ink-muted">
                Este carimbo é gravado nos pixels da foto com a localização selecionada
              </span>
            </div>

            {/* Simulação Visual do Carimbo Preto Translúcido */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 text-white p-4 font-mono">
              <div className="absolute top-2 right-2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                Carimbo Pericial em 1920x1080
              </div>
              <div className="h-20 flex items-center justify-center text-slate-600 text-xs italic">
                [ Feed de Vídeo da Câmera do Encarregado ]
              </div>
              {/* Tarja Inferior */}
              <div className="bg-slate-950/90 border-t-2 border-amber-500 p-3 rounded-b-md space-y-1">
                <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  CONSTRUKORE | OBRA: {project.codigo} • {(previewTorre || 'GERAL').toUpperCase()} • {(previewPavimento || 'CANTEIRO').toUpperCase()} • {(previewAmbiente || 'ÁREA GERAL').toUpperCase()}
                </div>
                <div className="text-[11px] text-slate-300">
                  DATA: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')} • GPS: {project.gps_lat || -25.4284}, {project.gps_lng || -49.2733} ({project.cidade || 'Canteiro'})
                </div>
                <div className="text-[10px] text-slate-400">
                  RESPONSÁVEL: Encarregado de Campo • EVIDÊNCIA FOTOGRÁFICA INALTERÁVEL
                </div>
              </div>
            </div>
          </div>

          {/* Formulário Rápido de Adição Manual de Local */}
          <form
            onSubmit={handleAdicionarItem}
            className="bg-panel border border-rule rounded-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-2">
                <Plus className="w-4 h-4 text-action" />
                Adicionar Local Individualmente
              </span>
              <span className="text-[11px] text-ink-muted">
                Adicione torres, pavimentos ou frentes uma a uma se preferir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-muted mb-1">Nível</label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as any)}
                  className="w-full bg-paper border border-rule rounded-field px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-action"
                >
                  <option value="torres">Torre / Bloco</option>
                  <option value="pavimentos">Pavimento / Andar</option>
                  <option value="ambientes">Ambiente / Cômodo / Frente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-muted mb-1">Código / Sigla</label>
                <input
                  type="text"
                  placeholder="Ex: PAV-16 ou T-C"
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  className="w-full bg-paper border border-rule rounded-field px-3 py-2 text-xs font-mono text-ink focus:outline-none focus:border-action"
                />
              </div>

              <div className="sm:col-span-2 flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-ink-muted mb-1">Nome Exibido</label>
                  <input
                    type="text"
                    placeholder="Ex: 16º Pavimento Tipo ou Hall Social"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-field px-3 py-2 text-xs text-ink focus:outline-none focus:border-action"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-action hover:bg-action/90 text-white font-bold text-xs rounded-field flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar</span>
                </button>
              </div>
            </div>
          </form>

          {/* Estado Vazio Quando a Obra Ainda Não Tem Locais */}
          {totalLocaisCadastrados === 0 ? (
            <div className="bg-panel border-2 border-dashed border-rule rounded-card p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-action-soft text-action mx-auto flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-ink">
                Nenhum local cadastrado para {project.nome}
              </h3>
              <p className="text-xs text-ink-secondary max-w-md mx-auto">
                Esta obra ainda não possui locais próprios configurados. Você pode subir uma planilha com as 3 colunas (Torre, Pavimento, Ambiente) ou usar o modelo de demonstração.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 rounded-field bg-action hover:bg-action/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Importar Planilha Agora</span>
                </button>
                <button
                  type="button"
                  onClick={onResetLocationsToDefault}
                  className="px-4 py-2 rounded-field bg-paper border border-rule hover:border-action text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-action" />
                  <span>Usar Exemplo Predial</span>
                </button>
              </div>
            </div>
          ) : (
            /* Três Colunas: Torres, Pavimentos, Ambientes */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Torres */}
              <div className="bg-panel border border-rule rounded-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-action" />
                    Torres ({locationsConfig.torres.length})
                  </span>
                  <span className="text-[10px] text-ink-muted">Blocos da Obra</span>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {locationsConfig.torres.length === 0 ? (
                    <div className="text-center py-6 text-xs text-ink-muted italic">
                      Nenhuma torre cadastrada
                    </div>
                  ) : (
                    locationsConfig.torres.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setPreviewTorre(item.nome)}
                        className={`p-2 rounded-field border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          previewTorre === item.nome
                            ? 'bg-action-soft/40 border-action text-ink font-bold'
                            : 'bg-paper border-rule-subtle text-ink-secondary hover:border-rule'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-ink-muted bg-paper-subtle px-1.5 py-0.5 rounded">
                            {item.codigo}
                          </span>
                          <span className="truncate">{item.nome}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveLocationItem('torres', item.id);
                          }}
                          className="text-ink-muted hover:text-danger p-1 transition-colors"
                          title="Remover torre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 2. Pavimentos */}
              <div className="bg-panel border border-rule rounded-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-action" />
                    Pavimentos ({locationsConfig.pavimentos.length})
                  </span>
                  <span className="text-[10px] text-ink-muted">Níveis Verticais</span>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {locationsConfig.pavimentos.length === 0 ? (
                    <div className="text-center py-6 text-xs text-ink-muted italic">
                      Nenhum pavimento cadastrado
                    </div>
                  ) : (
                    locationsConfig.pavimentos.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setPreviewPavimento(item.nome)}
                        className={`p-2 rounded-field border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          previewPavimento === item.nome
                            ? 'bg-action-soft/40 border-action text-ink font-bold'
                            : 'bg-paper border-rule-subtle text-ink-secondary hover:border-rule'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-ink-muted bg-paper-subtle px-1.5 py-0.5 rounded">
                            {item.codigo}
                          </span>
                          <span className="truncate">{item.nome}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveLocationItem('pavimentos', item.id);
                          }}
                          className="text-ink-muted hover:text-danger p-1 transition-colors"
                          title="Remover pavimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Ambientes */}
              <div className="bg-panel border border-rule rounded-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-action" />
                    Ambientes ({locationsConfig.ambientes.length})
                  </span>
                  <span className="text-[10px] text-ink-muted">Frentes de Serviço</span>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {locationsConfig.ambientes.length === 0 ? (
                    <div className="text-center py-6 text-xs text-ink-muted italic">
                      Nenhum ambiente cadastrado
                    </div>
                  ) : (
                    locationsConfig.ambientes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setPreviewAmbiente(item.nome)}
                        className={`p-2 rounded-field border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          previewAmbiente === item.nome
                            ? 'bg-action-soft/40 border-action text-ink font-bold'
                            : 'bg-paper border-rule-subtle text-ink-secondary hover:border-rule'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-ink-muted bg-paper-subtle px-1.5 py-0.5 rounded">
                            {item.codigo}
                          </span>
                          <span className="truncate">{item.nome}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveLocationItem('ambientes', item.id);
                          }}
                          className="text-ink-muted hover:text-danger p-1 transition-colors"
                          title="Remover ambiente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CLOUDFLARE R2 (CONFIGURAÇÃO & TUTORIAL POR OBRA)                    */}
      {/* ========================================================================= */}
      {activeTab === 'R2_CONFIG' && (
        <div className="space-y-6">
          {/* Card de Status da Conexão */}
          <div className="bg-panel border border-rule rounded-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                    r2Config.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-paper text-ink-muted border border-rule'
                  }`}
                >
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-ink">Cloudflare R2 Object Storage</h3>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        r2Config.enabled
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-paper-subtle text-ink-muted border border-rule'
                      }`}
                    >
                      {r2Config.enabled ? 'Sincronização em Nuvem Ativa' : 'Modo Local / Armazenamento no Navegador'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Configuração exclusiva para a obra <strong className="text-ink">{project.nome}</strong>. Bucket dedicado com zero custo de tráfego.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestarConexao}
                  className="px-3.5 py-2 rounded-field bg-paper border border-rule hover:border-action text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-action" />
                  <span>Testar Parâmetros</span>
                </button>
                <button
                  type="button"
                  onClick={handleSalvarR2}
                  className="px-4 py-2 rounded-field bg-action hover:bg-action/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar na Obra</span>
                </button>
              </div>
            </div>

            {/* Alerta de Teste de Conexão */}
            {r2TestStatus && (
              <div
                className={`p-3.5 rounded-field border text-xs flex items-start gap-3 ${
                  r2TestStatus.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-danger-soft border-danger/30 text-danger'
                }`}
              >
                {r2TestStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">{r2TestStatus.message}</div>
                  {r2TestStatus.details && (
                    <div className="font-mono text-[11px] opacity-80">{r2TestStatus.details}</div>
                  )}
                </div>
              </div>
            )}

            {/* Formulário de Credenciais S3 R2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1 flex items-center justify-between">
                  <span>Cloudflare Account ID</span>
                  <span className="text-[10px] text-ink-muted font-normal">32 caracteres hex</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: 8a7c2b4e9f1a0d3e5b7c8d9e0f1a2b3c"
                    value={r2Form.accountId}
                    onChange={(e) => setR2Form({ ...r2Form, accountId: e.target.value })}
                    className="w-full bg-paper border border-rule rounded-field py-2 pl-9 pr-3 text-xs font-mono text-ink focus:outline-none focus:border-action"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Nome do Bucket R2 da Obra
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Ex: construkore-rdo-${project.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    value={r2Form.bucketName}
                    onChange={(e) => setR2Form({ ...r2Form, bucketName: e.target.value })}
                    className="w-full bg-paper border border-rule rounded-field py-2 pl-9 pr-3 text-xs font-mono text-ink focus:outline-none focus:border-action"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1 flex items-center justify-between">
                  <span>Endpoint Seguro de Upload (Worker / n8n)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">🔒 Sem expor chave</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: https://upload-rdo.suaobra.workers.dev ou https://n8n.suaobra.com/webhook/rdo-foto"
                  value={r2Form.uploadEndpointUrl || ''}
                  onChange={(e) => setR2Form({ ...r2Form, uploadEndpointUrl: e.target.value })}
                  className="w-full bg-paper border border-rule rounded-field py-2 px-3 text-xs font-mono text-ink focus:outline-none focus:border-action"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1 flex items-center justify-between">
                  <span>Token de Autorização / API Key</span>
                  <span className="text-[10px] text-ink-muted">Opcional para proteger o webhook</span>
                </label>
                <input
                  type="password"
                  placeholder="Bearer token ou segredo do webhook"
                  value={r2Form.apiKey || ''}
                  onChange={(e) => setR2Form({ ...r2Form, apiKey: e.target.value })}
                  className="w-full bg-paper border border-rule rounded-field py-2 px-3 text-xs font-mono text-ink focus:outline-none focus:border-action"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink mb-1 flex items-center justify-between">
                  <span>Domínio Público do Bucket (CDN ou r2.dev)</span>
                  <span className="text-[10px] text-ink-muted font-normal">
                    Ex: https://fotos.suaobra.com.br ou https://pub-xxxxxx.r2.dev
                  </span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://media.construkore.com.br"
                    value={r2Form.publicDomainUrl}
                    onChange={(e) => setR2Form({ ...r2Form, publicDomainUrl: e.target.value })}
                    className="w-full bg-paper border border-rule rounded-field py-2 pl-9 pr-3 text-xs font-mono text-ink focus:outline-none focus:border-action"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r2Form.enabled}
                    onChange={(e) => setR2Form({ ...r2Form, enabled: e.target.checked })}
                    className="rounded border-rule text-action focus:ring-action/30"
                  />
                  <span>Habilitar envio direto para o Cloudflare R2 nesta obra</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r2Form.autoSync}
                    onChange={(e) => setR2Form({ ...r2Form, autoSync: e.target.checked })}
                    className="rounded border-rule text-action focus:ring-action/30"
                  />
                  <span>Sincronizar fotos pendentes em segundo plano</span>
                </label>
              </div>
            </div>
          </div>

          {/* Guia Passo a Passo: Como Criar a Conta e Fazer o Vínculo */}
          <div className="bg-panel border border-rule rounded-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-action" />
                Guia Passo a Passo: Como Criar o Bucket no Cloudflare R2
              </h3>
              <a
                href="https://dash.cloudflare.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-action hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Acessar Painel Cloudflare</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-4 text-xs text-ink-secondary">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-action-soft text-action font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-ink">Criar Conta e Ativar o R2</h4>
                  <p className="mt-0.5">
                    Acesse <a href="https://dash.cloudflare.com/" target="_blank" rel="noreferrer" className="text-action underline">dash.cloudflare.com</a>, crie sua conta gratuita e, no menu lateral esquerdo, clique em <strong>R2 Object Storage</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-action-soft text-action font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-ink">Criar o Bucket de Mídia para {project.nome}</h4>
                  <p className="mt-0.5">
                    Clique em <strong>Create bucket</strong>, defina o nome (sugestão: <code className="bg-paper-subtle px-1.5 py-0.5 rounded font-mono">construkore-rdo-{project.codigo.toLowerCase()}</code>) e selecione a região <strong>Automatic</strong> ou <strong>South America</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-action-soft text-action font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-ink">Configurar Webhook Seguro no n8n ou Worker</h4>
                  <p className="mt-0.5">
                    Gere o token com permissão <strong>Object Read & Write</strong> no Cloudflare R2 e coloque no nó S3 do seu n8n na VPS ou Cloudflare Worker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE IMPORTAÇÃO EM LOTE VIA PLANILHA (3 COLUNAS)                      */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-panel border border-rule rounded-card shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header do Modal */}
            <div className="p-4 border-b border-rule flex items-center justify-between bg-paper">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-action-soft text-action flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Importação em Lote de Locais (3 Colunas)
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Obra: <strong className="text-ink">{project.nome}</strong> ({project.codigo})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded hover:bg-paper-subtle transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Modo de Importação (Substituir vs Mesclar) */}
              <div className="bg-paper p-3 rounded-card border border-rule space-y-2">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                  Modo de Importação para {project.codigo}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-field border cursor-pointer flex items-start gap-2.5 transition-colors ${
                      importMode === 'replace'
                        ? 'bg-action-soft/40 border-action text-ink font-semibold'
                        : 'bg-panel border-rule text-ink-secondary hover:border-rule'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-action"
                    />
                    <div>
                      <div className="text-xs font-bold text-ink">Substituir Locais Atuais</div>
                      <div className="text-[10px] text-ink-muted">
                        Limpa o cadastro atual desta obra e cadastra a nova estrutura da planilha (Recomendado).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-field border cursor-pointer flex items-start gap-2.5 transition-colors ${
                      importMode === 'merge'
                        ? 'bg-action-soft/40 border-action text-ink font-semibold'
                        : 'bg-panel border-rule text-ink-secondary hover:border-rule'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-action"
                    />
                    <div>
                      <div className="text-xs font-bold text-ink">Mesclar com Existentes</div>
                      <div className="text-[10px] text-ink-muted">
                        Mantém os locais já existentes e adiciona novos sem duplicar.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botão para Baixar Planilha Modelo */}
              <div className="flex items-center justify-between bg-action-soft/30 border border-action/20 p-2.5 rounded-field">
                <div className="flex items-center gap-2 text-ink">
                  <Info className="w-4 h-4 text-action shrink-0" />
                  <span className="text-[11px]">
                    A planilha precisa de 3 colunas na ordem: <strong>Torre</strong>, <strong>Pavimento</strong> e <strong>Ambiente</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 bg-action hover:bg-action/90 text-white rounded text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar Modelo (.csv)</span>
                </button>
              </div>

              {/* Alternador de Entrada: Colar do Excel vs Subir Arquivo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-rule pb-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputTab('PASTE')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        inputTab === 'PASTE'
                          ? 'bg-paper text-ink border border-rule'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Colar do Excel / Google Sheets
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputTab('FILE')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        inputTab === 'FILE'
                          ? 'bg-paper text-ink border border-rule'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      Subir Arquivo (.CSV)
                    </button>
                  </div>
                  {rawSpreadsheetText && (
                    <button
                      type="button"
                      onClick={() => setRawSpreadsheetText('')}
                      className="text-[11px] text-danger hover:underline"
                    >
                      Limpar dados colados
                    </button>
                  )}
                </div>

                {inputTab === 'PASTE' ? (
                  <div>
                    <textarea
                      rows={6}
                      value={rawSpreadsheetText}
                      onChange={(e) => setRawSpreadsheetText(e.target.value)}
                      placeholder={`Cole aqui os dados copiados do Excel ou do arquivo CSV. Exemplo:\n\nTorre A\tSubsolo 02\tGaragem e Reservatório\nTorre A\tSubsolo 01\tVagas 01 a 20\nTorre A\tTérreo\tHall de Entrada\nTorre A\t1º Pavimento Tipo\tApartamento 101\nTorre B\tTérreo\tPortaria e Acesso`}
                      className="w-full bg-paper border border-rule rounded-field p-3 text-xs font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-action"
                    />
                    <p className="text-[10px] text-ink-muted mt-1">
                      Dica: você pode selecionar as 3 colunas na sua planilha, pressionar <strong>Ctrl+C</strong> e colar direto aqui (o ConstruKore entende tabulação e vírgulas automaticamente).
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-rule rounded-card p-6 text-center space-y-2 bg-paper">
                    <Upload className="w-8 h-8 text-action mx-auto" />
                    <div className="text-xs font-bold text-ink">
                      Selecione um arquivo CSV da sua máquina
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      Arquivos .csv exportados do Excel com delimitador vírgula ou ponto-e-vírgula.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-paper border border-rule hover:border-action text-ink font-bold text-xs rounded-field inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-action" />
                      <span>Escolher Arquivo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Prévia em Tempo Real dos Dados Reconhecidos */}
              {parsedRows.length > 0 && (
                <div className="bg-paper border border-rule rounded-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Dados Reconhecidos com Sucesso:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-action-soft text-action font-bold px-2 py-0.5 rounded-full">
                        {parsedRows.length} linhas
                      </span>
                      <span className="text-[10px] bg-paper-subtle text-ink font-bold px-2 py-0.5 rounded-full border border-rule">
                        {parsedStats.torresCount} torres
                      </span>
                      <span className="text-[10px] bg-paper-subtle text-ink font-bold px-2 py-0.5 rounded-full border border-rule">
                        {parsedStats.pavimentosCount} pavimentos
                      </span>
                      <span className="text-[10px] bg-paper-subtle text-ink font-bold px-2 py-0.5 rounded-full border border-rule">
                        {parsedStats.ambientesCount} ambientes
                      </span>
                    </div>
                  </div>

                  {/* Tabela dos Primeiros Registros */}
                  <div className="border border-rule rounded overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-panel text-ink-muted border-b border-rule font-bold">
                        <tr>
                          <th className="p-1.5 pl-2 w-10">#</th>
                          <th className="p-1.5">Torre / Bloco</th>
                          <th className="p-1.5">Pavimento</th>
                          <th className="p-1.5">Ambiente / Frente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule font-mono">
                        {parsedRows.slice(0, 8).map((row, idx) => (
                          <tr key={idx} className="hover:bg-panel transition-colors">
                            <td className="p-1.5 pl-2 text-ink-muted">{idx + 1}</td>
                            <td className="p-1.5 font-bold text-ink">{row.torre || '-'}</td>
                            <td className="p-1.5 text-ink">{row.pavimento || '-'}</td>
                            <td className="p-1.5 text-ink-secondary">{row.ambiente || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 8 && (
                    <div className="text-[10px] text-ink-muted text-right">
                      E mais {parsedRows.length - 8} linhas que serão importadas...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-rule bg-paper flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-field bg-panel border border-rule hover:border-ink-muted text-ink text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-field bg-action hover:bg-action/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar e Importar ({parsedRows.length} linhas)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA DE LOCAIS                                  */}
      {/* ========================================================================= */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-panel border border-rule rounded-card shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Limpar todos os locais desta obra?
                </h3>
                <p className="text-xs text-ink-muted">
                  Obra: {project.nome} ({project.codigo})
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Esta ação removerá todas as torres, pavimentos e ambientes salvos exclusivamente para a obra <strong>{project.nome}</strong>. Você poderá subir uma nova planilha de 3 colunas a qualquer momento.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-field bg-paper border border-rule hover:border-ink-muted text-ink text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-field bg-danger hover:bg-danger/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Limpar Locais</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
