import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import ModalContainer from "@/components/modals/modal-container";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Loader2 } from "lucide-react";

// Lazy load section components for better performance
const HomeSection = lazy(() => import("@/components/sections/home-section"));
const TorahSection = lazy(() => import("@/components/sections/torah-section"));
const TefillaSection = lazy(() => import("@/components/sections/tefilla-section"));
const TzedakaSection = lazy(() => import("@/components/sections/tzedaka-section"));
const TableSection = lazy(() => import("@/components/sections/table-section"));

// Loading fallback for sections
const SectionLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="animate-spin text-blush" size={48} />
  </div>
);

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
    // Suspense wraps ErrorBoundary to properly handle lazy loading promises
    switch (activeSection) {
      case 'home':
        return (
          <Suspense fallback={<SectionLoader />}>
            <ErrorBoundary>
              <HomeSection key="home" onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </Suspense>
        );
      case 'torah':
        return (
          <Suspense fallback={<SectionLoader />}>
            <ErrorBoundary>
              <TorahSection key="torah" onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </Suspense>
        );
      case 'tefilla':
        return (
          <Suspense fallback={<SectionLoader />}>
            <ErrorBoundary>
              <TefillaSection key="tefilla" onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </Suspense>
        );
      case 'tzedaka':
        return (
          <Suspense fallback={<SectionLoader />}>
            <ErrorBoundary>
              <TzedakaSection key="tzedaka" onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </Suspense>
        );
      case 'table':
        return (
          <Suspense fallback={<SectionLoader />}>
            <ErrorBoundary>
              <TableSection key="table" />
            </ErrorBoundary>
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<SectionLoader />}>
            <ErrorBoundary>
              <HomeSection key="home-default" onSectionChange={navigateToSection} />
            </ErrorBoundary>
          </Suspense>
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
