import { Book, HandHeart, Home, Heart, Utensils, ShoppingBag } from "lucide-react";
import type { Section } from "@/pages/home";

interface BottomNavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const navItems = [
    { id: 'torah' as Section, icon: Book, label: 'Torah', isCenter: false },
    { id: 'tefilla' as Section, icon: HandHeart, label: 'Tefilla', isCenter: false },
    { id: 'home' as Section, icon: Home, label: 'Home', isCenter: true },
    { id: 'table' as Section, icon: Utensils, label: 'Table', isCenter: false },
    { id: 'shop' as Section, icon: ShoppingBag, label: 'Shop', isCenter: false },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ id, icon: Icon, label, isCenter }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`nav-tab flex flex-col items-center rounded-lg transition-all duration-200 ${
              isCenter 
                ? 'p-3 scale-110' 
                : 'p-2'
            } ${
              activeSection === id 
                ? isCenter 
                  ? 'bg-gradient-to-br from-blush to-peach text-white shadow-md' 
                  : 'text-blush bg-blush/10' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon 
              className={`mb-1 ${isCenter ? 'text-2xl' : 'text-lg'}`} 
              size={isCenter ? 28 : 20} 
            />
            <span className={`font-medium ${isCenter ? 'text-xs' : 'text-xs'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
