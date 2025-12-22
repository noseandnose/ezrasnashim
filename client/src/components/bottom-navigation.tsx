import { BookOpen, HandHeart, Heart, Sparkles, Coins } from "lucide-react";
import { useRef } from "react";
import type { Section } from "@/pages/home";

interface BottomNavigationProps {
  activeSection: Section | null;
  onSectionChange: (section: Section) => void;
}

export default function BottomNavigation({
  activeSection,
  onSectionChange,
}: BottomNavigationProps) {
  const navItems = [
    { id: "torah" as Section, icon: BookOpen, label: "Torah" },
    { id: "tefilla" as Section, icon: HandHeart, label: "Tefilla" },
    { id: "home" as Section, icon: Heart, label: "Home" },
    { id: "tzedaka" as Section, icon: Coins, label: "Tzedaka" },
    { id: "table" as Section, icon: Sparkles, label: "Life" },
  ];

  const onSectionChangeRef = useRef(onSectionChange);
  onSectionChangeRef.current = onSectionChange;

  const getActiveColor = (sectionId: Section) => {
    switch (sectionId) {
      case "torah": return "text-muted-lavender";
      case "tefilla": return "text-rose-blush";
      case "tzedaka": return "text-sage";
      case "table": return "text-sand-gold";
      case "home": return "text-rose-blush";
      default: return "text-rose-blush";
    }
  };

  return (
    <nav
      data-bottom-nav
      data-bridge-container
      className="nav-extended fixed left-4 right-4 mx-auto max-w-md z-50"
      style={{
        bottom: "calc(var(--nav-offset, 0px) + var(--safe-area-bottom, 0px) + 12px)",
        touchAction: "none"
      }}
    >
      <div 
        className="relative overflow-hidden rounded-[28px] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)]"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
      >
        <div 
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }}
        />
        
        <div className="relative flex items-center justify-around py-2.5 px-1">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeSection === id;
            const isHome = id === "home";
            
            return (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                data-action={`nav-${id}`}
                data-testid={`nav-${id}`}
                className={`flex flex-col items-center justify-center transition-all duration-300 rounded-2xl px-3 py-2 min-w-[56px] ${
                  isActive 
                    ? isHome
                      ? "bg-gradient-to-br from-rose-blush/90 to-blush/80 shadow-lg"
                      : "bg-white/60 shadow-sm"
                    : "hover:bg-white/40"
                }`}
                style={isActive && !isHome ? {
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)"
                } : undefined}
              >
                <Icon
                  className={`mb-0.5 transition-all duration-300 ${
                    isActive
                      ? isHome
                        ? "text-white drop-shadow-sm"
                        : getActiveColor(id)
                      : "text-gray-500/70"
                  }`}
                  size={isActive ? 22 : 20}
                  strokeWidth={isActive ? 2 : 1.5}
                  fill="none"
                />
                <span
                  className={`text-[10px] transition-all duration-300 ${
                    isActive 
                      ? isHome
                        ? "text-white font-semibold"
                        : `${getActiveColor(id)} font-semibold`
                      : "text-gray-500/70 font-medium"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
