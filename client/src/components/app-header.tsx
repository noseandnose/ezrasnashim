import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { BarChart3, Info, Share2, Share, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";
import { useState, useEffect } from "react";
import logoImage from "@assets/6LO_1753613081319.png";
import AddToHomeScreenModal from "./modals/add-to-home-screen-modal";
import MessageModal from "./modals/message-modal";
import { useQuery } from "@tanstack/react-query";


export default function AppHeader() {
  const { data: times, isLoading: timesLoading } = useJewishTimes();
  const { data: hebrewDate, isLoading: dateLoading } = useHebrewDate();
  const [, setLocation] = useLocation();
  const { openModal } = useModalStore();
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hasReadMessage, setHasReadMessage] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
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
  }, []);
  
  const handleOpenMessage = () => {
    setShowMessageModal(true);
    const readKey = `message-read-${today}`;
    localStorage.setItem(readKey, 'true');
    setHasReadMessage(true);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      <header className="bg-gradient-soft p-3 border-0 shadow-none">
        <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
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
            {todayMessage && !hasReadMessage && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blush rounded-full" />
            )}
          </button>
        </div>
        <img 
          src={logoImage} 
          alt="Ezras Nashim" 
          className="h-7 w-auto"
        />
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowAddToHomeScreen(true)}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
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
    </>
  );
}
