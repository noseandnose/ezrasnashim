import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll and add event listener
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
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

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const modalContent = (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}
    >
      {/* Header */}
      <div 
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <img 
            src={logoImage} 
            alt="Ezras Nashim" 
            style={{ height: '20px', width: 'auto' }}
          />
          <h1 style={{ 
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#111827',
            textAlign: 'center',
            flex: 1,
            margin: 0
          }}>
            {title}
          </h1>
        </div>
        <button
          onClick={handleCloseClick}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close fullscreen"
        >
          <X style={{ height: '20px', width: '20px', color: '#4b5563' }} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div 
        style={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ maxWidth: '56rem', margin: '0 auto' }} className={className}>
          {children}
        </div>
      </div>
    </div>
  );

  // Use React Portal to render outside normal DOM hierarchy
  return createPortal(modalContent, document.body);
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