import { Heart } from "lucide-react";

interface HeartProgressProps {
  completed: boolean;
  size?: number;
  animationClass?: string;
}

export default function HeartProgress({ completed, size = 18, animationClass = '' }: HeartProgressProps) {
  if (completed) {
    return (
      <Heart 
        size={size} 
        className={`text-sage fill-sage ${animationClass}`}
        strokeWidth={2}
      />
    );
  }
  
  return (
    <Heart 
      size={size} 
      className={`text-blush fill-blush ${animationClass}`}
      strokeWidth={2}
    />
  );
}