// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — PAINEL DE LOCAIS & CLOUDFLARE R2
// Gestão de Torres, Pavimentos, Ambientes e Armazenamento em Nuvem
// =====================================================================

import React, { useState } from 'react';
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
  Copy,
  Check,
} from 'lucide-react';
import {
  ObraLocationsConfig,
  LocationItem,
  R2StorageConfig,
  ProjectContext,
} from '../../types/diary.types';
import { R2UploadService } from '../../services/r2UploadService';

interface LocationsAndR2PanelProps {
  project: ProjectContext;
  locationsConfig: ObraLocationsConfig;
  r2Config: R2StorageConfig;
  onUpdateLocations: (updates: Partial<ObraLocationsConfig>) => void;
  onAddLocationItem: (type: 'torres' | 'pavimentos' | 'ambientes', item: LocationItem) => void;
  onRemoveLocationItem: (type: 'torres' | 'pavimentos' | 'ambientes', id: string) => void;
  onResetLocationsToDefault: () => void;
  onUpdateR2Config: (updates: Partial<R2StorageConfig>) => void;
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estados para inclusão inline de locais
  const [novoTipo, setNovoTipo] = useState<'torres' | 'pavimentos' | 'ambientes'>('pavimentos');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoNome, setNovoNome] = useState('');

  // Prévia do carimbo
  const [previewTorre, setPreviewTorre] = useState(locationsConfig.torres[0]?.nome || 'Torre A');
  const [previewPavimento, setPreviewPavimento] = useState(locationsConfig.pavimentos[7]?.nome || '8º Pavimento');
  const [previewAmbiente, setPreviewAmbiente] = useState(locationsConfig.ambientes[0]?.nome || 'Apartamento Final 1');

  const handleSalvarR2 = () => {
    onUpdateR2Config(r2Form);
    setR2TestStatus({
      tested: true,
      success: true,
      message: 'Configurações de armazenamento salvas no navegador com sucesso!',
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

  const copiarTexto = (texto: string, chave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedKey(chave);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Painel */}
      <div className="bg-panel border border-rule rounded-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-action-soft text-action uppercase tracking-wider">
              ESTRUTURA DE CAMPO & NUVEM
            </span>
            <span className="text-xs text-ink-muted">· {project.nome}</span>
          </div>
          <h2 className="text-lg font-bold text-ink mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-action" />
            Locais da Obra & Cloudflare R2
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Padronize os pavimentos para o carimbo da câmera mobile e configure o bucket R2 para armazenamento com zero custo de tráfego.
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
            Locais & Pavimentos ({locationsConfig.torres.length + locationsConfig.pavimentos.length + locationsConfig.ambientes.length})
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
          {/* Prévia do Carimbo Pericial */}
          <div className="bg-panel border border-rule rounded-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-2">
                <Eye className="w-4 h-4 text-action" />
                Prévia do Carimbo Indelével na Câmera Mobile
              </span>
              <span className="text-[11px] text-ink-muted">
                Este carimbo é queimado diretamente nos pixels da foto capturada pelo encarregado
              </span>
            </div>

            {/* Simulação Visual do Carimbo Preto Translúcido */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 text-white p-4 font-mono">
              <div className="absolute top-2 right-2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                Carimbo Pericial em 1920x1080
              </div>
              <div className="h-24 flex items-center justify-center text-slate-600 text-xs italic">
                [ Feed de Vídeo da Câmera do Encarregado ]
              </div>
              {/* Tarja Inferior */}
              <div className="bg-slate-950/90 border-t-2 border-amber-500 p-3 rounded-b-md space-y-1">
                <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  CONSTRUKORE | OBRA: {project.codigo} • {previewTorre.toUpperCase()} • {previewPavimento.toUpperCase()} • {previewAmbiente.toUpperCase()}
                </div>
                <div className="text-[11px] text-slate-300">
                  DATA: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')} • GPS: -25.428400, -49.273300 (Curitiba, PR)
                </div>
                <div className="text-[10px] text-slate-400">
                  RESPONSÁVEL: Antônio Santos (Encarregado) • EVIDÊNCIA FOTOGRÁFICA INALTERÁVEL
                </div>
              </div>
            </div>
          </div>

          {/* Formulário Rápido de Adição de Local */}
          <form
            onSubmit={handleAdicionarItem}
            className="bg-panel border border-rule rounded-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-2">
                <Plus className="w-4 h-4 text-action" />
                Adicionar Novo Local / Pavimento à Estrutura
              </span>
              <button
                type="button"
                onClick={onResetLocationsToDefault}
                className="text-xs text-ink-muted hover:text-action flex items-center gap-1 transition-colors"
                title="Restaura os 13 pavimentos e ambientes padrão da obra"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão Predial</span>
              </button>
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
                  className="px-4 py-2 bg-action hover:bg-action/90 text-white font-bold text-xs rounded-field flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar</span>
                </button>
              </div>
            </div>
          </form>

          {/* Três Colunas: Torres, Pavimentos, Ambientes */}
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
                {locationsConfig.torres.map((item) => (
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
                    {locationsConfig.torres.length > 1 && (
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
                    )}
                  </div>
                ))}
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
                {locationsConfig.pavimentos.map((item) => (
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
                    {locationsConfig.pavimentos.length > 1 && (
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
                    )}
                  </div>
                ))}
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
                {locationsConfig.ambientes.map((item) => (
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
                    {locationsConfig.ambientes.length > 1 && (
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CLOUDFLARE R2 (CONFIGURAÇÃO & TUTORIAL)                             */}
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
                  <div className="flex items-center gap-2">
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
                    10 GB grátis todos os meses, zero taxa de tráfego de download e compatibilidade com Amazon S3.
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
                  <span>Salvar Configurações</span>
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
                  <span className="text-[10px] text-ink-muted font-normal">32 caracteres hexadecimais</span>
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
                  Nome do Bucket R2
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: construkore-rdo-media"
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
                  <span>Habilitar envio direto para o Cloudflare R2</span>
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
                  <h4 className="font-bold text-ink">Criar o Bucket de Mídia</h4>
                  <p className="mt-0.5">
                    Clique em <strong>Create bucket</strong>, defina o nome (ex: <code className="bg-paper-subtle px-1.5 py-0.5 rounded font-mono">construkore-rdo-media</code>) e selecione a região <strong>Automatic</strong> ou <strong>South America / North America</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-action-soft text-action font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-ink">Gerar Token R2 e Configurar no Backend (Worker / n8n)</h4>
                  <p className="mt-0.5">
                    Na tela do R2, clique em <strong>Manage R2 API Tokens</strong>. Crie um token com permissão <strong>Object Read & Write</strong>.
                  </p>
                  <p className="mt-1 text-ink-muted">
                    Coloque esse token nas variáveis de ambiente do seu <strong>Cloudflare Worker</strong> ou nó do <strong>n8n na VPS</strong>. Ele manterá a chave 100% protegida fora do navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-action-soft text-action font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-ink">Informar o Endpoint de Upload Seguro</h4>
                  <p className="mt-0.5">
                    Cole no campo <strong>Endpoint Seguro de Upload</strong> a URL do seu Worker (ex: <code className="bg-paper-subtle px-1.5 py-0.5 rounded font-mono">https://upload.suaobra.workers.dev</code>) ou do Webhook do n8n na sua VPS.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-action-soft text-action font-bold flex items-center justify-center shrink-0 text-xs">
                  5
                </div>
                <div>
                  <h4 className="font-bold text-ink">Habilitar Acesso Público (Domínio das Fotos)</h4>
                  <p className="mt-0.5">
                    Entre no seu bucket criado, clique na aba <strong>Settings</strong> e desça até <strong>Public Access</strong>.
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-ink-muted">
                    <li>Opção Rápida: Ative <strong>R2.dev subdomain</strong> (gera uma URL como <code className="font-mono">https://pub-xxxx.r2.dev</code>).</li>
                    <li>Opção Profissional: Clique em <strong>Connect Domain</strong> e aponte um subdomínio próprio (ex: <code className="font-mono">media.suaconstrutora.com.br</code>).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
