import { useState } from "react";
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

      <ModalContainer />
    </div>
  );
}
