import { Utensils, Lightbulb, Mic, Play, Flame, Clock } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useShabbosTime } from "@/hooks/use-shabbos-times";
import { Card } from "@/components/ui/card";

export default function TableSection() {
  const { openModal } = useModalStore();
  const { data: shabbosData, isLoading: shabbosLoading } = useShabbosTime();

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
    <div className="h-full p-4 space-y-4">
      {/* Shabbos Times Section */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Flame className="text-orange-600" size={16} />
            <h3 className="font-semibold text-gray-800 text-sm">This Shabbos</h3>
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">🕯️ Candle Lighting:</span>
              <span className="font-medium">{shabbosData?.candleLighting || "Loading..."}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-gray-600">🔥 Havdalah:</span>
              <span className="font-medium">{shabbosData?.havdalah || "Loading..."}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-600">📖 Parsha:</span>
            <span className="font-medium">{shabbosData?.parsha || "Loading..."}</span>
          </div>
        </div>
      </Card>

      {/* Shabbos Content Grid */}
      <div className="grid grid-cols-2 gap-3">
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
