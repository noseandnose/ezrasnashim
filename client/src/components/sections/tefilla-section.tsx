import { Scroll, Clock, HandHeart, Plus, CheckCircle, User, AlertCircle, Calendar, Heart, ChevronRight, BookOpen, Sparkles, Star, Timer, Settings, Shield, Home, Compass, ArrowRight, Baby, HeartHandshake, Briefcase, GraduationCap, Users, Stethoscope, DollarSign, UserCheck, Smile, Zap, TrendingUp, Crown } from "lucide-react";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import type { Section } from "@/pages/home";

interface TefillaSectionProps {
  onSectionChange?: (section: Section) => void;
}
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { TehillimName, GlobalTehillimProgress } from "@shared/schema";

export default function TefillaSection({ onSectionChange }: TefillaSectionProps) {
  const { openModal } = useModalStore();
  const { tefillaCompleted } = useDailyCompletionStore();
  const { isModalComplete } = useModalCompletionStore();
  const { data: times, isLoading } = useJewishTimes();

  // Time-based prayer logic
  const getCurrentPrayer = () => {
    if (!times || isLoading) {
      return { title: "Morning Brochas", subtitle: "Loading times...", modal: "morning-brochas" };
    }

    const now = new Date();
    const neitz = new Date(`${now.toDateString()} ${times.sunrise}`);
    const minchaGedola = new Date(`${now.toDateString()} ${times.minchaGedolah}`);
    const shkia = new Date(`${now.toDateString()} ${times.shkia}`);
    
    // Calculate next day's neitz for Maariv end time
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (now >= neitz && now < minchaGedola) {
      // Morning Brochas time
      return {
        title: "Morning Brochas",
        subtitle: `${times.sunrise} - ${times.minchaGedolah}`,
        modal: "morning-brochas"
      };
    } else if (now >= minchaGedola && now < shkia) {
      // Mincha time
      return {
        title: "Mincha",
        subtitle: `${times.minchaGedolah} - ${times.shkia}`,
        modal: "mincha"
      };
    } else {
      // Maariv time (from Shkia until next morning's Neitz)
      return {
        title: "Maariv",
        subtitle: `${times.shkia} - ${times.sunrise}`,
        modal: "maariv"
      };
    }
  };

  const currentPrayer = getCurrentPrayer();

  // Helper functions for reason icons and short text
  const getReasonIcon = (reason: string, reasonEnglish?: string) => {
    // Map Hebrew reasons and English translations to icons
    const reasonToCode = (r: string, eng?: string): string => {
      if (r === "רפואה שלמה" || eng === "Complete Healing") return "health";
      if (r === "שידוך" || eng === "Finding a mate") return "shidduch";
      if (r === "זרע של קיימא" || eng === "Children") return "children";
      if (r === "פרנסה" || eng === "Livelihood") return "parnassa";
      if (r === "הצלחה" || eng === "Success") return "success";
      if (r === "שלום בית" || eng === "Family") return "family";
      if (r === "חכמה" || eng === "Education") return "education";
      if (r === "עליית נשמה" || eng === "Peace") return "peace";
      return "general";
    };
    
    const code = reasonToCode(reason, reasonEnglish);
    const iconMap: Record<string, JSX.Element> = {
      'health': <Stethoscope size={12} className="text-red-500" />,
      'shidduch': <HeartHandshake size={12} className="text-pink-500" />,
      'children': <Baby size={12} className="text-blue-500" />,
      'parnassa': <DollarSign size={12} className="text-green-500" />,
      'success': <Star size={12} className="text-yellow-500" />,
      'family': <Users size={12} className="text-purple-500" />,
      'education': <GraduationCap size={12} className="text-indigo-500" />,
      'peace': <Smile size={12} className="text-teal-500" />,
      'general': <Heart size={12} className="text-blush" />
    };
    
    return iconMap[code];
  };

  const getReasonShort = (reason: string, reasonEnglish?: string) => {
    // Map Hebrew reasons and English translations to short text
    const reasonToCode = (r: string, eng?: string): string => {
      if (r === "רפואה שלמה" || eng === "Complete Healing") return "health";
      if (r === "שידוך" || eng === "Finding a mate") return "shidduch";
      if (r === "זרע של קיימא" || eng === "Children") return "children";
      if (r === "פרנסה" || eng === "Livelihood") return "parnassa";
      if (r === "הצלחה" || eng === "Success") return "success";
      if (r === "שלום בית" || eng === "Family") return "family";
      if (r === "חכמה" || eng === "Education") return "education";
      if (r === "עליית נשמה" || eng === "Peace") return "peace";
      return "general";
    };
    
    const code = reasonToCode(reason, reasonEnglish);
    const shortMap: Record<string, string> = {
      'health': 'Health',
      'shidduch': 'Match',
      'children': 'Kids',
      'parnassa': 'Income',
      'success': 'Success',
      'family': 'Family',
      'education': 'Study',
      'peace': 'Peace',
      'general': 'Prayer'
    };
    
    return shortMap[code];
  };
  const queryClient = useQueryClient();
  
  // Local state management
  const [hebrewName, setHebrewName] = useState("");
  const [reason, setReason] = useState("");
  const [reasonEnglish, setReasonEnglish] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHebrew, setShowHebrew] = useState(true);

  // Fetch global Tehillim progress
  const { data: progress } = useQuery<GlobalTehillimProgress>({
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/progress`).then(res => res.json()),
    queryKey: ['/api/tehillim/progress'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch current name for the perek - Only update when perek is completed
  const { data: currentName } = useQuery<TehillimName | null>({
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/current-name`).then(res => res.json()),
    queryKey: ['/api/tehillim/current-name'],
    refetchInterval: false, // Disable automatic refresh - only when perek is completed
  });

  // Fetch all active names for count display
  const { data: allNames } = useQuery<TehillimName[]>({
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/names`).then(res => res.json()),
    queryKey: ['/api/tehillim/names'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch Tehillim preview (first line) for display
  const { data: tehillimPreview, isLoading: isPreviewLoading } = useQuery<{preview: string; perek: number; language: string}>({
    queryKey: ['/api/tehillim/preview', progress?.currentPerek],
    queryFn: () => fetch(`/api/tehillim/preview/${progress?.currentPerek}?language=hebrew`).then(res => res.json()),
    enabled: !!progress?.currentPerek,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  // Mutation to complete a perek
  const completePerekMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim/complete`, { completedBy: 'user' });
    },
    onSuccess: () => {
      toast({
        title: "Perek Completed!",
        description: `Perek ${progress?.currentPerek || 'current'} has been completed. Moving to the next perek.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete perek. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to add a new name
  const addNameMutation = useMutation({
    mutationFn: async (data: { hebrewName: string; reason: string; reasonEnglish?: string }) => {
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim/names`, data);
    },
    onSuccess: () => {
      toast({
        title: "Name Added Successfully",
        description: "The name has been added to the Tehillim cycle and will be removed automatically after 18 days.",
      });
      setHebrewName("");
      setReason("");
      setReasonEnglish("");
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/names'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add name. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddName = () => {
    if (!hebrewName.trim() || !reason.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in both the Hebrew name and reason fields.",
        variant: "destructive"
      });
      return;
    }

    addNameMutation.mutate({
      hebrewName: hebrewName.trim(),
      reason: reason.trim(),
      reasonEnglish: reasonEnglish.trim() || undefined
    });
  };

  const completePerek = () => {
    completePerekMutation.mutate();
  };

  // Reason options for the dropdown with proper icons
  const reasonOptions = [
    { 
      value: "health", 
      label: "רפואה שלמה (Complete Healing)", 
      english: "Health",
      icon: <Stethoscope size={16} className="text-red-500" />
    },
    { 
      value: "children", 
      label: "זרע של קיימא (Children)", 
      english: "Children",
      icon: <Baby size={16} className="text-blue-500" />
    },
    { 
      value: "shidduch", 
      label: "שידוך הגון (Good Match)", 
      english: "Match",
      icon: <Heart size={16} className="text-pink-500" />
    },
    { 
      value: "parnassa", 
      label: "פרנסה טובה (Good Livelihood)", 
      english: "Income",
      icon: <DollarSign size={16} className="text-green-500" />
    },
    { 
      value: "success", 
      label: "הצלחה (Success)", 
      english: "Success",
      icon: <TrendingUp size={16} className="text-yellow-500" />
    },
    { 
      value: "family", 
      label: "שלום בית (Peace in Home)", 
      english: "Family",
      icon: <Users size={16} className="text-purple-500" />
    },
    { 
      value: "peace", 
      label: "עליית נשמה (Soul Elevation)", 
      english: "Peace",
      icon: <Smile size={16} className="text-teal-500" />
    }
  ];

  const getTehillimText = (perekNumber: number, isHebrew: boolean) => {
    // Authentic Tehillim texts for the first few perakim
    const tehillimTexts: Record<number, { hebrew: string; english: string }> = {
      1: {
        hebrew: "אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים וּבְדֶרֶךְ חַטָּאִים לֹא עָמָד וּבְמוֹשַׁב לֵצִים לֹא יָשָׁב׃ כִּי אִם בְּתוֹרַת יְהוָה חֶפְצוֹ וּבְתוֹרָתוֹ יֶהְגֶּה יוֹמָם וָלָיְלָה׃",
        english: "Happy is the man who has not walked in the counsel of the wicked, nor stood in the way of sinners, nor sat in the seat of scorners. But his delight is in the law of the Lord, and in His law he meditates day and night."
      },
      2: {
        hebrew: "לָמָּה רָגְשׁוּ גוֹיִם וּלְאֻמִּים יֶהְגּוּ רִיק׃ יִתְיַצְּבוּ מַלְכֵי אֶרֶץ וְרוֹזְנִים נוֹסְדוּ יָחַד עַל יְהוָה וְעַל מְשִׁיחוֹ׃",
        english: "Why do the nations rage, and the peoples plot in vain? The kings of the earth set themselves, and the rulers take counsel together, against the Lord and against His anointed."
      },
      3: {
        hebrew: "מִזְמוֹר לְדָוִד בְּבָרְחוֹ מִפְּנֵי אַבְשָׁלוֹם בְּנוֹ׃ יְהוָה מָה רַבּוּ צָרָי רַבִּים קָמִים עָלָי׃",
        english: "A Psalm of David, when he fled from Absalom his son. Lord, how many are my foes! Many are rising against me."
      }
    };

    const text = tehillimTexts[perekNumber];
    if (!text) {
      return (
        <div className="text-sm text-gray-600 italic text-center">
          {isHebrew ? `פרק ${perekNumber} - טקסט מלא זמין בספר תהלים` : `Perek ${perekNumber} - Full text available in Tehillim book`}
        </div>
      );
    }

    return (
      <div className={`text-sm leading-relaxed ${isHebrew ? 'text-right david-libre-regular' : 'font-english'}`}>
        {isHebrew ? text.hebrew : text.english}
      </div>
    );
  };

  const getTehillimFirstLine = (perekNumber: number) => {
    const tehillimTexts: Record<number, string> = {
      1: "אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים...",
      2: "לָמָּה רָגְשׁוּ גוֹיִם וּלְאֻמִּים יֶהְגּוּ רִיק...",
      3: "מִזְמוֹר לְדָוִד בְּבָרְחוֹ מִפְּנֵי אַבְשָׁלוֹם בְּנוֹ...",
      11: "בַּיהוָה חָסִיתִי אֵיךְ תֹּאמְרוּ לְנַפְשִׁי...",
      12: "הוֹשִׁיעָה יְהוָה כִּי גָמַר חָסִיד..."
    };

    return tehillimTexts[perekNumber] || `פרק ${perekNumber} - לחץ לצפייה בטקסט המלא`;
  };

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Tefilla Section - Connected to top bar - Only Tehillim */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Global Tehillim Chain Card */}
        <div className="bg-white/70 rounded-2xl p-3 border border-blush/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Scroll className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-black font-bold">Global Tehillim Chain</h3>

              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-blush text-xs px-3 py-1 h-auto bg-white border-blush/30 hover:bg-blush/5"
              >
                <Plus size={14} className="mr-1" />
                Add Name
              </Button>
            </div>
          </div>

          {/* Add Name Form */}
          {showAddForm && (
            <div className="space-y-3 mb-3 p-3 bg-gradient-to-r from-ivory to-lavender/5 rounded-2xl border border-lavender/20">
              <div className="flex items-center space-x-2 text-sm text-blush/80">
                <AlertCircle size={16} />
                <span className="font-sans">Names are automatically removed after 18 days</span>
              </div>
              
              <Input
                placeholder="Hebrew Name"
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                className="text-right rounded-2xl border-blush/20 focus:border-blush bg-white"
                dir="rtl"
              />
              
              <Select value={reason} onValueChange={(value) => {
                setReason(value);
                const option = reasonOptions.find(opt => opt.value === value);
                setReasonEnglish(option?.english || "");
              }}>
                <SelectTrigger className="w-full rounded-2xl border-blush/20 bg-white">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="bg-white hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowAddForm(false)} 
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-2xl border-blush/30 hover:bg-blush/5 bg-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddName}
                  disabled={addNameMutation.isPending}
                  size="sm"
                  className="flex-1 rounded-2xl bg-gradient-feminine hover:opacity-90 text-white"
                >
                  {addNameMutation.isPending ? "Adding..." : "Add Name"}
                </Button>
              </div>
            </div>
          )}

          {/* Compact Perek Display */}
          <button
            onClick={() => openModal('tehillim-text')}
            className="w-full bg-gradient-to-br from-ivory to-lavender/10 rounded-2xl p-3 border border-blush/15 hover:bg-white/90 transition-all duration-300"
          >
            {/* Header with perek number */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif text-lg text-black font-bold">
                Perek {progress?.currentPerek || 1}
              </h4>
              <div className="bg-gradient-feminine p-2 rounded-full">
                <ArrowRight className="text-white" size={14} strokeWidth={2} />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="w-full bg-blush/20 rounded-full h-1.5">
                <div 
                  className="bg-gradient-feminine h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((progress?.currentPerek || 1) / 150) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Name assignment with reason icon */}
            {currentName && (
              <div className="mb-2 p-2 bg-white/60 rounded-xl border border-blush/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <User size={12} className="text-blush" />
                    <span className="font-sans text-sm text-black font-medium heebo-regular text-right" dir="rtl">
                      {currentName.hebrewName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getReasonIcon(currentName.reason, currentName.reasonEnglish ?? undefined)}
                    <span className="text-xs text-black/60 font-sans">
                      {getReasonShort(currentName.reason, currentName.reasonEnglish ?? undefined)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Hebrew Preview Text - Compact */}
            {tehillimPreview && (
              <div className="text-xs text-black/70 heebo-regular text-right bg-white/50 rounded-lg p-2 border border-blush/10 line-clamp-2">
                {tehillimPreview.preview}
              </div>
            )}
          </button>

        </div>

      </div>

      {/* OTHER SECTIONS BELOW - SEPARATE FROM MAIN */}
      <div className="p-2 space-y-2">
        {/* Top Row: Morning Brochas and Mincha */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => {
              console.log(`${currentPrayer.title} button clicked`);
              openModal(currentPrayer.modal);
            }}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete(currentPrayer.modal) ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete(currentPrayer.modal) ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              {currentPrayer.modal === 'morning-brochas' ? (
                <Sparkles className="text-white" size={18} />
              ) : currentPrayer.modal === 'mincha' ? (
                <Clock className="text-white" size={18} />
              ) : (
                <Star className="text-white" size={18} />
              )}
            </div>
            <h3 className="font-serif text-sm text-black mb-1 font-bold">{currentPrayer.title}</h3>
            <p className="font-sans text-xs text-black/60">
              {isModalComplete(currentPrayer.modal) ? 'Completed' : currentPrayer.subtitle}
            </p>
          </button>

          <button 
            onClick={() => openModal('birkat-hamazon')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete('birkat-hamazon') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('birkat-hamazon') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <HandHeart className="text-white" size={18} />
            </div>
            <h3 className="font-serif text-sm text-black mb-1 font-bold">Birkat Hamazon</h3>
            <p className="font-sans text-xs text-black/60">
              {isModalComplete('birkat-hamazon') ? 'Completed' : 'After Blessings'}
            </p>
          </button>
        </div>

        {/* Bottom Row: Special Tehillim and Nishmas */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => openModal('special-tehillim')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete('special-tehillim') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('special-tehillim') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <BookOpen className="text-white" size={18} />
            </div>
            <h3 className="font-serif text-sm text-black mb-1 font-bold">Special Tehillim</h3>
            <p className="font-sans text-xs text-black/60">
              {isModalComplete('special-tehillim') ? 'Completed' : 'For Specific Occasions'}
            </p>
          </button>

          <button 
            onClick={() => openModal('nishmas-campaign')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete('nishmas-campaign') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('nishmas-campaign') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Heart className="text-white" size={18} />
            </div>
            <h3 className="font-serif text-sm text-black mb-1 font-bold">Nishmas Kol Chai</h3>
            <p className="font-sans text-xs text-black/60">
              {isModalComplete('nishmas-campaign') ? 'Completed' : 'Prayer of Gratitude'}
            </p>
          </button>
        </div>

        {/* Personal Prayer Section */}
        <div className="bg-white rounded-3xl p-3 shadow-lg border border-blush/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <HandHeart className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-serif text-lg text-black font-bold">Personal Prayers</h3>
              <p className="font-sans text-sm text-black/70">Categories for your Tefillos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => openModal('refuah')}
              className="bg-gradient-to-br from-blush/10 to-blush/5 rounded-2xl p-3 text-center hover:scale-105 transition-all duration-300 border border-blush/20"
            >
              <div className="bg-blush/20 p-2 rounded-full mx-auto mb-1 w-fit">
                <Shield className="text-blush" size={16} strokeWidth={1.5} />
              </div>
              <h4 className="font-serif text-sm text-black font-bold">Refuah</h4>
              <p className="font-sans text-xs text-black/60 mt-1">Healing</p>
            </button>
            
            <button 
              onClick={() => openModal('family')}
              className="bg-gradient-to-br from-lavender/10 to-lavender/5 rounded-2xl p-3 text-center hover:scale-105 transition-all duration-300 border border-lavender/20"
            >
              <div className="bg-lavender/20 p-2 rounded-full mx-auto mb-1 w-fit">
                <Home className="text-lavender" size={16} strokeWidth={1.5} />
              </div>
              <h4 className="font-serif text-sm text-black font-bold">Family</h4>
              <p className="font-sans text-xs text-black/60 mt-1">Shalom Bayis</p>
            </button>
            
            <button 
              onClick={() => openModal('life')}
              className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-3 text-center hover:scale-105 transition-all duration-300 border border-sage/20"
            >
              <div className="bg-sage/20 p-2 rounded-full mx-auto mb-1 w-fit">
                <Compass className="text-sage" size={16} strokeWidth={1.5} />
              </div>
              <h4 className="font-serif text-sm text-black font-bold">Life</h4>
              <p className="font-sans text-xs text-black/60 mt-1">Guidance</p>
            </button>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}