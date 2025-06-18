import { Book, HandHeart, Home, Heart, Flame, ShoppingBag, Coins } from "lucide-react";
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
    { id: 'tzedaka' as Section, icon: Coins, label: 'Tzedaka', isCenter: false },
    { id: 'table' as Section, icon: Flame, label: 'Shabbos', isCenter: false },
  ];

  const getActiveColorClass = (sectionId: Section) => {
    switch (sectionId) {
      case 'torah': return 'bg-muted-lavender/15 text-muted-lavender rounded-2xl';
      case 'tefilla': return 'bg-rose-blush/15 text-rose-blush rounded-2xl';
      case 'tzedaka': return 'bg-warm-gray/15 text-warm-gray rounded-2xl';
      case 'table': return 'bg-sand-gold/15 text-sand-gold rounded-2xl';
      default: return 'bg-rose-blush/15 text-rose-blush rounded-2xl';
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-soft-white/95 backdrop-blur-sm border-t border-rose-blush/15 shadow-2xl rounded-t-3xl transition-gentle">
      <div className="flex items-center justify-evenly py-2 px-4">
        {navItems.map(({ id, icon: Icon, label, isCenter }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex flex-col items-center transition-gentle glow-hover focus-glow ${
              isCenter 
                ? 'p-3 scale-110' 
                : 'p-2'
            } ${
              activeSection === id 
                ? isCenter 
                  ? 'gradient-quiet-joy rounded-full shadow-lg'
                  : getActiveColorClass(id)
                : 'hover:bg-ivory rounded-2xl'
            }`}
          >
            <Icon 
              className={`mb-1 transition-gentle ${
                activeSection === id 
                  ? isCenter 
                    ? 'text-white' 
                    : ''
                  : 'text-warm-gray/70'
              }`}
              size={isCenter ? 28 : 20}
              strokeWidth={1.5} 
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
