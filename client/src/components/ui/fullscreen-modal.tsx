import { useEffect, useRef } from 'react';
import { X, Info } from 'lucide-react';
import logoImage from "@assets/1LO_1755590090315.png";
import { FloatingSettings } from './floating-settings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  // Info icon  
  showInfoIcon?: boolean;
  onInfoClick?: (open: boolean) => void;
  // Info popover content
  infoContent?: React.ReactNode;
  showInfoPopover?: boolean;
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
  onLanguageChange,
  showInfoIcon = false,
  onInfoClick,
  infoContent,
  showInfoPopover = false
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

    // Try to handle native browser back gesture by listening for popstate
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      onClose();
    };

    // Add popstate listener to catch browser back gestures
    window.addEventListener('popstate', handlePopState, true);
    
    // Save current scroll position and body styles
    const scrollY = window.scrollY;
    const originalBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      touchAction: document.body.style.touchAction,
      overscrollBehavior: document.body.style.overscrollBehavior,
      webkitOverscrollBehavior: (document.body.style as any).webkitOverscrollBehavior
    };
    
    // Try minimal body style changes to avoid interfering with gestures
    document.body.style.overflow = 'hidden';
    // Don't fix the body position - this might be interfering with gesture detection
    // document.body.style.position = 'fixed';
    // document.body.style.top = `-${scrollY}px`;
    document.body.style.touchAction = 'auto';
    document.body.style.overscrollBehavior = 'auto';
    // @ts-ignore - WebKit specific property
    document.body.style.webkitOverscrollBehavior = 'auto';
    
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
      document.body.style.overscrollBehavior = originalBodyStyle.overscrollBehavior;
      // @ts-ignore - WebKit specific property
      document.body.style.webkitOverscrollBehavior = originalBodyStyle.webkitOverscrollBehavior;
      
      // Restore html overflow
      document.documentElement.style.overflow = originalHtmlOverflow;
      
      // Only restore scroll position if we actually saved it
      if (typeof scrollY === 'number') {
        window.scrollTo(0, scrollY);
      }
      
      document.removeEventListener('keydown', handleEscape, true);
      window.removeEventListener('closeFullscreen', handleCloseFullscreen);
      window.removeEventListener('popstate', handlePopState, true);
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
        // Remove all touch restrictions to allow native browser gestures
        touchAction: 'auto',
        overscrollBehavior: 'auto',
        // WebKit-specific property for Safari
        // @ts-ignore
        WebkitOverscrollBehavior: 'auto'
      }}
      onClick={(e) => {
        // Only stop propagation for clicks directly on the modal background
        if (e.target === e.currentTarget) {
          e.stopPropagation();
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
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Ezras Nashim" 
              className="h-5 w-auto"
            />
          </div>

          <h1 className="text-lg font-semibold text-gray-900 text-center flex-1 mx-4">
            {title}
          </h1>
          
          <div className="flex items-center gap-2">
            {showInfoIcon && (
              <Popover open={showInfoPopover} onOpenChange={(open) => onInfoClick?.(open)}>
                <PopoverTrigger asChild>
                  <button
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Prayer timing information"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Info className="h-5 w-5 text-blush/60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs p-3 bg-white border border-blush/20 shadow-lg z-[9999]">
                  {infoContent || <p className="text-xs text-black">Loading timing information...</p>}
                </PopoverContent>
              </Popover>
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
      >
        <div className={`max-w-4xl mx-auto ${className}`} style={{ paddingBottom: '100px' }}>
          {typeof children === 'function' 
            ? (children as (params: { language: 'hebrew' | 'english', fontSize: number }) => React.ReactNode)({ language: language || 'hebrew', fontSize: fontSize || 16 }) 
            : children}
        </div>
        
        {/* Floating Settings Button */}
        {(showFontControls || showLanguageControls) && (
          <FloatingSettings
            showFontControls={showFontControls}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
            showLanguageControls={showLanguageControls}
            language={language}
            onLanguageChange={onLanguageChange}
          />
        )}
      </div>
    </div>
  );
}

