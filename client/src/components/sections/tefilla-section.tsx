import { HandHeart, Plus, Heart, Star, Compass, ArrowRight, Sunrise, Sun, Moon, Stars, Search, Link2, ChevronRight, Stethoscope, Users, Shuffle } from "lucide-react";

import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import type { Section } from "@/pages/home";
import { registerClickHandler } from "@/utils/dom-event-bridge";
import { useLocation } from "wouter";

interface TefillaSectionProps {
  onSectionChange?: (section: Section) => void;
}
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { TehillimChain } from "@shared/schema";

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

  // Tehillim Chains state
  const [chainView, setChainView] = useState<'none' | 'create' | 'find'>('none');
  const [chainName, setChainName] = useState("");
  const [chainReason, setChainReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  // Fetch total tehillim from all chains
  const { data: chainTotalData } = useQuery<{ total: number }>({
    queryKey: ['/api/tehillim-chains/stats/total'],
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });
  const chainTotal = chainTotalData?.total || 0;

  // Reason options for the dropdown
  const reasonOptions = [
    { value: 'refuah', label: 'Refuah (Health)' },
    { value: 'shidduch', label: 'Shidduch (Match)' },
    { value: 'parnassa', label: 'Parnassa (Livelihood)' },
    { value: 'children', label: 'Children' },
    { value: 'shalom-bayis', label: 'Shalom Bayis (Peace)' },
    { value: 'success', label: 'Success' },
    { value: 'protection', label: 'Protection' },
    { value: 'general', label: 'General Prayer' },
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
    mutationFn: async (data: { name: string; reason: string; deviceId?: string }) => {
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
    createChainMutation.mutate({ name: chainName, reason: chainReason, deviceId });
  };

  // Ref callback for compass button (FlutterFlow WebView fix)
  const compassButtonRef = useCallback((element: HTMLButtonElement | null) => {
    if (element) {
      registerClickHandler(element, () => {
        const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
          detail: {
            title: 'The Kotel Compass',
            contentType: 'compass'
          }
        });
        window.dispatchEvent(fullscreenEvent);
      });
    }
  }, []);



  return (
    <div className="pb-20" data-bridge-container>

      {/* Main Tefilla Section - Tehillim */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg space-y-3">
        
        {/* Personal Tehillim Chains Card */}
        <div 
          className="bg-white/70 rounded-2xl p-3 border border-blush/10"
          style={{ animation: 'gentle-glow-pink 3s ease-in-out infinite' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Link2 className="text-white" size={20} />
              </div>
              <div>
                <h3 className="platypi-bold text-lg text-black">Tehillim Chains</h3>
                <p className="platypi-regular text-xs text-black/60">
                  {chainTotal.toLocaleString()} Tehillim Said
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  console.log('Create button clicked, current view:', chainView);
                  setChainView(chainView === 'create' ? 'none' : 'create');
                }}
                className={`text-xs px-3 py-1 h-auto bg-white border rounded-md hover:bg-blush/5 inline-flex items-center ${chainView === 'create' ? 'text-blush border-blush' : 'text-blush border-blush/30'}`}
                data-testid="button-chain-create"
              >
                <Plus size={14} className="mr-1" />
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Find button clicked, current view:', chainView);
                  setChainView(chainView === 'find' ? 'none' : 'find');
                }}
                className={`text-xs px-3 py-1 h-auto bg-white border rounded-md hover:bg-blush/5 inline-flex items-center ${chainView === 'find' ? 'text-blush border-blush' : 'text-blush border-blush/30'}`}
                data-testid="button-chain-find"
              >
                <Search size={14} className="mr-1" />
                Find
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/tehillim-chains/random`);
                    if (response.ok) {
                      const chain = await response.json();
                      setLocation(`/c/${chain.slug}`);
                    }
                  } catch (error) {
                    console.error('Failed to get random chain:', error);
                  }
                }}
                className="text-xs px-3 py-1 h-auto bg-white border border-blush/30 rounded-md hover:bg-blush/5 inline-flex items-center text-blush"
                data-testid="button-chain-random"
              >
                <Shuffle size={14} className="mr-1" />
                Random
              </button>
            </div>
          </div>

          {/* Create Chain Form */}
          {chainView === 'create' && (
            <div className="space-y-3 p-3 bg-gradient-to-r from-ivory to-lavender/5 rounded-2xl border border-lavender/20">
              <Input
                placeholder="Chain Name (e.g., Refuah for Sarah)"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                className="text-left rounded-2xl border-blush/20 focus:border-blush bg-white"
                data-testid="input-chain-name"
              />
              
              <Select value={chainReason} onValueChange={setChainReason}>
                <SelectTrigger className="rounded-2xl border-blush/20 focus:border-blush bg-white" data-testid="select-chain-reason">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
                  {searchResults.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setLocation(`/c/${chain.slug}`)}
                      className="w-full p-3 bg-white rounded-xl border border-blush/20 hover:bg-blush/5 transition-all flex items-center justify-between"
                    >
                      <div className="text-left">
                        <p className="platypi-medium text-sm text-black">{chain.name}</p>
                        <p className="platypi-regular text-xs text-black/60">{chain.reason}</p>
                      </div>
                      <ChevronRight size={16} className="text-blush" />
                    </button>
                  ))}
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
            ref={compassButtonRef}
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