import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const togglePlay = () => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else {
      // Play (simulate since we don't have actual audio files)
      setIsPlaying(true);
      simulateAudioProgress();
    }
  };

  const simulateAudioProgress = () => {
    let currentProgress = progress;
    const speed = parseFloat(playbackSpeed);
    progressIntervalRef.current = setInterval(() => {
      currentProgress += 0.5 * speed;
      if (currentProgress <= 100) {
        setProgress(currentProgress);
        // Update current time based on progress
        const totalSeconds = parseDuration(duration);
        const currentSeconds = Math.floor((currentProgress / 100) * totalSeconds);
        setCurrentTime(formatTime(currentSeconds));
      } else {
        // Audio finished
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime("0:00");
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, 100);
  };

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="gradient-blush-peach rounded-2xl p-4 text-white mb-4 audio-controls">
      <div className="flex items-center justify-between mb-4">
        <div className="w-16"></div> {/* Left spacer */}
        
        <Button
          onClick={togglePlay}
          className="bg-white bg-opacity-20 rounded-full p-4 hover:bg-opacity-30 transition-all border-0 audio-play-button"
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
