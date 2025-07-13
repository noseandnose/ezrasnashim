import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 18 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Determine which flower to show based on progress
  const getFlowerDisplay = () => {
    if (completedCount === 0) {
      // No completion - show small flower outline
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
          <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
          <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
          <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
          <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      );
    } else if (completedCount === 1) {
      // One completion - show small filled flower
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-blush">
          <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
          <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
          <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
          <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
          <circle cx="12" cy="12" r="2" fill="#fbbf24"/>
        </svg>
      );
    } else if (completedCount === 2) {
      // Two completions - show bigger flower
      return (
        <svg width={size + 4} height={size + 4} viewBox="0 0 28 28" fill="currentColor" className="text-blush">
          <path d="M14 1a4 4 0 0 0-4 4c0 2 1.6 3.6 3.6 4a4 4 0 0 0 .4 0 4 4 0 0 0 4-4 4 4 0 0 0-4-4z"/>
          <path d="M14 27a4 4 0 0 0 4-4c0-2-1.6-3.6-3.6-4a4 4 0 0 0-.4 0 4 4 0 0 0-4 4 4 4 0 0 0 4 4z"/>
          <path d="M1 14a4 4 0 0 0 4 4c2 0 3.6-1.6 4-3.6a4 4 0 0 0 0-.4 4 4 0 0 0-4-4 4 4 0 0 0-4 4z"/>
          <path d="M27 14a4 4 0 0 0-4 4c-2 0-3.6-1.6-4-3.6a4 4 0 0 0 0-.4 4 4 0 0 0 4-4 4 4 0 0 0 4 4z"/>
          <path d="M6.5 6.5a3 3 0 0 0-1 4.2c1.4 1.4 3.6 1.8 5.4 1a3 3 0 0 0 1.8-2.8 3 3 0 0 0-6.2-2.4z"/>
          <path d="M21.5 21.5a3 3 0 0 0 1-4.2c-1.4-1.4-3.6-1.8-5.4-1a3 3 0 0 0-1.8 2.8 3 3 0 0 0 6.2 2.4z"/>
          <path d="M21.5 6.5a3 3 0 0 0 1 4.2c-1.4 1.4-3.6 1.8-5.4 1a3 3 0 0 0-1.8-2.8 3 3 0 0 0 6.2-2.4z"/>
          <path d="M6.5 21.5a3 3 0 0 0-1-4.2c1.4-1.4 3.6-1.8 5.4-1a3 3 0 0 0 1.8 2.8 3 3 0 0 0-6.2 2.4z"/>
          <circle cx="14" cy="14" r="3" fill="#fbbf24"/>
        </svg>
      );
    } else {
      // All three completions - show bouquet
      return (
        <svg width={size + 6} height={size + 6} viewBox="0 0 30 30" fill="currentColor" className="text-blush">
          {/* First flower */}
          <g transform="translate(-2,-2) scale(0.7)">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
            <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
            <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
            <circle cx="12" cy="12" r="2" fill="#fbbf24"/>
          </g>
          {/* Second flower */}
          <g transform="translate(8,2) scale(0.7)">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
            <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
            <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
            <circle cx="12" cy="12" r="2" fill="#fbbf24"/>
          </g>
          {/* Third flower */}
          <g transform="translate(3,8) scale(0.7)">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
            <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
            <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
            <circle cx="12" cy="12" r="2" fill="#fbbf24"/>
          </g>
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center justify-center">
      {getFlowerDisplay()}
    </div>
  );
}