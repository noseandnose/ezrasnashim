import { HandHeart, Plus, Heart, Star, Compass, Stars, Search, Link2, ChevronRight, ChevronDown, Shuffle, Briefcase, Baby, Home, Shield, Sparkles, HeartPulse } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";

// TEMPORARY: Section background images
import sectionMorningBg from "@assets/Morning_1767097444174.png";
import sectionAfternoonBg from "@assets/Afternoon_1767097444173.png";
import sectionNightBg from "@assets/Night_1767097444169.png";
import type { Section } from "@/pages/home";
import { useLocation } from "wouter";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useTefillaStats } from "@/hooks/use-tefilla-stats";
import { useState, useEffect, useCallback, memo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { toast } from "@/hooks/use-toast";
import type { TehillimChain } from "@shared/schema";

interface TefillaSectionProps {
  onSectionChange?: (section: Section) => void;
}

const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const getReasonIcon = (reason: string) => {
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('refuah') || lowerReason.includes('health')) return HeartPulse;
  if (lowerReason.includes('shidduch') || lowerReason.includes('match')) return Heart;
  if (lowerReason.includes('parnassa') || lowerReason.includes('livelihood')) return Briefcase;
  if (lowerReason.includes('children') || lowerReason.includes('child')) return Baby;
  if (lowerReason.includes('shalom') || lowerReason.includes('peace')) return Home;
  if (lowerReason.includes('success')) return Star;
  if (lowerReason.includes('protection')) return Shield;
  return Sparkles;
};

function TefillaSectionComponent({ onSectionChange: _onSectionChange }: TefillaSectionProps) {
  const { openModal } = useModalStore();
  const { tefillaCompleted: _tefillaCompleted } = useDailyCompletionStore();
  const { isModalComplete, completedModals } = useModalCompletionStore();
  const { data: times, isLoading } = useJewishTimes();
  
  // TEMPORARY: Check if current time is after tzais hakochavim (nightfall)
  const isAfterTzais = () => {
    const tzaisStr = times?.tzaitHakochavim;
    if (!tzaisStr) return new Date().getHours() >= 18; // Fallback to 6 PM
    const now = new Date();
    const match = tzaisStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return now.getHours() >= 18;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    else if (!period && hours < 12) hours += 12; // 24-hour format fallback
    const tzaisTime = new Date(now);
    tzaisTime.setHours(hours, minutes, 0, 0);
    return now >= tzaisTime;
  };

  // TEMPORARY: Get time-appropriate background for main section
  const getSectionBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return sectionMorningBg;
    if (isAfterTzais()) return sectionNightBg;
    return sectionAfternoonBg;
  };

  // Lazy prefetch prayer data when browser is idle (not on mount)
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Use requestIdleCallback to defer prefetching until browser is idle
    const prefetchPrayers = () => {
      const prefetchOptions = { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 };
      queryClient.prefetchQuery({ queryKey: ['/api/brochas/daily'], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ['/api/brochas/special'], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ['/api/mincha/prayer'], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ['/api/maariv/prayer'], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ['/api/nishmas/prayer'], ...prefetchOptions });
      queryClient.prefetchQuery({ queryKey: ['/api/morning/prayers'], ...prefetchOptions });
    };
    
    // Defer prefetching until browser is idle (fallback: 2 seconds)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetchPrayers, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(prefetchPrayers, 2000);
      return () => clearTimeout(id);
    }
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

  getCurrentPrayer(); // Call to compute current prayer for time-based logic

  // Tehillim Chains state
  const [chainView, setChainView] = useState<'none' | 'create' | 'find'>('none');
  const [chainName, setChainName] = useState("");
  const [chainReason, setChainReason] = useState("");
  const [chainDescription, setChainDescription] = useState("");
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [, setLocation] = useLocation();
  
  // Toggle handlers for Create/Find buttons
  const handleCreateToggle = useCallback(() => {
    setChainView(prev => prev === 'create' ? 'none' : 'create');
  }, []);
  
  const handleFindToggle = useCallback(() => {
    setChainView(prev => prev === 'find' ? 'none' : 'find');
  }, []);

  // Fetch all Tehillim stats in a single batched request (2 API calls → 1)
  const { data: tefillaStats, isLoading: isLoadingGlobalStats } = useTefillaStats();
  
  // Extract data from the batched response
  const globalStats = tefillaStats?.globalStats;


  // Reason options for the dropdown
  const reasonOptions = [
    { value: 'refuah', label: 'Refuah Shleima' },
    { value: 'shidduch', label: 'Shidduch' },
    { value: 'parnassa', label: 'Parnassa' },
    { value: 'children', label: 'Children' },
    { value: 'shalom-bayis', label: 'Shalom Bayis' },
    { value: 'success', label: 'Success' },
    { value: 'protection', label: 'Protection' },
    { value: 'general', label: 'General Tefillas' },
  ];

  // Search chains query - fetch recent by default when Find is open
  const { data: searchResults = [], isLoading: isSearching } = useQuery<TehillimChain[]>({
    queryKey: ['/api/tehillim-chains/search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    staleTime: 30000,
    enabled: chainView === 'find',
  });

  // Create chain mutation
  const createChainMutation = useMutation({
    mutationFn: async (data: { name: string; reason: string; description?: string; deviceId?: string }) => {
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim-chains`, data);
    },
    onSuccess: async (response) => {
      const chain = response.data;
      toast({
        title: "Chain Created!",
        description: "Your Tehillim chain has been created.",
      });
      setChainName("");
      setChainReason("");
      setChainDescription("");
      setChainView('none');
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains/stats/total'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains/search'] });
      // Navigate to the new chain
      setLocation(`/c/${chain.slug}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chain. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateChain = () => {
    if (!chainName.trim() || !chainReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a name and reason.",
        variant: "destructive"
      });
      return;
    }
    // Get device ID from localStorage or generate one
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem('deviceId', deviceId);
    }
    const descriptionValue = chainDescription.trim();
    createChainMutation.mutate({ 
      name: chainName, 
      reason: chainReason, 
      ...(descriptionValue ? { description: descriptionValue } : {}),
      deviceId 
    });
  };

  // Compass button handler
  const handleOpenCompass = useCallback(() => {
    const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
      detail: {
        title: 'The Kotel Compass',
        contentType: 'compass'
      }
    });
    window.dispatchEvent(fullscreenEvent);
  }, []);



  return (
    <div className="pb-20 relative overflow-hidden min-h-screen" data-bridge-container>
      {/* TEMPORARY: Full page background image */}
      <img 
        src={getSectionBackground()} 
        alt="" 
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.3 }}
      />

      {/* Main Tefilla Section */}
      <div 
        className="rounded-b-3xl p-3 space-y-3 relative"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          zIndex: 2
        }}
      >
        
        {/* Total Tehillim Said Card */}
        <div className="bg-white/70 rounded-2xl p-3 border border-blush/10 relative">
          {/* Apple Glass Style Find Button - Top Right Corner */}
          <button
            onClick={handleFindToggle}
            className={`absolute top-2 right-2 rounded-xl border border-gray-200 shadow-sm transition-all flex items-center space-x-1 px-2 py-1 ${chainView === 'find' ? 'bg-blush/20 border-blush' : 'bg-white/60 hover:bg-white/80'}`}
            style={{ height: 'auto', minHeight: 'auto' }}
            aria-label="Find Chain"
            data-testid="button-chain-find-icon"
          >
            <Search size={10} className="text-gray-600" />
            <span className="text-gray-700 text-xs platypi-medium">Find</span>
          </button>
          
          {/* Header Row - Title and Subheading */}
          <div className="flex items-center mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Link2 className="text-white" size={20} />
              </div>
              <div>
                <h3 className="platypi-bold text-lg text-black">Tehillim Chains</h3>
                <span className="platypi-medium text-sm text-black/60">Sefer Tehillim, Completed Together.</span>
              </div>
            </div>
          </div>
          
          {/* Tehillim Chains Section with pulsating border */}
          <div 
            className="rounded-xl p-3 border border-blush/20 bg-white/80"
            style={{ animation: 'gentle-glow-pink 3s ease-in-out infinite' }}
          >
            {/* Buttons Row */}
            <div className="flex items-center justify-center space-x-4 mb-2">
            <Button
              type="button"
              onClick={handleCreateToggle}
              className={`text-base px-6 py-3 bg-white border border-blush/30 text-black rounded-xl hover:bg-blush/5 inline-flex items-center ${chainView === 'create' ? 'border-blush' : ''}`}
              data-testid="button-chain-create"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-gradient-feminine rounded-full mr-2 shrink-0">
                <Plus size={18} className="text-white" />
              </div>
              Create
            </Button>
            <Button
              type="button"
              disabled={isLoadingRandom}
              onClick={async () => {
                if (isLoadingRandom) return;
                setIsLoadingRandom(true);
                try {
                  // Get device ID for cache key
                  const deviceId = localStorage.getItem('tehillim_device_id') || 'anonymous';
                  const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/tehillim-chains/random?t=${Date.now()}`);
                  if (response.ok) {
                    const chain = await response.json();
                    // Pre-populate the query cache so chain page loads instantly
                    queryClient.setQueryData(['/api/tehillim-chains', chain.slug, deviceId], chain);
                    setLocation(`/c/${chain.slug}`);
                  }
                } catch (error) {
                  console.error('Failed to get random chain:', error);
                } finally {
                  setIsLoadingRandom(false);
                }
              }}
              className={`text-base px-6 py-3 bg-white border border-blush/30 text-black rounded-xl hover:bg-blush/5 inline-flex items-center ${isLoadingRandom ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid="button-chain-random"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-gradient-feminine rounded-full mr-2 shrink-0">
                <Shuffle size={18} className={`text-white ${isLoadingRandom ? 'animate-spin' : ''}`} />
              </div>
              {isLoadingRandom ? 'Loading...' : 'Random'}
            </Button>
          </div>

          {/* Stats Line */}
          <div className="border-t border-blush/10 pt-2 mt-1">
            <div className="flex justify-center gap-8 text-center">
              <div>
                <p className="platypi-bold text-sm text-black">
                  {isLoadingGlobalStats ? "..." : (globalStats?.totalRead || 0).toLocaleString()}
                </p>
                <p className="platypi-regular text-[10px] text-black/50">Tehillim Read</p>
              </div>
              <div className="border-l border-blush/10 pl-8">
                <p className="platypi-bold text-sm text-black">
                  {isLoadingGlobalStats ? "..." : (globalStats?.booksCompleted || 0).toLocaleString()}
                </p>
                <p className="platypi-regular text-[10px] text-black/50">Books Completed</p>
              </div>
            </div>
          </div>

          {/* Create Chain Form */}
          {chainView === 'create' && (
            <div className="space-y-3 p-3 bg-gradient-to-r from-ivory to-lavender/5 rounded-2xl border border-lavender/20">
              <Input
                placeholder="Chain Name (Name Ben/Bat Name)"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                className="text-left rounded-2xl border-blush/20 focus:border-blush bg-white"
                data-testid="input-chain-name"
              />
              
              <div>
                <button
                  type="button"
                  onClick={() => setReasonDropdownOpen(!reasonDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-2xl border border-blush/20 bg-white px-3 py-2 text-sm focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20"
                  data-testid="select-chain-reason"
                >
                  {chainReason ? (
                    <span className="inline-flex items-center gap-2">
                      {(() => {
                        const ReasonIcon = getReasonIcon(chainReason);
                        return <ReasonIcon size={16} className="text-blush" />;
                      })()}
                      {reasonOptions.find(o => o.value === chainReason)?.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select a reason...</span>
                  )}
                  <ChevronDown size={16} className={`text-muted-foreground transition-transform ${reasonDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {reasonDropdownOpen && (
                  <div className="mt-2 w-full rounded-xl border border-blush/20 bg-white shadow-sm overflow-hidden">
                    {reasonOptions.map((option, index) => {
                      const OptionIcon = getReasonIcon(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setChainReason(option.value);
                            setReasonDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-blush/5 ${index !== reasonOptions.length - 1 ? 'border-b border-blush/10' : ''}`}
                        >
                          <OptionIcon size={14} className="text-blush" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <textarea
                placeholder="Add a description (optional)"
                value={chainDescription}
                onChange={(e) => setChainDescription(e.target.value)}
                className="w-full min-h-[60px] rounded-2xl border border-blush/20 bg-white px-3 py-2 text-sm focus:border-blush focus:outline-none focus:ring-2 focus:ring-blush/20 resize-none"
                data-testid="input-chain-description"
              />
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setChainView('none')} 
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-2xl border-blush/30 hover:bg-blush/5 bg-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateChain}
                  disabled={createChainMutation.isPending}
                  size="sm"
                  className="flex-1 rounded-2xl bg-gradient-feminine hover:opacity-90 text-white"
                  data-testid="button-create-chain"
                >
                  {createChainMutation.isPending ? "Creating..." : "Create Chain"}
                </Button>
              </div>
            </div>
          )}

          {/* Find Chain Form */}
          {chainView === 'find' && (
            <div className="space-y-3 p-3 bg-gradient-to-r from-ivory to-lavender/5 rounded-2xl border border-lavender/20">
              <Input
                placeholder="Search by name or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-left rounded-2xl border-blush/20 focus:border-blush bg-white"
                data-testid="input-chain-search"
              />
              
              {isSearching && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-blush border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((chain) => {
                    const ReasonIcon = getReasonIcon(chain.reason);
                    return (
                      <button
                        key={chain.id}
                        onClick={() => setLocation(`/c/${chain.slug}`)}
                        className="w-full p-3 bg-white rounded-xl border border-blush/20 hover:bg-blush/5 transition-all flex items-center justify-between"
                      >
                        <div className="text-left">
                          <p className="platypi-medium text-sm text-black">{chain.name}</p>
                          <div className="flex items-center gap-1.5">
                            <ReasonIcon size={12} className="text-blush/70" />
                            <p className="platypi-regular text-xs text-black/60">{toTitleCase(chain.reason)}</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-blush" />
                      </button>
                    );
                  })}
                </div>
              )}
              
              {!isSearching && searchResults.length === 0 && (
                <p className="text-center text-sm text-black/50 py-4 platypi-regular">
                  {searchQuery ? "No chains found. Try a different search or create a new one." : "No chains created yet. Be the first to create one!"}
                </p>
              )}
              
              <Button 
                onClick={() => setChainView('none')} 
                variant="outline"
                size="sm"
                className="w-full rounded-2xl border-blush/30 hover:bg-blush/5 bg-white"
              >
                Close
              </Button>
            </div>
          )}
          </div>
        </div>

      </div>

      {/* OTHER SECTIONS BELOW - SEPARATE FROM MAIN */}
      <div className="py-2 space-y-2">
        {/* Top Row: Siddur and Tehillim */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => openModal('brochas', 'tefilla')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            data-modal-type="brochas"
            data-modal-section="tefilla"
            data-testid="button-tefilla-brochas"
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              (isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Star className="text-white" size={18} />
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">Siddur</h3>
            <p className="platypi-regular text-xs text-black/60">
              {(isModalComplete('al-hamichiya') || isModalComplete('birkat-hamazon')) ? 'Completed' : 'Tefillas and Brochas'}
            </p>
          </button>

          <button 
            onClick={() => openModal('special-tehillim', 'tefilla')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
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
        </div>

        {/* Bottom Row: Women's Tefillas and Nishmas */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openModal('womens-tefillas', 'tefilla')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            data-modal-type="womens-tefillas"
            data-modal-section="tefilla"
            data-testid="button-tefilla-womens"
          >
            <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-gradient-feminine">
              <HandHeart className="text-white" size={18} />
            </div>
            <h3 className="platypi-bold text-sm text-black mb-1">Women's Tefillas</h3>
            <p className="platypi-regular text-xs text-black/60">Special Prayers</p>
          </button>

          <button 
            onClick={() => openModal('nishmas-campaign', 'tefilla')}
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
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

        {/* The Kotel Compass Section */}
        <div className="bg-gradient-soft rounded-3xl p-4 shadow-lg">
          <Button
            variant="ghost"
            onClick={handleOpenCompass}
            className="w-full bg-white/70 rounded-2xl p-3 border border-blush/10 hover:bg-white/90 transition-all duration-300 text-left h-auto"
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
            </div>
          </Button>
        </div>

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
      
    </div>
  );
}

export default memo(TefillaSectionComponent);