import { useState, useEffect } from "react";
import { Sparkles, Star, Heart, Crown, Trophy, Zap } from "lucide-react";

interface CompletionCelebrationProps {
  taskType: 'torah' | 'tefilla' | 'tzedaka';
  trigger: boolean;
  onComplete: () => void;
}

export default function CompletionCelebration({ taskType, trigger, onComplete }: CompletionCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      
      // Generate particle positions
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  const getTaskDetails = () => {
    switch (taskType) {
      case 'torah':
        return {
          title: "Torah Complete!",
          subtitle: "Wisdom gained",
          icon: <Star className="text-yellow-400" size={48} />,
          color: "from-yellow-400 to-orange-500"
        };
      case 'tefilla':
        return {
          title: "Prayer Complete!",
          subtitle: "Connection strengthened",
          icon: <Heart className="text-pink-400" size={48} />,
          color: "from-pink-400 to-purple-500"
        };
      case 'tzedaka':
        return {
          title: "Tzedaka Complete!",
          subtitle: "Kindness shared",
          icon: <Sparkles className="text-green-400" size={48} />,
          color: "from-green-400 to-blue-500"
        };
      default:
        return {
          title: "Task Complete!",
          subtitle: "Well done",
          icon: <Trophy className="text-yellow-400" size={48} />,
          color: "from-yellow-400 to-orange-500"
        };
    }
  };

  const taskDetails = getTaskDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 animate-in fade-in duration-300" />
      
      {/* Celebration particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '1s'
          }}
        >
          {Math.random() > 0.5 ? (
            <Sparkles className="text-yellow-400" size={16} />
          ) : (
            <Star className="text-orange-400" size={14} />
          )}
        </div>
      ))}
      
      {/* Main celebration content */}
      <div className="relative animate-in zoom-in duration-500">
        <div className={`bg-gradient-to-br ${taskDetails.color} p-8 rounded-3xl shadow-2xl border-4 border-white`}>
          <div className="text-center space-y-4">
            {/* Main icon with pulse animation */}
            <div className="relative">
              <div className="animate-pulse">
                {taskDetails.icon}
              </div>
              <div className="absolute inset-0 animate-ping opacity-30">
                {taskDetails.icon}
              </div>
            </div>
            
            {/* Text content */}
            <div className="text-white">
              <h2 className="text-2xl font-serif font-bold mb-2">
                {taskDetails.title}
              </h2>
              <p className="text-lg opacity-90">
                {taskDetails.subtitle}
              </p>
            </div>
            
            {/* Additional sparkle effects */}
            <div className="flex justify-center space-x-2">
              <Zap className="text-white animate-bounce" size={20} style={{ animationDelay: '0.1s' }} />
              <Sparkles className="text-white animate-bounce" size={20} style={{ animationDelay: '0.2s' }} />
              <Zap className="text-white animate-bounce" size={20} style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}