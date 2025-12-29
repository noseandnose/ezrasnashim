import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { useInstallHighlight } from "@/hooks/use-install-highlight";
import { useHomeSummary } from "@/hooks/use-home-summary";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Info, Share2, Heart, Mail, Share, X, Menu, MessageSquare, Search, Calendar, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";
import { useState, useEffect } from "react";
import logoImage from "@assets/A_project_of_(4)_1764762086237.png";
import AddToHomeScreenModal from "./modals/add-to-home-screen-modal";
import { SearchModal } from "./SearchModal";
import { getLocalDateString } from "@/lib/dateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function AppHeader() {
  useJewishTimes();
  useHebrewDate();
  const [, setLocation] = useLocation();
  const { openModal } = useModalStore();
  const { user, isAuthenticated, logout } = useAuth();
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hasReadMessage, setHasReadMessage] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Use install highlight hook for PWA installation guidance
  const {
    shouldHighlight,
    markDismissed,
    isStandalone,
    canInstall,
    isIOS,
    isWebview,
  } = useInstallHighlight();
  
  const today = getLocalDateString();
  
  // Use batched home summary for better performance
  const { data: homeSummary } = useHomeSummary();
  const todayMessage = homeSummary?.message;
  
  // Check if user has read today's message
  useEffect(() => {
    const readKey = `message-read-${today}`;
    setHasReadMessage(localStorage.getItem(readKey) === 'true');
  }, [today]);
  

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors focus:outline-none relative ${
                    shouldHighlight ? 'animate-pulse border-2 border-blush shadow-lg' : ''
                  }`}
                  aria-label="Menu"
                  data-testid="button-menu"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                  }}
                >
                  <Menu className="h-5 w-5 text-black/70" />
                  {!!todayMessage && !hasReadMessage && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blush rounded-full" data-testid="indicator-unread-menu" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/statistics")}
                  className="cursor-pointer"
                  data-testid="menu-item-analytics"
                  data-action="menu-analytics"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openModal('about', 'about')}
                  className="cursor-pointer"
                  data-testid="menu-item-info"
                  data-action="menu-info"
                >
                  <Info className="h-5 w-5 mr-2" />
                  Info
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openModal('date-calculator-fullscreen', 'table')}
                  className="cursor-pointer"
                  data-testid="menu-item-date-converter"
                  data-action="menu-date-converter"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Hebrew Date Converter
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleShare}
                  className="cursor-pointer"
                  data-testid="menu-item-share"
                  data-action="menu-share"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </DropdownMenuItem>
                {!isStandalone && !isWebview && (
                  <DropdownMenuItem
                    onClick={handleInstallClick}
                    className={`cursor-pointer ${
                      shouldHighlight 
                        ? 'bg-blush/20 font-bold animate-pulse border-2 border-blush' 
                        : canInstall 
                        ? 'bg-blush/10 font-semibold' 
                        : ''
                    }`}
                    data-testid="menu-item-install"
                    data-action="menu-install"
                  >
                    {isIOS ? (
                      <Share className="h-5 w-5 mr-2" />
                    ) : (
                      <Share2 className="h-5 w-5 mr-2" />
                    )}
                    Install App
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => window.open('https://tally.so/r/3xqAEy', '_blank')}
                  className="cursor-pointer"
                  data-testid="menu-item-feedback"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Community Feedback
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation('/feed')}
                  className="cursor-pointer relative"
                  data-testid="menu-item-feed"
                  data-action="menu-feed"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Feed
                  {!!todayMessage && !hasReadMessage && (
                    <span className="ml-auto w-2 h-2 bg-blush rounded-full" />
                  )}
                </DropdownMenuItem>
{/* Hidden until ready to launch - Create Profile feature
                {!authLoading && !isAuthenticated && (
                  <DropdownMenuItem
                    onClick={() => setLocation('/login')}
                    className="cursor-pointer"
                    data-testid="menu-item-login"
                    data-action="menu-login"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Create Profile
                  </DropdownMenuItem>
                )}
*/}
                {isAuthenticated && user && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setLocation("/profile")}
                      className="cursor-pointer"
                      data-testid="menu-item-profile"
                      data-action="menu-profile"
                    >
                      <User className="h-5 w-5 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer"
                      data-testid="menu-item-logout"
                      data-action="menu-logout"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
          <div className="flex items-center gap-1 flex-1 justify-end">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              aria-label="Search"
              data-testid="button-search"
              data-action="header-search"
              style={{
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
