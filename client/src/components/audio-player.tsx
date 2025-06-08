import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  title: string;
  duration: string;
  audioUrl: string;
}

export default function AudioPlayer({ title, duration, audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
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
    progressIntervalRef.current = setInterval(() => {
      currentProgress += 0.5;
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
    <div className="gradient-blush-peach rounded-2xl p-4 text-white mb-4">
      <div className="flex items-center justify-center mb-3">
        <Button
          onClick={togglePlay}
          className="bg-white bg-opacity-20 rounded-full p-3 hover:bg-opacity-30 transition-all border-0"
        >
          {isPlaying ? (
            <Pause className="text-xl" size={24} />
          ) : (
            <Play className="text-xl" size={24} />
          )}
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>{currentTime}</span>
          <span>{duration}</span>
        </div>
        <div className="bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="audio-progress h-full rounded-full transition-all duration-100" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      {/* Hidden audio element for future real audio implementation */}
      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
    </div>
  );
}
