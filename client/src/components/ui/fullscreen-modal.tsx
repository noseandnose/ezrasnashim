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
      style={{ 
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'white'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: '40px 1fr 40px',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10
        }}
      >
        <img 
          src={logoImage} 
          alt="Ezras Nashim" 
          style={{ height: '20px', width: 'auto' }}
        />
        <h2 style={{ 
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close"
          type="button"
        >
          <X style={{ height: '20px', width: '20px', color: '#4b5563' }} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div 
        style={{ 
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px'
        }}
      >
        <div style={{ maxWidth: '56rem', margin: '0 auto' }} className={className}>
          {children}
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