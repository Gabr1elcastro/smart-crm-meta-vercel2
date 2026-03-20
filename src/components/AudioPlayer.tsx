import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerProps {
  audioUrl: string;
  isOwn?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, isOwn = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Detectar formato do arquivo (apenas para validação interna)
  const getAudioFormat = (url: string): string => {
    const match = url.match(/\.(\w+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'unknown';
  };

  const audioFormat = getAudioFormat(audioUrl);
  const isOGG = audioFormat === 'ogg';

  useEffect(() => {
    console.log('🎵 AudioPlayer iniciado');
    console.log('📍 URL:', audioUrl);
    
    // Se for OGG, mostrar erro de formato imediatamente
    if (isOGG) {
      console.warn('⚠️ Formato OGG detectado - não suportado');
      setHasError(true);
      setIsLoading(false);
      return;
    }
  }, [audioUrl, isOGG]);

  useEffect(() => {
    if (isOGG) return;

    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      console.log('✅ Metadata carregada:', audio.duration);
      setDuration(audio.duration);
      setIsReady(true);
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error('❌ Erro no áudio');
      setHasError(true);
      setIsReady(false);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log('✅ Áudio pronto para reprodução');
      setIsReady(true);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, isOGG]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || hasError || !isReady) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ Erro ao reproduzir:', error);
      setHasError(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (!audio || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const seekTime = clickRatio * duration;
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Estado de erro
  if (hasError || isOGG) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-4 max-w-[300px] ${
        isOwn 
          ? 'bg-gradient-to-br from-red-500 to-red-600' 
          : 'bg-gradient-to-br from-gray-100 to-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isOwn ? 'bg-red-400/30' : 'bg-gray-300/50'}`}>
            <Volume2 className={`h-5 w-5 ${isOwn ? 'text-white' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-800'}`}>
              Áudio indisponível
            </p>
            <p className={`text-xs ${isOwn ? 'text-red-100' : 'text-gray-600'}`}>
              Formato não suportado
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 max-w-[300px] transition-all ${
      isOwn 
        ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg' 
        : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-md'
    }`}>
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
      </div>

      {/* Audio element oculto */}
      {!isOGG && (
        <audio 
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}
      
      <div className="relative z-10">
        {/* Header com botão play e ícone */}
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            disabled={!isReady || hasError || isLoading}
            className={`rounded-full p-0 h-12 w-12 transition-all ${
              isOwn 
                ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm' 
                : 'bg-gray-800/10 hover:bg-gray-800/20 text-gray-700 backdrop-blur-sm'
            } ${isLoading ? 'animate-pulse' : ''}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className={`h-4 w-4 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                Mensagem de voz
              </span>
            </div>
            
            {/* Tempo */}
            <div className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Barra de progresso interativa */}
        <div 
          ref={progressBarRef}
          className="relative h-1.5 bg-black/10 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${
              isOwn ? 'bg-white/80' : 'bg-gray-700'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
          
          {/* Indicador de posição */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md transition-all duration-100 ${
              isOwn ? 'bg-white' : 'bg-gray-700'
            }`}
            style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
          />
        </div>

        {/* Visualizador de ondas estilizado */}
        <div className="flex items-center justify-center gap-0.5 mt-3 h-8">
          {[...Array(30)].map((_, i) => {
            const isActive = (i / 30) * 100 <= progressPercentage;
            const height = 10 + Math.sin(i * 0.3) * 10 + Math.random() * 5;
            
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isActive 
                    ? (isOwn ? 'bg-white/70' : 'bg-gray-700')
                    : (isOwn ? 'bg-white/20' : 'bg-gray-400/30')
                }`}
                style={{ 
                  height: `${isPlaying ? height : 12}px`,
                  transform: isPlaying && isActive ? 'scaleY(1.2)' : 'scaleY(1)'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}; 