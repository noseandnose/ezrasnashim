import { Book, Heart, Play, Shield, BookOpen, Sparkles, Star, Scroll } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { Section } from "@/pages/home";

interface TorahSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function TorahSection({ onSectionChange }: TorahSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted } = useDailyCompletionStore();
  
  // Fetch today's Pirkei Avot for daily inspiration
  const today = new Date().toISOString().split('T')[0];
  const { data: pirkeiAvot } = useQuery<{text: string; chapter: number; source: string}>({
    queryKey: ['/api/torah/pirkei-avot', today],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  const torahItems = [
    {
      id: 'chizuk',
      icon: Heart,
      title: 'Chizuk',
      subtitle: '5 minute inspiration',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'audio'
    },
    {
      id: 'emuna',
      icon: Shield,
      title: 'Emuna',
      subtitle: 'Faith & Trust',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'audio'
    },
    {
      id: 'halacha',
      icon: Book,
      title: 'Halacha',
      subtitle: 'Jewish Law & Practice',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'text'
    },
    {
      id: 'featured',
      icon: Star,
      title: 'Featured',
      subtitle: 'Special Topics',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10',
      contentType: 'text'
    }
  ];

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Torah Section - Connected to top bar */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Daily Inspiration - Pirkei Avot */}
        {pirkeiAvot && (
          <div className="bg-white/70 rounded-2xl p-3 mb-3 border border-blush/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-feminine p-1.5 rounded-full">
                <Scroll className="text-white" size={16} />
              </div>
              <h3 className="font-serif text-sm text-black font-bold">Daily Inspiration</h3>
              <span className="text-xs text-black/60 font-sans">Pirkei Avot {pirkeiAvot.source.replace('.', ':')}</span>
            </div>
            <p className="font-sans text-xs text-black/90 leading-relaxed text-justify">
              {pirkeiAvot.text}
            </p>
          </div>
        )}
      </div>

      {/* Daily Torah Content - Separate Section */}
      <div className="p-2 space-y-1">
        <div className="grid grid-cols-2 gap-2 mb-1">
          {torahItems.map(({ id, icon: Icon, title, subtitle, gradient, iconBg, iconColor, border, contentType }) => (
            <button
              key={id}
              className={`${gradient} rounded-3xl p-3 text-center glow-hover transition-gentle shadow-lg border ${border} relative`}
              onClick={() => openModal(id)}
            >
              {/* Content Type Indicator */}
              {contentType && (
                <div className="absolute top-2 left-2 bg-white text-blush text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {contentType === 'text' ? 'T' : '▶'}
                </div>
              )}
              
              <div className={`${iconBg} p-2 rounded-full mx-auto mb-2 w-fit`}>
                <Icon className={`${iconColor}`} size={18} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xs text-black mb-1 tracking-wide font-bold">{title}</h3>
              <p className="font-sans text-xs text-black/60 leading-relaxed">{subtitle}</p>
            </button>
          ))}
        </div>

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
