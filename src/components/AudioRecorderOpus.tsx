import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, X, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioRecorderOpusProps {
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  onCancel: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const AudioRecorderOpus: React.FC<AudioRecorderOpusProps> = ({
  onSendAudio,
  onCancel,
  isRecording,
  onStartRecording,
  onStopRecording
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      startRecordingTimer();
      startMediaRecording();
    } else {
      stopRecordingTimer();
      stopMediaRecording();
    }

    return () => {
      stopRecordingTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // Atualizar tempo de reprodução
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setPlaybackTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const startRecordingTimer = () => {
    setRecordingTime(0);
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startMediaRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      console.log('🎤 Iniciando gravação de áudio otimizada para WhatsApp');
      
      // Lista de formatos em ordem de preferência para WhatsApp
      const formats = [
        'audio/webm;codecs=opus',  // Será enviado como OGG com opus
        'audio/ogg;codecs=opus',   // Formato ideal para WhatsApp
        'audio/webm',              // Fallback
        'audio/ogg'                // Último recurso
      ];
      
      let mimeType = '';
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('Nenhum formato de áudio compatível encontrado');
      }
      
      console.log(`✅ Formato selecionado para gravação: ${mimeType}`);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // Bitrate otimizado para WhatsApp
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Criar blob com o tipo correto
        let finalMimeType = mimeType;
        
        // Se gravou em WebM com opus, reportar como OGG opus para WhatsApp
        if (mimeType === 'audio/webm;codecs=opus') {
          finalMimeType = 'audio/ogg;codecs=opus';
          console.log('🔄 Convertendo tipo de WebM Opus para OGG Opus para compatibilidade');
        }
        
        const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
        
        console.log('✅ Áudio gravado e pronto:', {
          formatoGravado: mimeType,
          formatoFinal: finalMimeType,
          tamanho: `${(audioBlob.size / 1024).toFixed(2)} KB`,
          duração: `${recordingTime}s`,
          tipoBlob: audioBlob.type
        });
        
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Parar stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Gravar em chunks pequenos para melhor performance
      mediaRecorder.start(500);
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      onCancel();
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    setIsSending(true);
    try {
      console.log('📤 Enviando áudio com formato:', audioBlob.type);
      await onSendAudio(audioBlob);
      handleCancel(); // Limpar após enviar com sucesso
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
    setIsPlaying(false);
    setPlaybackTime(0);
    setAudioDuration(0);
    onCancel();
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * audioDuration;
    
    audio.currentTime = seekTime;
    setPlaybackTime(seekTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Se estiver gravando
  if (isRecording) {
    return (
      <div className="flex items-center space-x-3 rounded-lg p-4 border-2 bg-red-50 border-red-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full animate-pulse bg-red-500" />
          <span className="font-mono text-sm font-medium text-red-600">
            {formatTime(recordingTime)}
          </span>
        </div>
        
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-red-600">
            🎤 Gravando áudio...
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onStopRecording}
          className="rounded-full text-red-600 hover:bg-red-100"
        >
          <MicOff className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Se tem áudio gravado
  if (audioBlob && audioUrl) {
    const progressPercentage = audioDuration > 0 ? (playbackTime / audioDuration) * 100 : 0;
    
    return (
      <div className="rounded-lg p-4 border-2 bg-green-50 border-green-200">
        <audio 
          ref={audioRef} 
          src={audioUrl}
          preload="metadata"
        />
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-medium text-green-700">
              🎤 Áudio pronto - {formatTime(recordingTime)}
            </span>
            <p className="text-xs text-green-600 mt-1">
              Tamanho: {(audioBlob.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-gray-600 hover:bg-gray-100 rounded-full p-1"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayback}
            className="rounded-full p-2 text-green-600 hover:bg-green-100"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          <div className="flex-1 flex items-center space-x-2">
            <div 
              className="flex-1 h-2 bg-green-200 rounded-full cursor-pointer relative"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <span className="text-xs font-mono min-w-[35px] text-green-600">
              {formatTime(playbackTime)} / {formatTime(audioDuration)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-600">
            ⚡ Formato otimizado para WhatsApp
          </span>
          
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            {isSending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Enviando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Enviar Áudio</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}; 