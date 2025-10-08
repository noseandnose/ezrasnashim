import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { BarChart3, Info, Share2, Heart, Mail, Share, X, Menu } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";
import { useState, useEffect, useRef } from "react";
import logoImage from "@assets/6LO_1753613081319.png";
import AddToHomeScreenModal from "./modals/add-to-home-screen-modal";
import MessageModal from "./modals/message-modal";
import { useQuery } from "@tanstack/react-query";
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
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasReadMessage, setHasReadMessage] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<any>(null);
  
  const today = getLocalDateString();
  
  // Check if there's a message for today
  const { data: todayMessage } = useQuery({
    queryKey: [`/api/messages/${today}`],
    retry: false,
  });
  
  // Check if user has read today's message
  useEffect(() => {
    const readKey = `message-read-${today}`;
    setHasReadMessage(localStorage.getItem(readKey) === 'true');
  }, [today]);

  useEffect(() => {
    // Detect if iOS device
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    
    // Detect if app is running in standalone mode (already installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
  }, []);
  
  // Listen for beforeinstallprompt event (Android)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPromptRef.current = e;
      // Update UI to show install button
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleOpenMessage = () => {
    setShowMessageModal(true);
    const readKey = `message-read-${today}`;
    localStorage.setItem(readKey, 'true');
    setHasReadMessage(true);
  };

  const handleInstallClick = async () => {
    // If app is already installed, don't show prompt
    if (isStandalone) {
      return;
    }
    
    // Try native install prompt first (works on Android)
    if (deferredPromptRef.current) {
      const promptEvent = deferredPromptRef.current;
      // Show the install prompt
      promptEvent.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await promptEvent.userChoice;
      
      if (outcome === 'accepted') {
        // User accepted the install prompt
        deferredPromptRef.current = null;
        setCanInstall(false);
      }
    } else {
      // Fallback: Show manual instructions (iOS or browser without support)
      setShowAddToHomeScreen(true);
    }
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
      <header className="bg-gradient-soft p-3 border-0 shadow-none" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center px-2">
          <div className="flex items-center gap-1 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                  aria-label="Menu"
                  data-testid="button-menu"
                >
                  <Menu className="h-5 w-5 text-black/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/statistics")}
                  className="cursor-pointer"
                  data-testid="menu-item-analytics"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openModal('about', 'about')}
                  className="cursor-pointer"
                  data-testid="menu-item-info"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Info
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleShare}
                  className="cursor-pointer"
                  data-testid="menu-item-share"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {!isStandalone && (
                  <DropdownMenuItem
                    onClick={handleInstallClick}
                    className={`cursor-pointer ${
                      canInstall ? 'bg-blush/10 font-semibold' : ''
                    }`}
                    data-testid="menu-item-install"
                  >
                    {isIOS ? (
                      <Share className="h-4 w-4 mr-2" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    Install App
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-shrink-0">
            <img 
              src={logoImage} 
              alt="Ezras Nashim" 
              className="h-7 w-auto cursor-pointer select-none"
              onClick={handleLogoClick}
              draggable={false}
            />
          </div>
          <div className="flex items-center gap-1 flex-1 justify-end">
            <button
              onClick={handleOpenMessage}
              className="p-2 rounded-full hover:bg-white/50 transition-colors relative"
              aria-label="Daily Message"
              data-testid="button-message"
            >
              <Mail className="h-5 w-5 text-black/70" />
              {!!todayMessage && !hasReadMessage && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blush rounded-full" data-testid="indicator-unread-message" />
              )}
            </button>
          </div>
        </div>
      </header>
      
      <AddToHomeScreenModal 
        isOpen={showAddToHomeScreen}
        onClose={() => setShowAddToHomeScreen(false)}
      />
      
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        date={today}
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
              <X className="h-5 w-5 text-gray-500" />
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
