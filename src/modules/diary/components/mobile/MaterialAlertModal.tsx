import React, { useState } from 'react';
import { AlertTriangle, Clock, Users, X, Check, PackageOpen } from 'lucide-react';

interface MaterialAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    material_name: string;
    location_name: string;
    wbs_task_name: string;
    workers_idle: number;
    hours_lost: number;
    notes: string;
  }) => void;
}

export const MaterialAlertModal: React.FC<MaterialAlertModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [materialName, setMaterialName] = useState('');
  const [locationName, setLocationName] = useState('Pavimento 08');
  const [wbsTaskName, setWbsTaskName] = useState('Alvenaria Estrutural');
  const [workersIdle, setWorkersIdle] = useState(4);
  const [hoursLost, setHoursLost] = useState(2.0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) return;
    onSubmit({
      material_name: materialName,
      location_name: locationName,
      wbs_task_name: wbsTaskName,
      workers_idle: workersIdle,
      hours_lost: hoursLost,
      notes,
    });
    setMaterialName('');
    setNotes('');
    onClose();
  };

  const quickMaterials = ['Bloco Cerâmico 14x19x39', 'Argamassa Colante AC-III', 'Aço CA-50 10mm', 'Tubo PVC 100mm', 'Cimento CP-II'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header de Alerta */}
        <div className="bg-warning-soft border-b border-warning/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-chip bg-warning text-white flex items-center justify-center">
              <PackageOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-warning-text flex items-center gap-2">
                FALTA DE MATERIAL EM CAMPO
              </h2>
              <p className="text-xs text-ink-secondary">
                Registra o impacto imediato na equipe para validação da engenharia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 rounded-chip transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário Tátil */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Nome do Material */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Qual material faltou? *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Bloco 14x19x39, Cimento, Eletroduto..."
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-panel-subtle border border-rule rounded-field focus:outline-none focus:border-action font-medium"
            />
            {/* Chips de Atalho Rápido */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickMaterials.map((mat) => (
                <button
                  type="button"
                  key={mat}
                  onClick={() => setMaterialName(mat)}
                  className="text-xs px-2.5 py-1 rounded-pill bg-paper border border-rule-subtle text-ink-secondary hover:border-action hover:text-action transition-colors"
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          {/* Frente e Local */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Frente / Pavimento
              </label>
              <select
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-panel-subtle border border-rule rounded-field focus:outline-none focus:border-action"
              >
                <option value="Pavimento 05">Pavimento 05</option>
                <option value="Pavimento 06">Pavimento 06</option>
                <option value="Pavimento 08">Pavimento 08</option>
                <option value="Pavimento 09">Pavimento 09</option>
                <option value="Subsolo 01">Subsolo 01</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Atividade Afetada
              </label>
              <select
                value={wbsTaskName}
                onChange={(e) => setWbsTaskName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-panel-subtle border border-rule rounded-field focus:outline-none focus:border-action"
              >
                <option value="Alvenaria Estrutural">Alvenaria Estrutural</option>
                <option value="Armação de Vigas">Armação de Vigas</option>
                <option value="Instalações Hidráulicas">Instalações Hidráulicas</option>
                <option value="Reboco Interno">Reboco Interno</option>
              </select>
            </div>
          </div>

          {/* Impacto Imediato (Operários Parados & Horas) */}
          <div className="bg-paper p-3.5 rounded-card border border-rule space-y-3">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Impacto Imediato de Canteiro
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* Quantidade de Operários */}
              <div>
                <label className="text-xs text-ink-secondary flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  Operários Parados
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkersIdle(Math.max(1, workersIdle - 1))}
                    className="w-8 h-8 rounded-chip bg-panel border border-rule flex items-center justify-center font-bold text-base hover:bg-action-soft"
                  >
                    -
                  </button>
                  <span className="text-base font-bold text-ink w-8 text-center">
                    {workersIdle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkersIdle(workersIdle + 1)}
                    className="w-8 h-8 rounded-chip bg-panel border border-rule flex items-center justify-center font-bold text-base hover:bg-action-soft"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Horas Perdidas */}
              <div>
                <label className="text-xs text-ink-secondary flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Tempo Paralisado
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHoursLost(Math.max(0.5, hoursLost - 0.5))}
                    className="w-8 h-8 rounded-chip bg-panel border border-rule flex items-center justify-center font-bold text-base hover:bg-action-soft"
                  >
                    -
                  </button>
                  <span className="text-base font-bold text-ink w-12 text-center">
                    {hoursLost} h
                  </span>
                  <button
                    type="button"
                    onClick={() => setHoursLost(hoursLost + 0.5)}
                    className="w-8 h-8 rounded-chip bg-panel border border-rule flex items-center justify-center font-bold text-base hover:bg-action-soft"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-ink-muted bg-panel p-2 rounded-field border border-rule-subtle">
              💡 Impacto calculado: <strong>{workersIdle * hoursLost} horas-homem</strong> de ociosidade registrada.
            </div>
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Detalhes / Motivo informado
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Caminhão da cerâmica atrasou na estrada; aguardando descarregamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-panel-subtle border border-rule rounded-field focus:outline-none focus:border-action"
            />
          </div>

          {/* Aviso sobre aprovação prévia */}
          <p className="text-[11px] text-ink-muted italic">
            * Conforme regra do projeto, este apontamento entrará como evento pendente e será revisado pela Engenheira Residente antes de constar no RDO oficial.
          </p>

          {/* Botões */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-rule-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-field text-ink-secondary hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold rounded-field bg-warning text-white hover:opacity-90 flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Registrar Falta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
