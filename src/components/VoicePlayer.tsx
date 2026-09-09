import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoicePlayerProps {
  url: string;
  duration?: number;
  isMe?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ url, duration = 6, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate pseudo-waveform bars based on url or random stable seed
  const bars = [
    30, 45, 60, 80, 50, 40, 70, 90, 65, 85, 100, 75, 60, 40, 80, 95, 70, 55, 85, 65, 45, 35, 60, 40
  ];

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Fallback if browser requires user gesture
        setIsPlaying(true);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = pos * audioDuration;
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressRatio = audioDuration > 0 ? currentTime / audioDuration : 0;

  return (
    <div 
      className={`flex items-center gap-3 py-1 px-1 select-none min-w-[210px] max-w-[280px] ${
        isMe ? 'text-white' : 'text-zinc-200'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isMe
            ? 'bg-white text-blue-600 hover:bg-zinc-100'
            : 'bg-blue-500 hover:bg-blue-400 text-white'
        }`}
        title={isPlaying ? 'Пауза' : 'Слушать голосовое'}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Waveform & Time */}
      <div className="flex-1 min-w-0">
        <div 
          className="flex items-center gap-[2.5px] h-6 cursor-pointer py-1"
          onClick={handleSeek}
          title="Перемотать"
        >
          {bars.map((h, i) => {
            const barRatio = i / bars.length;
            const isFilled = barRatio <= progressRatio;

            return (
              <div
                key={i}
                style={{ height: `${Math.max(15, h)}%` }}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isFilled
                    ? isMe
                      ? 'bg-white'
                      : 'bg-blue-400'
                    : isMe
                    ? 'bg-blue-400/40'
                    : 'bg-zinc-600/60'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono mt-0.5 opacity-80">
          <span>{formatTime(currentTime > 0 ? currentTime : audioDuration)}</span>
          <span className="flex items-center gap-1">
            <Volume2 size={10} className="opacity-70" />
            <span>{formatTime(audioDuration)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
