import React, { useState } from 'react';
import {
  Hammer,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Camera,
  MapPin,
  User,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { ProductionEntry } from '../../types/diary.types';

interface ProductionManagerPanelProps {
  productionList: ProductionEntry[];
  onUpdateProductionDetails: (taskId: string, updates: Partial<ProductionEntry>) => void;
  onAddProductionEntry: (entry: Partial<ProductionEntry>) => void;
}

export const ProductionManagerPanel: React.FC<ProductionManagerPanelProps> = ({
  productionList,
  onUpdateProductionDetails,
  onAddProductionEntry,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newLocation, setNewLocation] = useState('Pavimento 08');
  const [newPlanned, setNewPlanned] = useState<number>(100);
  const [newUom, setNewUom] = useState('m²');
  const [newCritical, setNewCritical] = useState(false);
  const [newAssignee, setNewAssignee] = useState('Antônio Santos (Encarregado)');

  const totalPlanned = productionList.reduce((acc, curr) => acc + curr.quantity_planned, 0);
  const totalReported = productionList.reduce((acc, curr) => acc + curr.quantity_reported, 0);
  const globalProgress = totalPlanned > 0 ? Math.round((totalReported / totalPlanned) * 100) : 0;
  const completedCount = productionList.filter((p) => p.progress_pct >= 100).length;
  const criticalCount = productionList.filter((p) => p.is_critical).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName) return;

    onAddProductionEntry({
      task_name: newTaskName.trim(),
      location_name: newLocation.trim(),
      quantity_planned: Math.max(1, newPlanned),
      quantity_reported: 0,
      uom: newUom,
      is_critical: newCritical,
      assigned_user_name: newAssignee,
    });

    setNewTaskName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Topo & KPIs de Produção */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Avanço Físico Global</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-action">{globalProgress}%</span>
            <TrendingUp className="w-6 h-6 text-action" />
          </div>
          <span className="text-[11px] text-ink-secondary block">Meta ponderada do dia</span>
        </div>

        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Frentes em Execução</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-ink">{productionList.length}</span>
            <Hammer className="w-6 h-6 text-ink-muted" />
          </div>
          <span className="text-[11px] text-ink-secondary block">Atividades planejadas hoje</span>
        </div>

        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Metas Atingidas (100%+)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-success">{completedCount}</span>
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <span className="text-[11px] text-ink-secondary block">Concluídas conforme plano</span>
        </div>

        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Tarefas Críticas (Foto Req.)</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-danger">{criticalCount}</span>
            <Camera className="w-6 h-6 text-danger" />
          </div>
          <span className="text-[11px] text-ink-secondary block">Exigem evidência no fechamento</span>
        </div>
      </div>

      {/* Painel Principal com Tabela Editável de Produção */}
      <div className="bg-panel border border-rule rounded-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">
                Apontamento & Medição de Produção Diária
              </h3>
              <span className="text-[10px] font-mono font-bold bg-action-soft text-action px-2 py-0.5 rounded-chip">
                Edição Direta pelo Engenheiro
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Alimente as quantidades executadas no canteiro hoje. Tarefas com desvios superiores a 15% devem conter observações justificadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 text-xs font-bold bg-action hover:opacity-90 text-white rounded-field flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Atividade
          </button>
        </div>

        {/* Formulário Inline de Nova Atividade */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="p-4 bg-paper rounded-card border border-rule space-y-3 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-action" /> Nova Atividade no Diário de Hoje
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Nome da Atividade:
                </label>
                <input
                  type="text"
                  required
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Ex: Assentamento de Contramarcos"
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Local / Pavimento:
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ex: Pavimento 08"
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Encarregado Responsável:
                </label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="Ex: Antônio Santos"
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Meta Prevista Hoje:
                </label>
                <input
                  type="number"
                  min={1}
                  value={newPlanned}
                  onChange={(e) => setNewPlanned(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Unidade (UOM):
                </label>
                <select
                  value={newUom}
                  onChange={(e) => setNewUom(e.target.value)}
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                >
                  <option value="m²">m² (Metro quadrado)</option>
                  <option value="m³">m³ (Metro cúbico)</option>
                  <option value="pontos">pontos (Instalações)</option>
                  <option value="kg">kg (Armação)</option>
                  <option value="un">un (Peças)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newCritical}
                    onChange={(e) => setNewCritical(e.target.checked)}
                    className="w-4 h-4 text-danger rounded border-rule"
                  />
                  <span className="font-semibold text-danger">Atividade Crítica (Foto Obrigatória)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-action hover:opacity-90 text-white rounded-field shadow-xs"
              >
                Salvar Atividade
              </button>
            </div>
          </form>
        )}

        {/* Tabela Editável de Atividades */}
        <div className="overflow-x-auto border border-rule rounded-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-panel-subtle border-b border-rule text-ink-muted uppercase text-[10px] font-bold">
                <th className="p-3">Atividade / Frente</th>
                <th className="p-3">Localização</th>
                <th className="p-3">Responsável</th>
                <th className="p-3 text-center">Meta Prevista</th>
                <th className="p-3 text-center">Executado Hoje</th>
                <th className="p-3 text-center">Progresso (%)</th>
                <th className="p-3">Observações / Desvios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {productionList.map((prod) => (
                <tr key={prod.task_id} className="hover:bg-paper transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-ink">{prod.task_name}</strong>
                      {prod.is_critical && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-danger-soft text-danger uppercase">
                          Crítica
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-ink-secondary">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-action" />
                      {prod.location_name}
                    </span>
                  </td>

                  <td className="p-3 text-ink-secondary">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-ink-muted" />
                      {prod.assigned_user_name || 'Encarregado'}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-ink">
                    {prod.quantity_planned} {prod.uom}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={prod.quantity_reported}
                        onChange={(e) =>
                          onUpdateProductionDetails(prod.task_id, {
                            quantity_reported: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-center font-mono font-bold text-xs bg-paper border border-rule rounded-field py-1 text-ink focus:border-action focus:outline-none"
                      />
                      <span className="text-[11px] text-ink-muted font-mono">{prod.uom}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="w-28 mx-auto space-y-1">
                      <div className="w-full h-2 rounded-pill bg-panel border border-rule overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            prod.progress_pct >= 100 ? 'bg-success' : 'bg-action'
                          }`}
                          style={{ width: `${Math.min(100, prod.progress_pct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-ink block text-center">
                        {prod.progress_pct}%
                      </span>
                    </div>
                  </td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={prod.notes || ''}
                      onChange={(e) =>
                        onUpdateProductionDetails(prod.task_id, { notes: e.target.value })
                      }
                      placeholder="Justificativa técnica ou nota..."
                      className="w-full p-1.5 rounded-field bg-paper border border-rule text-xs text-ink placeholder:text-ink-muted focus:border-action focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
