import { useEffect, useState } from "react";
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
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";

export type Section = 'torah' | 'tefilla' | 'tzedaka' | 'home' | 'table';

export default function Home() {
  const [location, setLocation] = useLocation();
  
  // Initialize geolocation and Jewish times immediately (core app functionality)
  useGeolocation();
  useJewishTimes();
  
  // Track which sections have been mounted for instant switching
  const [mountedSections, setMountedSections] = useState<Set<Section>>(
    new Set<Section>(['home']) // Always mount home on initial load
  );
  
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
  
  // Mount section when it becomes active (lazy mounting)
  useEffect(() => {
    if (!mountedSections.has(activeSection)) {
      setMountedSections(prev => new Set(prev).add(activeSection));
    }
  }, [activeSection, mountedSections]);
  
  // Scroll to top when section changes
  useEffect(() => {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }, [activeSection]);
  
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
    // Lazy mount sections: only mount when first visited, then keep mounted
    // This gives fast initial load + instant switching after first visit
    return (
      <>
        {mountedSections.has('home') && (
          <div style={{ display: activeSection === 'home' ? 'block' : 'none' }}>
            <ErrorBoundary>
              <HomeSection onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </div>
        )}
        {mountedSections.has('torah') && (
          <div style={{ display: activeSection === 'torah' ? 'block' : 'none' }}>
            <ErrorBoundary>
              <TorahSection onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </div>
        )}
        {mountedSections.has('tefilla') && (
          <div style={{ display: activeSection === 'tefilla' ? 'block' : 'none' }}>
            <ErrorBoundary>
              <TefillaSection onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </div>
        )}
        {mountedSections.has('tzedaka') && (
          <div style={{ display: activeSection === 'tzedaka' ? 'block' : 'none' }}>
            <ErrorBoundary>
              <TzedakaSection onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </div>
        )}
        {mountedSections.has('table') && (
          <div style={{ display: activeSection === 'table' ? 'block' : 'none' }}>
            <ErrorBoundary>
              <TableSection />
            </ErrorBoundary>
          </div>
        )}
      </>
    );
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
