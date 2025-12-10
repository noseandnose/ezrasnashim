import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AudioPlayerProps {
  title: string;
  duration: string | number;
  audioUrl: string;
  onAudioEnded?: () => void; // Optional callback for when audio finishes
}

export default function AudioPlayer({ duration, audioUrl, onAudioEnded }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [actualDuration, setActualDuration] = useState(duration);
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [audioError, setAudioError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Convert various hosting URLs to proxied streaming URLs
  const getDirectAudioUrl = (url: string) => {
    if (!url) return '';
    
    // Clean the URL - remove any trailing whitespace/newlines
    const cleanUrl = url.trim();
    
    // GitHub raw files
    if (cleanUrl.includes('raw.githubusercontent.com')) {
      const pathMatch = cleanUrl.match(/raw\.githubusercontent\.com\/(.+)/);
      if (pathMatch) {
        return `/api/media-proxy/github/${pathMatch[1]}`;
      }
    }
    
    // Cloudinary files - use direct URL if publicly accessible
    if (cleanUrl.includes('res.cloudinary.com')) {
      // For public Cloudinary URLs, use direct access
      return cleanUrl;
    }
    
    // Google Drive files
    const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) || cleanUrl.match(/id=([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `/api/media-proxy/gdrive/${fileId}`;
    }
    
    // Direct URLs (already hosted properly)
    if (cleanUrl.startsWith('http')) {
      return cleanUrl;
    }
    
    return cleanUrl;
  };

  // Use ref-based toggle to avoid stale closure issues after backgrounding
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (audio.paused) {
        // Resume audio context if suspended (required for PWA/home screen mode)
        const audioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (audioContext) {
          const ctx = new audioContext();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
        
        audio.play().catch((err) => {
          console.error('[AudioPlayer] Play failed:', err);
          setAudioError(true);
        });
      } else {
        audio.pause();
      }
    }
  }, []);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
      
      // Call the completion callback if provided
      if (onAudioEnded) {
        onAudioEnded();
      }
    };

    const handleTimeUpdate = () => {
      if (audio && audio.duration && !isNaN(audio.duration)) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(formatTime(Math.floor(audio.currentTime)));
      }
    };

    const handleLoadedMetadata = () => {
      setAudioError(false);
      setIsLoading(false);
      if (audio.duration) {
        // Update duration with actual file duration
        const actualDurationTime = formatTime(Math.floor(audio.duration));
        setActualDuration(actualDurationTime);
      }
    };

    const handleError = () => {
      // Audio failed to load
      setAudioError(true);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setAudioError(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(playbackSpeed);
    }
  }, [playbackSpeed]);


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touchX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX;
      const clickX = touchX - rect.left;
      const width = rect.width;
      const clickPercent = Math.max(0, Math.min(1, clickX / width)); // Clamp between 0 and 1
      const newTime = clickPercent * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(clickPercent * 100);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleProgressChange(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressChange(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleProgressChange(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressChange(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleProgressChange(e);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const directAudioUrl = getDirectAudioUrl(audioUrl);

  return (
    <div className="bg-gray-50 rounded-2xl p-4 mb-4 audio-controls border border-gray-200" data-bridge-container>
      <audio 
        ref={audioRef} 
        src={directAudioUrl} 
        preload="metadata"
        onError={() => { /* Audio failed to load */ }}
      />
      {audioError && (
        <div className="text-xs text-gray-600 mb-2 text-center">
          Audio temporarily unavailable - please refresh the page
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="w-16"></div> {/* Left spacer */}
        
        <button
          onClick={togglePlay}
          className={`bg-gradient-feminine rounded-full p-4 hover:scale-105 transition-all border-0 text-white audio-play-button inline-flex items-center justify-center ${audioError ? 'opacity-50' : ''}`}
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          data-testid="button-audio-play"
          type="button"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-0.5" />
          )}
        </button>
        
        <div className="bg-gray-200 rounded-lg p-1">
          <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
            <SelectTrigger className="bg-transparent border-none text-black text-xs w-14 h-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between text-sm platypi-medium text-black">
          <span>{currentTime}</span>
          <span>{isLoading ? duration : actualDuration}</span>
        </div>
        <div className="audio-progress-bar py-2">
          <div 
            className="bg-gray-300 rounded-full audio-progress-track w-full h-2 cursor-pointer relative"
            onClick={handleProgressClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className={`audio-progress h-full rounded-full ${isDragging ? 'transition-none' : 'transition-all duration-100'} relative bg-gradient-feminine`}
              style={{ width: `${progress}%` }}
            >
              <div 
                className={`absolute -right-2 -top-1 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-pink-300 ${isDragging ? 'opacity-100 scale-125' : 'opacity-90'} cursor-grab active:cursor-grabbing transition-all duration-100`}
                style={{ touchAction: 'none' }}
              >
                {/* Larger invisible touch target */}
                <div className="absolute inset-0 -m-2 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
