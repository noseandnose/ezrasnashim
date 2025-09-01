import { Heart } from "lucide-react";

interface HeartProgressProps {
  completed: boolean;
  size?: number;
  animationClass?: string;
}

export default function HeartProgress({ completed, size = 18, animationClass = '' }: HeartProgressProps) {
  // Generate unique gradient IDs for each heart instance
  const gradientId = `heart-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const completedGradientId = `heart-completed-gradient-${Math.random().toString(36).substr(2, 9)}`;

  if (completed) {
    return (
      <div className={`${animationClass}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={completedGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(120, 20%, 75%)" />
              <stop offset="100%" stopColor="hsl(120, 20%, 75%)" />
            </linearGradient>
          </defs>
          <path 
            d="m20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
            fill={`url(#${completedGradientId})`}
            stroke="none"
          />
        </svg>
      </div>
    );
  }
  
  return (
    <div className={`${animationClass}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(350, 45%, 85%)" />
            <stop offset="100%" stopColor="hsl(260, 30%, 85%)" />
          </linearGradient>
        </defs>
        <path 
          d="m20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
          fill={`url(#${gradientId})`}
          stroke="none"
        />
      </svg>
    </div>
  );
}