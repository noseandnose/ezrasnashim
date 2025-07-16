import { useDailyCompletionStore } from "@/lib/types";
import { useState, useEffect } from "react";
import state0Image from '@assets/State 0_1752685387597.png';
import state1Image from '@assets/State 1_1752685387597.png';
import state2Image from '@assets/State 2_1752685387596.png';
import state3Image from '@assets/State 4_1752685387593.png';

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 36 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Trigger transition effect when completion count changes
  useEffect(() => {
    if (completedCount !== previousCount) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousCount(completedCount);
      }, 300); // Transition duration
      
      return () => clearTimeout(timer);
    }
  }, [completedCount, previousCount]);
  
  // Map completion count to the appropriate image using imported static assets
  const getProgressImage = () => {
    switch (completedCount) {
      case 0:
        return {
          src: state0Image,
          scale: 1.8,
          alt: "Growing branch - Start your spiritual journey"
        };
      case 1:
        return {
          src: state1Image,
          scale: 1.8,
          alt: "Beautiful flower blooms - One completion"
        };
      case 2:
        return {
          src: state2Image,
          scale: 1.8,
          alt: "Multiple flowers - Two completions"
        };
      case 3:
        return {
          src: state3Image,
          scale: 1.8,
          alt: "Full garden bouquet - All completions!"
        };
      default:
        return {
          src: state0Image,
          scale: 1.8,
          alt: "Daily progress"
        };
    }
  };

  const progressImage = getProgressImage();

  return (
    <div className="flex items-center justify-center w-full h-full relative">
      <img
        src={progressImage.src}
        alt={progressImage.alt}
        className={`object-contain transition-all duration-300 ease-in-out ${
          isTransitioning 
            ? 'scale-110 opacity-80 transform rotate-2' 
            : 'scale-100 opacity-100 transform rotate-0'
        }`}
        style={{
          width: '120px',
          height: '120px',
          maxWidth: '120px',
          maxHeight: '120px'
        }}
      />
      
      {/* Sparkle effect during transition */}
      {isTransitioning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blush/20"></div>
          <div className="animate-pulse absolute inline-flex h-3/4 w-3/4 rounded-full bg-lavender/30"></div>
        </div>
      )}
    </div>
  );
}