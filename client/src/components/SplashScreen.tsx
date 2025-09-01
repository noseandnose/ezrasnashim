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
    
    // Show splash for minimum 1 second, then fade out quickly
    const timer = setTimeout(() => {
      setIsAnimating(false);
      // Allow fade out animation to complete
      setTimeout(onComplete, 200);
    }, 1000); // Reduced from 1.5s to 1s

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
        {/* Logo with gentle fade-in and scale animation */}
        <div className={`transition-all duration-1000 ease-out ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-80'
        }`}>
          <img 
            src={logoPath} 
            alt="Ezras Nashim" 
            className="w-32 h-32 object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
        
        {/* App name with delayed fade-in */}
        <div className={`mt-6 transition-all duration-1000 delay-300 ease-out ${
          isAnimating ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'
        }`}>
          <h1 className="text-2xl font-playfair font-bold text-gray-800 tracking-wide">
            Ezras Nashim
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1 font-inter">
            Daily Torah • Tefilla • Tzedaka
          </p>
        </div>

        {/* Subtle loading indicator */}
        <div className={`mt-8 transition-opacity duration-1000 delay-500 ${
          isAnimating ? 'opacity-60' : 'opacity-0'
        }`}>
          <div className="w-8 h-1 bg-gradient-to-r from-blush to-peach rounded-full overflow-hidden">
            <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}