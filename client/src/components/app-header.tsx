import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { ChartBar as BarChart3, Info, Share2, Heart, Mail, Share, X } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";
import { useState, useEffect } from "react";
import logoImage from "@assets/6LO_1753613081319.png";
import AddToHomeScreenModal from "./modals/add-to-home-screen-modal";
import MessageModal from "./modals/message-modal";
import { useQuery } from "@tanstack/react-query";
import { getLocalDateString } from "@/lib/dateUtils";


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
  const [hasClickedShare, setHasClickedShare] = useState(false);
  
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
  
  // Check if user has ever clicked the share button
  useEffect(() => {
    const shareClickedKey = 'share-button-clicked';
    setHasClickedShare(localStorage.getItem(shareClickedKey) === 'true');
  }, []);

  useEffect(() => {
    // Detect if iOS device
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  }, []);
  
  const handleOpenMessage = () => {
    setShowMessageModal(true);
    const readKey = `message-read-${today}`;
    localStorage.setItem(readKey, 'true');
    setHasReadMessage(true);
  };


  const handleShareClick = () => {
    // Mark share button as clicked and save to localStorage
    const shareClickedKey = 'share-button-clicked';
    localStorage.setItem(shareClickedKey, 'true');
    setHasClickedShare(true);
    
    // Open the add to home screen modal
    setShowAddToHomeScreen(true);
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
      <header className="bg-gradient-soft p-4 border-0 shadow-none">
        <div className="relative flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => openModal('about', 'about')}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              aria-label="About Ezras Nashim"
            >
              <Info className="h-5 w-5 text-blush" />
            </button>
            <button
              onClick={handleOpenMessage}
              className="p-2 rounded-full hover:bg-white/50 transition-colors relative"
              aria-label="Daily Message"
            >
              <Mail className="h-5 w-5 text-black/70" />
              {!!todayMessage && !hasReadMessage && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blush rounded-full" />
              )}
            </button>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <img
              src={logoImage}
              alt="Ezras Nashim"
              className="h-8 w-auto cursor-pointer select-none"
              onClick={handleLogoClick}
              draggable={false}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleShareClick}
              className={`p-2 rounded-full hover:bg-white/50 transition-colors ${
                !hasClickedShare ? 'animate-pulse border-2 border-blush' : ''
              }`}
              aria-label="Add to Home Screen"
            >
              {isIOS ? (
                <Share className="h-5 w-5 text-black/70" />
              ) : (
                <Share2 className="h-5 w-5 text-black/70" />
              )}
            </button>
            <button
              onClick={() => setLocation("/statistics")}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              aria-label="View Statistics"
            >
              <BarChart3 className="h-5 w-5 text-black/70" />
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
