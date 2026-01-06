import { useLocation } from "wouter";
import { BookOpen, Heart, HandCoins, LogOut, Calendar, Trophy, ArrowLeft, Star, Pencil, Check, X, Flame, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useModalCompletionStore } from "@/lib/types";
import { getLocalDateString } from "@/lib/dateUtils";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/bottom-navigation";
import type { Section } from "@/pages/home";
import sectionMorningBg from "@assets/Morning_Background_1767032607494.png";
import sectionAfternoonBg from "@assets/Afternoon_Background_1767032607493.png";
import sectionNightBg from "@assets/background_night_1767034895431.png";

const getTimeBasedBackground = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return sectionMorningBg;
  if (hour >= 12 && hour < 18) return sectionAfternoonBg;
  return sectionNightBg;
};

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const completedModals = useModalCompletionStore((state) => state.completedModals);
  const { toast } = useToast();
  
  const [backgroundImage, setBackgroundImage] = useState(getTimeBasedBackground);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundImage(getTimeBasedBackground());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editHebrewName, setEditHebrewName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editAfterSunset, setEditAfterSunset] = useState(false);
  
  const startEditing = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditHebrewName(user?.hebrewName || '');
    setEditBirthday(user?.birthday || '');
    setEditAfterSunset(user?.birthdayAfterSunset || false);
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
        birthdayAfterSunset: editAfterSunset,
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

  const { data: hebrewBirthday } = useQuery({
    queryKey: ['/api/hebrew-date/birthday', user?.birthday, user?.birthdayAfterSunset],
    enabled: !!user?.birthday,
    queryFn: async (): Promise<{ hebrew: string } | null> => {
      if (!user?.birthday) return null;
      const [year, month, day] = user.birthday.split('-').map(Number);
      const afterSunset = user.birthdayAfterSunset ? 1 : 0;
      const res = await fetch(
        `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1&gs=${afterSunset}`
      );
      if (!res.ok) throw new Error('Failed to fetch Hebrew date');
      const data = await res.json();
      return { hebrew: data.hebrew as string };
    },
    staleTime: Infinity,
  });
  
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
    let todayLife = 0;
    let totalTorah = 0;
    let totalTefilla = 0;
    let totalTzedaka = 0;
    let totalLife = 0;
    const totalDays = allDates.length;
    
    // Get tzedaka button completions from separate storage
    const tzedakaButtonCompletions = JSON.parse(localStorage.getItem('tzedaka_button_completions') || '{}');
    
    const countForDay = (dayData: any, date: string) => {
      let torah = 0;
      let tefilla = 0;
      let tzedaka = 0;
      let life = 0;
      
      if (dayData?.repeatables) {
        Object.entries(dayData.repeatables).forEach(([key, value]) => {
          const count = value as number;
          // Torah content (matching analytics: torah, chizuk, emuna, halacha, featured, parsha-vort, pirkei-avot, gems-of-gratitude, torah-class, torah-challenge)
          if (key === 'halacha' || key === 'chizuk' || key === 'emuna' || 
              key === 'featured' || key === 'pirkei-avot' || key === 'gems-of-gratitude' ||
              key === 'torah-challenge' || key === 'parsha-vort' || key.includes('story') || 
              key.includes('daily-wisdom') || key.includes('torah-class')) {
            torah += count;
          }
          // Tefilla content (matching analytics: individual-tehillim-*, chain-tehillim-*, brocha-*, womens-prayer-*, global-tehillim-chain, tehillim-text, meditation-*, al-hamichiya, birkat-hamazon, nishmas-campaign, special-tehillim)
          else if (key.startsWith('individual-tehillim-') || 
              key.startsWith('chain-tehillim-') ||
              key.startsWith('brocha-') ||
              key.startsWith('womens-prayer-') ||
              key === 'global-tehillim-chain' ||
              key === 'tehillim-text' ||
              key === 'special-tehillim' ||
              key.startsWith('meditation-') ||
              key === 'al-hamichiya' ||
              key === 'birkat-hamazon' ||
              key === 'nishmas-campaign') {
            tefilla += count;
          } 
          // Tzedaka content
          else if (key.startsWith('tzedaka-') || key === 'tzedaka' || key === 'donate') {
            tzedaka += count;
          }
          // Life content (matching analytics: life-class, marriage-insights, recipe, gift-of-chatzos)
          else if (key === 'marriage-insights' || key === 'gift-of-chatzos' || key === 'life-class' || key === 'recipe') {
            life += count;
          }
        });
      }
      
      // Singles are only for morning-brochas, mincha, maariv
      if (dayData?.singles) {
        dayData.singles.forEach((id: string) => {
          if (id === 'mincha' || id === 'morning-brochas' || id === 'maariv') {
            tefilla++;
          }
        });
      }
      
      // Add tzedaka from separate storage for this date
      const dayTzedakaData = tzedakaButtonCompletions[date];
      if (dayTzedakaData) {
        tzedaka += dayTzedakaData.gave_elsewhere_count || 0;
        if (dayTzedakaData.put_a_coin) tzedaka++;
        if (dayTzedakaData.sponsor_a_day) tzedaka++;
        if (dayTzedakaData.active_campaign) tzedaka++;
      }
      
      return { torah, tefilla, tzedaka, life };
    };
    
    // Combine dates from both storages
    const tzedakaDates = Object.keys(tzedakaButtonCompletions);
    const allUniqueDates = Array.from(new Set([...allDates, ...tzedakaDates])).sort();
    
    allUniqueDates.forEach((date) => {
      const dayData = completedModals[date] || {};
      const counts = countForDay(dayData, date);
      totalTorah += counts.torah;
      totalTefilla += counts.tefilla;
      totalTzedaka += counts.tzedaka;
      totalLife += counts.life;
      
      if (date === today) {
        todayTorah = counts.torah;
        todayTefilla = counts.tefilla;
        todayTzedaka = counts.tzedaka;
        todayLife = counts.life;
      }
    });
    
    let currentStreak = 0;
    const todayDate = new Date(today);
    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completedModals[dateStr] || tzedakaButtonCompletions[dateStr]) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    const totalMitzvos = totalTorah + totalTefilla + totalTzedaka + totalLife;
    
    return { 
      todayTorah, todayTefilla, todayTzedaka, todayLife,
      totalTorah, totalTefilla, totalTzedaka, totalLife,
      totalDays, currentStreak, totalMitzvos
    };
  }, [completedModals]);
  
  const handleSectionChange = (section: Section) => {
    setLocation(`/${section === 'home' ? '' : section}`);
  };
  
  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)'
          }}
        />
        <div className="relative w-12 h-12 border-4 border-blush border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)'
        }}
      />
      
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-4"
        style={{ 
          paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
          background: 'rgba(255,255,255,0.7)',
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
      
      <div className="relative p-3 pb-40 space-y-2" style={{ paddingTop: 'calc(var(--safe-area-top, 0px) + 80px)' }}>
        <div 
          className="rounded-2xl p-3 border border-white/30"
          style={{ 
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          {!isEditing ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="platypi-bold text-lg text-black">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  {user?.hebrewName && (
                    <p className="font-hebrew text-sm text-black/70 mt-0.5" dir="rtl">
                      <Star className="w-3 h-3 inline-block ml-1 text-amber-500" />
                      {user.hebrewName}
                    </p>
                  )}
                </div>
                <button 
                  onClick={startEditing}
                  className="p-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors shadow-sm"
                  data-testid="button-edit-profile"
                >
                  <Pencil className="w-4 h-4 text-blush" />
                </button>
              </div>
              <p className="platypi-regular text-xs text-black/50 mt-2 truncate">{user?.email}</p>
              {user?.birthday && (
                <p className="platypi-regular text-xs text-black/50 flex items-center gap-1 mt-1 flex-wrap">
                  <Calendar className="w-3 h-3" />
                  <span>{formatBirthday(user.birthday)}</span>
                  {hebrewBirthday?.hebrew && (
                    <>
                      <span className="text-black/30">•</span>
                      <span className="font-hebrew">{hebrewBirthday.hebrew}</span>
                    </>
                  )}
                </p>
              )}
            </div>
          ) : (
            <div>
                <div className="flex justify-end mb-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={cancelEditing}
                      className="p-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors shadow-sm"
                      disabled={isSaving}
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      onClick={saveProfile}
                      className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors shadow-sm"
                      disabled={isSaving}
                      data-testid="button-save-profile"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="First name"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="bg-white/80 border-blush/20 rounded-xl text-sm"
                      data-testid="input-edit-first-name"
                    />
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="bg-white/80 border-blush/20 rounded-xl text-sm"
                      data-testid="input-edit-last-name"
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Hebrew name"
                    value={editHebrewName}
                    onChange={(e) => setEditHebrewName(e.target.value)}
                    className="bg-white/80 border-blush/20 rounded-xl text-sm font-hebrew"
                    dir="rtl"
                    data-testid="input-edit-hebrew-name"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      placeholder="Birthday"
                      value={editBirthday}
                      onChange={(e) => setEditBirthday(e.target.value)}
                      max={getTodayString()}
                      className="bg-white/80 border-blush/20 rounded-xl text-sm flex-1"
                      data-testid="input-edit-birthday"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditAfterSunset(!editAfterSunset)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          editAfterSunset 
                            ? 'bg-blush border-blush' 
                            : 'bg-white/80 border-blush/40'
                        }`}
                        data-testid="checkbox-after-sunset"
                      >
                        {editAfterSunset && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <label 
                        onClick={() => setEditAfterSunset(!editAfterSunset)}
                        className="platypi-regular text-[10px] text-black/60 cursor-pointer whitespace-nowrap"
                      >
                        After sunset
                      </label>
                    </div>
                  </div>
                </div>
            </div>
          )}
        </div>
        
        <div 
          className="rounded-2xl p-3 border border-white/30"
          style={{ 
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <h3 className="platypi-bold text-xs text-black mb-2 flex items-center gap-1.5">
            <div className="p-1 rounded-full bg-gradient-feminine">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            Today's Progress
          </h3>
          
          <div className="grid grid-cols-4 gap-1">
            <div className="bg-blush/10 rounded-lg p-1.5 text-center">
              <div className="w-5 h-5 rounded-full bg-blush/20 flex items-center justify-center mx-auto mb-0.5">
                <BookOpen className="w-2.5 h-2.5 text-blush" />
              </div>
              <div className="platypi-bold text-base text-black">{stats.todayTorah}</div>
              <div className="platypi-regular text-[8px] text-black/60">Torah</div>
            </div>
            
            <div className="bg-lavender/10 rounded-lg p-1.5 text-center">
              <div className="w-5 h-5 rounded-full bg-lavender/20 flex items-center justify-center mx-auto mb-0.5">
                <Heart className="w-2.5 h-2.5 text-lavender" />
              </div>
              <div className="platypi-bold text-base text-black">{stats.todayTefilla}</div>
              <div className="platypi-regular text-[8px] text-black/60">Tefilla</div>
            </div>
            
            <div className="bg-sage/10 rounded-lg p-1.5 text-center">
              <div className="w-5 h-5 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-0.5">
                <HandCoins className="w-2.5 h-2.5 text-sage" />
              </div>
              <div className="platypi-bold text-base text-black">{stats.todayTzedaka}</div>
              <div className="platypi-regular text-[8px] text-black/60">Tzedaka</div>
            </div>
            
            <div className="bg-black/5 rounded-lg p-1.5 text-center">
              <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-0.5">
                <Star className="w-2.5 h-2.5 text-black/60" />
              </div>
              <div className="platypi-bold text-base text-black">{stats.todayLife}</div>
              <div className="platypi-regular text-[8px] text-black/60">Life</div>
            </div>
          </div>
        </div>
        
        <div 
          className="rounded-2xl p-3 border border-white/30"
          style={{ 
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <h3 className="platypi-bold text-xs text-black mb-2 flex items-center gap-1.5">
            <div className="p-1 rounded-full bg-gradient-feminine">
              <Trophy className="w-3 h-3 text-white" />
            </div>
            All-Time Stats
          </h3>
          
          <div className="grid grid-cols-4 gap-1 mb-2">
            <div className="bg-blush/10 rounded-lg p-1.5 text-center">
              <div className="platypi-bold text-base text-blush">{stats.totalTorah}</div>
              <div className="platypi-regular text-[8px] text-black/60">Torah</div>
            </div>
            <div className="bg-lavender/10 rounded-lg p-1.5 text-center">
              <div className="platypi-bold text-base text-lavender">{stats.totalTefilla}</div>
              <div className="platypi-regular text-[8px] text-black/60">Tefilla</div>
            </div>
            <div className="bg-sage/10 rounded-lg p-1.5 text-center">
              <div className="platypi-bold text-base text-sage">{stats.totalTzedaka}</div>
              <div className="platypi-regular text-[8px] text-black/60">Tzedaka</div>
            </div>
            <div className="bg-black/5 rounded-lg p-1.5 text-center">
              <div className="platypi-bold text-base text-black">{stats.totalLife}</div>
              <div className="platypi-regular text-[8px] text-black/60">Life</div>
            </div>
          </div>
          
          <div className="bg-gradient-feminine rounded-lg p-3 text-center shadow-lg">
            <div className="platypi-bold text-2xl text-white">{stats.totalMitzvos}</div>
            <div className="platypi-regular text-xs text-white/90">Total Mitzvos Completed</div>
          </div>
        </div>
        
        <div 
          className="rounded-2xl p-3 border border-white/30"
          style={{ 
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <h3 className="platypi-bold text-xs text-black mb-2 flex items-center gap-1.5">
            <div className="p-1 rounded-full bg-gradient-feminine">
              <Flame className="w-3 h-3 text-white" />
            </div>
            Your Journey
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blush/20 to-blush/10 rounded-lg p-3 text-center">
              <div className="platypi-bold text-2xl text-blush">{stats.currentStreak}</div>
              <div className="platypi-regular text-[10px] text-black/60">Day Streak</div>
            </div>
            <div className="bg-gradient-to-br from-lavender/20 to-lavender/10 rounded-lg p-3 text-center">
              <div className="platypi-bold text-2xl text-lavender">{stats.totalDays}</div>
              <div className="platypi-regular text-[10px] text-black/60">Active Days</div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="w-full rounded-lg p-2.5 border border-white/30 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          style={{ 
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          data-testid="button-sign-out"
        >
          <LogOut className="w-4 h-4 text-black/50" />
          <span className="platypi-regular text-sm text-black/60">Sign Out</span>
        </button>
      </div>
      
      <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
    </div>
  );
}
