import { Book, Heart, Play, Shield } from "lucide-react";
import { useModalStore } from "@/lib/types";
import SponsorshipBar from "@/components/sponsorship-bar";

export default function TorahSection() {
  const { openModal } = useModalStore();

  const torahItems = [
    {
      id: 'halacha',
      icon: Book,
      title: 'Daily Halacha',
      subtitle: 'Laws of Chanukah',
      color: 'text-blush'
    },
    {
      id: 'mussar',
      icon: Heart,
      title: 'Daily Mussar',
      subtitle: 'Building Character',
      color: 'text-peach'
    },
    {
      id: 'chizuk',
      icon: Play,
      title: 'Daily Chizuk',
      subtitle: '5 min audio',
      color: 'text-blush'
    },
    {
      id: 'loshon',
      icon: Shield,
      title: 'Loshon Horah',
      subtitle: 'Guard Your Speech',
      color: 'text-peach'
    }
  ];

  return (
    <div className="h-full p-4">
      {/* Single sponsorship bar for all daily learning */}
      <SponsorshipBar className="mb-4" />
      
      <div className="grid grid-cols-2 gap-3 h-full">
        {torahItems.map(({ id, icon: Icon, title, subtitle, color }) => (
          <div
            key={id}
            className="content-card rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => openModal(id)}
          >
            <div className="text-center">
              <Icon className={`text-2xl ${color} mb-2 mx-auto`} size={32} />
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
