import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { useInstallHighlight } from "@/hooks/use-install-highlight";
import { useAuth } from "@/hooks/use-auth";
import { useBackButtonHistory } from "@/hooks/use-back-button-history";
import { BarChart3, Info, Share2, Heart, Share, X, Menu, MessageSquare, Search, Calendar, User, MapPin, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import logoImage from "@assets/A_project_of_(4)_1764762086237.png";
import AddToHomeScreenModal from "./modals/add-to-home-screen-modal";
import { SearchModal } from "./SearchModal";
import LocationModal from "./modals/location-modal";


export default function AppHeader() {
  useJewishTimes();
  useHebrewDate();
  const [, setLocation] = useLocation();
  const { openModal } = useModalStore();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Register hamburger menu with back button history for Android WebView support
  // Note: Other modals (SearchModal, LocationModal, AddToHomeScreenModal) register themselves
  useBackButtonHistory({ id: 'hamburger-menu', isOpen: menuOpen, onClose: () => setMenuOpen(false) });
  
  // Close menu when clicking outside - using pointerdown for WebView compatibility
  useEffect(() => {
    if (!menuOpen) return;
    
    const handleOutsideClick = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    // Use pointerdown for WebView compatibility
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [menuOpen]);
  
  // Close menu on visibility change (when returning from background)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
  
  // Use install highlight hook for PWA installation guidance
  const {
    shouldHighlight,
    markDismissed,
    isStandalone,
    canInstall,
    isIOS,
    isWebview,
  } = useInstallHighlight();

  const handleInstallClick = () => {
    // User has engaged with install - dismiss the highlight
    markDismissed();
    
    // Redirect to the app download page
    window.open('https://onelink.to/e93hq9', '_blank');
  };
  
  const handleShare = async () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ezras Nashim',
          text: 'Check out Ezras Nashim - Daily Jewish spiritual app for women',
          url: window.location.origin,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
  
  const handleLogoClick = () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    
    // Reset if more than 2 seconds since last click
    if (timeSinceLastClick > 2000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(now);
    
    // Show easter egg after 5 consecutive quick clicks
    if (clickCount >= 4) { // 4 because we're about to increment to 5
      setShowEasterEgg(true);
      setClickCount(0); // Reset counter
    }
  };

  return (
    <>
      <header 
        className="header-extended relative px-3 border-0 z-40" 
        data-bridge-container 
        style={{ 
          paddingTop: `calc(var(--safe-area-top) + 0.625rem)`, 
          paddingBottom: '0.625rem',
          minHeight: 'var(--header-total-height)',
          background: 'transparent'
        }}
      >
        <div className="flex items-center px-2" style={{ minHeight: 'var(--header-row-height)' }}>
          <div className="flex items-center gap-1 flex-1 relative" ref={menuRef}>
            <button
              ref={buttonRef}
              className={`flex items-center justify-center rounded-full transition-colors focus:outline-none relative ${
                (shouldHighlight || (!isLoading && !isAuthenticated)) ? 'animate-pulse border-2 border-blush shadow-lg' : ''
              }`}
              aria-label="Menu"
              data-testid="button-menu"
              onClick={(e) => {
                e.stopPropagation();
                if (!menuOpen && buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();
                  setMenuPosition({ top: rect.bottom + 4, left: rect.left });
                }
                setMenuOpen(!menuOpen);
              }}
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                minHeight: '36px',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <Menu className="h-5 w-5 text-black/70" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center" style={{ height: 'var(--header-row-height)' }}>
            <img 
              src={logoImage} 
              alt="Ezras Nashim" 
              className="w-auto cursor-pointer select-none"
              style={{ height: 'calc(var(--header-row-height) - 10px)', marginTop: '5px', marginBottom: '5px' }}
              onClick={handleLogoClick}
              draggable={false}
            />
          </div>
          <div className="flex flex-col items-end flex-1">
            <span className="font-hebrew text-[0.5rem] text-black/50 leading-none" dir="rtl">בס״ד</span>
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center justify-center rounded-full transition-colors"
              aria-label="Search"
              data-testid="button-search"
              data-action="header-search"
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                minHeight: '36px',
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <Search className="h-5 w-5 text-black/70" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Portal-rendered menu for proper z-index stacking */}
      {menuOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed w-48 rounded-xl border border-blush/20 bg-white p-1 shadow-lg"
          style={{ 
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 99999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!isLoading && !isAuthenticated && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setLocation('/login');
              }}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
              data-testid="menu-item-login"
            >
              <User className="h-5 w-5 mr-2" />
              Sign Up / Log In
            </div>
          )}
          {isAuthenticated && user && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setLocation("/profile");
              }}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
              data-testid="menu-item-profile"
            >
              <User className="h-5 w-5 mr-2" />
              My Profile
            </div>
          )}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setLocation("/statistics");
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-analytics"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              openModal('date-calculator-fullscreen', 'table');
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-date-converter"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Hebrew Date Converter
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              handleShare();
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-share"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </div>
          {!isStandalone && !isWebview && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                handleInstallClick();
              }}
              className={`relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20 ${
                shouldHighlight 
                  ? 'bg-blush/20 font-bold animate-pulse border-2 border-blush' 
                  : canInstall 
                  ? 'bg-blush/10 font-semibold' 
                  : ''
              }`}
              data-testid="menu-item-install"
            >
              {isIOS ? (
                <Share className="h-5 w-5 mr-2" />
              ) : (
                <Share2 className="h-5 w-5 mr-2" />
              )}
              Install App
            </div>
          )}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              window.open('https://tally.so/r/3xqAEy', '_blank');
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-feedback"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Community Feedback
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              window.open('https://chat.whatsapp.com/KgPtWtTSd77CUdXNk1TRj0?mode=gi_t', '_blank');
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-community"
          >
            <Users className="h-5 w-5 mr-2" />
            Community
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setShowLocationModal(true);
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-location"
          >
            <MapPin className="h-5 w-5 mr-2" />
            Change Location
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              openModal('about', 'about');
            }}
            className="relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm transition-colors hover:bg-blush/10 active:bg-blush/20"
            data-testid="menu-item-info"
          >
            <Info className="h-5 w-5 mr-2" />
            Info
          </div>
        </div>,
        document.body
      )}
      
      <AddToHomeScreenModal 
        isOpen={showAddToHomeScreen}
        onClose={() => setShowAddToHomeScreen(false)}
      />
      
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
      
      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={() => setShowEasterEgg(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEasterEgg(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
            
            <div className="flex justify-center mb-4">
              <Heart className="h-12 w-12 text-rose-500 animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl platypi-bold text-black">
                A Special Message
              </h3>
              
              <p className="text-lg platypi-medium text-black leading-relaxed">
                "To Heasy and Brosi, it was all for you. Its always been all for you."
              </p>
              
              <div className="flex justify-center mt-6">
                <Heart className="h-6 w-6 text-rose-400 mx-1" />
                <Heart className="h-6 w-6 text-rose-500 mx-1" />
                <Heart className="h-6 w-6 text-rose-600 mx-1" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
