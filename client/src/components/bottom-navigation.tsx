import { Book, HandHeart, Home, Heart, Flame, ShoppingBag } from "lucide-react";
import type { Section } from "@/pages/home";

interface BottomNavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const navItems = [
    { id: 'torah' as Section, icon: Book, label: 'Torah', isCenter: false },
    { id: 'tefilla' as Section, icon: HandHeart, label: 'Tefilla', isCenter: false },
    { id: 'home' as Section, icon: Heart, label: 'Home', isCenter: true },
    { id: 'table' as Section, icon: Flame, label: 'Shabbos', isCenter: false },
    { id: 'shop' as Section, icon: ShoppingBag, label: 'Shop', isCenter: false },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-sm border-t border-blush/20 shadow-2xl rounded-t-3xl">
      <div className="flex items-center justify-between py-3 px-6">
        {navItems.map(({ id, icon: Icon, label, isCenter }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex flex-col items-center transition-all duration-300 ${
              isCenter 
                ? 'p-3 scale-110' 
                : 'p-2'
            } ${
              activeSection === id 
                ? isCenter 
                  ? 'bg-gradient-feminine rounded-full shadow-lg'
                  : 'bg-blush/15 rounded-2xl'
                : 'hover:bg-ivory rounded-2xl'
            }`}
          >
            <Icon 
              className={`mb-1 transition-colors duration-300 ${
                activeSection === id 
                  ? isCenter 
                    ? 'text-white' 
                    : 'text-blush'
                  : 'text-warm-gray/70'
              }`}
              size={isCenter ? 28 : 20} 
            />
            <span className={`font-sans font-medium text-xs transition-colors duration-300 ${
              activeSection === id 
                ? isCenter 
                  ? 'text-white' 
                  : 'text-blush'
                : 'text-warm-gray/70'
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>
      
      {/* Soft bottom padding for iPhone home indicator */}
      <div className="h-1"></div>
    </nav>
  );
}
