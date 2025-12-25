import { useLocation } from "wouter";
import { User, BookOpen, Heart, HandCoins, LogOut, Calendar, Trophy, ArrowLeft, Star, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useModalCompletionStore } from "@/lib/types";
import { getLocalDateString } from "@/lib/dateUtils";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import type { Section } from "@/pages/home";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const completedModals = useModalCompletionStore((state) => state.completedModals);
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editHebrewName, setEditHebrewName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  
  const startEditing = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditHebrewName(user?.hebrewName || '');
    setEditBirthday(user?.birthday || '');
    setIsEditing(true);
  };
  
  const cancelEditing = () => {
    setIsEditing(false);
  };
  
  const saveProfile = async () => {
    if (editBirthday) {
      const selectedDate = new Date(editBirthday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        toast({
          title: "Invalid date",
          description: "Birthday cannot be in the future.",
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        hebrewName: editHebrewName.trim(),
        birthday: editBirthday,
      });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      setIsEditing(false);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatBirthday = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };
  
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const stats = useMemo(() => {
    const today = getLocalDateString();
    const allDates = Object.keys(completedModals).sort();
    
    let todayTorah = 0;
    let todayTefilla = 0;
    let todayTzedaka = 0;
    let totalTorah = 0;
    let totalTefilla = 0;
    let totalTzedaka = 0;
    const totalDays = allDates.length;
    
    const countForDay = (dayData: any) => {
      let torah = 0;
      let tefilla = 0;
      let tzedaka = 0;
      
      if (dayData?.repeatables) {
        Object.entries(dayData.repeatables).forEach(([key, value]) => {
          const count = value as number;
          if (key.startsWith('individual-tehillim-') || 
              key.startsWith('chain-tehillim-') ||
              key.startsWith('brocha-') ||
              key.startsWith('womens-prayer-') ||
              key === 'global-tehillim-chain' ||
              key === 'tehillim-text' ||
              key.startsWith('meditation-')) {
            tefilla += count;
          } else if (key === 'tzedaka-daily' || key === 'tzedaka-donation') {
            tzedaka += count;
          }
        });
      }
      
      if (dayData?.singles) {
        dayData.singles.forEach((id: string) => {
          if (id.includes('halacha') || id.includes('chizuk') || id.includes('emuna') || 
              id.includes('story') || id.includes('daily-wisdom')) {
            torah++;
          } else if (id.includes('mincha') || id.includes('shacharis') || id.includes('maariv') ||
                     id.includes('birkat') || id.includes('nishmas') || id.includes('prayer')) {
            tefilla++;
          }
        });
      }
      
      return { torah, tefilla, tzedaka };
    };
    
    Object.entries(completedModals).forEach(([date, dayData]) => {
      const counts = countForDay(dayData);
      totalTorah += counts.torah;
      totalTefilla += counts.tefilla;
      totalTzedaka += counts.tzedaka;
      
      if (date === today) {
        todayTorah = counts.torah;
        todayTefilla = counts.tefilla;
        todayTzedaka = counts.tzedaka;
      }
    });
    
    let currentStreak = 0;
    const todayDate = new Date(today);
    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completedModals[dateStr]) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    const totalMitzvos = totalTorah + totalTefilla + totalTzedaka;
    
    return { 
      todayTorah, todayTefilla, todayTzedaka,
      totalTorah, totalTefilla, totalTzedaka,
      totalDays, currentStreak, totalMitzvos
    };
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
          className="rounded-2xl p-6"
          style={{ 
            background: 'rgba(186, 137, 160, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex justify-end mb-2">
            {!isEditing ? (
              <button 
                onClick={startEditing}
                className="text-blush hover:text-blush/80 p-1"
                data-testid="button-edit-profile"
              >
                <Pencil className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={cancelEditing}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  disabled={isSaving}
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={saveProfile}
                  className="text-green-600 hover:text-green-700 p-1"
                  disabled={isSaving}
                  data-testid="button-save-profile"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="text-center">
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
            
            {!isEditing ? (
              <>
                <h2 className="text-xl font-semibold text-black">
                  {user?.firstName} {user?.lastName}
                </h2>
                {user?.hebrewName && (
                  <p className="text-lg text-gray-700 mt-1" dir="rtl">
                    <Star className="w-4 h-4 inline-block mr-1 text-blush" />
                    {user.hebrewName}
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
                {user?.birthday && (
                  <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatBirthday(user.birthday)}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="First name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="bg-white"
                    data-testid="input-edit-first-name"
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="bg-white"
                    data-testid="input-edit-last-name"
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Hebrew name"
                  value={editHebrewName}
                  onChange={(e) => setEditHebrewName(e.target.value)}
                  className="bg-white"
                  dir="rtl"
                  data-testid="input-edit-hebrew-name"
                />
                <Input
                  type="date"
                  placeholder="Birthday"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  max={getTodayString()}
                  className="bg-white"
                  data-testid="input-edit-birthday"
                />
              </div>
            )}
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
            <Trophy className="w-5 h-5 text-blush" />
            Today's Progress
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-black">{stats.todayTorah}</div>
              <div className="text-xs text-gray-600">Torah</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="text-2xl font-bold text-black">{stats.todayTefilla}</div>
              <div className="text-xs text-gray-600">Tefilla</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <HandCoins className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-black">{stats.todayTzedaka}</div>
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
            <Trophy className="w-5 h-5 text-amber-500" />
            All-Time Stats
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.totalTorah}</div>
              <div className="text-xs text-gray-600">Torah</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.totalTefilla}</div>
              <div className="text-xs text-gray-600">Tefilla</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalTzedaka}</div>
              <div className="text-xs text-gray-600">Tzedaka</div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blush">{stats.totalMitzvos}</div>
              <div className="text-sm text-gray-600">Total Mitzvos Completed</div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{stats.currentStreak}</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-black">{stats.totalDays}</div>
              <div className="text-xs text-gray-600">Total Active Days</div>
            </div>
          </div>
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
