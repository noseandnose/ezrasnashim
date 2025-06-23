import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface HeartExplosionProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function HeartExplosion({ trigger, onComplete }: HeartExplosionProps) {
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowExplosion(true);
      
      // Clean up and call onComplete after animation
      const timer = setTimeout(() => {
        setShowExplosion(false);
        onComplete?.();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!showExplosion) return null;

  return (
    <div className="heart-explosion">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="heart-particle">
          <Heart size={16} fill="currentColor" />
        </div>
      ))}
    </div>
  );
}