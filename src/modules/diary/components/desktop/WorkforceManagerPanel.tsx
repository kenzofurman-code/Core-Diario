import React, { useState } from 'react';
import {
  Users,
  Plus,
  RotateCcw,
  Trash2,
  Building2,
  HardHat,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { WorkforceSnapshot, WorkforceRoleCount } from '../../types/diary.types';

interface WorkforceManagerPanelProps {
  workforce: WorkforceSnapshot;
  onUpdateRoleCount: (roleCode: string, count: number, companyName?: string) => void;
  onAddRole: (role: WorkforceRoleCount) => void;
  onRemoveRole: (roleCode: string) => void;
  onCopyYesterday: () => void;
}

export const WorkforceManagerPanel: React.FC<WorkforceManagerPanelProps> = ({
  workforce,
  onUpdateRoleCount,
  onAddRole,
  onRemoveRole,
  onCopyYesterday,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newCompanyType, setNewCompanyType] = useState<'PROPRIA' | 'TERCEIRIZADA'>('TERCEIRIZADA');
  const [newCompanyName, setNewCompanyName] = useState('Empreiteira Roma');
  const [newCount, setNewCount] = useState<number>(4);

  const totalWorkers = workforce.entries.reduce((acc, curr) => acc + curr.count, 0);
  const totalProprios = workforce.entries
    .filter((e) => e.company_type === 'PROPRIA')
    .reduce((acc, curr) => acc + curr.count, 0);
  const totalTerceiros = workforce.entries
    .filter((e) => e.company_type === 'TERCEIRIZADA')
    .reduce((acc, curr) => acc + curr.count, 0);

  const pctProprios = totalWorkers > 0 ? Math.round((totalProprios / totalWorkers) * 100) : 0;
  const pctTerceiros = totalWorkers > 0 ? Math.round((totalTerceiros / totalWorkers) * 100) : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleCode || !newRoleName) return;

    onAddRole({
      role_code: newRoleCode.toUpperCase().trim(),
      role_name: newRoleName.trim(),
      company_type: newCompanyType,
      company_name: newCompanyName.trim(),
      count: Math.max(1, newCount),
    });

    setNewRoleCode('');
    setNewRoleName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Topo & KPIs de Efetivo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Efetivo Total no Canteiro</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-ink">{totalWorkers}</span>
            <Users className="w-6 h-6 text-action" />
          </div>
          <span className="text-[11px] text-ink-secondary block">
            {workforce.copied_from_yesterday ? 'Copiado do dia anterior' : 'Apontamento do dia atual'}
          </span>
        </div>

        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Mão de Obra Própria</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-ink">{totalProprios}</span>
            <span className="text-xs font-mono font-bold text-action bg-action-soft px-2 py-0.5 rounded">
              {pctProprios}%
            </span>
          </div>
          <span className="text-[11px] text-ink-secondary block">Engenharia e Encarregados</span>
        </div>

        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Mão de Obra Terceirizada</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-ink">{totalTerceiros}</span>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded">
              {pctTerceiros}%
            </span>
          </div>
          <span className="text-[11px] text-ink-secondary block">Subempreiteiras e Especialistas</span>
        </div>

        <div className="bg-panel border border-rule p-4 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Funções Ativas</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold text-ink">{workforce.entries.length}</span>
            <Briefcase className="w-6 h-6 text-ink-muted" />
          </div>
          <span className="text-[11px] text-ink-secondary block">Especialidades distribuídas</span>
        </div>
      </div>

      {/* Painel Principal de Gestão e Tabela Editável */}
      <div className="bg-panel border border-rule rounded-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">
                Apontamento de Mão de Obra por Equipe & Função
              </h3>
              <span className="text-[10px] font-mono font-bold bg-action-soft text-action px-2 py-0.5 rounded-chip">
                Edição em Tempo Real
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Ajuste as quantidades de operários presentes no canteiro hoje. As alterações alimentam o RDO oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopyYesterday}
              className="px-3.5 py-2 text-xs font-semibold bg-panel-subtle hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1.5 transition-colors shadow-xs"
              title="Copiar o mesmo efetivo de ontem (48 operários)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-action" />
              Repetir Efetivo de Ontem
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-2 text-xs font-bold bg-action hover:opacity-90 text-white rounded-field flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Função
            </button>
          </div>
        </div>

        {/* Formulário Inline de Adicionar Função */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="p-4 bg-paper rounded-card border border-rule space-y-3 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-action" /> Nova Função ou Empresa no Canteiro
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Código (ex: CAR, PNT):
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toUpperCase())}
                  placeholder="Ex: CAR"
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Nome da Função:
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ex: Carpinteiro de Formas"
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Vínculo:
                </label>
                <select
                  value={newCompanyType}
                  onChange={(e) => setNewCompanyType(e.target.value as any)}
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                >
                  <option value="TERCEIRIZADA">Terceirizada</option>
                  <option value="PROPRIA">Própria</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Qtd Inicial:
                </label>
                <input
                  type="number"
                  min={1}
                  value={newCount}
                  onChange={(e) => setNewCount(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink font-mono text-xs focus:border-action focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-secondary mb-1">
                  Empresa / Razão Social:
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Ex: Estruturas Poty Mirante"
                  className="w-full p-2 rounded-field bg-panel border border-rule text-ink text-xs focus:border-action focus:outline-none"
                />
              </div>

              <div className="flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-2 text-xs text-ink-muted hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-action hover:opacity-90 text-white rounded-field shadow-xs"
                >
                  Adicionar ao Efetivo
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tabela de Funções e Contagens */}
        <div className="overflow-x-auto border border-rule rounded-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-panel-subtle border-b border-rule text-ink-muted uppercase text-[10px] font-bold">
                <th className="p-3">Código</th>
                <th className="p-3">Função / Especialidade</th>
                <th className="p-3">Empresa</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-center">Operários Presentes</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {workforce.entries.map((entry) => (
                <tr key={entry.role_code} className="hover:bg-paper transition-colors">
                  <td className="p-3 font-mono font-bold text-ink">
                    <span className="px-2 py-0.5 rounded bg-panel-subtle border border-rule">
                      {entry.role_code}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-ink">
                    {entry.role_name}
                  </td>
                  <td className="p-3 text-ink-secondary font-medium">
                    {entry.company_name}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-chip uppercase ${
                        entry.company_type === 'PROPRIA'
                          ? 'bg-action-soft text-action'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {entry.company_type}
                    </span>
                  </td>
                  <td className="p-3">
                    {/* Controle Tátil de Contagem */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateRoleCount(entry.role_code, Math.max(0, entry.count - 1))}
                        className="w-7 h-7 rounded-field bg-panel border border-rule text-ink hover:bg-panel-subtle font-bold flex items-center justify-center transition-colors active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={entry.count}
                        onChange={(e) =>
                          onUpdateRoleCount(entry.role_code, Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-16 text-center font-mono font-bold text-sm bg-paper border border-rule rounded-field py-1 text-ink focus:border-action focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateRoleCount(entry.role_code, entry.count + 1)}
                        className="w-7 h-7 rounded-field bg-panel border border-rule text-ink hover:bg-panel-subtle font-bold flex items-center justify-center transition-colors active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveRole(entry.role_code)}
                      className="p-1.5 text-ink-muted hover:text-danger rounded hover:bg-danger-soft/30 transition-colors"
                      title={`Remover ${entry.role_name} do dia`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-panel-subtle font-bold text-xs border-t-2 border-rule">
                <td colSpan={4} className="p-3 text-ink text-right">
                  TOTAL DE OPERÁRIOS HOJE:
                </td>
                <td className="p-3 text-center font-mono text-base text-action">
                  {totalWorkers}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
