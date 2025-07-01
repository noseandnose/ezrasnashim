import { useState, useEffect } from "react";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import HomeSection from "@/components/sections/home-section";
import TorahSection from "@/components/sections/torah-section";
import TefillaSection from "@/components/sections/tefilla-section";
import TzedakaSection from "@/components/sections/tzedaka-section";
import TableSection from "@/components/sections/table-section";
import ShopSection from "@/components/sections/shop-section";
import ModalContainer from "@/components/modals/modal-container";
// GAMIFICATION TEST - Can be easily removed
import DailyProgress from "@/components/gamification/daily-progress";
import InstantRewards from "@/components/gamification/instant-rewards";
import CompletionCelebration from "@/components/gamification/completion-celebration";
import { useDailyCompletionStore } from "@/lib/types";

export type Section = 'torah' | 'tefilla' | 'tzedaka' | 'home' | 'table';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const { setGamificationCallbacks } = useDailyCompletionStore();
  
  // GAMIFICATION TEST - State management for rewards and celebrations
  const [showRewards, setShowRewards] = useState<'torah' | 'tefilla' | 'tzedaka' | null>(null);
  const [showCelebration, setShowCelebration] = useState<'torah' | 'tefilla' | 'tzedaka' | null>(null);
  
  // GAMIFICATION TEST - Set up gamification callbacks
  useEffect(() => {
    if (setGamificationCallbacks) {
      setGamificationCallbacks({
        onTaskComplete: (task: 'torah' | 'tefilla' | 'tzedaka') => {
          // Show instant rewards first
          setShowRewards(task);
          
          // Show celebration after a short delay
          setTimeout(() => {
            setShowCelebration(task);
          }, 1500);
        }
      });
    }
  }, [setGamificationCallbacks]);

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeSection onSectionChange={setActiveSection} />;
      case 'torah':
        return <TorahSection onSectionChange={setActiveSection} />;
      case 'tefilla':
        return <TefillaSection onSectionChange={setActiveSection} />;
      case 'tzedaka':
        return <TzedakaSection onSectionChange={setActiveSection} />;
      case 'table':
        return <TableSection />;
      default:
        return <HomeSection onSectionChange={setActiveSection} />;
    }
  };

  return (
    <div className="mobile-app min-h-screen max-w-md mx-auto bg-white shadow-2xl relative">
      <AppHeader />
      
      <main className="content-area overflow-y-auto overflow-x-hidden">
        {renderSection()}
      </main>

      <BottomNavigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />

      <ModalContainer onSectionChange={setActiveSection} />
      
      {/* GAMIFICATION TEST - Can be easily removed by deleting these components */}
      {/* Daily Progress Tracker - only show on home page */}
      {activeSection === 'home' && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <DailyProgress />
        </div>
      )}
      
      {/* Instant Rewards */}
      {showRewards && (
        <InstantRewards
          taskType={showRewards}
          onClaim={() => setShowRewards(null)}
        />
      )}
      
      {/* Completion Celebrations */}
      {showCelebration && (
        <CompletionCelebration
          taskType={showCelebration}
          trigger={Boolean(showCelebration)}
          onComplete={() => setShowCelebration(null)}
        />
      )}
    </div>
  );
}
