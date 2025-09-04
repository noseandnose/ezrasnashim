import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import logoImage from "@assets/1LO_1755590090315.png";

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode | ((params: { language: 'hebrew' | 'english', fontSize: number }) => React.ReactNode);
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

    // Handle custom close event
    const handleCloseFullscreen = () => {
      onClose();
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
    // Add custom close event listener
    window.addEventListener('closeFullscreen', handleCloseFullscreen);

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
      window.removeEventListener('closeFullscreen', handleCloseFullscreen);
    };
  }, [isOpen, onClose]);


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
        // Only prevent touch defaults for very specific cases to avoid interfering with navigation gestures
        // We only want to prevent when it's a direct click on the modal background itself
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Header */}
      <div 
        className="bg-white border-b border-gray-200 px-4 py-3 cursor-pointer"
        style={{
          flexShrink: 0,
          minHeight: '56px'
        }}
        onClick={(e) => {
          // Only scroll to top if not clicking the close button
          if (!(e.target as Element).closest('button[aria-label="Close fullscreen"]')) {
            scrollContainerRef.current?.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Ezras Nashim" 
              className="h-5 w-auto"
            />
            
            {/* Language Selector */}
            {showLanguageControls && onLanguageChange && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLanguageChange('hebrew');
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'hebrew' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  עב
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLanguageChange('english');
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'english' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
              </div>
            )}
          </div>

          <h1 className="text-lg font-semibold text-gray-900 truncate text-center flex-1 mx-4">
            {title}
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            {showFontControls && onFontSizeChange && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFontSizeChange(Math.max(12, (fontSize || 16) - 2));
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
                  aria-label="Decrease font size"
                >
                  A-
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFontSizeChange(Math.min(28, (fontSize || 16) + 2));
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
                  aria-label="Increase font size"
                >
                  A+
                </button>
              </div>
            )}
            
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
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          // Ensure scrolling works on iOS and prevent bounce
          position: 'relative',
          height: '100%',
          // Fix iOS Safari scroll bounce issues
          overscrollBehaviorY: 'contain',
          // Add extra padding bottom for iOS safe area
          paddingBottom: 'env(safe-area-inset-bottom, 20px)'
        }}
        onTouchMove={(e) => {
          // Allow touch scrolling within this container
          e.stopPropagation();
        }}
      >
        <div className={`max-w-4xl mx-auto ${className}`} style={{ paddingBottom: '100px' }}>
          {typeof children === 'function' 
            ? (children as (params: { language: 'hebrew' | 'english', fontSize: number }) => React.ReactNode)({ language: language || 'hebrew', fontSize: fontSize || 16 }) 
            : children}
        </div>
      </div>
    </div>
  );
}

