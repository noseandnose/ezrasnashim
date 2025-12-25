import { useLocation } from "wouter";
import { User, BookOpen, Heart, HandCoins, LogOut, Calendar, Trophy, ArrowLeft, Star, Pencil, Check, X, Flame, Sparkles } from "lucide-react";
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          background: 'linear-gradient(180deg, hsl(350, 45%, 98%) 0%, hsl(260, 30%, 98%) 50%, hsl(350, 45%, 96%) 100%)'
        }}
      >
        <div className="animate-pulse text-black/60">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen"
        style={{ 
          background: 'linear-gradient(180deg, hsl(350, 45%, 98%) 0%, hsl(260, 30%, 98%) 50%, hsl(350, 45%, 96%) 100%)'
        }}
      >
        <header 
          className="fixed top-0 left-0 right-0 z-50 px-4"
          style={{ 
            paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
            background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
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
            <h1 className="flex-1 text-center platypi-bold text-black">My Profile</h1>
            <div className="w-9" />
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center p-6 pt-28 pb-28">
          <div 
            className="w-full max-w-sm rounded-3xl p-8 text-center border border-blush/10"
            style={{ 
              background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-feminine flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="platypi-bold text-xl text-black mb-2">Create Your Profile</h2>
            <p className="platypi-regular text-sm text-black/60 mb-6">
              Sign in to save your progress across devices and access personalized features.
            </p>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full bg-gradient-feminine hover:opacity-90 text-white rounded-xl py-3 platypi-bold"
              data-testid="button-login"
            >
              Sign In to Get Started
            </Button>
          </div>
        </div>
        <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: 'linear-gradient(180deg, hsl(350, 45%, 98%) 0%, hsl(260, 30%, 98%) 50%, hsl(350, 45%, 96%) 100%)'
      }}
    >
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-4"
        style={{ 
          paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
          background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
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
          <h1 className="flex-1 text-center platypi-bold text-black">My Profile</h1>
          <div className="w-9" />
        </div>
      </header>
      
      <div className="p-4 pt-24 pb-28 space-y-4">
        <div 
          className="rounded-3xl p-4 border border-blush/10"
          style={{ 
            background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}
        >
          {!isEditing ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="platypi-bold text-lg text-black">
                  {user?.firstName} {user?.lastName}
                </h2>
                {user?.hebrewName && (
                  <p className="platypi-regular text-sm text-black/70" dir="rtl">
                    <Star className="w-3 h-3 inline-block mr-1 text-amber-500" />
                    {user.hebrewName}
                  </p>
                )}
                <p className="platypi-regular text-xs text-black/50">{user?.email}</p>
                {user?.birthday && (
                  <p className="platypi-regular text-xs text-black/50 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatBirthday(user.birthday)}
                  </p>
                )}
              </div>
              <button 
                onClick={startEditing}
                className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors"
                data-testid="button-edit-profile"
              >
                <Pencil className="w-4 h-4 text-blush" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-3">
                <div className="flex gap-2">
                  <button 
                    onClick={cancelEditing}
                    className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors"
                    disabled={isSaving}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    onClick={saveProfile}
                    className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
                    disabled={isSaving}
                    data-testid="button-save-profile"
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="text"
                    placeholder="First name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="bg-white/70 border-blush/20 rounded-xl"
                    data-testid="input-edit-first-name"
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="bg-white/70 border-blush/20 rounded-xl"
                    data-testid="input-edit-last-name"
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Hebrew name"
                  value={editHebrewName}
                  onChange={(e) => setEditHebrewName(e.target.value)}
                  className="bg-white/70 border-blush/20 rounded-xl"
                  dir="rtl"
                  data-testid="input-edit-hebrew-name"
                />
                <Input
                  type="date"
                  placeholder="Birthday"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  max={getTodayString()}
                  className="bg-white/70 border-blush/20 rounded-xl"
                  data-testid="input-edit-birthday"
                />
              </div>
            </div>
          )}
        </div>
        
        <div 
          className="rounded-3xl p-5 border border-blush/10"
          style={{ 
            background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}
        >
          <h3 className="platypi-bold text-base text-black mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-gradient-feminine">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            Today's Progress
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-2xl p-3 text-center border border-blush/10">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div className="platypi-bold text-2xl text-black">{stats.todayTorah}</div>
              <div className="platypi-regular text-xs text-black/60">Torah</div>
            </div>
            
            <div className="bg-white/70 rounded-2xl p-3 text-center border border-blush/10">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div className="platypi-bold text-2xl text-black">{stats.todayTefilla}</div>
              <div className="platypi-regular text-xs text-black/60">Tefilla</div>
            </div>
            
            <div className="bg-white/70 rounded-2xl p-3 text-center border border-blush/10">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <HandCoins className="w-5 h-5 text-green-600" />
              </div>
              <div className="platypi-bold text-2xl text-black">{stats.todayTzedaka}</div>
              <div className="platypi-regular text-xs text-black/60">Tzedaka</div>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-3xl p-5 border border-blush/10"
          style={{ 
            background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}
        >
          <h3 className="platypi-bold text-base text-black mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-500">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            All-Time Stats
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/70 rounded-2xl p-3 text-center border border-blush/10">
              <div className="platypi-bold text-xl text-amber-600">{stats.totalTorah}</div>
              <div className="platypi-regular text-xs text-black/60">Torah</div>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 text-center border border-blush/10">
              <div className="platypi-bold text-xl text-pink-600">{stats.totalTefilla}</div>
              <div className="platypi-regular text-xs text-black/60">Tefilla</div>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 text-center border border-blush/10">
              <div className="platypi-bold text-xl text-green-600">{stats.totalTzedaka}</div>
              <div className="platypi-regular text-xs text-black/60">Tzedaka</div>
            </div>
          </div>
          
          <div className="bg-gradient-feminine rounded-2xl p-4 text-center">
            <div className="platypi-bold text-3xl text-white">{stats.totalMitzvos}</div>
            <div className="platypi-regular text-sm text-white/80">Total Mitzvos Completed</div>
          </div>
        </div>
        
        <div 
          className="rounded-3xl p-5 border border-blush/10"
          style={{ 
            background: 'linear-gradient(180deg, rgba(186,137,160,0.12) 0%, rgba(186,137,160,0.06) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}
        >
          <h3 className="platypi-bold text-base text-black mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-blush">
              <Flame className="w-4 h-4 text-white" />
            </div>
            Your Journey
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-2xl p-4 text-center border border-blush/10">
              <div className="platypi-bold text-3xl text-blush">{stats.currentStreak}</div>
              <div className="platypi-regular text-xs text-black/60">Day Streak</div>
            </div>
            <div className="bg-white/70 rounded-2xl p-4 text-center border border-blush/10">
              <div className="platypi-bold text-3xl text-blush">{stats.totalDays}</div>
              <div className="platypi-regular text-xs text-black/60">Total Active Days</div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="w-full bg-white/70 rounded-2xl p-4 border border-blush/10 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          data-testid="button-sign-out"
        >
          <LogOut className="w-4 h-4 text-black/60" />
          <span className="platypi-regular text-sm text-black/60">Sign Out</span>
        </button>
      </div>
      
      <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
    </div>
  );
}
