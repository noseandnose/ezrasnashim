import { BookOpen, HandHeart, Heart, Sparkles, Coins } from "lucide-react";
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
    { id: "torah" as Section, icon: BookOpen, label: "Torah", isCenter: false },
    {
      id: "tefilla" as Section,
      icon: HandHeart,
      label: "Tefilla",
      isCenter: false,
    },
    { id: "home" as Section, icon: Heart, label: "Home", isCenter: true },
    {
      id: "tzedaka" as Section,
      icon: Coins,
      label: "Tzedaka",
      isCenter: false,
    },
    { id: "table" as Section, icon: Sparkles, label: "Life", isCenter: false },
  ];

  const getActiveColorClass = (sectionId: Section) => {
    switch (sectionId) {
      case "torah":
        return "bg-white text-muted-lavender rounded-2xl border-2 border-muted-lavender/30 w-16 h-16";
      case "tefilla":
        return "bg-white text-rose-blush rounded-2xl border-2 border-rose-blush/30 w-16 h-16";
      case "tzedaka":
        return "bg-white text-sage rounded-2xl border-2 border-sage/30 w-16 h-16";
      case "table":
        return "bg-white text-sand-gold rounded-2xl border-2 border-sand-gold/30 w-16 h-16";
      case "home":
        return "bg-gradient-feminine rounded-2xl shadow-lg w-16 h-16";
      default:
        return "bg-white text-rose-blush rounded-2xl border-2 border-rose-blush/30 w-16 h-16";
    }
  };

  return (
    <nav
      className="fixed left-0 right-0 mx-auto w-full max-w-md bg-gradient-soft backdrop-blur-sm border-t border-rose-blush/15 shadow-2xl rounded-t-3xl transition-gentle z-50"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--nav-offset, 0px))",
        paddingBottom: "0.5rem",
        touchAction: "none"
      }}
    >
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${
              activeSection === id
                ? getActiveColorClass(id)
                : "hover:bg-blush/5 rounded-xl w-16 h-16"
            }`}
          >
            <Icon
              className={`mb-1 transition-gentle ${
                activeSection === id
                  ? id === "home"
                    ? "text-white"
                    : ""
                  : "text-warm-gray/70"
              }`}
              size={activeSection === id ? 22 : 20}
              strokeWidth={1.5}
              fill="none"
            />
            <span
              className={`${activeSection === id ? "platypi-bold" : "platypi-medium"} text-xs transition-colors duration-300 ${
                activeSection === id
                  ? id === "home"
                    ? "text-white"
                    : id === "torah"
                      ? "text-muted-lavender"
                      : id === "tefilla"
                        ? "text-rose-blush"
                        : id === "tzedaka"
                          ? "text-sage"
                          : id === "table"
                            ? "text-sand-gold"
                            : "text-rose-blush"
                  : "text-warm-gray/70"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
