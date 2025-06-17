import { Book, Heart, Play, Shield } from "lucide-react";
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
      gradient: 'from-blush/8 to-ivory',
      iconBg: 'bg-blush/20',
      iconColor: 'text-blush',
      border: 'border-blush/15'
    },
    {
      id: 'mussar',
      icon: Heart,
      title: 'Daily Mussar',
      subtitle: 'Character Development',
      gradient: 'from-lavender/8 to-ivory',
      iconBg: 'bg-lavender/20',
      iconColor: 'text-lavender',
      border: 'border-lavender/15'
    },
    {
      id: 'chizuk',
      icon: Play,
      title: 'Daily Chizuk',
      subtitle: '5 minute inspiration',
      gradient: 'from-sage/8 to-ivory',
      iconBg: 'bg-sage/20',
      iconColor: 'text-sage',
      border: 'border-sage/15'
    },
    {
      id: 'loshon',
      icon: Shield,
      title: 'Loshon Horah',
      subtitle: 'Guarding Your Speech',
      gradient: 'from-blush/8 to-ivory',
      iconBg: 'bg-blush/20',
      iconColor: 'text-blush',
      border: 'border-blush/15'
    }
  ];

  return (
    <div className="p-3 space-y-4">
      {/* Welcome Header */}
      <div className="text-center">
        <h2 className="font-serif text-2xl text-warm-gray mb-2 tracking-wide">Daily Torah Learning</h2>
        <p className="font-sans text-warm-gray/70 text-sm leading-relaxed">Nourish your soul with wisdom and inspiration</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {torahItems.map(({ id, icon: Icon, title, subtitle, gradient, iconBg, iconColor, border }) => (
          <button
            key={id}
            className={`bg-gradient-to-br ${gradient} rounded-3xl p-6 text-center hover:scale-105 transition-all duration-300 shadow-lg border ${border}`}
            onClick={() => openModal(id)}
          >
            <div className={`${iconBg} p-4 rounded-full mx-auto mb-4 w-fit`}>
              <Icon className={`${iconColor}`} size={24} />
            </div>
            <h3 className="font-serif text-sm text-warm-gray mb-2">{title}</h3>
            <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{subtitle}</p>
          </button>
        ))}
      </div>

      {/* Inspirational Quote */}
      <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-3xl p-6 border border-blush/20">
        <p className="font-sans text-sm text-warm-gray/80 italic text-center leading-relaxed">
          "{quote?.text || 'Turn it over and over, for everything is in it. Look into it, grow old and worn over it, and never move away from it, for there is no better portion than it.'}"
        </p>
        <p className="font-serif text-xs text-warm-gray/60 text-center mt-2">- {quote?.source || 'Pirkei Avot 5:22'}</p>
      </div>

      {/* Bottom padding */}
      <div className="h-24"></div>
    </div>
  );
}
