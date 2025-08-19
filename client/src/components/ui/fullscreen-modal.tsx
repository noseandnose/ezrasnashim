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
      // Simply prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
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
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw'
      }}
    >
      {/* Header */}
      <div 
        className="bg-white border-b border-gray-200 px-4 py-3"
        style={{ 
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: '40px 1fr 40px',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <img 
          src={logoImage} 
          alt="Ezras Nashim" 
          style={{ height: '20px', width: 'auto' }}
        />
        <h2 className="text-lg font-semibold text-gray-900 truncate text-center">
          {title}
        </h2>
        <button
          onClick={() => {
            setTimeout(() => {
              onClose();
            }, 0);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors justify-self-end"
          aria-label="Close"
          type="button"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Content - fixed scrolling container */}
      <div 
        style={{ 
          flex: '1 1 auto',
          overflowY: 'scroll',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          height: 'calc(100vh - 60px)',
          position: 'relative'
        }}
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