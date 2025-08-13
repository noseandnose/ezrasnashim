import { BookOpen, HandHeart, Home, Heart, Sparkles, ShoppingBag, Coins } from "lucide-react";
import type { Section } from "@/pages/home";

interface BottomNavigationProps {
  activeSection: Section | null;
  onSectionChange: (section: Section) => void;
}

export default function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const navItems = [
    { id: 'torah' as Section, icon: BookOpen, label: 'Torah', isCenter: false },
    { id: 'tefilla' as Section, icon: HandHeart, label: 'Tefilla', isCenter: false },
    { id: 'home' as Section, icon: Heart, label: 'Home', isCenter: true },
    { id: 'tzedaka' as Section, icon: Coins, label: 'Tzedaka', isCenter: false },
    { id: 'table' as Section, icon: Sparkles, label: 'Life', isCenter: false },
  ];

  const getActiveColorClass = (sectionId: Section) => {
    switch (sectionId) {
      case 'torah': return 'bg-white text-muted-lavender rounded-2xl border-2 border-muted-lavender/30';
      case 'tefilla': return 'bg-white text-rose-blush rounded-2xl border-2 border-rose-blush/30';
      case 'tzedaka': return 'bg-white text-sage rounded-2xl border-2 border-sage/30';
      case 'table': return 'bg-white text-sand-gold rounded-2xl border-2 border-sand-gold/30';
      default: return 'bg-white text-rose-blush rounded-2xl border-2 border-rose-blush/30';
    }
  };



  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-gradient-soft backdrop-blur-sm border-t border-rose-blush/15 shadow-2xl rounded-t-3xl transition-gentle">
      <div className="flex items-center justify-around py-2 px-2">
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
                  : getActiveColorClass(id)
                : 'hover:bg-blush/5 rounded-xl'
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
            <span className={`platypi-medium text-xs transition-colors duration-300 ${
              activeSection === id 
                ? isCenter 
                  ? 'text-white' 
                  : id === 'torah' ? 'text-muted-lavender'
                  : id === 'tefilla' ? 'text-rose-blush'
                  : id === 'tzedaka' ? 'text-sage'
                  : id === 'table' ? 'text-sand-gold'
                  : 'text-rose-blush'
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
