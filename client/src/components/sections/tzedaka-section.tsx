import { Heart, BookOpen, Shield, Plus } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { Campaign } from "@shared/schema";

export default function TzedakaSection() {
  const { openModal } = useModalStore();

  // Fetch active campaign data
  const { data: campaign } = useQuery<Campaign>({
    queryKey: ['/api/campaigns/active'],
  });

  const progressPercentage = campaign ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0;

  const tzedakaOptions = [
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
      description: "Dedicate all Mitzvot done on the app - choose 1 day, 1 week, or 1 month",
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

        {/* Campaign Card with Progress Bar */}
        {campaign && (
          <div
            className="content-card rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
            onClick={() => openModal('campaign')}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-blush/10">
                  <BookOpen className="text-blush" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Campaign</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {campaign.title}
                  </p>
                </div>
                <Plus className="text-gray-400" size={16} />
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-blush">${campaign.currentAmount.toLocaleString()} / ${campaign.goalAmount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blush to-peach h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {progressPercentage}% Complete
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tzedaka Options */}
        <div className="space-y-3">
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
                <div className="font-medium text-sage">142</div>
                <div className="text-gray-600">Days Sponsored</div>
              </div>
              <div>
                <div className="font-medium text-blush">3</div>
                <div className="text-gray-600">Campaigns Completed</div>
              </div>
              <div>
                <div className="font-medium text-peach">$24,580</div>
                <div className="text-gray-600">Total to Causes</div>
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
