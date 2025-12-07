import { HandHeart, Plus, User, AlertCircle, Heart, Star, Compass, ArrowRight, Baby, HeartHandshake, GraduationCap, Users, Stethoscope, DollarSign, Smile, TrendingUp, Sunrise, Sun, Moon, Stars, Globe, Unlock } from "lucide-react";

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

  // Prefetch brochas data to speed up loading when user clicks
  const queryClient = useQueryClient();
  
  useQuery({
    queryKey: ['/api/brochas/daily'],
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (garbage collection time)
  });

  useQuery({
    queryKey: ['/api/brochas/special'],
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (garbage collection time)
  });
  
  // Prefetch Mincha and Maariv prayers to prevent empty modals
  useEffect(() => {
    // Prefetch Mincha prayer - uses default queryFn from queryClient
    queryClient.prefetchQuery({
      queryKey: ['/api/mincha/prayer'],
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
    
    // Prefetch Maariv prayer - uses default queryFn from queryClient
    queryClient.prefetchQuery({
      queryKey: ['/api/maariv/prayer'],
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
    
    // Prefetch Nishmas prayer - uses default queryFn from queryClient
    queryClient.prefetchQuery({
      queryKey: ['/api/nishmas/prayer'],
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
    
    // Prefetch morning prayers - uses default queryFn from queryClient
    queryClient.prefetchQuery({
      queryKey: ['/api/morning/prayers'],
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    });
  }, [queryClient]);

  // Helper function to check if any individual Tehillim has been completed
  const hasAnyTehillimCompleted = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysCompletions = completedModals[today];
    if (!todaysCompletions) return false;
    
    // Check for any completion key that starts with 'individual-tehillim-'
    // Check in singles (Set<string>) - convert to array for iteration
    for (const modalId of Array.from(todaysCompletions.singles)) {
      if (modalId.startsWith('individual-tehillim-')) {
        return true;
      }
    }
    // Also check in repeatables (Record<string, number>)
    for (const modalId of Object.keys(todaysCompletions.repeatables)) {
      if (modalId.startsWith('individual-tehillim-')) {
        return true;
      }
    }
    return false;
  };

  // Time-based prayer logic
  const getCurrentPrayer = () => {
    if (!times || isLoading) {
      return { title: "Shacharis", subtitle: "Loading times...", modal: "morning-brochas" };
    }

    // Get the current time in the location's timezone where zmanim were calculated
    const now = new Date();
    
    // Helper function to parse time strings like "6:30 AM" into today's date in the location's timezone
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
      // IMPORTANT: The zmanim times are returned in the location's timezone
      // We need to ensure we're comparing apples to apples
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      
      return date;
    };
    
    const alos = parseTimeToday(times.alosHashachar);
    const chatzos = parseTimeToday(times.chatzos);
    const chatzotNight = parseTimeToday(times.chatzotNight);
    const minchaGedola = parseTimeToday(times.minchaGedolah);
    const shkia = parseTimeToday(times.shkia);
    const plagHamincha = parseTimeToday(times.plagHamincha);
    
    // Handle null times gracefully
    if (!alos || !chatzos || !chatzotNight || !minchaGedola || !shkia || !plagHamincha) {
      return {
        title: "Shacharis",
        subtitle: "Times unavailable",
        modal: "morning-brochas"
      };
    }
    
    if (now >= alos && now < chatzos) {
      // Shacharis time - from Alos Hashachar until Chatzos (solar noon)
      return {
        title: "Shacharis",
        subtitle: `${times.alosHashachar} - ${times.chatzos}`,
        modal: "morning-brochas"
      };
    } else if (now >= minchaGedola && now < shkia) {
      // Mincha time - from Mincha Gedolah until Shkia
      return {
        title: "Mincha",
        subtitle: `${times.minchaGedolah} - ${times.shkia}`,
        modal: "mincha"
      };
    } else if (now >= shkia && now < plagHamincha) {
      // Gap between Shkia and Plag Hamincha - show when Maariv will be available
      return {
        title: "Maariv",
        subtitle: `from ${times.plagHamincha}`,
        modal: "maariv",
        disabled: true
      };
    } else if (now >= plagHamincha || now < alos) {
      // Maariv time - Available from Plag Hamincha until next Alos, but ideally until Chatzot HaLyla
      return {
        title: "Maariv",
        subtitle: `${times.plagHamincha} - ${times.chatzotNight}`,
        modal: "maariv"
      };
    } else {
      // Between Chatzos and Mincha Gedolah - show when Mincha will be available
      return {
        title: "Mincha",
        subtitle: `from ${times.minchaGedolah} until ${times.shkia}`,
        modal: "mincha",
        disabled: true
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
  
  // Local state management
  const [hebrewName, setHebrewName] = useState("");
  const [reason, setReason] = useState("");
  const [reasonEnglish, setReasonEnglish] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [_showHebrew, _setShowHebrew] = useState(true);

  // Fetch global Tehillim progress
  const { data: progress, isError: progressError } = useQuery<GlobalTehillimProgress>({
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
    staleTime: 60000,           // Cache for 1 minute
    refetchOnWindowFocus: true, // Refetch when users return to app
    refetchInterval: 180000,    // Check every 3 minutes (reduced from 30s for performance)
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  // Fetch current name for the perek - MUST be defined before useEffect hooks that use it
  const { data: currentName } = useQuery<TehillimName | null>({
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
    staleTime: 0,                   // NO caching - keep real-time for global chain
    refetchOnWindowFocus: true,     // Refetch when users return to app  
    enabled: !!progress?.currentPerek && progress.currentPerek >= 1 && progress.currentPerek <= 171 // Only fetch when we have valid progress (includes Perek 119 parts)
  });
  
  // Only refetch tehillim data when explicitly needed (removed aggressive polling)
  // Removed automatic refetching on mount and modal state changes to prevent request storms
  
  // Listen for tehillim completion event - only invalidate when actually needed
  useEffect(() => {
    const handleTehillimCompleted = () => {
      // Only invalidate specific queries after completion (no aggressive refetching)
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
    };
    
    window.addEventListener('tehillimCompleted', handleTehillimCompleted);
    return () => window.removeEventListener('tehillimCompleted', handleTehillimCompleted);
  }, [queryClient]);

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
    enabled: !!progress?.currentPerek && progress.currentPerek >= 1 && progress.currentPerek <= 171, // Includes Perek 119 parts
    staleTime: 10 * 60 * 1000,  // Keep fresh for 10 minutes 
    gcTime: 30 * 60 * 1000,     // Cache for 30 minutes
    refetchOnWindowFocus: false
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
    refetchInterval: 180000, // Refresh every 3 minutes (reduced from 1min for performance)
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
    enabled: !!progress?.currentPerek && progress.currentPerek >= 1 && progress.currentPerek <= 171, // Includes Perek 119 parts
    staleTime: 60000, // Cache for 1 minute - preview text doesn't change
    gcTime: 300000 // Keep in cache for 5 minutes
  });

  // Removed unused _completePerekMutation to fix TypeScript errors

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





  return (
    <div className="pb-20" data-bridge-container>

      {/* Main Tefilla Section - Tehillim */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg">
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
              onClick={() => {
                // Dispatch custom event to open global tehillim directly in fullscreen
                const event = new CustomEvent('openGlobalTehillimFullscreen', { 
                  detail: { nextPerek: progress?.currentPerek || 59 } 
                });
                window.dispatchEvent(event);
              }}
              className="w-full bg-white/90 rounded-2xl p-3 border border-blush/20 hover:bg-white transition-all duration-300 shadow-sm"
              style={{
                animation: 'gentle-glow-pink 3s ease-in-out infinite'
              }}
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
                    style={{ width: `${progressError ? 0 : ((progress?.currentPerek || 0) / 171) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Name assignment with reason icon */}
              {progressError ? (
                <div className="mb-2 p-2 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center justify-center space-x-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="platypi-regular text-xs text-red-600">Unable to connect to Tehillim chain</span>
                  </div>
                </div>
              ) : currentName ? (
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
      <div className="py-2 space-y-2">
        {/* Top Row: Morning Brochas and Mincha */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <button 
              onClick={() => {
                // Only open modal if not disabled
                if (!currentPrayer.disabled) {
                  openModal(currentPrayer.modal, 'tefilla');
                }
              }}
              disabled={currentPrayer.disabled}
              className={`w-full rounded-3xl p-3 text-center transition-all duration-300 shadow-lg border border-blush/10 ${
                currentPrayer.disabled 
                  ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
                  : isModalComplete(currentPrayer.modal) 
                    ? 'bg-sage/20 hover:scale-105' 
                    : 'bg-white hover:scale-105'
              }`}
              data-modal-type={currentPrayer.modal}
              data-modal-section="tefilla"
              data-testid="button-tefilla-prayer"
            >
              <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
                currentPrayer.disabled 
                  ? 'bg-gray-300' 
                  : isModalComplete(currentPrayer.modal) 
                    ? 'bg-sage' 
                    : 'bg-gradient-feminine'
              }`}>
                {currentPrayer.modal === 'morning-brochas' ? (
                  <Sunrise className={currentPrayer.disabled ? "text-gray-500" : "text-white"} size={18} />
                ) : currentPrayer.modal === 'mincha' ? (
                  <Sun className={currentPrayer.disabled ? "text-gray-500" : "text-white"} size={18} />
                ) : (
                  <Moon className={currentPrayer.disabled ? "text-gray-500" : "text-white"} size={18} />
                )}
              </div>
              <h3 className={`platypi-bold text-sm mb-1 ${currentPrayer.disabled ? 'text-gray-500' : 'text-black'}`}>
                {currentPrayer.title}
              </h3>
              <p className={`platypi-regular text-xs ${currentPrayer.disabled ? 'text-gray-400' : 'text-black/60'}`}>
                {isModalComplete(currentPrayer.modal) ? 'Completed' : currentPrayer.subtitle}
              </p>
            </button>
          </div>

          <button 
            onClick={() => openModal('brochas', 'tefilla')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              (isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'bg-sage/20' : 'bg-white'
            }`}
            data-modal-type="brochas"
            data-modal-section="tefilla"
            data-testid="button-tefilla-brochas"
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              (isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Star className="text-white" size={18} />
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">Brochas</h3>
            <p className="platypi-regular text-xs text-black/60">
              {(isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'Completed' : 'Daily and Special'}
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
            data-modal-type="special-tehillim"
            data-modal-section="tefilla"
            data-testid="button-tefilla-tehillim"
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
            data-modal-type="nishmas-campaign"
            data-modal-section="tefilla"
            data-testid="button-tefilla-nishmas"
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
              data-modal-type="refuah"
              data-modal-section="tefilla"
              data-testid="button-tefilla-refuah"
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
              data-modal-type="family"
              data-modal-section="tefilla"
              data-testid="button-tefilla-family"
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
              data-modal-type="life"
              data-modal-section="tefilla"
              data-testid="button-tefilla-life"
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
            onClick={() => {
              const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
                detail: {
                  title: 'The Kotel Compass',
                  contentType: 'compass'
                }
              });
              window.dispatchEvent(fullscreenEvent);
            }}
            className="w-full bg-white/70 rounded-2xl p-3 border border-blush/10 hover:bg-white/90 transition-all duration-300 text-left"
            data-testid="button-open-compass"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Compass className="text-white" size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="platypi-bold text-lg text-black">The Kotel Compass</h3>
                <p className="platypi-regular text-sm text-black/70">Direct your Heart Home</p>
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