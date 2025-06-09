import { Heart, BookOpen, Baby, Shield, Plus } from "lucide-react";
import { useModalStore } from "@/lib/types";

export default function TzedakaSection() {
  const { openModal } = useModalStore();

  const tzedakaOptions = [
    {
      id: 'sponsor-day',
      icon: BookOpen,
      title: 'Sponsor a Day of Ezras Nashim',
      description: 'Dedicate all Mitzvot done on the app for one day',
      color: 'text-blush',
      bgColor: 'bg-blush/10'
    },
    {
      id: 'torah-dedication',
      icon: BookOpen,
      title: 'Donate to Ezras Nashim Torah',
      description: 'Letter, Pasuk, Perek or Parsha dedication',
      color: 'text-peach',
      bgColor: 'bg-peach/10'
    },
    {
      id: 'infertility-support',
      icon: Baby,
      title: "Women's Infertility Support",
      description: 'Help couples struggling with fertility challenges',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50'
    },
    {
      id: 'abuse-support',
      icon: Shield,
      title: "Women's Abuse Support",
      description: 'Support women escaping abusive situations',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="h-full p-4">
      <div className="space-y-4 h-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <Heart className="text-blush mr-2" size={24} />
            <h2 className="text-lg font-semibold">Tzedaka & Donations</h2>
          </div>
          <p className="text-sm text-gray-600">
            Support meaningful causes in our community
          </p>
        </div>

        {/* Tzedaka Options */}
        <div className="space-y-3 flex-1">
          {tzedakaOptions.map((option) => (
            <div
              key={option.id}
              className="content-card rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
              onClick={() => openModal(option.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${option.bgColor}`}>
                  <option.icon className={option.color} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {option.description}
                  </p>
                </div>
                <Plus className="text-gray-400" size={16} />
              </div>
            </div>
          ))}
        </div>

        {/* Community Impact */}
        <div className="content-card rounded-2xl p-4 bg-gradient-to-r from-blush/5 to-peach/5">
          <div className="text-center">
            <h3 className="font-semibold text-sm mb-2">Community Impact</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium text-blush">142</div>
                <div className="text-gray-600">Days Sponsored</div>
              </div>
              <div>
                <div className="font-medium text-peach">89</div>
                <div className="text-gray-600">Torah Dedications</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}