import React, { useState } from 'react';
import { Mic, Camera, PackageOpen, Users, Hammer, AlertTriangle } from 'lucide-react';
import { MaterialAlertModal } from './MaterialAlertModal';
import { AudioRecordModal } from './AudioRecordModal';
import { ObraCameraOverlayModal } from './ObraCameraOverlayModal';
import { WorkforceModal } from './WorkforceModal';
import { ProductionModal } from './ProductionModal';
import {
  WorkforceSnapshot,
  ProductionEntry,
  UserContext,
  ProjectContext,
  ObraLocationsConfig,
  R2StorageConfig,
} from '../../types/diary.types';

interface QuickCaptureBarProps {
  project: ProjectContext;
  locationsConfig: ObraLocationsConfig;
  r2Config: R2StorageConfig;
  workforce: WorkforceSnapshot;
  productionList: ProductionEntry[];
  currentUser?: UserContext;
  onAddAudioEvent: (text: string, duration: number, audioBlobUrl?: string) => void;
  onAddPhotoEvent: (imageUrl: string, caption: string, location: string, audioBlobUrl?: string) => void;
  onAddMaterialShortage: (data: {
    material_name: string;
    location_name: string;
    wbs_task_name: string;
    workers_idle: number;
    hours_lost: number;
    notes: string;
  }) => void;
  onUpdateWorkforceCount: (roleCode: string, delta: number) => void;
  onCopyYesterdayWorkforce: () => void;
  onUpdateProduction: (taskId: string, reported: number) => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({
  project,
  locationsConfig,
  r2Config,
  workforce,
  productionList,
  currentUser,
  onAddAudioEvent,
  onAddPhotoEvent,
  onAddMaterialShortage,
  onUpdateWorkforceCount,
  onCopyYesterdayWorkforce,
  onUpdateProduction,
}) => {
  const [modalOpen, setModalOpen] = useState<'audio' | 'photo' | 'material' | 'workforce' | 'production' | null>(null);

  const completedTasksCount = productionList.filter((p) => p.progress_pct >= 100).length;

  return (
    <div className="space-y-4">
      {/* Título de Seção */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-action uppercase">
            Ações Rápidas de Campo (Canteiro)
          </span>
          <h2 className="text-base font-bold text-ink">Apontamento Direto</h2>
        </div>
        <span className="text-[11px] bg-paper-subtle border border-rule px-2.5 py-1 rounded-pill text-ink-muted">
          Toque para lançar
        </span>
      </div>

      {/* Grade de Botões Gigantes Táteis */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* 1. Botão Gravador de Áudio */}
        <button
          type="button"
          onClick={() => setModalOpen('audio')}
          className="p-4 rounded-card bg-panel border-2 border-rule hover:border-action hover:bg-action-soft/20 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-xs active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-action-soft text-action flex items-center justify-center group-hover:bg-action group-hover:text-white transition-colors">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-sm font-bold text-ink">Gravar Áudio</span>
            <span className="text-[11px] text-ink-muted">Voz para relato</span>
          </div>
        </button>

        {/* 2. Botão Foto de Campo com Carimbo */}
        <button
          type="button"
          onClick={() => setModalOpen('photo')}
          className="p-4 rounded-card bg-panel border-2 border-rule hover:border-action hover:bg-action-soft/20 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-xs active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-action-soft text-action flex items-center justify-center group-hover:bg-action group-hover:text-white transition-colors">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-sm font-bold text-ink">Tirar Foto</span>
            <span className="text-[11px] text-ink-muted">Com data e GPS</span>
          </div>
        </button>

        {/* 3. Botão FALTA DE MATERIAL (Destaque em Amarelo/Laranja) */}
        <button
          type="button"
          onClick={() => setModalOpen('material')}
          className="p-4 rounded-card bg-warning-soft/40 border-2 border-warning hover:bg-warning-soft flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-xs active:scale-95 col-span-2 sm:col-span-1"
        >
          <div className="w-12 h-12 rounded-full bg-warning text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-sm font-bold text-warning-text flex items-center justify-center gap-1">
              Faltou Material!
            </span>
            <span className="text-[11px] text-warning-text/80 font-medium">
              Registrar equipe parada
            </span>
          </div>
        </button>

        {/* 4. Botão Efetivo */}
        <button
          type="button"
          onClick={() => setModalOpen('workforce')}
          className="p-4 rounded-card bg-panel border-2 border-rule hover:border-action hover:bg-action-soft/20 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-xs active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-paper border border-rule text-ink flex items-center justify-center group-hover:border-action group-hover:text-action transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-sm font-bold text-ink">Efetivo de Hoje</span>
            <span className="text-[11px] font-mono font-semibold text-action">
              {workforce.total_workers} operários
            </span>
          </div>
        </button>

        {/* 5. Botão Produção / Avanço */}
        <button
          type="button"
          onClick={() => setModalOpen('production')}
          className="p-4 rounded-card bg-panel border-2 border-rule hover:border-action hover:bg-action-soft/20 flex flex-col items-center justify-center gap-2 text-center transition-all group shadow-xs active:scale-95 col-span-2 sm:col-span-2"
        >
          <div className="w-12 h-12 rounded-full bg-paper border border-rule text-ink flex items-center justify-center group-hover:border-action group-hover:text-action transition-colors">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-sm font-bold text-ink">Avanço de Produção</span>
            <span className="text-[11px] text-ink-muted">
              {completedTasksCount} de {productionList.length} frentes concluídas
            </span>
          </div>
        </button>
      </div>

      {/* Modais Gerenciados */}
      <AudioRecordModal
        isOpen={modalOpen === 'audio'}
        onClose={() => setModalOpen(null)}
        onSubmit={(text, duration, blobUrl) => onAddAudioEvent(text, duration, blobUrl)}
      />

      <ObraCameraOverlayModal
        isOpen={modalOpen === 'photo'}
        onClose={() => setModalOpen(null)}
        project={project}
        currentUser={currentUser || { id: 'usr-campo', name: 'Equipe de Campo', email: 'campo@obra.com', role: 'encarregado' }}
        locationsConfig={locationsConfig}
        r2Config={r2Config}
        onSubmit={(url, caption, loc, audioBlobUrl) => onAddPhotoEvent(url, caption, loc, audioBlobUrl)}
      />

      <MaterialAlertModal
        isOpen={modalOpen === 'material'}
        onClose={() => setModalOpen(null)}
        onSubmit={(data) => onAddMaterialShortage(data)}
      />

      <WorkforceModal
        isOpen={modalOpen === 'workforce'}
        onClose={() => setModalOpen(null)}
        workforce={workforce}
        onUpdateCount={onUpdateWorkforceCount}
        onCopyYesterday={onCopyYesterdayWorkforce}
      />

      <ProductionModal
        isOpen={modalOpen === 'production'}
        onClose={() => setModalOpen(null)}
        productionList={productionList}
        currentUser={currentUser}
        onUpdateProduction={onUpdateProduction}
      />
    </div>
  );
};
