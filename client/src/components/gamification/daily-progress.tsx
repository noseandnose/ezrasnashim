import { useState, useEffect } from "react";
import { Star, Trophy, Flame, Heart, CheckCircle, Sparkles } from "lucide-react";
import { useDailyCompletionStore } from "@/lib/types";

interface DailyProgressProps {
  className?: string;
}

export default function DailyProgress({ className = "" }: DailyProgressProps) {
  const { torahCompleted, tefillaCompleted, tzedakaCompleted } = useDailyCompletionStore();
  const [todayStreak, setTodayStreak] = useState(0);
  const [celebrateCompletion, setCelebrateCompletion] = useState(false);
  
  const completedCount = [torahCompleted, tefillaCompleted, tzedakaCompleted].filter(Boolean).length;
  const isAllComplete = completedCount === 3;
  
  // Session-based streak tracking (resets each day)
  useEffect(() => {
    const today = new Date().toDateString();
    const storedData = localStorage.getItem('daily-progress');
    
    if (storedData) {
      const data = JSON.parse(storedData);
      if (data.date === today) {
        setTodayStreak(data.streak || 0);
      } else {
        // New day, reset
        localStorage.setItem('daily-progress', JSON.stringify({ date: today, streak: 0 }));
        setTodayStreak(0);
      }
    } else {
      localStorage.setItem('daily-progress', JSON.stringify({ date: today, streak: 0 }));
      setTodayStreak(0);
    }
  }, []);
  
  // Update streak when tasks completed
  useEffect(() => {
    if (isAllComplete && todayStreak === 0) {
      const newStreak = 1;
      setTodayStreak(newStreak);
      setCelebrateCompletion(true);
      
      const today = new Date().toDateString();
      localStorage.setItem('daily-progress', JSON.stringify({ 
        date: today, 
        streak: newStreak,
        completedAt: new Date().toISOString()
      }));
      
      // Hide celebration after 3 seconds
      setTimeout(() => setCelebrateCompletion(false), 3000);
    }
  }, [isAllComplete, todayStreak]);
  
  const getProgressMessage = () => {
    if (isAllComplete) {
      return "🎉 Perfect Day Complete!";
    }
    switch (completedCount) {
      case 0: return "Start your spiritual journey today";
      case 1: return "Great start! Keep the momentum going";
      case 2: return "Almost there! One more to complete the day";
      default: return "";
    }
  };
  
  const getProgressIcon = () => {
    if (isAllComplete) return <Trophy className="text-yellow-500" size={20} />;
    if (completedCount === 2) return <Flame className="text-orange-500" size={20} />;
    if (completedCount === 1) return <Star className="text-blue-500" size={20} />;
    return <Heart className="text-gray-400" size={20} />;
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Main Progress Display */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 ${
        isAllComplete 
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-md' 
          : 'bg-white border-blush/10'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getProgressIcon()}
            <span className={`font-serif font-bold ${
              isAllComplete ? 'text-orange-600' : 'text-black'
            }`}>
              Daily Progress
            </span>
          </div>
          <div className="text-sm font-medium text-black/70">
            {completedCount}/3
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                isAllComplete 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                  : 'bg-gradient-feminine'
              }`}
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Progress Message */}
        <div className="text-sm text-black/70 text-center">
          {getProgressMessage()}
        </div>
        
        {/* Individual Task Indicators */}
        <div className="flex justify-center space-x-4 mt-3">
          <div className={`flex items-center space-x-1 text-xs ${
            torahCompleted ? 'text-green-600' : 'text-gray-400'
          }`}>
            {torahCompleted ? <CheckCircle size={16} /> : <div className="w-4 h-4 border border-gray-300 rounded-full" />}
            <span>Torah</span>
          </div>
          <div className={`flex items-center space-x-1 text-xs ${
            tefillaCompleted ? 'text-green-600' : 'text-gray-400'
          }`}>
            {tefillaCompleted ? <CheckCircle size={16} /> : <div className="w-4 h-4 border border-gray-300 rounded-full" />}
            <span>Tefilla</span>
          </div>
          <div className={`flex items-center space-x-1 text-xs ${
            tzedakaCompleted ? 'text-green-600' : 'text-gray-400'
          }`}>
            {tzedakaCompleted ? <CheckCircle size={16} /> : <div className="w-4 h-4 border border-gray-300 rounded-full" />}
            <span>Tzedaka</span>
          </div>
        </div>
      </div>
      
      {/* Celebration Animation */}
      {celebrateCompletion && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl animate-pulse">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Sparkles className="text-yellow-500 animate-bounce" size={32} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}