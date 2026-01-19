import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import { X, Info, Compass } from 'lucide-react';
import logoImage from "@assets/1LO_1755590090315.png";
import { FloatingSettings } from './floating-settings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocation } from 'wouter';
import { MiniCompassModal } from '@/components/modals/mini-compass-modal';
import { ensureSafeAreaVariables } from '@/hooks/use-safe-area';
import { getHebrewFontClass } from '@/lib/hebrewUtils';

// Global counter and state to track active fullscreen modals
// Prevents race conditions when closing one modal while another opens
let activeFullscreenModals = 0;
let savedScrollState: {
  container: HTMLElement | null;
  scrollTop: number;
  originalOverflow: string;
} | null = null;

// Safety function to reset scroll lock state
function resetScrollLockIfNeeded() {
  if (activeFullscreenModals === 0) {
    // Find scroll container
    const scrollContainer = document.querySelector('[data-scroll-lock-target]') as HTMLElement 
      ?? document.querySelector('.content-area') as HTMLElement;
    
    if (scrollContainer) {
      // Restore scroll functionality (overflow only - never touch pointer-events)
      scrollContainer.style.overflow = '';
    }
    
    // Restore body/html  
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    delete (window as any).__fallbackScrollLock;
    
    // Clear saved state
    savedScrollState = null;
  }
}

// Emergency reset function (ignores counter)
function forceResetScrollLock() {
  const scrollContainer = document.querySelector('[data-scroll-lock-target]') as HTMLElement 
    ?? document.querySelector('.content-area') as HTMLElement;
  
  if (scrollContainer) {
    // Restore scroll functionality (overflow only - never touch pointer-events)
    scrollContainer.style.overflow = '';
  }
  
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  delete (window as any).__fallbackScrollLock;
  
  savedScrollState = null;
  activeFullscreenModals = 0;
}

// Conservative cleanup: only reset scroll locks and remove ORPHANED elements
// Does NOT hide legitimate open dialogs - that breaks the UI completely
function forceCloseAllFullscreenModals() {
  console.log('[FullscreenModal] Running conservative cleanup...');
  
  // 1. Reset scroll locks and counter
  forceResetScrollLock();
  
  // 2. Reset pointer-events on major containers only
  document.body.style.pointerEvents = '';
  document.documentElement.style.pointerEvents = '';
  const mainContent = document.querySelector('main');
  if (mainContent) {
    (mainContent as HTMLElement).style.pointerEvents = '';
  }
  
  // 3. Dispatch a custom event that components can listen to for state reset
  window.dispatchEvent(new CustomEvent('webview-resume-recovery'));
  
  console.log('[FullscreenModal] Conservative cleanup complete');
}

// Defensive helper: ensures pointer-events are never stuck
// Called by App.tsx on various events to catch any stuck state
export function ensurePointerEventsUnlocked() {
  // Check for active open dialogs first
  const activeDialogs = document.querySelectorAll('[data-state="open"][role="dialog"]');
  const activePoppers = document.querySelectorAll('[data-radix-popper-content-wrapper] [data-state="open"]');
  const hasActiveDialogs = activeDialogs.length > 0 || activePoppers.length > 0 || activeFullscreenModals > 0;
  
  // If active dialogs exist, be very conservative
  if (hasActiveDialogs) {
    return;
  }
  
  // CONSERVATIVE CLEANUP - only remove elements that are explicitly closed
  
  // 1. Remove CLOSED Radix dialog overlays only
  document.querySelectorAll('[data-radix-dialog-overlay][data-state="closed"]').forEach(overlay => {
    console.log('[PointerEvents] Removing closed Radix dialog overlay');
    overlay.remove();
  });
  
  // 2. Remove Radix popper wrappers that contain closed content
  document.querySelectorAll('[data-radix-popper-content-wrapper]').forEach(popper => {
    const content = popper.querySelector('[data-state]');
    if (content?.getAttribute('data-state') === 'closed') {
      console.log('[PointerEvents] Removing closed Radix popper wrapper');
      popper.remove();
    }
  });
  
  // 3. Remove orphaned Radix focus guards (only when NO open radix components exist)
  const anyRadixOpen = document.querySelector('[data-state="open"]');
  if (!anyRadixOpen) {
    document.querySelectorAll('[data-radix-focus-guard]').forEach(el => {
      console.log('[PointerEvents] Removing orphaned Radix focus guard');
      el.remove();
    });
  }
  
  // 4. Clean up body/html pointer events
  if (document.body.style.pointerEvents === 'none') {
    console.log('[PointerEvents] Unlocking body pointer-events');
    document.body.style.pointerEvents = '';
  }
  
  if (document.documentElement.style.pointerEvents === 'none') {
    console.log('[PointerEvents] Unlocking html pointer-events');
    document.documentElement.style.pointerEvents = '';
  }
  
  // 5. Reset any stuck overflow:hidden on body (scroll lock) - only if no modals open
  if (document.body.style.overflow === 'hidden' && !anyRadixOpen) {
    console.log('[PointerEvents] Resetting body overflow');
    document.body.style.overflow = '';
  }
  
  const mainContent = document.querySelector('main');
  if (mainContent && (mainContent as HTMLElement).style.pointerEvents === 'none') {
    console.log('[PointerEvents] Unlocking main pointer-events');
    (mainContent as HTMLElement).style.pointerEvents = '';
  }
  
  // 6. Reset any stuck focus state that might be blocking events
  // This can help "wake up" React's event system in WebViews
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur?.();
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__forceResetScrollLock = forceResetScrollLock;
  (window as any).__ensurePointerEventsUnlocked = ensurePointerEventsUnlocked;
  
  // Safety net: Reset scroll lock when page becomes visible if no modals are actually mounted
  // This catches cases where modals got stuck during background/foreground transitions
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Small delay to let React reconcile first
      setTimeout(() => {
        // If counter says modals are active but no modal elements exist, reset
        if (activeFullscreenModals > 0) {
          const modalElements = document.querySelectorAll('[data-fullscreen-modal]');
          if (modalElements.length === 0) {
            console.warn('[FullscreenModal] Detected stuck modal counter, resetting scroll lock');
            forceResetScrollLock();
          }
        }
      }, 100);
    }
  });
}

// Export helper functions for external use (e.g., App.tsx visibility handler)
export function isFullscreenModalActive(): boolean {
  return activeFullscreenModals > 0;
}

export { forceResetScrollLock, forceCloseAllFullscreenModals };

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  hideHeader?: boolean;
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
  // Floating element (e.g., navigation arrows) rendered outside scroll container
  floatingElement?: React.ReactNode;
  // Compass button (for prayer modals)
  showCompassButton?: boolean;
}

export function FullscreenModal({ 
  isOpen, 
  onClose, 
  title, 
  hideHeader = false,
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
  showInfoPopover = false,
  floatingElement,
  showCompassButton = false
}: FullscreenModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [showCompass, setShowCompass] = useState(false);
  
  // Track if this modal instance is already closing (prevents double-close from rapid clicks)
  const isClosingRef = useRef(false);
  
  // Reset closing flag when modal opens or when onClose handler changes
  // (onClose changes when content swaps, e.g., individual-tehillim -> special-tehillim)
  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
    }
  }, [isOpen]);
  
  // Also reset when onClose changes (content swap without closing the modal)
  useEffect(() => {
    isClosingRef.current = false;
  }, [onClose]);

  // Simple close handler with double-click protection
  const handleClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    onClose();
  }, [onClose]);
  
  // Handler for logo/home button
  const handleLogoClick = useCallback(() => {
    onClose();
    setLocation('/');
  }, [onClose, setLocation]);

  // Use useLayoutEffect to ensure new modal increments counter before old modal's cleanup runs
  // This prevents race conditions in chained modal scenarios
  useLayoutEffect(() => {
    if (!isOpen) {
      // Safety check: if modal is closed and counter is 0, ensure scroll is unlocked
      resetScrollLockIfNeeded();
      return;
    }

    // Increment the modal counter
    activeFullscreenModals++;

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

    // Note: popstate handling for Android back button is now centralized in useModalHistory hook
    // The hook calls closeModal() which will trigger onClose via modal state change
    
    // Find and lock the scroll container (.content-area) instead of body
    const scrollContainer = document.querySelector('[data-scroll-lock-target]') as HTMLElement 
      ?? document.querySelector('.content-area') as HTMLElement;
    
    if (scrollContainer) {
      // Save the current scroll position and styles (only if this is the first modal)
      if (activeFullscreenModals === 1) {
        savedScrollState = {
          container: scrollContainer,
          scrollTop: scrollContainer.scrollTop,
          originalOverflow: scrollContainer.style.overflow
        };
        
        // Lock the scroll container (overflow only - never touch pointer-events)
        scrollContainer.style.overflow = 'hidden';
      }
      // If activeFullscreenModals > 1, the lock is already in place, don't change anything
    } else {
      // Fallback: lock body if no scroll container found (admin pages, etc.)
      if (activeFullscreenModals === 1) {
        const originalBodyOverflow = document.body.style.overflow;
        const originalHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Store for cleanup
        (window as any).__fallbackScrollLock = {
          bodyOverflow: originalBodyOverflow,
          htmlOverflow: originalHtmlOverflow
        };
      }
    }
    
    // Add escape listener with capture
    document.addEventListener('keydown', handleEscape, true);
    // Add custom close event listener
    window.addEventListener('closeFullscreen', handleCloseFullscreen);

    return () => {
      // Decrement the modal counter
      activeFullscreenModals--;
      
      // Capture current state locally to prevent race conditions
      const capturedState = savedScrollState;
      const capturedFallbackLock = (window as any).__fallbackScrollLock;
      
      // Only restore scroll when no other fullscreen modals are active
      if (activeFullscreenModals === 0) {
        // In web views, do immediate cleanup to prevent stuck pointer-events
        // In browsers, defer to prevent closing gesture from interfering
        const cleanupFn = () => {
          // Re-check counter in case new modal opened
          if (activeFullscreenModals > 0) return;
          
          // Restore scroll container if we locked it
          if (capturedState && capturedState.container) {
            // Restore original overflow style
            capturedState.container.style.overflow = capturedState.originalOverflow;
            
            // Restore scroll position in next frame to avoid gesture interference
            const restoreScroll = () => {
              // Re-check counter again before final restore
              if (activeFullscreenModals > 0) return;
              
              if (capturedState && capturedState.container) {
                capturedState.container.scrollTop = capturedState.scrollTop;
              }
              // Clear the saved state only if still at 0
              if (activeFullscreenModals === 0) {
                savedScrollState = null;
              }
              // Ensure safe-area CSS variables are still applied
              ensureSafeAreaVariables();
            };
            
            if (document.visibilityState !== 'visible') {
              // Immediate restoration when page is hidden
              restoreScroll();
            } else {
              // Deferred restoration when visible to avoid gesture interference
              requestAnimationFrame(restoreScroll);
            }
          } else if (capturedFallbackLock) {
            // Restore fallback body/html lock
            document.body.style.overflow = capturedFallbackLock.bodyOverflow;
            document.documentElement.style.overflow = capturedFallbackLock.htmlOverflow;
            if (activeFullscreenModals === 0) {
              delete (window as any).__fallbackScrollLock;
            }
            
            // Ensure safe-area variables are applied
            if (document.visibilityState !== 'visible') {
              ensureSafeAreaVariables();
            } else {
              requestAnimationFrame(() => {
                if (activeFullscreenModals > 0) return;
                ensureSafeAreaVariables();
              });
            }
          }
        };
        
        // CRITICAL: If page is backgrounded, do immediate cleanup
        // requestAnimationFrame won't execute while page is hidden, causing stuck state
        if (document.visibilityState !== 'visible') {
          // Immediate cleanup when page is hidden
          cleanupFn();
        } else {
          // Deferred cleanup for smooth gesture handling when visible
          requestAnimationFrame(cleanupFn);
        }
      }
      
      document.removeEventListener('keydown', handleEscape, true);
      window.removeEventListener('closeFullscreen', handleCloseFullscreen);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  // Render directly without portal to ensure it works
  return (
    <div 
      data-fullscreen-modal
      data-bridge-container
      className="fixed inset-0 bg-white"
      style={{ 
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        pointerEvents: 'auto',
        // Remove all touch restrictions to allow native browser gestures
        touchAction: 'auto',
        overscrollBehavior: 'auto',
        // WebKit-specific property for Safari
        // @ts-ignore
        WebkitOverscrollBehavior: 'auto'
      }}
      onPointerDown={(e) => {
        // Only stop propagation for clicks directly on the modal background
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      {/* Header */}
      {!hideHeader ? (
        <div 
          className="bg-white border-b border-gray-200 px-4 py-3 cursor-pointer"
          style={{
            flexShrink: 0,
            minHeight: '56px',
            paddingTop: 'max(12px, env(safe-area-inset-top))'
          }}
          onPointerDown={(e) => {
            // Only scroll to top if not clicking any button (close or info)
            if (!(e.target as Element).closest('button')) {
              scrollContainerRef.current?.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogoClick();
                }}
                className="hover:opacity-80 transition-opacity flex-shrink-0"
                aria-label="Go to home"
                type="button"
              >
                <img 
                  src={logoImage} 
                  alt="Ezras Nashim" 
                  className="h-5 w-auto"
                />
              </button>

              {showCompassButton && (
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCompass(true);
                  }}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Open compass"
                  type="button"
                >
                  <Compass className="h-6 w-6 text-blush/70" />
                </button>
              )}
            </div>

            <h1 className={`text-lg font-semibold text-gray-900 text-center flex-1 mx-4 truncate min-w-0 ${title ? getHebrewFontClass(title, 'platypi-semibold') : 'platypi-semibold'}`}>
              {title}
            </h1>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {showInfoIcon && (
                <Popover open={showInfoPopover} onOpenChange={(open) => onInfoClick?.(open)}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Prayer timing information"
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onInfoClick?.(!showInfoPopover);
                      }}
                    >
                      <Info className="h-6 w-6 text-blush/60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs p-3 bg-white border border-blush/20 shadow-lg z-[9999]">
                    {infoContent || <p className="text-xs text-black">Loading timing information...</p>}
                  </PopoverContent>
                </Popover>
              )}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
                }}
                data-testid="button-close-modal"
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close fullscreen"
                type="button"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Compact close button for headerless modals */
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          data-testid="button-close-modal"
          className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-sm z-10"
          style={{ top: 'max(12px, env(safe-area-inset-top))' }}
          aria-label="Close"
          type="button"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      )}

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
          // Add padding bottom using safe-area CSS variable
          paddingBottom: 'calc(var(--safe-bottom-total) + 20px)'
        }}
      >
        <div className={`max-w-4xl mx-auto ${className}`} style={{ paddingBottom: (showFontControls || showLanguageControls) ? '100px' : '0px' }}>
          {typeof children === 'function' 
            ? (children as (params: { language: 'hebrew' | 'english', fontSize: number }) => React.ReactNode)({ language: language || 'hebrew', fontSize: fontSize || 16 }) 
            : children}
        </div>
      </div>

      {/* Floating Settings Button - Outside scrollable content */}
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

      {/* Floating Element (e.g., navigation arrows) - Outside scrollable content */}
      {floatingElement}

      {/* Mini Compass Modal */}
      <MiniCompassModal 
        isOpen={showCompass} 
        onClose={() => setShowCompass(false)} 
      />
    </div>
  );
}

