import { useEffect, useState } from 'react';
import logoPath from '@assets/EN App Icon_1756705023411.png';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function SplashScreen({ isVisible, onComplete }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isVisible) return;
    
    // Show splash for minimum 800ms, then fade out quickly
    const timer = setTimeout(() => {
      setIsAnimating(false);
      // Allow fade out animation to complete
      setTimeout(onComplete, 150);
    }, 800); // Further reduced for faster startup

    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-white z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        WebkitBackdropFilter: 'none',
        backdropFilter: 'none',
        background: '#ffffff'
      }}
    >
      <div className="flex flex-col items-center">
        {/* Logo only as requested */}
        <div className={`transition-all duration-800 ease-out ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-80'
        }`}>
          <img 
            src={logoPath} 
            alt="Ezras Nashim" 
            className="w-24 h-24 object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
      </div>
    </div>
  );
}