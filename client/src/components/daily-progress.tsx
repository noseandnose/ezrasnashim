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
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
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
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-rose-400">
          <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
          <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
          <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
          <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
          <circle cx="12" cy="12" r="2.5" fill="#fbbf24"/>
        </svg>
      );
    } else if (completedCount === 2) {
      // Two completions - show bigger flower
      return (
        <svg width={size * 1.2} height={size * 1.2} viewBox="0 0 32 32" fill="currentColor" className="text-rose-500">
          <path d="M16 2a4 4 0 0 0-4 4c0 2 1.6 3.6 3.6 4a4 4 0 0 0 .4 0 4 4 0 0 0 4-4 4 4 0 0 0-4-4z"/>
          <path d="M16 30a4 4 0 0 0 4-4c0-2-1.6-3.6-3.6-4a4 4 0 0 0-.4 0 4 4 0 0 0-4 4 4 4 0 0 0 4 4z"/>
          <path d="M2 16a4 4 0 0 0 4 4c2 0 3.6-1.6 4-3.6a4 4 0 0 0 0-.4 4 4 0 0 0-4-4 4 4 0 0 0-4 4z"/>
          <path d="M30 16a4 4 0 0 0-4 4c-2 0-3.6-1.6-4-3.6a4 4 0 0 0 0-.4 4 4 0 0 0 4-4 4 4 0 0 0 4 4z"/>
          <path d="M7.5 7.5a3 3 0 0 0-1 4.2c1.4 1.4 3.6 1.8 5.4 1a3 3 0 0 0 1.8-2.8 3 3 0 0 0-6.2-2.4z"/>
          <path d="M24.5 24.5a3 3 0 0 0 1-4.2c-1.4-1.4-3.6-1.8-5.4-1a3 3 0 0 0-1.8 2.8 3 3 0 0 0 6.2 2.4z"/>
          <path d="M24.5 7.5a3 3 0 0 0 1 4.2c-1.4 1.4-3.6 1.8-5.4 1a3 3 0 0 0-1.8-2.8 3 3 0 0 0 6.2-2.4z"/>
          <path d="M7.5 24.5a3 3 0 0 0-1-4.2c1.4-1.4 3.6-1.8 5.4-1a3 3 0 0 0 1.8 2.8 3 3 0 0 0-6.2 2.4z"/>
          <circle cx="16" cy="16" r="3.5" fill="#fbbf24"/>
        </svg>
      );
    } else {
      // All three completions - show bouquet
      return (
        <svg width={size * 1.4} height={size * 1.4} viewBox="0 0 40 40" fill="currentColor" className="text-rose-600">
          {/* First flower */}
          <g transform="translate(2,2) scale(0.8)">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
            <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
            <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
            <circle cx="12" cy="12" r="2.5" fill="#fbbf24"/>
          </g>
          {/* Second flower */}
          <g transform="translate(16,2) scale(0.8)">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
            <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
            <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
            <circle cx="12" cy="12" r="2.5" fill="#fbbf24"/>
          </g>
          {/* Third flower */}
          <g transform="translate(9,16) scale(0.8)">
            <path d="M12 2a3 3 0 0 0-3 3c0 1.5 1.2 2.7 2.7 3a3 3 0 0 0 .3 0 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
            <path d="M12 22a3 3 0 0 0 3-3c0-1.5-1.2-2.7-2.7-3a3 3 0 0 0-.3 0 3 3 0 0 0-3 3 3 3 0 0 0 3 3z"/>
            <path d="M2 12a3 3 0 0 0 3 3c1.5 0 2.7-1.2 3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0-3-3 3 3 0 0 0-3 3z"/>
            <path d="M22 12a3 3 0 0 0-3 3c-1.5 0-2.7-1.2-3-2.7a3 3 0 0 0 0-.3 3 3 0 0 0 3-3 3 3 0 0 0 3 3z"/>
            <circle cx="12" cy="12" r="2.5" fill="#fbbf24"/>
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