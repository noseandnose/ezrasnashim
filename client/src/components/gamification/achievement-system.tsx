import { useState, useEffect } from "react";
import { Star, Trophy, Flame, Crown, Heart, Zap, Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  reward: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementSystemProps {
  isOpen: boolean;
  onClose: () => void;
  completedDays: {
    torah: number;
    tefilla: number;
    tzedaka: number;
    total: number;
  };
}

export default function AchievementSystem({ isOpen, onClose, completedDays }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const baseAchievements: Achievement[] = [
      {
        id: "first_step",
        title: "First Steps",
        description: "Complete your first day of Torah, Tefilla & Tzedaka",
        icon: <Star className="text-yellow-400" size={24} />,
        reward: "Bronze Badge",
        unlocked: completedDays.total >= 1,
        progress: completedDays.total,
        maxProgress: 1
      },
      {
        id: "week_warrior",
        title: "Week Warrior",
        description: "Complete all three tasks for 7 consecutive days",
        icon: <Trophy className="text-bronze-400" size={24} />,
        reward: "Weekly Crown",
        unlocked: completedDays.total >= 7,
        progress: Math.min(completedDays.total, 7),
        maxProgress: 7
      },
      {
        id: "fire_streak",
        title: "Fire Streak",
        description: "Maintain a 30-day completion streak",
        icon: <Flame className="text-red-400" size={24} />,
        reward: "Fire Badge + Special Prayer",
        unlocked: completedDays.total >= 30,
        progress: Math.min(completedDays.total, 30),
        maxProgress: 30
      },
      {
        id: "spiritual_master",
        title: "Spiritual Master",
        description: "Complete 100 days of spiritual practice",
        icon: <Crown className="text-purple-400" size={24} />,
        reward: "Master Crown + Blessing",
        unlocked: completedDays.total >= 100,
        progress: Math.min(completedDays.total, 100),
        maxProgress: 100
      },
      {
        id: "torah_scholar",
        title: "Torah Scholar",
        description: "Complete 50 days of Torah study",
        icon: <Zap className="text-blue-400" size={24} />,
        reward: "Scholar Badge",
        unlocked: completedDays.torah >= 50,
        progress: Math.min(completedDays.torah, 50),
        maxProgress: 50
      },
      {
        id: "prayer_master",
        title: "Prayer Master",
        description: "Complete 50 days of prayer",
        icon: <Heart className="text-pink-400" size={24} />,
        reward: "Prayer Heart",
        unlocked: completedDays.tefilla >= 50,
        progress: Math.min(completedDays.tefilla, 50),
        maxProgress: 50
      },
      {
        id: "giving_spirit",
        title: "Giving Spirit",
        description: "Complete 50 days of tzedaka",
        icon: <Gift className="text-green-400" size={24} />,
        reward: "Charity Star",
        unlocked: completedDays.tzedaka >= 50,
        progress: Math.min(completedDays.tzedaka, 50),
        maxProgress: 50
      }
    ];

    setAchievements(baseAchievements);
  }, [completedDays]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-gradient-feminine p-3 rounded-full">
              <Trophy className="text-white" size={24} />
            </div>
          </div>
          <DialogTitle className="text-xl font-serif font-bold text-black">
            Achievements
          </DialogTitle>
          <p className="text-sm text-black/70">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-2xl border transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-md'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  achievement.unlocked ? 'bg-white shadow-sm' : 'bg-gray-100'
                }`}>
                  {achievement.unlocked ? achievement.icon : (
                    <div className="text-gray-400">
                      {achievement.icon}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-serif font-bold ${
                    achievement.unlocked ? 'text-black' : 'text-gray-500'
                  }`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${
                    achievement.unlocked ? 'text-black/70' : 'text-gray-400'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress bar for incomplete achievements */}
                  {!achievement.unlocked && achievement.maxProgress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-feminine h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Reward display */}
                  <div className={`mt-2 text-xs font-medium ${
                    achievement.unlocked ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    🎁 {achievement.reward}
                  </div>
                </div>

                {achievement.unlocked && (
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-1 bg-white rounded-full transform rotate-45 translate-x-0.5"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 mt-4"
        >
          Continue Journey
        </Button>
      </DialogContent>
    </Dialog>
  );
}