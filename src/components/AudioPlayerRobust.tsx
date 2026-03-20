import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerRobustProps {
  audioUrl: string;
  isOwn?: boolean;
}

export const AudioPlayerRobust: React.FC<AudioPlayerRobustProps> = ({ 
  audioUrl, 
  isOwn = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🎵 AudioPlayerRobust - URL recebida:', audioUrl);
    
    // Resetar estados ao mudar URL
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    
    // Validar URL
    if (!audioUrl || audioUrl.trim() === '') {
      console.error('❌ URL de áudio vazia ou inválida');
      setHasError(true);
      setErrorMessage('URL de áudio inválida');
      setIsLoading(false);
      return;
    }
    
    // Criar novo elemento de áudio
    const audio = new Audio();
    audioRef.current = audio;
    
    // Configurar eventos
    audio.onloadstart = () => {
      console.log('🔄 Iniciando carregamento do áudio...');
      setIsLoading(true);
    };
    
    audio.onloadedmetadata = () => {
      console.log('✅ Metadados carregados:', {
        duration: audio.duration,
        readyState: audio.readyState
      });
      
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setHasError(false);
      } else {
        console.warn('⚠️ Duração inválida:', audio.duration);
      }
    };
    
    audio.oncanplaythrough = () => {
      console.log('✅ Áudio pronto para reprodução');
      setIsLoading(false);
      setHasError(false);
    };
    
    audio.onerror = (e) => {
      console.error('❌ Erro ao carregar áudio:', e);
      setHasError(true);
      setIsLoading(false);
      
      // Determinar mensagem de erro
      const audio = e.target as HTMLAudioElement;
      if (audio.error) {
        switch (audio.error.code) {
          case audio.error.MEDIA_ERR_NETWORK:
            setErrorMessage('Erro de rede ao carregar áudio');
            break;
          case audio.error.MEDIA_ERR_DECODE:
            setErrorMessage('Formato de áudio não suportado');
            break;
          case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setErrorMessage('Fonte de áudio não suportada');
            break;
          default:
            setErrorMessage('Erro ao carregar áudio');
        }
      } else {
        setErrorMessage('Erro desconhecido');
      }
    };
    
    audio.onended = () => {
      console.log('🏁 Reprodução finalizada');
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    
    // Definir URL com tratamento de erro
    try {
      audio.src = audioUrl;
      audio.preload = 'metadata';
      
      // Forçar carregamento
      audio.load();
    } catch (error) {
      console.error('❌ Erro ao definir URL do áudio:', error);
      setHasError(true);
      setErrorMessage('Erro ao processar URL do áudio');
      setIsLoading(false);
    }
    
    // Cleanup
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || hasError || isLoading) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else {
        await audio.play();
        setIsPlaying(true);
        
        // Atualizar progresso
        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime) {
            setCurrentTime(audio.currentTime);
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erro ao reproduzir:', error);
      setHasError(true);
      setErrorMessage('Erro ao reproduzir áudio');
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || hasError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * duration;
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0 || seconds === null || seconds === undefined) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  // Se houver erro
  if (hasError) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        isOwn ? 'bg-blue-600/20' : 'bg-gray-200'
      }`}>
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{errorMessage}</span>
        </div>
        <a
          href={audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>
        </a>
      </div>
    );
  }

  // Player normal
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      isOwn ? 'bg-blue-600/20' : 'bg-gray-200'
    }`}>
      {/* Botão Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading || hasError}
        className={`rounded-full ${
          isOwn ? 'hover:bg-blue-700/20' : 'hover:bg-gray-300'
        }`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      {/* Barra de progresso e tempo */}
      <div className="flex-1 space-y-1">
        <div 
          className="h-2 bg-gray-300 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div 
            className={`h-full ${
              isOwn ? 'bg-white' : 'bg-blue-500'
            } rounded-full transition-all duration-100`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Indicador de formato */}
      <div className="text-xs opacity-50">
        🎵
      </div>
    </div>
  );
}; 