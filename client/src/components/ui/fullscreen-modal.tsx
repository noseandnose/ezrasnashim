import { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import logoImage from "@assets/1LO_1755590090315.png";

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FullscreenModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}: FullscreenModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = originalOverflow;
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        // Fullscreen not supported or user denied
        setIsFullscreen(false);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white"
    >
      {/* Header - absolutely positioned at top */}
      <div 
        className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 z-10"
      >
        <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
          <img 
            src={logoImage} 
            alt="Ezras Nashim" 
            className="h-5 w-auto"
          />
          <h2 className="text-lg font-semibold text-gray-900 truncate text-center">
            {title}
          </h2>
          <button
            onClick={() => {
              onClose();
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors justify-self-end"
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Scrollable Content - with padding for header */}
      <div 
        className="absolute inset-0 pt-[60px] overflow-y-auto overflow-x-hidden"
      >
        <div className={`px-4 py-4 ${className}`}>
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FullscreenButtonProps {
  onToggle: () => void;
  isFullscreen?: boolean;
}

export function FullscreenButton({ onToggle, isFullscreen = false }: FullscreenButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4 text-gray-600" />
      ) : (
        <Maximize2 className="h-4 w-4 text-gray-600" />
      )}
    </button>
  );
}