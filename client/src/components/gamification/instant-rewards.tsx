import { useState, useEffect } from "react";
import { Gift, Star, Heart, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstantReward {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  color: string;
  available: boolean;
}

interface InstantRewardsProps {
  taskType: 'torah' | 'tefilla' | 'tzedaka';
  onClaim: (reward: InstantReward) => void;
}

export default function InstantRewards({ taskType, onClaim }: InstantRewardsProps) {
  const [availableRewards, setAvailableRewards] = useState<InstantReward[]>([]);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    // Generate random instant rewards based on task type
    const rewardPools = {
      torah: [
        {
          id: 'wisdom_star',
          title: 'Wisdom Star',
          description: 'You gained spiritual wisdom today',
          icon: <Star className="text-yellow-400" size={20} />,
          color: 'bg-yellow-50 border-yellow-200',
          available: true
        },
        {
          id: 'scholar_badge',
          title: 'Torah Scholar',
          description: 'Your dedication to learning shines',
          icon: <Zap className="text-blue-500" size={20} />,
          color: 'bg-blue-50 border-blue-200',
          available: true
        },
        {
          id: 'inspiration_boost',
          title: 'Inspiration Boost',
          description: 'May this learning inspire your day',
          icon: <Sparkles className="text-purple-500" size={20} />,
          color: 'bg-purple-50 border-purple-200',
          available: true
        }
      ],
      tefilla: [
        {
          id: 'prayer_heart',
          title: 'Prayer Heart',
          description: 'Your prayers reach the heavens',
          icon: <Heart className="text-pink-500" size={20} />,
          color: 'bg-pink-50 border-pink-200',
          available: true
        },
        {
          id: 'divine_connection',
          title: 'Divine Connection',
          description: 'You strengthened your bond with Hashem',
          icon: <Sparkles className="text-teal-500" size={20} />,
          color: 'bg-teal-50 border-teal-200',
          available: true
        },
        {
          id: 'spiritual_crown',
          title: 'Spiritual Crown',
          description: 'Your devotion is recognized',
          icon: <Crown className="text-purple-600" size={20} />,
          color: 'bg-purple-50 border-purple-200',
          available: true
        }
      ],
      tzedaka: [
        {
          id: 'giving_heart',
          title: 'Giving Heart',
          description: 'Your generosity makes a difference',
          icon: <Heart className="text-green-500" size={20} />,
          color: 'bg-green-50 border-green-200',
          available: true
        },
        {
          id: 'blessing_multiplier',
          title: 'Blessing Multiplier',
          description: 'May your kindness return tenfold',
          icon: <Gift className="text-orange-500" size={20} />,
          color: 'bg-orange-50 border-orange-200',
          available: true
        },
        {
          id: 'charity_star',
          title: 'Charity Star',
          description: 'You lit up someone\'s world today',
          icon: <Star className="text-yellow-600" size={20} />,
          color: 'bg-yellow-50 border-yellow-200',
          available: true
        }
      ]
    };

    // Randomly select 1-2 rewards from the pool
    const pool = rewardPools[taskType];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
    
    setAvailableRewards(selected);
    setShowRewards(true);
    
    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      setShowRewards(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [taskType]);

  const handleClaimReward = (reward: InstantReward) => {
    onClaim(reward);
    setAvailableRewards(prev => prev.filter(r => r.id !== reward.id));
    
    // Hide if no more rewards
    if (availableRewards.length <= 1) {
      setShowRewards(false);
    }
  };

  if (!showRewards || availableRewards.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="space-y-2">
        {availableRewards.map((reward) => (
          <div
            key={reward.id}
            className={`${reward.color} p-4 rounded-2xl border shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {reward.icon}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-black text-sm">
                    {reward.title}
                  </h3>
                  <p className="text-xs text-black/70">
                    {reward.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleClaimReward(reward)}
                size="sm"
                className="bg-gradient-feminine text-white text-xs px-3 py-1 rounded-xl border-0 hover:opacity-90"
              >
                Claim
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}