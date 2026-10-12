// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — HISTÓRICO & CALENDÁRIO DE RDOS
// Gestão de Dias Anteriores, Rascunhos em Aberto e Consulta Retroativa
// =====================================================================

import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CloudRain,
  Sun,
  Cloud,
  Lock,
  Plus,
  ArrowRight,
  FileText,
  Camera,
  Trash2,
  HardHat,
  TrendingUp,
  AlertTriangle,
  Search,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { DailyReportSummaryItem, ProjectContext } from '../../types/diary.types';

interface ReportsHistoryPanelProps {
  project: ProjectContext;
  reportsList: DailyReportSummaryItem[];
  activeDate: string;
  onSelectDate: (date: string) => void;
  onCreateNewDay: (targetDate: string, copyYesterdayWorkforce: boolean) => void;
  onDeleteDraftDay?: (targetDate: string) => void;
  onOpenDocumentView: (date: string) => void;
  onOpenPhotoDossier: (date: string) => void;
}

export const ReportsHistoryPanel: React.FC<ReportsHistoryPanelProps> = ({
  project,
  reportsList,
  activeDate,
  onSelectDate,
  onCreateNewDay,
  onDeleteDraftDay,
  onOpenDocumentView,
  onOpenPhotoDossier,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'ISSUED' | 'RAIN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewDayModalOpen, setIsNewDayModalOpen] = useState(false);
  const [newDateInput, setNewDateInput] = useState(() => {
    // Data de amanhã ou de hoje como sugestão
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [copyWorkforceChecked, setCopyWorkforceChecked] = useState(true);

  // Contadores analíticos
  const totalReports = reportsList.length;
  const issuedReports = reportsList.filter((r) => r.workflow_state === 'ISSUED').length;
  const pendingReports = reportsList.filter((r) => r.workflow_state !== 'ISSUED').length;
  const rainReports = reportsList.filter((r) => r.is_contractual_rain_day).length;

  // Filtragem da listagem
  const filteredList = reportsList.filter((r) => {
    if (filterMode === 'PENDING' && r.workflow_state === 'ISSUED') return false;
    if (filterMode === 'ISSUED' && r.workflow_state !== 'ISSUED') return false;
    if (filterMode === 'RAIN' && !r.is_contractual_rain_day) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.formatted_number.toLowerCase().includes(q) ||
        r.formatted_date.includes(q) ||
        r.weekday.toLowerCase().includes(q) ||
        r.date.includes(q)
      );
    }
    return true;
  });

  const handleConfirmCreateNewDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput) return;
    onCreateNewDay(newDateInput, copyWorkforceChecked);
    setIsNewDayModalOpen(false);
  };

  const getWeatherIcon = (cond: string, isRain: boolean) => {
    if (isRain || cond.includes('CHUVA')) {
      return <CloudRain className="w-4 h-4 text-blue-500" />;
    }
    if (cond.includes('NUBLADO')) {
      return <Cloud className="w-4 h-4 text-ink-muted" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho do Painel */}
      <div className="bg-panel border border-rule rounded-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-action-soft text-action uppercase tracking-wider">
              ARQUIVO DE GOVERNANÇA RDO
            </span>
            <span className="text-xs text-ink-muted">· {project.nome}</span>
          </div>
          <h2 className="text-lg font-bold text-ink mt-1 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-action" />
            Histórico de Diários & Dias Anteriores
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Analise e edite relatórios de dias anteriores que estão em rascunho, consulte RDOs emitidos e crie novos lançamentos retroativos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsNewDayModalOpen(true)}
            className="px-4 py-2.5 rounded-field bg-action hover:bg-action/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors w-full sm:w-auto justify-center active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Criar RDO para Nova Data</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Status Geral dos Diários */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-panel border border-rule rounded-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Total Registrado</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-ink">{totalReports}</span>
            <Calendar className="w-5 h-5 text-action" />
          </div>
          <span className="text-[11px] text-ink-secondary block">Diários na base</span>
        </div>

        <div className="bg-panel border border-rule rounded-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Emitidos & Bloqueados</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-success">{issuedReports}</span>
            <Lock className="w-5 h-5 text-success" />
          </div>
          <span className="text-[11px] text-success font-semibold block">Imutáveis com hash</span>
        </div>

        <div className="bg-panel border border-rule rounded-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Rascunhos / Em Análise</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-warning">{pendingReports}</span>
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <span className="text-[11px] text-warning font-semibold block">Abertos para edição</span>
        </div>

        <div className="bg-panel border border-rule rounded-card p-4 space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Chuva Impediente</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-blue-500">{rainReports}</span>
            <CloudRain className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[11px] text-blue-500 font-semibold block">Pleito contratual ativo</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-panel border border-rule rounded-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              filterMode === 'ALL'
                ? 'bg-action text-white shadow-xs'
                : 'text-ink-secondary hover:text-ink bg-paper border border-rule'
            }`}
          >
            Todos ({totalReports})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              filterMode === 'PENDING'
                ? 'bg-warning text-slate-950 font-bold shadow-xs'
                : 'text-ink-secondary hover:text-ink bg-paper border border-rule'
            }`}
          >
            Rascunhos em Aberto ({pendingReports})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('ISSUED')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              filterMode === 'ISSUED'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-ink-secondary hover:text-ink bg-paper border border-rule'
            }`}
          >
            Emitidos ({issuedReports})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('RAIN')}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
              filterMode === 'RAIN'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-ink-secondary hover:text-ink bg-paper border border-rule'
            }`}
          >
            Chuva ({rainReports})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por RDO, data ou dia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-paper border border-rule rounded-field py-1.5 pl-8 pr-3 text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-action"
          />
        </div>
      </div>

      {/* Grade de Diários Anteriores & Atuais */}
      <div className="space-y-3">
        {filteredList.map((item) => {
          const isIssued = item.workflow_state === 'ISSUED';
          const isActive = item.date === activeDate;

          return (
            <div
              key={item.date}
              className={`p-4 sm:p-5 rounded-card border transition-all ${
                isActive
                  ? 'bg-action-soft/20 border-action ring-2 ring-action/20 shadow-sm'
                  : 'bg-panel border-rule hover:border-rule-strong shadow-xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Dados da Data e Identificação */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink">
                      {item.formatted_number}
                    </span>
                    <span className="text-xs text-ink-muted">•</span>
                    <span className="text-sm font-semibold text-ink">
                      {item.formatted_date} ({item.weekday})
                    </span>

                    {/* Badges de Status */}
                    {isIssued ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <Lock className="w-3 h-3" /> Emitido & Bloqueado
                      </span>
                    ) : item.workflow_state === 'IN_REVIEW' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Em Validação de Governança
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Clock className="w-3 h-3" /> Rascunho / Em Aberto
                      </span>
                    )}

                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-action text-white">
                        <CheckCircle2 className="w-3 h-3" /> DIA ATIVO NA TELA
                      </span>
                    )}

                    {item.is_contractual_rain_day && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <CloudRain className="w-3 h-3" /> Chuva Impediente
                      </span>
                    )}

                    {item.conflicts_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger-soft text-danger border border-danger/20">
                        <AlertTriangle className="w-3 h-3" /> {item.conflicts_count} conflito
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink-secondary">
                    Responsável:{' '}
                    <strong>{item.responsible_engineer_name || 'Engenharia Residente'}</strong>
                    {item.document_hash && (
                      <span className="font-mono text-[10px] text-ink-muted ml-2">
                        Hash: {item.document_hash.substring(0, 16)}...
                      </span>
                    )}
                  </p>
                </div>

                {/* Métricas Rápidas do Dia (Efetivo, Avanço, Evidências, Clima) */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-ink-secondary">
                  {/* Efetivo */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center border border-rule text-action">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-ink block text-xs">
                        {item.total_workers} operários
                      </span>
                      <span className="text-[10px] text-ink-muted">Efetivo de obra</span>
                    </div>
                  </div>

                  {/* Avanço Físico */}
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-ink">
                      <span>Avanço</span>
                      <span className="font-mono">{item.production_progress_pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-paper rounded-full overflow-hidden border border-rule">
                      <div
                        className="h-full bg-action rounded-full transition-all"
                        style={{ width: `${item.production_progress_pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Clima */}
                  <div className="flex items-center gap-1.5">
                    {getWeatherIcon(item.weather_condition, item.is_contractual_rain_day)}
                    <span className="text-xs font-semibold text-ink">
                      {item.is_contractual_rain_day ? 'Chuva' : 'Estável'}
                    </span>
                  </div>

                  {/* Evidências Fotográficas */}
                  <div className="flex items-center gap-1 text-xs text-ink-muted">
                    <Camera className="w-3.5 h-3.5 text-action" />
                    <span className="font-mono font-bold text-ink">{item.photos_count}</span>
                    <span className="text-[11px]">fotos</span>
                  </div>
                </div>

                {/* Botões de Ação para o Dia */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  {/* Se for Rascunho / Em Aberto: Botão Primário "Abrir para Editar" */}
                  {!isIssued ? (
                    <button
                      type="button"
                      onClick={() => onSelectDate(item.date)}
                      className={`px-3.5 py-2 rounded-field text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                        isActive
                          ? 'bg-action text-white hover:bg-action/90'
                          : 'bg-action-soft hover:bg-action text-action hover:text-white'
                      }`}
                    >
                      <span>{isActive ? 'Continuar Editando' : 'Abrir para Editar'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    // Se for Emitido: Botão para Visualizar RDO Oficial e Dossiê
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDocumentView(item.date)}
                        className="px-3 py-1.5 rounded-field bg-paper border border-rule hover:border-action text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Visualizar RDO Oficial A4 emitido"
                      >
                        <FileText className="w-3.5 h-3.5 text-action" />
                        <span>RDO A4</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPhotoDossier(item.date)}
                        className="px-3 py-1.5 rounded-field bg-paper border border-rule hover:border-action text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Visualizar Caderno Fotográfico Pericial"
                      >
                        <Camera className="w-3.5 h-3.5 text-action" />
                        <span>Dossiê</span>
                      </button>

                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => onSelectDate(item.date)}
                          className="px-3 py-1.5 rounded-field bg-paper-subtle text-ink-muted hover:text-ink text-xs font-semibold transition-colors"
                          title="Carregar no painel para consulta"
                        >
                          Consultar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Excluir Rascunho se não for o dia ativo e não estiver emitido */}
                  {!isIssued && !isActive && onDeleteDraftDay && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja descartar o rascunho de ${item.formatted_date}?`)) {
                          onDeleteDraftDay(item.date);
                        }
                      }}
                      className="p-2 rounded-field text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                      title="Excluir este rascunho"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="p-8 text-center bg-panel border border-rule rounded-card space-y-2">
            <CalendarDays className="w-8 h-8 text-ink-muted mx-auto" />
            <h4 className="text-sm font-bold text-ink">Nenhum diário encontrado</h4>
            <p className="text-xs text-ink-secondary">
              Não há relatórios correspondentes ao filtro selecionado.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Criar RDO para Nova Data */}
      {isNewDayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-panel border border-rule rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-rule pb-3">
              <div className="w-10 h-10 rounded-xl bg-action-soft text-action flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Criar Diário de Obra (RDO)</h3>
                <p className="text-xs text-ink-muted">Inicie um novo lançamento diário para a obra</p>
              </div>
            </div>

            <form onSubmit={handleConfirmCreateNewDay} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Selecione a Data da Obra
                </label>
                <input
                  type="date"
                  required
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="w-full bg-paper border border-rule rounded-field py-2.5 px-3 text-xs text-ink font-semibold focus:outline-none focus:border-action"
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  Você pode escolher datas anteriores para preenchimento retroativo.
                </p>
              </div>

              <div className="p-3 bg-paper rounded-field border border-rule space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={copyWorkforceChecked}
                    onChange={(e) => setCopyWorkforceChecked(e.target.checked)}
                    className="rounded border-rule text-action focus:ring-action/30"
                  />
                  <span>Copiar equipes e efetivo do dia anterior</span>
                </label>
                <p className="text-[11px] text-ink-muted pl-5">
                  Facilita o preenchimento trazendo a contagem de pedreiros, serventes e terceirizados já cadastrados.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewDayModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-paper border border-rule hover:bg-paper-subtle text-ink font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-action hover:bg-action/90 text-white font-bold text-xs shadow-md"
                >
                  Criar e Abrir Diário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
