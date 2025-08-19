import { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Create a fullscreen container that blocks everything
    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.id = 'fullscreen-modal-container';
    fullscreenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      background: white;
      pointer-events: all;
    `;
    
    document.body.appendChild(fullscreenContainer);
    
    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      const container = document.getElementById('fullscreen-modal-container');
      if (container) {
        document.body.removeChild(container);
      }
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape, true);
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

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Blocking Overlay */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2147483646,
          pointerEvents: 'all'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* Modal Content */}
      <div 
        ref={containerRef}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          pointerEvents: 'all'
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
              cursor: 'pointer'
            }}
            aria-label="Close fullscreen"
          >
            <X style={{ height: '20px', width: '20px', color: '#4b5563' }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          style={{ 
            flex: '1 1 auto',
            overflow: 'auto',
            padding: '16px',
            height: '100%',
            pointerEvents: 'all'
          }}
          onScroll={(e) => e.stopPropagation()}
        >
          <div style={{ maxWidth: '56rem', margin: '0 auto' }} className={className}>
            {children}
          </div>
        </div>
      </div>
    </>
  );

  // Render to portal
  const portalContainer = document.getElementById('fullscreen-modal-container');
  if (portalContainer) {
    return createPortal(modalContent, portalContainer);
  }
  
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