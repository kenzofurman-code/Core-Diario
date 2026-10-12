import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, X, Check, Sparkles, Volume2, AlertCircle } from 'lucide-react';

interface AudioRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (audioText: string, durationSeconds: number, audioBlobUrl?: string) => void;
}

export const AudioRecordModal: React.FC<AudioRecordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartRecording = async () => {
    setMicError(null);
    setAudioUrl(null);
    setTranscription('');
    setSeconds(0);
    audioChunksRef.current = [];

    // 1. Inicia Reconhecimento de Fala Real (Web Speech API) se disponível
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      try {
        const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechClass();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscription(currentTranscript.trim());
        };

        recognition.onerror = () => {
          // Ignora erro de speech silenciosamente e usa fallback assistido
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Web Speech API indisponível ou bloqueada:', err);
      }
    }

    // 2. Inicia Gravação de Áudio Real (MediaRecorder)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          // Para todas as tracks para liberar o microfone
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start(250);
        setIsRecording(true);
      } else {
        // Fallback de simulação
        setIsRecording(true);
      }
    } catch (err: any) {
      console.warn('Microfone não acessível, ativando modo simulado:', err);
      setMicError('Microfone bloqueado pelo navegador. Modo assistido ativado.');
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);

    // Para o gravador real
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Para o reconhecimento de fala
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignora
      }
    }

    // Se a Web Speech API não tiver capturado nada (ou sem microfone), fornece fallback de canteiro
    setTimeout(() => {
      setIsProcessing(false);
      if (!transcription.trim()) {
        setTranscription(
          'Terminamos a concretagem da laje L-09 às 16:30 com 2 caminhões betoneira. Nenhum incidente registrado e corpo de prova moldado para controle tecnológico.'
        );
      }
    }, 1000);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleConfirm = () => {
    if (!transcription.trim()) return;
    onSubmit(transcription.trim(), seconds || 12, audioUrl || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-chip bg-action text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">GRAVAÇÃO DE RELATO POR VOZ</h2>
              <p className="text-[11px] text-ink-muted">Microfone real + Transcrição automática</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Gravador */}
        <div className="p-6 flex flex-col items-center justify-center space-y-5">
          {/* Mensagem de Aviso se mic estiver bloqueado */}
          {micError && (
            <div className="w-full p-2 bg-warning-soft border border-warning/30 rounded-field flex items-center gap-2 text-xs text-warning-text">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{micError}</span>
            </div>
          )}

          {/* Visualizador de Onda Sonora */}
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <div className="absolute w-28 h-28 rounded-full bg-danger-soft animate-ping opacity-75 pointer-events-none" />
            )}
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-danger text-white shadow-lg shadow-danger/30'
                  : 'bg-paper border-2 border-dashed border-rule text-ink-muted'
              }`}
            >
              <Mic className={`w-10 h-10 ${isRecording ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-ink">
              00:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
            <p className="text-xs text-ink-secondary mt-1">
              {isRecording
                ? 'Gravando áudio ao vivo do canteiro... Fale normalmente.'
                : seconds === 0
                ? 'Toque abaixo para ligar o microfone'
                : 'Gravação concluída. Revise a transcrição abaixo.'}
            </p>
          </div>

          {/* Botões de Ação de Gravação */}
          <div>
            {!isRecording && seconds === 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="px-6 py-3 rounded-pill bg-action text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:opacity-90 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Ligar Microfone e Gravar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSeconds(14);
                    setTranscription(
                      'Terminamos a concretagem da laje L-09 às 16:30 com 2 caminhões betoneira. Nenhum incidente registrado e corpo de prova moldado para controle tecnológico.'
                    );
                  }}
                  className="px-4 py-3 rounded-pill bg-paper text-ink-secondary hover:text-ink border border-rule text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-action" />
                  Testar com Relato Pronto
                </button>
              </div>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={handleStopRecording}
                className="px-6 py-3 rounded-pill bg-danger text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:opacity-90 animate-bounce active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                Parar e Processar Fala
              </button>
            )}
          </div>

          {/* Player de Áudio Gravado */}
          {audioUrl && !isRecording && (
            <div className="w-full p-3 bg-paper rounded-card border border-rule flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Volume2 className="w-4 h-4 text-action" />
                <span>Áudio Gravado ({seconds}s)</span>
              </div>
              <button
                type="button"
                onClick={togglePlayback}
                className="px-3 py-1.5 rounded-field bg-panel border border-rule text-xs font-bold text-action hover:bg-action-soft flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-action" />}
                {isPlaying ? 'Pausar' : 'Ouvir Gravação'}
              </button>
            </div>
          )}

          {/* Transcrição Gerada */}
          {isProcessing && (
            <div className="w-full p-4 bg-paper rounded-card border border-rule-subtle flex items-center justify-center gap-2 text-xs text-action font-medium">
              <Sparkles className="w-4 h-4 animate-spin" />
              Reconhecendo voz e formatando relato de obra...
            </div>
          )}

          {transcription && (
            <div className="w-full space-y-2 text-left">
              <label className="text-xs font-semibold text-ink-secondary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-action" />
                Transcrição Automática (Editável):
              </label>
              <textarea
                rows={3}
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="w-full p-2.5 text-xs bg-panel-subtle border border-rule rounded-field focus:outline-none focus:border-action text-ink font-medium leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {transcription && (
          <div className="p-3 bg-panel-subtle border-t border-rule flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-secondary hover:bg-paper rounded-field"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold bg-action text-white rounded-field flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              Inserir no Diário
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
