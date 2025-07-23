import { useDailyCompletionStore } from "@/lib/types";
import { useState, useEffect } from "react";
import stage0Image from '@assets/Untitled design (2)_1753301031660.png';
import stage1Image from '@assets/Stage1_1753300751705.png';
import stage2Image from '@assets/Stage2_1753300751704.png';
import stage3Image from '@assets/Stage3_1753300751700.png';

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
          src: stage0Image,
          scale: 1.8,
          alt: "Gentle pink beginning - Start your spiritual journey"
        };
      case 1:
        return {
          src: stage1Image,
          scale: 1.8,
          alt: "Single flower - One completion"
        };
      case 2:
        return {
          src: stage2Image,
          scale: 1.8,
          alt: "Multiple flowers - Two completions"
        };
      case 3:
      case 4:
        return {
          src: stage3Image,
          scale: 1.8,
          alt: "Full garden bouquet - All completions!"
        };
      default:
        return {
          src: stage0Image,
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