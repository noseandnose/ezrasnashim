import { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './button';
import logoImage from "@assets/1LO_1755590090315.png";

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  // Font and Language Controls
  showFontControls?: boolean;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  showLanguageControls?: boolean;
  language?: 'hebrew' | 'english';
  onLanguageChange?: (lang: 'hebrew' | 'english') => void;
}

export function FullscreenModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  showFontControls = false,
  fontSize = 16,
  onFontSizeChange,
  showLanguageControls = false,
  language = 'hebrew',
  onLanguageChange
}: FullscreenModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    
    // Save current scroll position and body styles
    const scrollY = window.scrollY;
    const originalBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      touchAction: document.body.style.touchAction
    };
    
    // Prevent body from scrolling on both desktop and mobile
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    // Also prevent scrolling on the document element for iOS
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    
    // Add escape listener with capture
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      // Restore body styles
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.position = originalBodyStyle.position;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.touchAction = originalBodyStyle.touchAction;
      
      // Restore html overflow
      document.documentElement.style.overflow = originalHtmlOverflow;
      
      // Restore scroll position
      window.scrollTo(0, scrollY);
      
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

  // Render directly without portal to ensure it works
  return (
    <div 
      className="fixed inset-0 bg-white"
      style={{ 
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        isolation: 'isolate',
        pointerEvents: 'auto',
        touchAction: 'none' // Prevent any touch actions on the container
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
      }}
      onTouchStart={(e) => {
        // Prevent default touch behavior except in scrollable area
        if (!scrollContainerRef.current?.contains(e.target as Node)) {
          e.preventDefault();
        }
      }}
    >
      {/* Header */}
      <div 
        className="bg-white border-b border-gray-200 px-4 py-3"
        style={{
          flexShrink: 0,
          minHeight: '56px'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={logoImage} 
              alt="Ezras Nashim" 
              className="h-5 w-auto"
            />
            <h1 className="text-lg font-semibold text-gray-900 truncate text-center flex-1">
              {title}
            </h1>
          </div>
          
          {/* Font and Language Controls */}
          <div className="flex items-center gap-2 mr-4">
            {showLanguageControls && onLanguageChange && (
              <Button
                onClick={() => onLanguageChange(language === "hebrew" ? "english" : "hebrew")}
                variant="ghost"
                size="sm"
                className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
                  language === "hebrew" 
                    ? 'bg-blush text-white' 
                    : 'text-black/60 hover:text-black hover:bg-white/50'
                }`}
              >
                {language === "hebrew" ? 'EN' : 'עב'}
              </Button>
            )}
            
            {showFontControls && onFontSizeChange && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onFontSizeChange(Math.max(fontSize - 2, 12))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <span className="text-xs platypi-medium">-</span>
                </button>
                <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
                <button
                  onClick={() => onFontSizeChange(Math.min(fontSize + 2, 24))}
                  className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
                >
                  <span className="text-xs platypi-medium">+</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close fullscreen"
            type="button"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          // Ensure scrolling works on iOS
          position: 'relative',
          height: '100%'
        }}
        onTouchMove={(e) => {
          // Allow touch scrolling within this container
          e.stopPropagation();
        }}
      >
        <div className={`max-w-4xl mx-auto ${className}`}>
          {typeof children === 'function' ? children({ language, fontSize }) : children}
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