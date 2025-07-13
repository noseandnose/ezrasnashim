import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  size?: number;
}

export default function DailyProgress({ size = 18 }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  
  // Count completed sections
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  
  // Determine which flower to show based on progress - using the beautiful flower from congratulations modal
  const getFlowerDisplay = () => {
    if (completedCount === 0) {
      // No completion - show flower outline only
      return (
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 100 100">
          {/* Flower petals outline */}
          <g fill="none" stroke="#D1D5DB" strokeWidth="2" opacity="0.5">
            {/* Top petal */}
            <ellipse cx="50" cy="25" rx="8" ry="15"/>
            {/* Top right petal */}
            <ellipse cx="65" cy="35" rx="8" ry="15" transform="rotate(45 65 35)"/>
            {/* Right petal */}
            <ellipse cx="75" cy="50" rx="8" ry="15" transform="rotate(90 75 50)"/>
            {/* Bottom right petal */}
            <ellipse cx="65" cy="65" rx="8" ry="15" transform="rotate(135 65 65)"/>
            {/* Bottom petal */}
            <ellipse cx="50" cy="75" rx="8" ry="15" transform="rotate(180 50 75)"/>
            {/* Bottom left petal */}
            <ellipse cx="35" cy="65" rx="8" ry="15" transform="rotate(225 35 65)"/>
            {/* Left petal */}
            <ellipse cx="25" cy="50" rx="8" ry="15" transform="rotate(270 25 50)"/>
            {/* Top left petal */}
            <ellipse cx="35" cy="35" rx="8" ry="15" transform="rotate(315 35 35)"/>
          </g>
          {/* Flower center outline */}
          <circle cx="50" cy="50" r="8" fill="none" stroke="#D1D5DB" strokeWidth="2" opacity="0.5"/>
        </svg>
      );
    } else if (completedCount === 1) {
      // One completion - show small filled flower
      return (
        <svg width={size} height={size} viewBox="0 0 100 100">
          {/* Flower petals */}
          <g fill="currentColor" opacity="0.8">
            {/* Top petal */}
            <ellipse cx="50" cy="25" rx="8" ry="15" fill="#E8B4CB"/>
            {/* Top right petal */}
            <ellipse cx="65" cy="35" rx="8" ry="15" transform="rotate(45 65 35)" fill="#F4A6CD"/>
            {/* Right petal */}
            <ellipse cx="75" cy="50" rx="8" ry="15" transform="rotate(90 75 50)" fill="#E8B4CB"/>
            {/* Bottom right petal */}
            <ellipse cx="65" cy="65" rx="8" ry="15" transform="rotate(135 65 65)" fill="#F4A6CD"/>
            {/* Bottom petal */}
            <ellipse cx="50" cy="75" rx="8" ry="15" transform="rotate(180 50 75)" fill="#E8B4CB"/>
            {/* Bottom left petal */}
            <ellipse cx="35" cy="65" rx="8" ry="15" transform="rotate(225 35 65)" fill="#F4A6CD"/>
            {/* Left petal */}
            <ellipse cx="25" cy="50" rx="8" ry="15" transform="rotate(270 25 50)" fill="#E8B4CB"/>
            {/* Top left petal */}
            <ellipse cx="35" cy="35" rx="8" ry="15" transform="rotate(315 35 35)" fill="#F4A6CD"/>
          </g>
          {/* Flower center */}
          <circle cx="50" cy="50" r="8" fill="#D4A574"/>
          <circle cx="50" cy="50" r="5" fill="#C9975B"/>
        </svg>
      );
    } else if (completedCount === 2) {
      // Two completions - show bigger flower
      return (
        <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 100 100">
          {/* Flower petals - bigger */}
          <g fill="currentColor" opacity="0.9">
            {/* Top petal */}
            <ellipse cx="50" cy="20" rx="10" ry="18" fill="#E8B4CB"/>
            {/* Top right petal */}
            <ellipse cx="68" cy="32" rx="10" ry="18" transform="rotate(45 68 32)" fill="#F4A6CD"/>
            {/* Right petal */}
            <ellipse cx="80" cy="50" rx="10" ry="18" transform="rotate(90 80 50)" fill="#E8B4CB"/>
            {/* Bottom right petal */}
            <ellipse cx="68" cy="68" rx="10" ry="18" transform="rotate(135 68 68)" fill="#F4A6CD"/>
            {/* Bottom petal */}
            <ellipse cx="50" cy="80" rx="10" ry="18" transform="rotate(180 50 80)" fill="#E8B4CB"/>
            {/* Bottom left petal */}
            <ellipse cx="32" cy="68" rx="10" ry="18" transform="rotate(225 32 68)" fill="#F4A6CD"/>
            {/* Left petal */}
            <ellipse cx="20" cy="50" rx="10" ry="18" transform="rotate(270 20 50)" fill="#E8B4CB"/>
            {/* Top left petal */}
            <ellipse cx="32" cy="32" rx="10" ry="18" transform="rotate(315 32 32)" fill="#F4A6CD"/>
          </g>
          {/* Flower center - bigger */}
          <circle cx="50" cy="50" r="10" fill="#D4A574"/>
          <circle cx="50" cy="50" r="6" fill="#C9975B"/>
        </svg>
      );
    } else {
      // All three completions - show beautiful large bouquet
      return (
        <svg width={size * 1.8} height={size * 1.8} viewBox="0 0 140 140">
          {/* First flower - top left, larger scale */}
          <g transform="translate(5,5) scale(0.85)" opacity="0.95">
            <ellipse cx="50" cy="25" rx="8" ry="15" fill="#E8B4CB"/>
            <ellipse cx="65" cy="35" rx="8" ry="15" transform="rotate(45 65 35)" fill="#F4A6CD"/>
            <ellipse cx="75" cy="50" rx="8" ry="15" transform="rotate(90 75 50)" fill="#E8B4CB"/>
            <ellipse cx="65" cy="65" rx="8" ry="15" transform="rotate(135 65 65)" fill="#F4A6CD"/>
            <ellipse cx="50" cy="75" rx="8" ry="15" transform="rotate(180 50 75)" fill="#E8B4CB"/>
            <ellipse cx="35" cy="65" rx="8" ry="15" transform="rotate(225 35 65)" fill="#F4A6CD"/>
            <ellipse cx="25" cy="50" rx="8" ry="15" transform="rotate(270 25 50)" fill="#E8B4CB"/>
            <ellipse cx="35" cy="35" rx="8" ry="15" transform="rotate(315 35 35)" fill="#F4A6CD"/>
            <circle cx="50" cy="50" r="9" fill="#D4A574"/>
            <circle cx="50" cy="50" r="6" fill="#C9975B"/>
          </g>
          
          {/* Second flower - top right, larger scale */}
          <g transform="translate(55,0) scale(0.85)" opacity="0.95">
            <ellipse cx="50" cy="25" rx="8" ry="15" fill="#F4A6CD"/>
            <ellipse cx="65" cy="35" rx="8" ry="15" transform="rotate(45 65 35)" fill="#E8B4CB"/>
            <ellipse cx="75" cy="50" rx="8" ry="15" transform="rotate(90 75 50)" fill="#F4A6CD"/>
            <ellipse cx="65" cy="65" rx="8" ry="15" transform="rotate(135 65 65)" fill="#E8B4CB"/>
            <ellipse cx="50" cy="75" rx="8" ry="15" transform="rotate(180 50 75)" fill="#F4A6CD"/>
            <ellipse cx="35" cy="65" rx="8" ry="15" transform="rotate(225 35 65)" fill="#E8B4CB"/>
            <ellipse cx="25" cy="50" rx="8" ry="15" transform="rotate(270 25 50)" fill="#F4A6CD"/>
            <ellipse cx="35" cy="35" rx="8" ry="15" transform="rotate(315 35 35)" fill="#E8B4CB"/>
            <circle cx="50" cy="50" r="9" fill="#D4A574"/>
            <circle cx="50" cy="50" r="6" fill="#C9975B"/>
          </g>
          
          {/* Third flower - bottom center, larger scale */}
          <g transform="translate(30,50) scale(0.85)" opacity="0.95">
            <ellipse cx="50" cy="25" rx="8" ry="15" fill="#E8B4CB"/>
            <ellipse cx="65" cy="35" rx="8" ry="15" transform="rotate(45 65 35)" fill="#F4A6CD"/>
            <ellipse cx="75" cy="50" rx="8" ry="15" transform="rotate(90 75 50)" fill="#E8B4CB"/>
            <ellipse cx="65" cy="65" rx="8" ry="15" transform="rotate(135 65 65)" fill="#F4A6CD"/>
            <ellipse cx="50" cy="75" rx="8" ry="15" transform="rotate(180 50 75)" fill="#E8B4CB"/>
            <ellipse cx="35" cy="65" rx="8" ry="15" transform="rotate(225 35 65)" fill="#F4A6CD"/>
            <ellipse cx="25" cy="50" rx="8" ry="15" transform="rotate(270 25 50)" fill="#E8B4CB"/>
            <ellipse cx="35" cy="35" rx="8" ry="15" transform="rotate(315 35 35)" fill="#F4A6CD"/>
            <circle cx="50" cy="50" r="9" fill="#D4A574"/>
            <circle cx="50" cy="50" r="6" fill="#C9975B"/>
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