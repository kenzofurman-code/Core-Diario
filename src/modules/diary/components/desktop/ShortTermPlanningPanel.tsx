import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  User,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { WeeklyPlanTask, UserContext } from '../../types/diary.types';
import { sampleUsers } from '../../services/diaryStorage';

interface ShortTermPlanningPanelProps {
  tasks: WeeklyPlanTask[];
  onAddTask: (task: Partial<WeeklyPlanTask>) => void;
  onUpdateTask: (taskId: string, updates: Partial<WeeklyPlanTask>) => void;
}

export const ShortTermPlanningPanel: React.FC<ShortTermPlanningPanelProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterUser, setFilterUser] = useState<string>('ALL');

  // Campos do formulário
  const [wbsCode, setWbsCode] = useState('02.04.02');
  const [taskName, setTaskName] = useState('');
  const [locationName, setLocationName] = useState('Pavimento 08 — Torre A');
  const [assignedUserId, setAssignedUserId] = useState('usr-02');
  const [companyType, setCompanyType] = useState<'PROPRIA' | 'TERCEIRIZADA'>('TERCEIRIZADA');
  const [companyName, setCompanyName] = useState('Empreiteira Silva & Santos');
  const [qtyWeek, setQtyWeek] = useState<number>(150);
  const [qtyToday, setQtyToday] = useState<number>(30);
  const [uom, setUom] = useState('m²');
  const [isCritical, setIsCritical] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (filterUser === 'ALL') return true;
    return t.assigned_user_id === filterUser;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName) return;

    const assignedUser = sampleUsers.find((u) => u.id === assignedUserId);

    onAddTask({
      wbs_code: wbsCode,
      task_name: taskName.trim(),
      location_name: locationName.trim(),
      assigned_user_id: assignedUserId,
      assigned_user_name: assignedUser ? `${assignedUser.name} (${assignedUser.role})` : 'Encarregado',
      company_type: companyType,
      company_name: companyName.trim(),
      quantity_planned_week: qtyWeek,
      quantity_planned_today: qtyToday,
      uom,
      is_critical: isCritical,
    });

    setTaskName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner Conceitual de Curto Prazo */}
      <div className="bg-panel border border-rule rounded-card p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-chip bg-action text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">
                  Planejamento de Curto Prazo (Semana 37 • 07/09 a 12/09/2026)
                </h3>
                <span className="text-[10px] font-mono font-bold bg-action-soft text-action px-2 py-0.5 rounded-chip">
                  Last Planner System
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                As tarefas programadas aqui alimentam as frentes de serviço no Modo Canteiro por Encarregado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-2 text-xs font-bold bg-action hover:opacity-90 text-white rounded-field flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Programar Nova Tarefa Semanal
            </button>
          </div>
        </div>

        {/* Explicação da Atribuição por Encarregado */}
        <div className="p-3 bg-action-soft/20 border border-action/30 rounded-field flex items-start gap-2.5 text-xs text-ink-secondary">
          <Sparkles className="w-4 h-4 text-action shrink-0 mt-0.5" />
          <div>
            <p className="text-ink font-semibold">
              Regra de Visibilidade por Usuário:
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Quando o encarregado (ex: <strong>Antônio Santos</strong>) acessa o Modo Canteiro, ele visualiza apenas as atividades atribuídas a ele no planejamento semanal. O Mestre de Obras (Carlos Silva) e a Engenheira Residente (Mariana Costa) têm acesso global a todas as equipes.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário Inline de Nova Tarefa Semanal */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-panel border border-rule rounded-card p-5 space-y-4 animate-in fade-in duration-150">
          <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 border-b border-rule pb-2">
            <Plus className="w-3.5 h-3.5 text-action" /> Inserir Atividade no Planejamento Semanal de Curto Prazo
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Código EAP / WBS:
              </label>
              <input
                type="text"
                required
                value={wbsCode}
                onChange={(e) => setWbsCode(e.target.value)}
                placeholder="Ex: 02.04.01"
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Descrição da Tarefa:
              </label>
              <input
                type="text"
                required
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Ex: Alvenaria de Vedação — Pavimento 08"
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink text-xs focus:border-action focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Local / Pavimento:
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Pavimento 08 — Torre A"
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink text-xs focus:border-action focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Encarregado Responsável:
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink text-xs focus:border-action focus:outline-none cursor-pointer"
              >
                {sampleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Empresa Executora:
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Empreiteira Silva & Santos"
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink text-xs focus:border-action focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Meta Prevista da Semana:
              </label>
              <input
                type="number"
                min={1}
                value={qtyWeek}
                onChange={(e) => setQtyWeek(parseFloat(e.target.value) || 1)}
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                Meta Diária (Hoje):
              </label>
              <input
                type="number"
                min={1}
                value={qtyToday}
                onChange={(e) => setQtyToday(parseFloat(e.target.value) || 1)}
                className="w-full p-2 rounded-field bg-paper border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rule">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
                className="w-4 h-4 text-danger rounded border-rule"
              />
              <span className="font-semibold text-danger">Atividade Crítica (Exige Foto Obrigatória)</span>
            </label>

            <div className="flex items-center gap-2">
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
                Inserir no Planejamento
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filtro por Encarregado e Tabela */}
      <div className="bg-panel border border-rule rounded-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-ink">
              Grade Semanal de Atividades ({filteredTasks.length} frentes)
            </h4>
          </div>

          {/* Filtro por Usuário */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink-muted">Filtrar por Responsável:</span>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="p-1.5 rounded-field bg-paper border border-rule text-xs text-ink focus:border-action focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos os Responsáveis</option>
              {sampleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Tarefas de Curto Prazo */}
        <div className="overflow-x-auto border border-rule rounded-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-panel-subtle border-b border-rule text-ink-muted uppercase text-[10px] font-bold">
                <th className="p-3">Código EAP</th>
                <th className="p-3">Atividade Programada</th>
                <th className="p-3">Localização</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Empresa</th>
                <th className="p-3 text-center">Meta Semana</th>
                <th className="p-3 text-center">Meta Hoje</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-paper transition-colors">
                  <td className="p-3 font-mono font-bold text-ink">
                    <span className="px-2 py-0.5 rounded bg-panel-subtle border border-rule">
                      {t.wbs_code}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-ink">{t.task_name}</strong>
                      {t.is_critical && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-danger-soft text-danger uppercase">
                          Crítica
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-ink-secondary">
                    {t.location_name}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-action-soft text-action flex items-center justify-center text-[10px] font-bold">
                        {t.assigned_user_name.charAt(0)}
                      </div>
                      <span className="font-semibold text-ink text-xs">
                        {t.assigned_user_name}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-ink-secondary">
                    {t.company_name}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-ink">
                    {t.quantity_planned_week} {t.uom}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-action">
                    {t.quantity_planned_today} {t.uom}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-chip uppercase ${
                        t.status === 'COMPLETED'
                          ? 'bg-success text-white'
                          : 'bg-action-soft text-action'
                      }`}
                    >
                      {t.status === 'COMPLETED' ? 'Concluída' : 'Em Execução'}
                    </span>
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
