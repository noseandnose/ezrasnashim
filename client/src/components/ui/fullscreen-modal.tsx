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
      // Prevent body scroll when modal is open - critical for mobile
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
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
    <div className="fixed inset-0 z-[100] bg-white" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-3 flex-1">
          <img 
            src={logoImage} 
            alt="Ezras Nashim" 
            className="h-5 w-auto"
            style={{ height: '20px', width: 'auto' }}
          />
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h2>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
          style={{ marginLeft: '8px' }}
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Content - using inline styles to ensure scrolling works */}
      <div 
        className={`px-4 py-4 ${className}`}
        style={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0
        }}
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}