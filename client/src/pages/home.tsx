import { useEffect } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import ModalContainer from "@/components/modals/modal-container";
import ErrorBoundary from "@/components/ui/error-boundary";
import HomeSection from "@/components/sections/home-section";
import TorahSection from "@/components/sections/torah-section";
import TefillaSection from "@/components/sections/tefilla-section";
import TzedakaSection from "@/components/sections/tzedaka-section";
import TableSection from "@/components/sections/table-section";

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
      case '/life':
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
    } else if (section === 'table') {
      setLocation('/life');
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
    // Only render the active section to prevent unnecessary API calls
    // Each section will load its own data when rendered
    switch (activeSection) {
      case 'home':
        return (
          <ErrorBoundary>
            <HomeSection key="home" onSectionChange={navigateToSection} />
          </ErrorBoundary>
        );
      case 'torah':
        return (
          <ErrorBoundary>
            <TorahSection key="torah" onSectionChange={navigateToSection} />
          </ErrorBoundary>
        );
      case 'tefilla':
        return (
          <ErrorBoundary>
            <TefillaSection key="tefilla" onSectionChange={navigateToSection} />
          </ErrorBoundary>
        );
      case 'tzedaka':
        return (
          <ErrorBoundary>
            <TzedakaSection key="tzedaka" onSectionChange={navigateToSection} />
          </ErrorBoundary>
        );
      case 'table':
        return (
          <ErrorBoundary>
            <TableSection key="table" />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <HomeSection key="home-default" onSectionChange={navigateToSection} />
          </ErrorBoundary>
        );
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
