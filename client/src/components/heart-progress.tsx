import { Heart } from "lucide-react";

interface HeartProgressProps {
  completed: boolean;
  size?: number;
}

export default function HeartProgress({ completed, size = 18 }: HeartProgressProps) {
  if (completed) {
    return (
      <Heart 
        size={size} 
        className="text-blush fill-blush animate-pulse" 
        strokeWidth={2}
      />
    );
  }
  
  return (
    <Heart 
      size={size} 
      className="text-gray-300" 
      strokeWidth={2}
    />
  );
}