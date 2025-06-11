import { Heart, BookOpen, Shield, Plus } from "lucide-react";
import { useModalStore } from "@/lib/types";

export default function TzedakaSection() {
  const { openModal } = useModalStore();

  const tzedakaOptions = [
    {
      id: "campaign",
      icon: BookOpen,
      title: "Campaign",
      description: "Donate towards current projects like sponsoring a Torah or ambulance - starting from $1",
      color: "text-blush",
      bgColor: "bg-blush/10",
    },
    {
      id: "causes",
      icon: Shield,
      title: "Causes",
      description: "Support our partner causes including fertility support, women's abuse prevention, and kollels",
      color: "text-peach",
      bgColor: "bg-peach/10",
    },
    {
      id: "sponsor-day",
      icon: Heart,
      title: "Sponsor a Day",
      description: "Dedicate all Mitzvot done on the app - choose 1 day, 1 week, or 1 month starting from $1",
      color: "text-sage",
      bgColor: "bg-sage/10",
    },
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
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="font-medium text-blush">$12,450</div>
                <div className="text-gray-600">Campaign Raised</div>
              </div>
              <div>
                <div className="font-medium text-peach">89</div>
                <div className="text-gray-600">Causes Supported</div>
              </div>
              <div>
                <div className="font-medium text-sage">142</div>
                <div className="text-gray-600">Days Sponsored</div>
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
