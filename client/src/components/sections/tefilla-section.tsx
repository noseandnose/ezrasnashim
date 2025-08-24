import { HandHeart, Plus, User, AlertCircle, Heart, Star, Compass, ArrowRight, Baby, HeartHandshake, GraduationCap, Users, Stethoscope, DollarSign, Smile, TrendingUp, Sunrise, Sun, Moon, Utensils, Stars, Globe, Unlock } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import type { Section } from "@/pages/home";

interface TefillaSectionProps {
  onSectionChange?: (section: Section) => void;
}
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { TehillimName, GlobalTehillimProgress } from "@shared/schema";

export default function TefillaSection({ onSectionChange: _onSectionChange }: TefillaSectionProps) {
  const { openModal } = useModalStore();
  const { tefillaCompleted: _tefillaCompleted } = useDailyCompletionStore();
  const { isModalComplete, completedModals } = useModalCompletionStore();
  const { data: times, isLoading } = useJewishTimes();

  // Helper function to check if any individual Tehillim has been completed
  const hasAnyTehillimCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysCompletions = completedModals[today];
    if (!todaysCompletions) return false;
    
    // Check for any completion key that starts with 'individual-tehillim-'
    for (const modalId of Array.from(todaysCompletions)) {
      if (modalId.startsWith('individual-tehillim-')) {
        return true;
      }
    }
    return false;
  };

  // Time-based prayer logic
  const getCurrentPrayer = () => {
    if (!times || isLoading) {
      return { title: "Morning Brochas", subtitle: "Loading times...", modal: "morning-brochas" };
    }

    const now = new Date();
    
    // Helper function to parse time strings like "6:30 AM" into today's date
    const parseTimeToday = (timeStr: string) => {
      if (!timeStr) return null;
      
      // Parse the time string (e.g., "6:30 AM" or "7:45 PM")
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Create a date object for today with the specified time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const neitz = parseTimeToday(times.sunrise);
    const minchaGedola = parseTimeToday(times.minchaGedolah);
    const shkia = parseTimeToday(times.shkia);
    
    // Handle null times gracefully
    if (!neitz || !minchaGedola || !shkia) {
      return {
        title: "Morning Brochas",
        subtitle: "Times unavailable",
        modal: "morning-brochas"
      };
    }
    
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
      // Handle both Hebrew and English reasons, plus common variations
      if (r === "רפואה שלמה" || eng === "Complete Healing" || r === "health" || eng === "health" || r === "Health") return "health";
      if (r === "שידוך" || eng === "Finding a mate" || r === "shidduch" || eng === "shidduch") return "shidduch";
      if (r === "זרע של קיימא" || eng === "Children" || r === "children" || eng === "children") return "children";
      if (r === "פרנסה" || eng === "Livelihood" || r === "parnassa" || eng === "parnassa") return "parnassa";
      if (r === "הצלחה" || eng === "Success" || r === "success" || eng === "success") return "success";
      if (r === "שלום בית" || eng === "Family" || r === "family" || eng === "family") return "family";
      if (r === "חכמה" || eng === "Education" || r === "education" || eng === "education") return "education";
      if (r === "עליית נשמה" || eng === "Peace" || r === "peace" || eng === "peace") return "peace";
      if (r === "פדיון שבויים" || eng === "Release from Captivity" || r === "hostages" || eng === "hostages") return "hostages";
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
      'hostages': <Unlock size={12} className="text-orange-600" />,
      'general': <Heart size={12} className="text-blush" />
    };
    
    return iconMap[code];
  };

  const getReasonShort = (reason: string, reasonEnglish?: string) => {
    // Map Hebrew reasons and English translations to short text
    const reasonToCode = (r: string, eng?: string): string => {
      // Handle both Hebrew and English reasons, plus common variations
      if (r === "רפואה שלמה" || eng === "Complete Healing" || r === "health" || eng === "health" || r === "Health") return "health";
      if (r === "שידוך" || eng === "Finding a mate" || r === "shidduch" || eng === "shidduch") return "shidduch";
      if (r === "זרע של קיימא" || eng === "Children" || r === "children" || eng === "children") return "children";
      if (r === "פרנסה" || eng === "Livelihood" || r === "parnassa" || eng === "parnassa") return "parnassa";
      if (r === "הצלחה" || eng === "Success" || r === "success" || eng === "success") return "success";
      if (r === "שלום בית" || eng === "Family" || r === "family" || eng === "family") return "family";
      if (r === "חכמה" || eng === "Education" || r === "education" || eng === "education") return "education";
      if (r === "עליית נשמה" || eng === "Peace" || r === "peace" || eng === "peace") return "peace";
      if (r === "פדיון שבויים" || eng === "Release from Captivity" || r === "hostages" || eng === "hostages") return "hostages";
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
      'hostages': 'Release',
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
  const [_showHebrew, _setShowHebrew] = useState(true);

  // Fetch global Tehillim progress
  const { data: progress, refetch: refetchProgress } = useQuery<GlobalTehillimProgress>({
    queryKey: ['/api/tehillim/progress'], 
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/progress`);
      if (!response.ok) {
        throw new Error('Failed to fetch tehillim progress');
      }
      const data = await response.json();
      // Progress data updated
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for even better responsiveness
    staleTime: 0, // Always consider data stale to force refetch
    gcTime: 10000, // Shorter cache time
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: 'always' // Always refetch when component mounts
  });
  
  // Fetch current name for the perek - MUST be defined before useEffect hooks that use it
  const { data: currentName, refetch: refetchCurrentName } = useQuery<TehillimName | null>({
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/current-name`);
        if (!response.ok) {
          throw new Error('Failed to fetch current name');
        }
        return response.json();
      } catch (error) {
        // Failed to fetch current name
        return null; // Return null as fallback
      }
    },
    queryKey: ['/api/tehillim/current-name', progress?.currentPerek], // Include perek in key to force refetch
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Always consider stale to force refetch
    gcTime: 10000, // Shorter cache time
    enabled: !!progress?.currentPerek // Only fetch when we have progress
  });
  
  // Refetch progress when returning to this section or when modal opens/closes
  useEffect(() => {
    // Small delay to ensure any server updates have completed
    const timer = setTimeout(() => {
      refetchProgress();
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
    }, 100);
    return () => clearTimeout(timer);
  }, []); // Run once on mount
  
  // Also refetch when the section becomes visible again after modal closes
  useEffect(() => {
    // Check if no modal is open (returned to section)
    const checkModalState = () => {
      const modalStore = useModalStore.getState();
      if (!modalStore.activeModal) {
        // Modal was closed, refetch all data
        setTimeout(() => {
          refetchProgress();
          queryClient.invalidateQueries({ queryKey: ['/api/tehillim/info'] });
          queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
        }, 200);
      }
    };
    
    // Subscribe to modal state changes
    const unsubscribe = useModalStore.subscribe((state, prevState) => {
      if (prevState.activeModal && !state.activeModal) {
        checkModalState();
      }
    });
    
    return unsubscribe;
  }, [refetchProgress, queryClient]);
  
  // Listen for tehillim completion event
  useEffect(() => {
    const handleTehillimCompleted = () => {
      // Add a delay to ensure backend has updated
      setTimeout(() => {
        // Refetch all tehillim-related data with forced refresh
        queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tehillim/info'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tehillim/preview'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
        refetchProgress();
        refetchCurrentName();
      }, 500); // Half second delay to ensure backend has updated
    };
    
    window.addEventListener('tehillimCompleted', handleTehillimCompleted);
    return () => window.removeEventListener('tehillimCompleted', handleTehillimCompleted);
  }, [refetchProgress, refetchCurrentName, queryClient]);

  // Get the actual Tehillim info to display English number and part
  const { data: tehillimInfo } = useQuery<{
    id: number;
    englishNumber: number;
    partNumber: number;
    hebrewNumber: string;
  }>({
    queryKey: ['/api/tehillim/info', progress?.currentPerek],
    queryFn: async () => {
      if (!progress?.currentPerek) return null;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/info/${progress.currentPerek}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!progress?.currentPerek,
    staleTime: 60000
  });



  // Fetch all active names for count display
  const { data: _allNames } = useQuery<TehillimName[]>({
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/names`);
        if (!response.ok) {
          throw new Error('Failed to fetch tehillim names');
        }
        return response.json();
      } catch (error) {
        // Silent error handling - don't show runtime error modal
        // Failed to fetch tehillim names
        return []; // Return empty array as fallback
      }
    },
    queryKey: ['/api/tehillim/names'],
    refetchInterval: 60000, // Refresh every minute
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Fetch Tehillim preview (first line) for display
  const { data: _tehillimPreview, isLoading: _isPreviewLoading } = useQuery<{preview: string; perek: number; language: string}>({
    queryKey: ['/api/tehillim/preview', progress?.currentPerek],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/preview/${progress?.currentPerek}?language=hebrew`);
        if (!response.ok) {
          throw new Error('Failed to fetch tehillim preview');
        }
        return response.json();
      } catch (error) {
        // Failed to fetch tehillim preview
        return { preview: '', perek: progress?.currentPerek || 0, language: 'hebrew' }; // Return empty preview as fallback
      }
    },
    enabled: !!progress?.currentPerek,
    staleTime: 60000, // Cache for 1 minute - preview text doesn't change
    gcTime: 300000 // Keep in cache for 5 minutes
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
      // Invalidate all tehillim-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/preview'] });
      
      // Force immediate refetch to update display
      queryClient.refetchQueries({ queryKey: ['/api/tehillim/progress'] });
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
      reasonEnglish: reasonEnglish.trim() || ""
    });
  };

  // Removed unused completePerek function

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
    },
    { 
      value: "hostages", 
      label: "פדיון שבויים (Release from Captivity)", 
      english: "Release from Captivity",
      icon: <Unlock size={16} className="text-orange-600" />
    }
  ];

  const _getTehillimText = (perekNumber: number, isHebrew: boolean) => {
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

  const _getTehillimFirstLine = (perekNumber: number) => {
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


      {/* Main Tefilla Section - Tehillim */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        {/* Global Tehillim Chain Card */}
        <div className="bg-white/70 rounded-2xl p-3 border border-blush/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Globe className="text-white" size={20} />
              </div>
              <div>
                <h3 className="platypi-bold text-lg text-black">Global Tehillim Chain</h3>

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

          {/* Add Name Form or Compact Perek Display */}
          {showAddForm ? (
            <div className="space-y-3 mb-3 p-3 bg-gradient-to-r from-ivory to-lavender/5 rounded-2xl border border-lavender/20">
              <div className="flex items-center space-x-2 text-sm text-blush/80">
                <AlertCircle size={16} />
                <span className="platypi-regular">Names are automatically removed after 18 days</span>
              </div>
              
              <Input
                placeholder="Hebrew Name"
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                className="text-left rounded-2xl border-blush/20 focus:border-blush bg-white"
                dir="ltr"
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
          ) : (
            <button
              onClick={() => openModal('tehillim-text', 'tefilla')}
              className="w-full bg-white/90 rounded-2xl p-3 border border-blush/20 hover:bg-white transition-all duration-300 shadow-sm"
            >
              {/* Header with perek number */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="platypi-bold text-lg text-black">
                  {tehillimInfo ? (
                    tehillimInfo.englishNumber === 119 && tehillimInfo.partNumber
                      ? `Perek ${tehillimInfo.englishNumber} Part ${tehillimInfo.partNumber}`
                      : `Perek ${tehillimInfo.englishNumber}`
                  ) : 'Loading...'}
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
                    style={{ width: `${((progress?.currentPerek || 0) / 150) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Name assignment with reason icon */}
              {currentName ? (
                <div className="mb-2 p-2 bg-white/60 rounded-xl border border-blush/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <User size={12} className="text-blush" />
                      <span className="platypi-medium text-sm text-black heebo-regular text-right" dir="rtl">
                        {currentName.hebrewName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getReasonIcon(currentName.reason, currentName.reasonEnglish ?? undefined)}
                      <span className="text-xs text-black/60 platypi-regular">
                        {getReasonShort(currentName.reason, currentName.reasonEnglish ?? undefined)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-2 p-2 bg-white/60 rounded-xl border border-blush/10">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-3 h-3 border border-blush border-t-transparent rounded-full"></div>
                    <span className="platypi-regular text-xs text-black/50">Loading name...</span>
                  </div>
                </div>
              )}
            </button>
          )}

        </div>

      </div>

      {/* OTHER SECTIONS BELOW - SEPARATE FROM MAIN */}
      <div className="p-2 space-y-2">
        {/* Top Row: Morning Brochas and Mincha */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => {
              // Prayer button clicked
              openModal(currentPrayer.modal, 'tefilla');
            }}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete(currentPrayer.modal) ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete(currentPrayer.modal) ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              {currentPrayer.modal === 'morning-brochas' ? (
                <Sunrise className="text-white" size={18} />
              ) : currentPrayer.modal === 'mincha' ? (
                <Sun className="text-white" size={18} />
              ) : (
                <Moon className="text-white" size={18} />
              )}
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">{currentPrayer.title}</h3>
            <p className="platypi-regular text-xs text-black/60">
              {isModalComplete(currentPrayer.modal) ? 'Completed' : currentPrayer.subtitle}
            </p>
          </button>

          <button 
            onClick={() => openModal('after-brochas', 'tefilla')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              (isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              (isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Utensils className="text-white" size={18} />
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">After Brochas</h3>
            <p className="platypi-regular text-xs text-black/60">
              {(isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'Completed' : 'Prayers of Thanks'}
            </p>
          </button>
        </div>

        {/* Bottom Row: Special Tehillim and Nishmas */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => openModal('special-tehillim', 'tefilla')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              hasAnyTehillimCompleted() ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              hasAnyTehillimCompleted() ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Stars className="text-white" size={18} />
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">Tehillim</h3>
            <p className="platypi-regular text-xs text-black/60">
              {hasAnyTehillimCompleted() ? 'Completed' : 'All & Special'}
            </p>
          </button>

          <button 
            onClick={() => openModal('nishmas-campaign', 'tefilla')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isModalComplete('nishmas-campaign') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('nishmas-campaign') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Heart className="text-white" size={18} />
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">Nishmas Kol Chai</h3>
            <p className="platypi-regular text-xs text-black/60">
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
              <h3 className="platypi-bold text-lg text-black">Personal Prayers</h3>
              <p className="platypi-regular text-sm text-black/70">Categories for your Tefillos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => openModal('refuah', 'tefilla')}
              className="bg-gradient-to-br from-blush/10 to-blush/5 rounded-2xl p-3 text-center hover:scale-105 transition-all duration-300 border border-blush/20"
            >
              <div className="bg-gradient-feminine p-2 rounded-full mx-auto mb-1 w-fit">
                <Stethoscope className="text-white" size={16} strokeWidth={1.5} />
              </div>
              <h4 className="platypi-bold text-sm text-black">Refuah</h4>
              <p className="platypi-regular text-xs text-black/60 mt-1">Healing</p>
            </button>
            
            <button 
              onClick={() => openModal('family', 'tefilla')}
              className="bg-gradient-to-br from-lavender/10 to-lavender/5 rounded-2xl p-3 text-center hover:scale-105 transition-all duration-300 border border-lavender/20"
            >
              <div className="bg-gradient-feminine p-2 rounded-full mx-auto mb-1 w-fit">
                <Users className="text-white" size={16} strokeWidth={1.5} />
              </div>
              <h4 className="platypi-bold text-sm text-black">Family</h4>
              <p className="platypi-regular text-xs text-black/60 mt-1">Home</p>
            </button>
            
            <button 
              onClick={() => openModal('life', 'tefilla')}
              className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-3 text-center hover:scale-105 transition-all duration-300 border border-sage/20"
            >
              <div className="bg-gradient-feminine p-2 rounded-full mx-auto mb-1 w-fit">
                <Heart className="text-white" size={16} strokeWidth={1.5} />
              </div>
              <h4 className="platypi-bold text-sm text-black">Life</h4>
              <p className="platypi-regular text-xs text-black/60 mt-1">Guidance</p>
            </button>
          </div>
        </div>

        {/* The Kotel Compass Section */}
        <div className="bg-gradient-soft rounded-3xl p-4 shadow-lg">
          <button
            onClick={() => openModal('jerusalem-compass', 'tefilla')}
            className="w-full bg-white/70 rounded-2xl p-3 border border-blush/10 hover:bg-white/90 transition-all duration-300 text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Compass className="text-white" size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="platypi-bold text-lg text-black">The Kotel Compass</h3>
                <p className="platypi-regular text-sm text-black/70">Face your Heart Home</p>
              </div>
              <div className="bg-gradient-feminine p-2 rounded-full shadow-lg">
                <ArrowRight className="text-white" size={16} />
              </div>
            </div>
          </button>
        </div>

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}