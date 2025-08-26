import { useEffect } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import HomeSection from "@/components/sections/home-section";
import TorahSection from "@/components/sections/torah-section";
import TefillaSection from "@/components/sections/tefilla-section";
import TzedakaSection from "@/components/sections/tzedaka-section";
import TableSection from "@/components/sections/table-section";
import ModalContainer from "@/components/modals/modal-container";

export type Section = 'torah' | 'tefilla' | 'tzedaka' | 'home' | 'table';

export default function Home() {
  const [location, setLocation] = useLocation();
  
  // Determine active section from URL path
  const getActiveSectionFromPath = (path: string): Section => {
    switch (path) {
      case '/torah':
        return 'torah';
      case '/tefilla':
        return 'tefilla';
      case '/tzedaka':
        return 'tzedaka';
      case '/table':
        return 'table';
      default:
        return 'home';
    }
  };

  const activeSection = getActiveSectionFromPath(location);
  
  // Navigation function to handle section changes
  const navigateToSection = (section: Section) => {
    if (section === 'home') {
      setLocation('/');
    } else {
      setLocation(`/${section}`);
    }
  };

  // Check for query parameters for special functionality
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollToProgress = urlParams.get('scrollToProgress') === 'true';
    
    // If scrollToProgress is requested and we're on home, scroll to progress section
    if (activeSection === 'home' && scrollToProgress) {
      setTimeout(() => {
        const progressElement = document.getElementById('daily-progress-garden');
        if (progressElement) {
          progressElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100); // Small delay to ensure DOM is ready
      
      // Clean the URL by removing the parameters while keeping the path
      window.history.replaceState({}, '', location);
    }
  }, [location, activeSection]);

  // Listen for custom navigation events from modal closures
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail;
      if (['torah', 'tefilla', 'tzedaka', 'home', 'table'].includes(section)) {
        navigateToSection(section);
      }
    };

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener);
    
    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener);
    };
  }, [navigateToSection]);

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HomeSection onSectionChange={navigateToSection} />;
      case 'torah':
        return <TorahSection onSectionChange={navigateToSection} />;
      case 'tefilla':
        return <TefillaSection onSectionChange={navigateToSection} />;
      case 'tzedaka':
        return <TzedakaSection onSectionChange={navigateToSection} />;
      case 'table':
        return <TableSection />;
      default:
        return <HomeSection onSectionChange={navigateToSection} />;
    }
  };

  return (
    <div className="mobile-app bg-white">
      <AppHeader />
      
      <main className="content-area">
        {renderSection()}
      </main>

      <BottomNavigation 
        activeSection={activeSection} 
        onSectionChange={navigateToSection} 
      />

      <ModalContainer onSectionChange={navigateToSection} />
    </div>
  );
}
