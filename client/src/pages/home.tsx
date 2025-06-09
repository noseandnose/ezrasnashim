import { useState } from "react";
import AppHeader from "@/components/app-header";
import BottomNavigation from "@/components/bottom-navigation";
import TorahSection from "@/components/sections/torah-section";
import TefillaSection from "@/components/sections/tefilla-section";
import TzedakaSection from "@/components/sections/tzedaka-section";
import TableSection from "@/components/sections/table-section";
import ShopSection from "@/components/sections/shop-section";
import ModalContainer from "@/components/modals/modal-container";

export type Section = 'torah' | 'tefilla' | 'tzedaka' | 'table' | 'shop';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('torah');

  const renderSection = () => {
    switch (activeSection) {
      case 'torah':
        return <TorahSection />;
      case 'tefilla':
        return <TefillaSection />;
      case 'tzedaka':
        return <TzedakaSection />;
      case 'table':
        return <TableSection />;
      case 'shop':
        return <ShopSection />;
      default:
        return <TorahSection />;
    }
  };

  return (
    <div className="mobile-app min-h-screen max-w-md mx-auto bg-white shadow-2xl relative">
      <AppHeader />
      
      <main className="content-area overflow-hidden">
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
