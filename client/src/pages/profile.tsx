import { useLocation } from "wouter";
import { User, BookOpen, Heart, HandCoins, LogOut, Calendar, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useModalCompletionStore } from "@/lib/types";
import { getLocalDateString } from "@/lib/dateUtils";
import { useMemo } from "react";
import BottomNavigation from "@/components/bottom-navigation";
import type { Section } from "@/pages/home";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const completedModals = useModalCompletionStore((state) => state.completedModals);
  
  const stats = useMemo(() => {
    const today = getLocalDateString();
    const todaysData = completedModals[today];
    
    let torahCount = 0;
    let tefillaCount = 0;
    let tzedakaCount = 0;
    const totalDays = Object.keys(completedModals).length;
    
    if (todaysData?.repeatables) {
      Object.entries(todaysData.repeatables).forEach(([key, value]) => {
        if (key.startsWith('individual-tehillim-') || 
            key.startsWith('chain-tehillim-') ||
            key.startsWith('brocha-') ||
            key.startsWith('womens-prayer-') ||
            key === 'global-tehillim-chain' ||
            key === 'tehillim-text' ||
            key.startsWith('meditation-')) {
          tefillaCount += value;
        } else if (key === 'tzedaka-daily' || key === 'tzedaka-donation') {
          tzedakaCount += value;
        }
      });
    }
    
    if (todaysData?.singles) {
      todaysData.singles.forEach((id: string) => {
        if (id.includes('halacha') || id.includes('chizuk') || id.includes('emuna') || 
            id.includes('story') || id.includes('daily-wisdom')) {
          torahCount++;
        } else if (id.includes('mincha') || id.includes('shacharis') || id.includes('maariv') ||
                   id.includes('birkat') || id.includes('nishmas') || id.includes('prayer')) {
          tefillaCount++;
        }
      });
    }
    
    return { torahCount, tefillaCount, tzedakaCount, totalDays };
  }, [completedModals]);
  
  const handleSectionChange = (section: Section) => {
    setLocation(`/${section === 'home' ? '' : section}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2DDD4] to-[#E4C5B8] flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2DDD4] to-[#E4C5B8]">
        <header 
          className="fixed top-0 left-0 right-0 z-50 px-4"
          style={{ 
            paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
            background: 'rgba(186, 137, 160, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center h-12">
            <button 
              onClick={() => setLocation("/")} 
              className="p-2 -ml-2 text-black"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-black">My Profile</h1>
            <div className="w-9" />
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center p-8 pt-24">
          <User className="w-16 h-16 text-blush mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">Create Your Profile</h2>
          <p className="text-gray-600 text-center mb-6">
            Sign in to save your progress across devices and access personalized features.
          </p>
          <Button 
            onClick={() => setLocation('/login')}
            className="bg-blush hover:bg-blush/90 text-white px-8 py-3"
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>
        <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2DDD4] to-[#E4C5B8]">
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-4"
        style={{ 
          paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
          background: 'rgba(186, 137, 160, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-center h-12">
          <button 
            onClick={() => setLocation("/")} 
            className="p-2 -ml-2 text-black"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-black">My Profile</h1>
          <div className="w-9" />
        </div>
      </header>
      
      <div className="p-4 pt-24 pb-28 space-y-6">
        <div 
          className="rounded-2xl p-6 text-center"
          style={{ 
            background: 'rgba(186, 137, 160, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div className="w-20 h-20 rounded-full bg-blush/20 flex items-center justify-center mx-auto mb-4">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={user.firstName || 'Profile'} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-blush" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-black">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-gray-600 text-sm">{user?.email}</p>
        </div>
        
        <div 
          className="rounded-2xl p-6"
          style={{ 
            background: 'rgba(186, 137, 160, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blush" />
            Today's Progress
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-black">{stats.torahCount}</div>
              <div className="text-xs text-gray-600">Torah</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="text-2xl font-bold text-black">{stats.tefillaCount}</div>
              <div className="text-xs text-gray-600">Tefilla</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <HandCoins className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-black">{stats.tzedakaCount}</div>
              <div className="text-xs text-gray-600">Tzedaka</div>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-2xl p-6"
          style={{ 
            background: 'rgba(186, 137, 160, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blush" />
            Your Journey
          </h3>
          <p className="text-gray-600 text-sm">
            You've been active for <span className="font-semibold text-black">{stats.totalDays}</span> days on Ezras Nashim.
          </p>
        </div>
        
        <Button 
          variant="outline"
          onClick={() => logout()}
          className="w-full border-gray-300 text-gray-600 hover:text-gray-800"
          data-testid="button-sign-out"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
      
      <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
    </div>
  );
}
