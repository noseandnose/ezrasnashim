import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import HomeSection from "@/components/sections/home-section";
import TorahSection from "@/components/sections/torah-section";
import TefillaSection from "@/components/sections/tefilla-section";
import TzedakaSection from "@/components/sections/tzedaka-section";
import TableSection from "@/components/sections/table-section";
import ShopSection from "@/components/sections/shop-section";
import ModalContainer from "@/components/modals/modal-container";

export type Section = 'torah' | 'tefilla' | 'tzedaka' | 'home' | 'table';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [location] = useLocation();

  // Check for section parameter in URL and set active section
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section') as Section;
    const scrollToProgress = urlParams.get('scrollToProgress') === 'true';
    
    if (sectionParam && ['torah', 'tefilla', 'tzedaka', 'home', 'table'].includes(sectionParam)) {
      setActiveSection(sectionParam);
      
      // If scrollToProgress is requested and we're on home, scroll to progress section
      if (sectionParam === 'home' && scrollToProgress) {
        setTimeout(() => {
          const progressElement = document.getElementById('daily-progress-garden');
          if (progressElement) {
            progressElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 100); // Small delay to ensure DOM is ready
      }
      
      // Clean the URL by removing the parameters
      window.history.replaceState({}, '', '/');
    }
  }, [location]);

  // Listen for custom navigation events from modal closures
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section, openFullscreen, content } = event.detail;
      if (['torah', 'tefilla', 'tzedaka', 'home', 'table'].includes(section)) {
        setActiveSection(section);
        
        // If openFullscreen is specified, dispatch the openDirectFullscreen event
        if (openFullscreen && content) {
          setTimeout(() => {
            const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
              detail: {
                modalKey: openFullscreen,
                content: content
              }
            });
            window.dispatchEvent(fullscreenEvent);
          }, 100); // Small delay to ensure section is rendered
        }
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);
    
    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, []);

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
    </div>
  );
}
