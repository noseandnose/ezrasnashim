import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minimize2, Maximize2 } from 'lucide-react';
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
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPortalElement(null);
      return;
    }

    // Create a portal container
    const portal = document.createElement('div');
    portal.style.position = 'fixed';
    portal.style.top = '0';
    portal.style.left = '0';
    portal.style.width = '100vw';
    portal.style.height = '100vh';
    portal.style.zIndex = '2147483647';
    portal.style.isolation = 'isolate';
    
    document.body.appendChild(portal);
    setPortalElement(portal);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    
    // Prevent body scroll and save original styles
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height
    };
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    window.addEventListener('keydown', handleEscape, true);

    return () => {
      if (portal && portal.parentNode) {
        portal.parentNode.removeChild(portal);
      }
      
      // Restore original body styles
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.width = originalStyles.width;
      document.body.style.height = originalStyles.height;
      
      window.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen || !portalElement) return null;

  const modalContent = (
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        isolation: 'isolate'
      }}
      onClick={(e) => e.stopPropagation()}
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
          minHeight: '56px',
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
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

      {/* Scrollable Content Container */}
      <div 
        style={{ 
          position: 'relative',
          flex: '1',
          minHeight: 0,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'scrollbar',
          scrollbarWidth: 'auto'
        }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ maxWidth: '56rem', margin: '0 auto' }} className={className}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalElement);
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