import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { useInstallHighlight } from "@/hooks/use-install-highlight";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Info, Share2, Heart, Share, X, Menu, MessageSquare, Search, Calendar, User, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import logoImage from "@assets/A_project_of_(4)_1764762086237.png";
import AddToHomeScreenModal from "./modals/add-to-home-screen-modal";
import { SearchModal } from "./SearchModal";
import LocationModal from "./modals/location-modal";

// Ultra-simple dropdown - no event listeners, no effects, just state-based rendering
// Testing if ANY complexity in dropdown is causing WebView freeze
function SimpleDropdown({ 
  trigger, 
  children, 
  isOpen, 
  onOpenChange 
}: { 
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="relative">
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!isOpen);
        }}
      >
        {trigger}
      </div>
      {isOpen && (
        <>
          {/* Backdrop to close on tap outside */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          <div 
            className="absolute top-full left-0 mt-1 z-50 min-w-[12rem] overflow-hidden rounded-xl border border-blush/20 bg-white p-1 shadow-lg"
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function SimpleMenuItem({ 
  children, 
  onClick,
  className = "",
  testId
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`w-full flex items-center rounded-lg px-2 py-2 text-sm text-left transition-colors hover:bg-blush/10 active:bg-blush/20 ${className}`}
    >
      {children}
    </button>
  );
}


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
          <div className="flex items-center gap-1 flex-1">
            <SimpleDropdown
              isOpen={menuOpen}
              onOpenChange={setMenuOpen}
              trigger={
                <button
                  className={`flex items-center justify-center rounded-full transition-colors focus:outline-none relative ${
                    (shouldHighlight || (!isLoading && !isAuthenticated)) ? 'animate-pulse border-2 border-blush shadow-lg' : ''
                  }`}
                  aria-label="Menu"
                  data-testid="button-menu"
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
              }
            >
              {!isLoading && !isAuthenticated && (
                <SimpleMenuItem
                  onClick={() => { setMenuOpen(false); setLocation('/login'); }}
                  testId="menu-item-login"
                >
                  <User className="h-5 w-5 mr-2" />
                  Sign Up / Log In
                </SimpleMenuItem>
              )}
              {isAuthenticated && user && (
                <SimpleMenuItem
                  onClick={() => { setMenuOpen(false); setLocation("/profile"); }}
                  testId="menu-item-profile"
                >
                  <User className="h-5 w-5 mr-2" />
                  My Profile
                </SimpleMenuItem>
              )}
              <SimpleMenuItem
                onClick={() => { setMenuOpen(false); setLocation("/statistics"); }}
                testId="menu-item-analytics"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </SimpleMenuItem>
              <SimpleMenuItem
                onClick={() => { setMenuOpen(false); openModal('date-calculator-fullscreen', 'table'); }}
                testId="menu-item-date-converter"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Hebrew Date Converter
              </SimpleMenuItem>
              <SimpleMenuItem
                onClick={() => { setMenuOpen(false); handleShare(); }}
                testId="menu-item-share"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </SimpleMenuItem>
              {!isStandalone && !isWebview && (
                <SimpleMenuItem
                  onClick={() => { setMenuOpen(false); handleInstallClick(); }}
                  className={
                    shouldHighlight 
                      ? 'bg-blush/20 font-bold animate-pulse border-2 border-blush' 
                      : canInstall 
                      ? 'bg-blush/10 font-semibold' 
                      : ''
                  }
                  testId="menu-item-install"
                >
                  {isIOS ? (
                    <Share className="h-5 w-5 mr-2" />
                  ) : (
                    <Share2 className="h-5 w-5 mr-2" />
                  )}
                  Install App
                </SimpleMenuItem>
              )}
              <SimpleMenuItem
                onClick={() => { setMenuOpen(false); window.open('https://tally.so/r/3xqAEy', '_blank'); }}
                testId="menu-item-feedback"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Community Feedback
              </SimpleMenuItem>
              <SimpleMenuItem
                onClick={() => { setMenuOpen(false); setShowLocationModal(true); }}
                testId="menu-item-location"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Change Location
              </SimpleMenuItem>
              <SimpleMenuItem
                onClick={() => { setMenuOpen(false); openModal('about', 'about'); }}
                testId="menu-item-info"
              >
                <Info className="h-5 w-5 mr-2" />
                Info
              </SimpleMenuItem>
            </SimpleDropdown>
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
            <span className="font-hebrew text-[8px] text-black/50 leading-none" dir="rtl">בס״ד</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-center relative">
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
