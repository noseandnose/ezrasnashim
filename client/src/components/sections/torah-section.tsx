import { Book, Heart, Play, Shield, BookOpen, Sparkles, Star, Scroll } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { InspirationalQuote } from "@shared/schema";

export default function TorahSection() {
  const { openModal } = useModalStore();
  
  // Fetch today's inspirational quote
  const today = new Date().toISOString().split('T')[0];
  const { data: quote } = useQuery<InspirationalQuote>({
    queryKey: ['daily-quote', today],
    queryFn: async () => {
      const response = await fetch(`/api/quotes/daily/${today}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  const torahItems = [
    {
      id: 'halacha',
      icon: Book,
      title: 'Daily Halacha',
      subtitle: 'Jewish Law & Practice',
      gradient: 'gradient-soft-glow',
      iconBg: 'bg-rose-blush/20',
      iconColor: 'text-rose-blush',
      border: 'border-rose-blush/15'
    },
    {
      id: 'mussar',
      icon: Heart,
      title: 'Daily Mussar',
      subtitle: 'Character Development',
      gradient: 'gradient-soft-glow',
      iconBg: 'bg-muted-lavender/20',
      iconColor: 'text-muted-lavender',
      border: 'border-muted-lavender/15'
    },
    {
      id: 'chizuk',
      icon: Play,
      title: 'Daily Chizuk',
      subtitle: '5 minute inspiration',
      gradient: 'gradient-sand-warm',
      iconBg: 'bg-sand-gold/20',
      iconColor: 'text-sand-gold',
      border: 'border-sand-gold/15'
    },
    {
      id: 'loshon',
      icon: Shield,
      title: 'Loshon Horah',
      subtitle: 'Guard Your Speech',
      gradient: 'gradient-soft-glow',
      iconBg: 'bg-sand-gold/20',
      iconColor: 'text-sand-gold',
      border: 'border-sand-gold/15'
    }
  ];

  return (
    <div className="p-2 space-y-1">
      {/* Welcome Header */}
      <div className="text-center">
        <h2 className="font-serif text-lg text-warm-gray mb-1 tracking-wide">Daily Torah Learning</h2>
        <p className="font-sans text-warm-gray/70 text-xs leading-relaxed">Nourish your soul with wisdom and inspiration</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {torahItems.map(({ id, icon: Icon, title, subtitle, gradient, iconBg, iconColor, border }) => (
          <button
            key={id}
            className={`${gradient} rounded-3xl p-4 text-center glow-hover transition-gentle shadow-lg border ${border}`}
            onClick={() => openModal(id)}
          >
            <div className={`${iconBg} p-3 rounded-full mx-auto mb-3 w-fit`}>
              <Icon className={`${iconColor}`} size={20} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-warm-gray mb-1 tracking-wide">{title}</h3>
            <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{subtitle}</p>
          </button>
        ))}
      </div>

      {/* Inspirational Quote */}
      <div className="gradient-soft-glow rounded-3xl p-4 border border-rose-blush/15 glow-hover transition-gentle">
        <p className="font-sans text-xs text-warm-gray/80 italic text-center leading-relaxed">
          "{quote?.text || 'Turn it over and over, for everything is in it. Look into it, grow old and worn over it, and never move away from it, for there is no better portion than it.'}"
        </p>
        <p className="font-serif text-xs text-warm-gray/60 text-center mt-2 tracking-wide">- {quote?.source || 'Pirkei Avot 5:22'}</p>
      </div>

      {/* Bottom padding */}
      <div className="h-24"></div>
    </div>
  );
}
