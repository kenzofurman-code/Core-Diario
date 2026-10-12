// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — CÂMERA DE CAMPO COM OVERLAY PERICIAL
// Inspirado na experiência de campo do ObraFoto (Seleção de Pavimentos & R2)
// =====================================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Mic,
  MicOff,
  Check,
  Upload,
  Zap,
  ZapOff,
  Sparkles,
  Layers,
  Building2,
  Globe,
  MapPin,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import {
  ObraLocationsConfig,
  LocationItem,
  R2StorageConfig,
  ProjectContext,
  UserContext,
  CurrentPhotoLocationSelection,
} from '../../types/diary.types';
import { DiaryStorageService } from '../../services/diaryStorage';
import { R2UploadService } from '../../services/r2UploadService';
import { CameraCanvasService } from '../../services/cameraCanvasService';

interface ObraCameraOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContext;
  currentUser: UserContext;
  locationsConfig: ObraLocationsConfig;
  r2Config: R2StorageConfig;
  onSubmit: (imageUrl: string, caption: string, location: string, audioBlobUrl?: string) => void;
}

type NivelAtivo = 'torre' | 'pavimento' | 'ambiente';

export const ObraCameraOverlayModal: React.FC<ObraCameraOverlayModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUser,
  locationsConfig,
  r2Config,
  onSubmit,
}) => {
  // Seleção ativa de pavimentos (persistida na sessão da visita)
  const [selecao, setSelecao] = useState<CurrentPhotoLocationSelection>(() =>
    DiaryStorageService.getPhotoLocationSelection()
  );

  const [seletorAberto, setSeletorAberto] = useState<NivelAtivo | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashAtivo, setFlashAtivo] = useState(false);
  const [zoomNivel, setZoomNivel] = useState<1 | 2>(1);
  const [screenFlash, setScreenFlash] = useState(false);

  // Observação de áudio rápida
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [segundosGravados, setSegundosGravados] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elementos HTML
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Obtém nomes atuais selecionados
  const nomeTorre = useMemo(() => {
    return locationsConfig.torres.find((t) => t.id === selecao.torreId)?.nome || locationsConfig.torres[0]?.nome || 'Torre A';
  }, [locationsConfig.torres, selecao.torreId]);

  const nomePavimento = useMemo(() => {
    return locationsConfig.pavimentos.find((p) => p.id === selecao.pavimentoId)?.nome || locationsConfig.pavimentos[7]?.nome || '8º Pavimento';
  }, [locationsConfig.pavimentos, selecao.pavimentoId]);

  const nomeAmbiente = useMemo(() => {
    return locationsConfig.ambientes.find((a) => a.id === selecao.ambienteId)?.nome || locationsConfig.ambientes[0]?.nome || 'Apartamento Final 1';
  }, [locationsConfig.ambientes, selecao.ambienteId]);

  const localFormatado = useMemo(() => {
    return `${nomeTorre} · ${nomePavimento} · ${nomeAmbiente}`;
  }, [nomeTorre, nomePavimento, nomeAmbiente]);

  // Iniciar Câmera ao abrir modal
  useEffect(() => {
    if (isOpen) {
      iniciarCamera();
    } else {
      pararCamera();
    }

    return () => {
      pararCamera();
      pararAudio();
    };
  }, [isOpen]);

  const iniciarCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } else {
        throw new Error('API de mídia não suportada neste navegador.');
      }
    } catch (err) {
      console.warn('[ObraCamera] Câmera não pôde ser aberta diretamente:', err);
      setIsCameraActive(false);
      setCameraError('Câmera indisponível no dispositivo. Use o botão de upload ou simulação abaixo.');
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const alternarZoom = () => {
    const novoZoom = zoomNivel === 1 ? 2 : 1;
    setZoomNivel(novoZoom);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.zoom) {
        track.applyConstraints?.({ advanced: [{ zoom: novoZoom } as any] }).catch(() => {});
      }
    }
  };

  const alternarFlash = () => {
    const novoFlash = !flashAtivo;
    setFlashAtivo(novoFlash);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities?.torch) {
        track.applyConstraints?.({ advanced: [{ torch: novoFlash } as any] }).catch(() => {});
      }
    }
  };

  // -------------------------------------------------------------------
  // GRAVAÇÃO DE NOTA DE VOZ RÁPIDA (MICROFONE)
  // -------------------------------------------------------------------
  const iniciarAudio = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        setAudioTranscript('Nota de áudio gravada pelo encarregado no momento do disparo.');
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setGravandoAudio(true);
      setSegundosGravados(0);

      audioTimerRef.current = setInterval(() => {
        setSegundosGravados((s) => {
          if (s >= 20) {
            pararAudio();
            return 20;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microfone não acessível:', err);
    }
  };

  const pararAudio = () => {
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setGravandoAudio(false);
  };

  const descartarAudio = () => {
    pararAudio();
    setAudioBlobUrl(null);
    setAudioTranscript(null);
    setSegundosGravados(0);
  };

  // -------------------------------------------------------------------
  // SELEÇÃO E MEMORIZAÇÃO DE LOCAIS (DRUM PICKER)
  // -------------------------------------------------------------------
  const handleSelecionarItem = (nivel: NivelAtivo, id: string | null) => {
    const novaSelecao = { ...selecao, [`${nivel}Id`]: id };
    setSelecao(novaSelecao);
    DiaryStorageService.setPhotoLocationSelection(novaSelecao);
    setSeletorAberto(null);
  };

  // -------------------------------------------------------------------
  // DISPARAR FOTO, QUEIMAR CARIMBO E SUBIR PARA O R2
  // -------------------------------------------------------------------
  const handleDispararFoto = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    // Efeito de Flash na tela
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 120);

    try {
      let imageSource: HTMLVideoElement | HTMLCanvasElement;

      if (videoRef.current && videoRef.current.videoWidth > 0) {
        imageSource = videoRef.current;
      } else {
        // Fallback de canteiro realista caso câmera não esteja aberta
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 1920;
        mockCanvas.height = 1080;
        const mCtx = mockCanvas.getContext('2d')!;
        
        // Gradiente do canteiro
        const grad = mCtx.createLinearGradient(0, 0, 0, 1080);
        grad.addColorStop(0, '#2F4F4F');
        grad.addColorStop(0.5, '#536878');
        grad.addColorStop(1, '#708090');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, 1920, 1080);

        // Pilares de concreto armado
        mCtx.fillStyle = '#9BA4B5';
        mCtx.fillRect(240, 200, 180, 880);
        mCtx.fillRect(860, 160, 200, 920);
        mCtx.fillRect(1480, 220, 180, 860);

        // Vigas de concreto
        mCtx.fillStyle = '#7C8899';
        mCtx.fillRect(100, 180, 1720, 120);

        // Armaduras de aço
        mCtx.fillStyle = '#D97706';
        for (let x = 270; x < 400; x += 22) {
          mCtx.fillRect(x, 80, 6, 110);
        }
        for (let x = 890; x < 1030; x += 22) {
          mCtx.fillRect(x, 60, 6, 130);
        }
        imageSource = mockCanvas;
      }

      // Queimar carimbo indelével em alta resolução com os dados do local
      const projectGps = (project as any).gps_coordinates || 
        ((project as any).gps_lat ? `${(project as any).gps_lat}, ${(project as any).gps_lng}` : undefined);
      const gpsCoordinates = await CameraCanvasService.getCoordinates(projectGps);
      const stampedDataUrl = await CameraCanvasService.burnWatermark(imageSource as any, {
        projectCode: project.codigo,
        projectName: project.nome,
        location: localFormatado,
        authorName: `${currentUser.name} (${currentUser.role})`,
        gpsCoordinates,
        timestamp: new Date().toISOString(),
      });

      // Upload para Cloudflare R2
      const uploadResult = await R2UploadService.uploadPhoto(stampedDataUrl, {
        projectCode: project.codigo,
        reportDate: new Date().toISOString(),
        locationName: localFormatado,
        config: r2Config,
      });

      // Legenda pericial
      const legenda = audioTranscript
        ? `Evidência em ${localFormatado}. Obs encarregado: "${audioTranscript}"`
        : `Registro fotográfico de acompanhamento em ${localFormatado}`;

      onSubmit(uploadResult.publicUrl, legenda, localFormatado, audioBlobUrl || undefined);
      onClose();
    } catch (err) {
      console.error('Erro ao capturar foto pericial:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Upload por arquivo (galeria do aparelho)
  const handleArquivoGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const stamped = await CameraCanvasService.burnWatermark(img, {
          projectCode: project.codigo,
          projectName: project.nome,
          location: localFormatado,
          authorName: `${currentUser.name} (${currentUser.role})`,
        });

        const uploadResult = await R2UploadService.uploadPhoto(stamped, {
          projectCode: project.codigo,
          reportDate: new Date().toISOString(),
          locationName: localFormatado,
          config: r2Config,
        });

        onSubmit(
          uploadResult.publicUrl,
          `Foto de arquivo em ${localFormatado}`,
          localFormatado,
          audioBlobUrl || undefined
        );
        onClose();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* Flash Visual */}
      <div
        className={`fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-100 ${
          screenFlash ? 'opacity-80' : 'opacity-0'
        }`}
      />

      {/* Input Oculto de Arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleArquivoGaleria}
        className="hidden"
      />

      {/* Vídeo da Câmera em Tela Cheia */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform ${
            zoomNivel === 2 ? 'scale-125' : 'scale-100'
          }`}
        />

        {/* Fallback caso câmera não abra */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
              <Camera className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-white">Visualizador de Câmera de Canteiro</h3>
              <p className="text-xs text-slate-400">
                {cameraError || 'Aguardando autorização da câmera...'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={iniciarCamera}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tentar Câmera Novamente</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full flex items-center gap-1.5 border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher da Galeria</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR TRANSLÚCIDA (Ações & Saída)                                 */}
      {/* ========================================================================= */}
      <div className="relative z-20 pt-safe px-4 pt-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Indicador de Nuvem R2 / Local */}
        <div className="flex items-center gap-2">
          {r2Config.enabled ? (
            <div className="flex items-center gap-1.5 text-[11px] bg-black/60 border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">R2 Cloud</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] bg-black/60 border border-white/20 text-slate-300 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Modo Local</span>
            </div>
          )}

          {/* Botão de Flash / Lanterna */}
          <button
            type="button"
            onClick={alternarFlash}
            className={`w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all ${
              flashAtivo
                ? 'bg-amber-400 text-black border-amber-400 font-bold'
                : 'bg-black/60 border-white/20 text-white'
            }`}
          >
            {flashAtivo ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHIPS FLUTUANTES DE LOCAL (OVERLAY EM TEMPO REAL)                         */}
      {/* Idêntico ao app de fotos: Torre, Pavimento, Ambiente                      */}
      {/* ========================================================================= */}
      <div className="relative z-20 px-4 py-2 flex flex-col items-start gap-2 max-w-sm pointer-events-auto">
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-black/70 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          📍 Local da Evidência Fotográfica
        </span>

        {/* 1. Chip Torre */}
        <button
          type="button"
          onClick={() => setSeletorAberto(seletorAberto === 'torre' ? null : 'torre')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
            seletorAberto === 'torre'
              ? 'bg-amber-400 text-black font-bold ring-2 ring-amber-400/50'
              : 'bg-black/70 border border-white/25 text-white hover:border-amber-400'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{nomeTorre}</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* 2. Chip Pavimento (Destaque Principal) */}
        <button
          type="button"
          onClick={() => setSeletorAberto(seletorAberto === 'pavimento' ? null : 'pavimento')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold backdrop-blur-md transition-all ${
            seletorAberto === 'pavimento'
              ? 'bg-amber-400 text-black font-bold ring-2 ring-amber-400/50'
              : 'bg-black/80 border border-amber-400/80 text-white shadow-lg shadow-black/40'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-sm">{nomePavimento}</span>
          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* 3. Chip Ambiente */}
        <button
          type="button"
          onClick={() => setSeletorAberto(seletorAberto === 'ambiente' ? null : 'ambiente')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
            seletorAberto === 'ambiente'
              ? 'bg-amber-400 text-black font-bold ring-2 ring-amber-400/50'
              : 'bg-black/70 border border-white/25 text-white hover:border-amber-400'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{nomeAmbiente}</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* Chip de Nota de Voz Gravada */}
        {audioBlobUrl && (
          <div className="flex items-center gap-2 bg-emerald-500/90 text-slate-950 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md animate-in fade-in">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Áudio Gravado ({segundosGravados}s)</span>
            <button
              type="button"
              onClick={descartarAudio}
              className="ml-1 text-slate-950 hover:text-red-900 p-0.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SELETOR DE ROLO / TAMBOR (DRUM WHEEL PICKER)                              */}
      {/* Abre quando clica em qualquer chip para trocar com 1 toque                */}
      {/* ========================================================================= */}
      {seletorAberto && (
        <div className="relative z-30 mx-4 bg-slate-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {seletorAberto === 'torre'
                ? 'Selecionar Torre'
                : seletorAberto === 'pavimento'
                ? 'Selecionar Pavimento / Andar'
                : 'Selecionar Ambiente / Frente'}
            </span>
            <button
              type="button"
              onClick={() => setSeletorAberto(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-full"
            >
              Fechar
            </button>
          </div>

          {/* Rolo de Itens */}
          <div className="max-h-48 overflow-y-auto space-y-1 scroll-smooth">
            {(seletorAberto === 'torre'
              ? locationsConfig.torres
              : seletorAberto === 'pavimento'
              ? locationsConfig.pavimentos
              : locationsConfig.ambientes
            ).map((item) => {
              const isSelected =
                seletorAberto === 'torre'
                  ? selecao.torreId === item.id
                  : seletorAberto === 'pavimento'
                  ? selecao.pavimentoId === item.id
                  : selecao.ambienteId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelecionarItem(seletorAberto, item.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-amber-400 text-black font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] opacity-70">
                      {isSelected ? '▶' : '•'} [{item.codigo}]
                    </span>
                    <span className="text-sm">{item.nome}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA INFERIOR DE DISPARO & CONTROLES                                     */}
      {/* Botão de Zoom, Microfone e Disparador Redondo com borda amarela           */}
      {/* ========================================================================= */}
      <div className="relative z-20 pb-safe px-6 pb-6 pt-3 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent">
        {/* Lado Esquerdo: Zoom (1x / 2x) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={alternarZoom}
            className={`w-11 h-11 rounded-full border backdrop-blur-md flex items-center justify-center font-bold text-xs transition-all ${
              zoomNivel === 2
                ? 'bg-amber-400 text-black border-amber-400'
                : 'bg-black/60 border-white/20 text-white'
            }`}
          >
            {zoomNivel}x
          </button>

          {/* Botão de Galeria / Upload de arquivo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
            title="Carregar foto da galeria"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        {/* Centro: DISPARADOR CIRCULAR COM ANEL DOURADO (OBRAFOTO STYLE) */}
        <button
          type="button"
          onClick={handleDispararFoto}
          disabled={isCapturing}
          className={`w-20 h-20 rounded-full bg-white border-4 border-amber-400 flex items-center justify-center shadow-2xl active:scale-95 transition-transform ${
            isCapturing ? 'opacity-50 animate-pulse' : ''
          }`}
          aria-label="Disparar foto com carimbo"
        >
          <div className="w-16 h-16 rounded-full bg-white active:bg-amber-100 flex items-center justify-center text-slate-950 font-bold text-xs">
            {isCapturing ? '...' : ''}
          </div>
        </button>

        {/* Lado Direito: Microfone de Observação Rápida */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={gravandoAudio ? pararAudio : iniciarAudio}
            className={`w-12 h-12 rounded-full border backdrop-blur-md flex flex-col items-center justify-center gap-0.5 transition-all ${
              gravandoAudio
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : audioBlobUrl
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-black/60 border-white/20 text-white'
            }`}
            title="Gravar nota de voz para o carimbo"
          >
            {gravandoAudio ? (
              <>
                <Mic className="w-5 h-5 text-white" />
                <span className="text-[9px] font-mono font-bold">{segundosGravados}s</span>
              </>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
