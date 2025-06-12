import { Utensils, Lightbulb, Mic, Play } from "lucide-react";
import { useModalStore } from "@/lib/types";

export default function TableSection() {
  const { openModal } = useModalStore();

  const tableItems = [
    {
      id: 'recipe',
      icon: Utensils,
      title: 'Shabbas Recipe',
      subtitle: 'Honey Glazed Challah',
      color: 'text-peach'
    },
    {
      id: 'inspiration',
      icon: Lightbulb,
      title: 'Table Inspiration',
      subtitle: 'Chanukah Table Setting',
      color: 'text-blush'
    },
    {
      id: 'parsha',
      icon: Mic,
      title: 'Parsha Vort',
      subtitle: 'Parshas Vayeshev - 3 min',
      color: 'text-peach',
      extraIcon: Play
    }
  ];

  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-2 gap-3 h-full">
        {tableItems.map(({ id, icon: Icon, title, subtitle, color }) => (
          <div
            key={id}
            className="content-card rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => openModal(id)}
          >
            <div className="text-center">
              <Icon className={`${color} mb-2 mx-auto`} size={32} />
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}
