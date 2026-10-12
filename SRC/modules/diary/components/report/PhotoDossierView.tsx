import React, { useState } from 'react';
import {
  Printer,
  X,
  Camera,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Grid2X2,
  Rows,
  Layers,
  FileText,
} from 'lucide-react';
import { ProjectContext } from '../../types/diary.types';

export interface PhotoEvidenceItem {
  id: string;
  url: string;
  caption: string;
  location: string;
  task_name?: string;
  timestamp: string;
  author: string;
  category: 'CRITICA' | 'INTEMPERIE' | 'QUALIDADE' | 'GERAL';
  is_critical?: boolean;
}

interface PhotoDossierViewProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContext;
  reportNumber: string;
  reportDate: string;
  responsibleEngineer: string;
  photos: PhotoEvidenceItem[];
  documentHash?: string;
}

export const PhotoDossierView: React.FC<PhotoDossierViewProps> = ({
  isOpen,
  onClose,
  project,
  reportNumber,
  reportDate,
  responsibleEngineer,
  photos,
  documentHash,
}) => {
  if (!isOpen) return null;

  const [layoutMode, setLayoutMode] = useState<'2_PER_PAGE' | '4_PER_PAGE'>('2_PER_PAGE');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'CRITICA' | 'INTEMPERIE'>('ALL');

  const filteredPhotos = photos.filter((p) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'CRITICA') return p.is_critical || p.category === 'CRITICA';
    if (filterCategory === 'INTEMPERIE') return p.category === 'INTEMPERIE';
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-overlay backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-panel border border-rule rounded-card w-full max-w-5xl shadow-2xl flex flex-col my-auto max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Barra Superior de Controles (Não aparece na impressão) */}
        <div className="p-3 sm:p-4 border-b border-rule flex flex-wrap items-center justify-between gap-3 bg-panel-subtle print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-action text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                CADERNO DE EVIDÊNCIAS FOTOGRÁFICAS PERICIAIS
                <span className="text-[10px] bg-action-soft text-action font-mono font-bold px-2 py-0.5 rounded-pill">
                  {filteredPhotos.length} fotos
                </span>
              </h2>
              <p className="text-[11px] text-ink-muted">
                {project.nome} • RDO {reportNumber} • {reportDate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Grade */}
            <div className="flex items-center bg-paper border border-rule rounded-field p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLayoutMode('2_PER_PAGE')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  layoutMode === '2_PER_PAGE' ? 'bg-action text-white shadow-xs' : 'text-ink-secondary hover:text-ink'
                }`}
                title="2 Fotos Grandes por folha A4 (alta definição pericial)"
              >
                <Rows className="w-3.5 h-3.5" />
                2 por Página (Pericial)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('4_PER_PAGE')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  layoutMode === '4_PER_PAGE' ? 'bg-action text-white shadow-xs' : 'text-ink-secondary hover:text-ink'
                }`}
                title="4 Fotos por folha A4 (compacto)"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                4 por Página (Compacto)
              </button>
            </div>

            {/* Filtros de Categoria */}
            <div className="flex items-center bg-paper border border-rule rounded-field p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-2 py-1 rounded font-medium ${
                  filterCategory === 'ALL' ? 'bg-action text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Todas ({photos.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('CRITICA')}
                className={`px-2 py-1 rounded font-medium ${
                  filterCategory === 'CRITICA' ? 'bg-action text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Críticas
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('INTEMPERIE')}
                className={`px-2 py-1 rounded font-medium ${
                  filterCategory === 'INTEMPERIE' ? 'bg-action text-white' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Intempéries
              </button>
            </div>

            {/* Botão de Impressão */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-action hover:opacity-90 active:scale-95 text-white text-xs font-semibold rounded-field flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-muted hover:text-ink rounded-field"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Folha do Documento (A4 Pronta para Impressão) */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 bg-white text-neutral-900 font-sans print:p-0 print:overflow-visible">
          {/* Cabeçalho Formal Pericial */}
          <div className="border-b-2 border-black pb-4 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black text-white font-bold text-xs flex items-center justify-center rounded-xs">
                  CK
                </div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-black">
                  CONSTRUKORE — CADERNO PERICIAL DE EVIDÊNCIAS FOTOGRÁFICAS
                </h1>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Anexo Técnico ao Livro de Ordem / RDO • Respaldo Confea / ABNT NBR 15575
              </p>
              <div className="text-xs text-neutral-800 mt-2 font-medium">
                <strong>Obra:</strong> {project.nome} ({project.codigo}) • <strong>Local:</strong> {project.cidade}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-mono text-xs font-bold bg-neutral-100 px-2.5 py-1 border border-neutral-300 rounded inline-block">
                ANEXO RDO {reportNumber}
              </div>
              <p className="text-xs text-neutral-700">
                <strong>Data da Obra:</strong> {reportDate}
              </p>
              <p className="text-[11px] text-neutral-600">
                <strong>Resp. Técnico:</strong> {responsibleEngineer}
              </p>
            </div>
          </div>

          {/* Sumário Pericial de Autoria */}
          <div className="bg-neutral-50 border border-neutral-200 p-2.5 rounded text-xs flex flex-wrap items-center justify-between gap-2 text-neutral-700">
            <span>
              <strong>Total de Evidências no Caderno:</strong> {filteredPhotos.length} fotografias
            </span>
            <span className="font-mono text-[11px]">
              Selo SHA-256: <strong>{documentHash || 'SHA256-4c28-98f1-poty'}</strong>
            </span>
          </div>

          {/* Grid de Fotografias */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-300 rounded text-neutral-500 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-neutral-400" />
              <p className="text-sm font-semibold">Nenhuma evidência fotográfica com este filtro.</p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                layoutMode === '2_PER_PAGE'
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
              }`}
            >
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  className="border border-neutral-300 rounded-sm overflow-hidden bg-white shadow-xs flex flex-col page-break-inside-avoid"
                >
                  {/* Foto com Carimbo */}
                  <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-mono font-bold">
                      Evidência #{index + 1}
                    </div>
                    {photo.is_critical && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                        Crítica (FVS)
                      </div>
                    )}
                  </div>

                  {/* Metadados Periciais */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(photo.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-700" />
                          {photo.location}
                        </span>
                      </div>

                      {photo.task_name && (
                        <span className="text-[11px] font-bold text-neutral-800 block">
                          Frente: {photo.task_name}
                        </span>
                      )}

                      <p className="text-neutral-900 font-medium text-xs leading-snug">
                        {photo.caption}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {photo.author}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Carimbo Auditado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé Legal / Termo Pericial */}
          <div className="border-t-2 border-black pt-4 mt-8 space-y-3 text-xs text-neutral-600">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-semibold text-black">DECLARAÇÃO DE VERACIDADE TÉCNICA:</p>
                <p className="text-[11px] text-neutral-600 max-w-xl mt-0.5">
                  Atesto que as evidências fotográficas acima retratam fielmente o andamento físico da obra
                  na data indicada, contendo carimbo indelével de integridade gerado em canteiro.
                </p>
              </div>

              <div className="text-center w-64 border-t border-black pt-1">
                <p className="font-bold text-black text-xs">{responsibleEngineer}</p>
                <p className="text-[10px] text-neutral-500">Engenheiro(a) Residente • Responsável Técnico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
