import { Book, HandHeart, Heart, Utensils, ShoppingBag } from "lucide-react";
import type { Section } from "@/pages/home";

interface BottomNavigationProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function BottomNavigation({ activeSection, onSectionChange }: BottomNavigationProps) {
  const navItems = [
    { id: 'torah' as Section, icon: Book, label: 'Torah' },
    { id: 'tefilla' as Section, icon: HandHeart, label: 'Tefilla' },
    { id: 'tzedaka' as Section, icon: Heart, label: 'Tzedaka' },
    { id: 'table' as Section, icon: Utensils, label: 'Table' },
    { id: 'shop' as Section, icon: ShoppingBag, label: 'Shop' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`nav-tab flex flex-col items-center p-2 rounded-lg transition-all ${
              activeSection === id ? 'active' : ''
            }`}
          >
            <Icon className="text-lg mb-1" size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
