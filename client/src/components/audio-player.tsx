import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AudioPlayerProps {
  title: string;
  duration: string;
  audioUrl: string;
}

export default function AudioPlayer({ title, duration, audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [playbackSpeed, setPlaybackSpeed] = useState("1");
  const [audioError, setAudioError] = useState(false);
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
    
    // Cloudinary files
    if (cleanUrl.includes('res.cloudinary.com')) {
      const pathMatch = cleanUrl.match(/res\.cloudinary\.com\/(.+)/);
      if (pathMatch) {
        return `/api/media-proxy/cloudinary/${pathMatch[1]}`;
      }
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

  const togglePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Failed to play audio:', error);
          setAudioError(true);
        }
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(formatTime(Math.floor(audio.currentTime)));
      }
    };

    const handleLoadedMetadata = () => {
      setAudioError(false);
      if (audio.duration) {
        // Update duration if it differs from provided duration
        const actualDuration = formatTime(Math.floor(audio.duration));
        // Could update duration state here if needed
      }
    };

    const handleError = () => {
      console.error('Audio failed to load:', audioUrl);
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

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickPercent = clickX / width;
      const newTime = clickPercent * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    }
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
    <div className="gradient-blush-peach rounded-2xl p-4 text-white mb-4 audio-controls">
      <audio 
        ref={audioRef} 
        src={directAudioUrl} 
        preload="metadata"
        onError={() => console.error('Audio failed to load:', directAudioUrl)}
      />
      {audioError && (
        <div className="text-xs text-white/80 mb-2 text-center">
          Audio temporarily unavailable - please refresh the page
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="w-16"></div> {/* Left spacer */}
        
        <Button
          onClick={togglePlay}
          disabled={audioError}
          className="bg-white bg-opacity-20 rounded-full p-4 hover:bg-opacity-30 transition-all border-0 audio-play-button disabled:opacity-50"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-0.5" />
          )}
        </Button>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-1">
          <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
            <SelectTrigger className="bg-transparent border-none text-white text-xs w-14 h-6">
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
        <div className="flex justify-between text-sm font-medium">
          <span>{currentTime}</span>
          <span>{duration}</span>
        </div>
        <div className="audio-progress-bar">
          <div 
            className="bg-white bg-opacity-20 rounded-full audio-progress-track w-full"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newProgress = (clickX / rect.width) * 100;
              setProgress(Math.max(0, Math.min(100, newProgress)));
              
              const totalSeconds = parseDuration(duration);
              const newCurrentSeconds = Math.floor((newProgress / 100) * totalSeconds);
              setCurrentTime(formatTime(newCurrentSeconds));
            }}
          >
            <div 
              className="audio-progress h-full rounded-full transition-all duration-100 relative" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white opacity-90"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Hidden audio element for future real audio implementation */}
      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
    </div>
  );
}
