import { create } from 'zustand';
import { getLocalDateString } from './dateUtils';

export type ModalType = 
  | 'halacha' 
  | 'emuna' 
  | 'chizuk' 
  | 'loshon'
  | 'featured'
  | 'mincha' 
  | 'maariv'
  | 'morning-brochas'
  | 'birkat-hamazon'
  | 'tehillim' 
  | 'tehillim-text'
  | 'special-tehillim'
  | 'individual-tehillim'
  | 'nishmas' 
  | 'nishmas-campaign'
  | 'refuah' 
  | 'family' 
  | 'life' 
  | 'individual-prayer'
  | 'womens-prayers'
  | 'womens-tefillas'
  | 'blessings'
  | 'tefillos'
  | 'personal-prayers'
  | 'jerusalem-compass'
  | 'donate'
  | 'about'
  | 'location'
  | 'sponsor-details'
  | 'community-impact'
  | 'date-calculator-fullscreen'
  | 'events'
  | 'library'
  | null;

export interface ModalState {
  activeModal: string | null;
  selectedPsalm: number | null;
  selectedParshaVortId: number | null;
  previousSection: string | null;
  previousModal: string | null;
  tehillimActiveTab: 'all' | 'special';
  tehillimReturnTab: 'all' | 'special' | null; // Store the return tab preference
  dailyTehillimPsalms: number[] | null; // Store daily tehillim psalms for Complete & Next navigation
  openModal: (modalId: string, fromSection?: string, psalmNumber?: number, parshaVortId?: number) => void;
  closeModal: (returnToPrevious?: boolean) => void;
  setSelectedPsalm: (psalmNumber: number) => void;
  setSelectedParshaVortId: (parshaVortId: number) => void;
  setTehillimActiveTab: (tab: 'all' | 'special') => void;
  setTehillimReturnTab: (tab: 'all' | 'special') => void;
  setDailyTehillimPsalms: (psalms: number[] | null) => void;
  
  // Convenience methods for specific modals
  isBirkatHamazonModalOpen: boolean;
  openBirkatHamazonModal: () => void;
  closeBirkatHamazonModal: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  activeModal: null,
  selectedPsalm: null,
  selectedParshaVortId: null,
  previousSection: null,
  previousModal: null,
  tehillimActiveTab: 'all',
  tehillimReturnTab: null,
  dailyTehillimPsalms: null,
  openModal: (modalId: string, fromSection?: string, psalmNumber?: number, parshaVortId?: number) => {
    const currentModal = get().activeModal;
    set({ 
      activeModal: modalId, 
      previousSection: fromSection || get().previousSection,
      previousModal: currentModal,
      selectedPsalm: psalmNumber || get().selectedPsalm,
      // Only set parshaVortId if explicitly provided, otherwise clear it to prevent sticky state
      selectedParshaVortId: parshaVortId !== undefined ? parshaVortId : null
    });
  },
  closeModal: (returnToPrevious?: boolean) => {
    const state = get();
    const wasTefilaModal = state.activeModal === 'tehillim-text';
    set({ activeModal: null });
    
    // If closing tehillim modal, trigger a custom event to refresh data
    if (wasTefilaModal && typeof window !== 'undefined') {
      setTimeout(() => {
        const refreshEvent = new CustomEvent('tehillimCompleted');
        window.dispatchEvent(refreshEvent);
      }, 50);
    }
    
    // Handle navigation based on close type
    if (returnToPrevious && state.previousSection && typeof window !== 'undefined') {
      // Use a small delay to ensure modal close animation completes
      setTimeout(() => {
        const event = new CustomEvent('navigateToSection', { 
          detail: { section: state.previousSection } 
        });
        window.dispatchEvent(event);
      }, 100);
    }
  },
  setSelectedPsalm: (psalmNumber: number) => set({ selectedPsalm: psalmNumber }),
  setSelectedParshaVortId: (parshaVortId: number) => set({ selectedParshaVortId: parshaVortId }),
  setTehillimActiveTab: (tab: 'all' | 'special') => set({ tehillimActiveTab: tab }),
  setTehillimReturnTab: (tab: 'all' | 'special') => set({ tehillimReturnTab: tab }),
  setDailyTehillimPsalms: (psalms: number[] | null) => set({ dailyTehillimPsalms: psalms }),
  
  // Convenience methods for specific modals
  get isBirkatHamazonModalOpen() {
    return get().activeModal === 'birkat-hamazon';
  },
  openBirkatHamazonModal: () => set({ activeModal: 'birkat-hamazon' }),
  closeBirkatHamazonModal: () => set({ activeModal: null }),
}));

// Daily completion tracking
export interface DailyCompletionState {
  torahCompleted: boolean;
  tefillaCompleted: boolean;
  tzedakaCompleted: boolean;
  lifeCompleted: boolean;
  tzedakaFlowerCount: number; // Track multiple tzedaka completions for garden flowers
  lifeFlowerCount: number; // Track multiple life completions for garden flowers
  congratulationsShown: boolean;
  completionDate: string;
  completeTask: (task: 'torah' | 'tefilla' | 'tzedaka' | 'life') => void;
  markTefillaComplete: () => void;
  resetDaily: () => void;
  checkAndShowCongratulations: () => boolean;
}

// Daily modal completion tracking with support for repeatable prayers
export interface DailyCompletionData {
  singles: Set<string>; // Single-completion prayers (once per day)
  repeatables: Record<string, number>; // Repeatable prayers with completion counts
}

export interface ModalCompletionState {
  completedModals: Record<string, DailyCompletionData>; // date -> completion data
  markModalComplete: (modalId: string) => void;
  isModalComplete: (modalId: string) => boolean;
  getCompletionCount: (modalId: string) => number;
  isSingleCompletionPrayer: (modalId: string) => boolean;
  resetModalCompletions: () => void;
  setCompletionsForDate: (date: string, data: { singles: Set<string>; repeatables: Record<string, number> }) => void;
}

export const useModalCompletionStore = create<ModalCompletionState>((set, get) => {
  // Define which prayers can only be completed once per day
  const SINGLE_COMPLETION_PRAYERS = new Set([
    'morning-brochas',  // Shacharis
    'mincha',           // Mincha
    'maariv'            // Maariv
  ]);
  
  // Helper to check if a prayer is single-completion
  const isSingleCompletionPrayer = (modalId: string): boolean => {
    return SINGLE_COMPLETION_PRAYERS.has(modalId);
  };
  
  // Load initial state from localStorage with migration support
  const loadFromStorage = (): Record<string, DailyCompletionData> => {
    try {
      const stored = localStorage.getItem('modalCompletions');
      if (stored) {
        const parsed = JSON.parse(stored);
        const completedModals: Record<string, DailyCompletionData> = {};
        
        // Load ALL dates to preserve cloud-synced history for streaks/totals
        for (const [date, data] of Object.entries(parsed)) {
          // Check if this is old format (array) or new format (object with singles/repeatables)
          if (Array.isArray(data)) {
            // Migrate from old format: convert array to new structure
            completedModals[date] = {
              singles: new Set(data.filter((id: string) => isSingleCompletionPrayer(id))),
              repeatables: {}
            };
            // Initialize repeatable counters from old data
            data.forEach((id: string) => {
              if (!isSingleCompletionPrayer(id)) {
                completedModals[date].repeatables[id] = 1;
              }
            });
          } else if (data && typeof data === 'object') {
            // New format: restore Sets and counters
            const typedData = data as any;
            completedModals[date] = {
              singles: new Set(typedData.singles || []),
              repeatables: typedData.repeatables || {}
            };
          }
        }
        return completedModals;
      }
    } catch (e) {
      console.error('Failed to load modal completions from storage:', e);
      localStorage.removeItem('modalCompletions');
    }
    return {};
  };

  // Save to localStorage whenever state changes
  const saveToStorage = (completedModals: Record<string, DailyCompletionData>) => {
    try {
      // Convert Sets to arrays for JSON serialization
      const toStore: Record<string, { singles: string[]; repeatables: Record<string, number> }> = {};
      for (const [date, data] of Object.entries(completedModals)) {
        toStore[date] = {
          singles: Array.from(data.singles),
          repeatables: data.repeatables
        };
      }
      localStorage.setItem('modalCompletions', JSON.stringify(toStore));
    } catch (e) {
      console.error('Failed to save modal completions to storage:', e);
    }
  };

  return {
    completedModals: loadFromStorage(),
    isSingleCompletionPrayer,
    
    markModalComplete: (modalId: string) => {
      const today = getLocalDateString();
      set(state => {
        const newState = { ...state.completedModals };
        
        // Initialize today's data if it doesn't exist
        if (!newState[today]) {
          newState[today] = {
            singles: new Set(),
            repeatables: {}
          };
        } else {
          // Clone to ensure proper state update
          newState[today] = {
            singles: new Set(newState[today].singles),
            repeatables: { ...newState[today].repeatables }
          };
        }
        
        // Handle single-completion vs repeatable prayers differently
        if (isSingleCompletionPrayer(modalId)) {
          // Single-completion: add to set (idempotent)
          newState[today].singles.add(modalId);
        } else {
          // Repeatable: increment counter
          newState[today].repeatables[modalId] = (newState[today].repeatables[modalId] || 0) + 1;
        }
        
        // Note: No longer pruning old dates to preserve cloud-synced history
        // Historical data is needed for streak calculations and profile stats
        
        saveToStorage(newState);
        return { completedModals: newState };
      });
    },
    
    isModalComplete: (modalId: string) => {
      const today = getLocalDateString();
      const todaysData = get().completedModals[today];
      if (!todaysData) return false;
      
      // Check both singles set and repeatables counters
      return todaysData.singles.has(modalId) || (todaysData.repeatables[modalId] || 0) > 0;
    },
    
    getCompletionCount: (modalId: string) => {
      const today = getLocalDateString();
      const todaysData = get().completedModals[today];
      if (!todaysData) return 0;
      
      // Single-completion prayers return 1 if completed, 0 otherwise
      if (isSingleCompletionPrayer(modalId)) {
        return todaysData.singles.has(modalId) ? 1 : 0;
      }
      
      // Repeatable prayers return their counter value
      return todaysData.repeatables[modalId] || 0;
    },
    
    resetModalCompletions: () => {
      localStorage.removeItem('modalCompletions');
      set({ completedModals: {} });
    },
    
    setCompletionsForDate: (date: string, data: { singles: Set<string>; repeatables: Record<string, number> }) => {
      set(state => {
        const newState = { ...state.completedModals };
        
        const existingData = newState[date];
        if (existingData) {
          const mergedSingles = new Set(Array.from(existingData.singles));
          Array.from(data.singles).forEach(id => mergedSingles.add(id));
          
          const mergedRepeatables = { ...existingData.repeatables };
          for (const [id, count] of Object.entries(data.repeatables)) {
            mergedRepeatables[id] = Math.max(mergedRepeatables[id] || 0, count);
          }
          
          newState[date] = {
            singles: mergedSingles,
            repeatables: mergedRepeatables
          };
        } else {
          newState[date] = {
            singles: new Set(Array.from(data.singles)),
            repeatables: { ...data.repeatables }
          };
        }
        
        saveToStorage(newState);
        return { completedModals: newState };
      });
    }
  };
});

export const useDailyCompletionStore = create<DailyCompletionState>((set, get) => {
  const today = getLocalDateString();
  
  // For testing: reset on every page load/restart
  // For production: comment out the line below and uncomment the localStorage logic
  const isTestMode = false; // Set to false for production
  
  if (isTestMode) {
    // Reset on every restart for testing
    const initial = {
      torahCompleted: false,
      tefillaCompleted: false,
      tzedakaCompleted: false,
      lifeCompleted: false,
      tzedakaFlowerCount: 0,
      lifeFlowerCount: 0,
      congratulationsShown: false,
      completionDate: today
    };
    
    return {
      ...initial,
      completeTask: (task: 'torah' | 'tefilla' | 'tzedaka' | 'life') => {
        const state = get();
        // Only increment flower count for tzedaka and life (Torah/Tefilla flowers are tracked via modal completions)
        const shouldIncrementFlower = task === 'tzedaka' || task === 'life';
        const newState = {
          ...state,
          [`${task}Completed`]: true,
          ...(shouldIncrementFlower && { [`${task}FlowerCount`]: ((state as any)[`${task}FlowerCount`] || 0) + 1 }),
        };
        set(newState);
      },
      markTefillaComplete: () => {
        const state = get();
        const newState = {
          ...state,
          tefillaCompleted: true,
        };
        set(newState);
      },
      resetDaily: () => {
        const newState = {
          torahCompleted: false,
          tefillaCompleted: false,
          tzedakaCompleted: false,
          lifeCompleted: false,
          tzedakaFlowerCount: 0,
          lifeFlowerCount: 0,
          completionDate: today,
        };
        set(newState);
      },
      checkAndShowCongratulations: () => {
        const state = get();
        // Only check Torah, Tefilla, Tzedaka for congratulations (3 pillars)
        const allCompleted = state.torahCompleted && state.tefillaCompleted && state.tzedakaCompleted;
        
        if (allCompleted && !state.congratulationsShown) {
          // Mark congratulations as shown immediately to prevent race conditions
          const newState = { ...state, congratulationsShown: true };
          set(newState);
          
          // Double-check after state update to ensure consistency
          const updatedState = get();
          if (updatedState.congratulationsShown && 
              updatedState.torahCompleted && 
              updatedState.tefillaCompleted && 
              updatedState.tzedakaCompleted) {
            return true;
          }
        }
        return false;
      }
    };
  }
  
  // Production logic: persist to localStorage and reset daily
  const stored = localStorage.getItem('dailyCompletion');
  const initial = stored ? JSON.parse(stored) : {
    torahCompleted: false,
    tefillaCompleted: false,
    tzedakaCompleted: false,
    lifeCompleted: false,
    tzedakaFlowerCount: 0,
    lifeFlowerCount: 0,
    congratulationsShown: false,
    completionDate: today
  };
  
  // Reset if it's a new day
  if (initial.completionDate !== today) {
    initial.torahCompleted = false;
    initial.tefillaCompleted = false;
    initial.tzedakaCompleted = false;
    initial.lifeCompleted = false;
    initial.tzedakaFlowerCount = 0;
    initial.lifeFlowerCount = 0;
    initial.congratulationsShown = false;
    initial.completionDate = today;
  }
  
  // Ensure tzedakaFlowerCount exists for older localStorage data
  if (initial.tzedakaFlowerCount === undefined) {
    initial.tzedakaFlowerCount = initial.tzedakaCompleted ? 1 : 0;
  }
  
  // Ensure lifeCompleted exists for older localStorage data
  if (initial.lifeCompleted === undefined) {
    initial.lifeCompleted = false;
  }
  
  // Ensure lifeFlowerCount exists for older localStorage data
  if (initial.lifeFlowerCount === undefined) {
    initial.lifeFlowerCount = initial.lifeCompleted ? 1 : 0;
  }
  
  return {
    ...initial,
    completeTask: (task: 'torah' | 'tefilla' | 'tzedaka' | 'life') => {
      const state = get();
      // Only increment flower count for tzedaka and life (Torah/Tefilla flowers are tracked via modal completions)
      const shouldIncrementFlower = task === 'tzedaka' || task === 'life';
      const newState = {
        ...state,
        [`${task}Completed`]: true,
        ...(shouldIncrementFlower && { [`${task}FlowerCount`]: ((state as any)[`${task}FlowerCount`] || 0) + 1 }),
      };
      set(newState);
      localStorage.setItem('dailyCompletion', JSON.stringify(newState));
    },
    markTefillaComplete: () => {
      const state = get();
      const newState = {
        ...state,
        tefillaCompleted: true,
      };
      set(newState);
      localStorage.setItem('dailyCompletion', JSON.stringify(newState));
    },
    resetDaily: () => {
      const newState = {
        torahCompleted: false,
        tefillaCompleted: false,
        tzedakaCompleted: false,
        lifeCompleted: false,
        tzedakaFlowerCount: 0,
        lifeFlowerCount: 0,
        congratulationsShown: false,
        completionDate: today,
      };
      set(newState);
      localStorage.setItem('dailyCompletion', JSON.stringify(newState));
    },
    checkAndShowCongratulations: () => {
      const state = get();
      // Only check Torah, Tefilla, Tzedaka for congratulations (3 pillars)
      const allCompleted = state.torahCompleted && state.tefillaCompleted && state.tzedakaCompleted;
      
      if (allCompleted && !state.congratulationsShown) {
        // Mark congratulations as shown immediately to prevent race conditions
        const newState = { ...state, congratulationsShown: true };
        set(newState);
        localStorage.setItem('dailyCompletion', JSON.stringify(newState));
        
        // Double-check after state update to ensure consistency
        const updatedState = get();
        if (updatedState.congratulationsShown && 
            updatedState.torahCompleted && 
            updatedState.tefillaCompleted && 
            updatedState.tzedakaCompleted) {
          return true;
        }
      }
      return false;
    }
  };
});

// Store for tracking completed donations
export interface DonationCompletionState {
  completedDonations: Set<string>;
  addCompletedDonation: (donationType: string) => void;
  isCompleted: (donationType: string) => boolean;
  resetDaily: () => void;
}

export const useDonationCompletionStore = create<DonationCompletionState>((set, get) => {
  // Load from localStorage on initialization
  const today = getLocalDateString();
  let initialCompleted = new Set<string>();
  
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('donationCompletion');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today && Array.isArray(parsed.completed)) {
          initialCompleted = new Set(parsed.completed);
        }
      }
    } catch (e) {
      // Silently handle localStorage errors
    }
  }

  return {
    completedDonations: initialCompleted,
    addCompletedDonation: (donationType: string) => {
      const newCompleted = new Set(get().completedDonations);
      newCompleted.add(donationType);
      set({ completedDonations: newCompleted });
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          const today = getLocalDateString();
          localStorage.setItem('donationCompletion', JSON.stringify({
            date: today,
            completed: Array.from(newCompleted)
          }));
        } catch (e) {
          // Silently handle localStorage errors
        }
      }
    },
    isCompleted: (donationType: string) => {
      return get().completedDonations.has(donationType);
    },
    resetDaily: () => {
      if (typeof window !== 'undefined') {
        try {
          const today = getLocalDateString();
          const stored = localStorage.getItem('donationCompletion');
          
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date !== today) {
              // Reset if different day
              set({ completedDonations: new Set() });
              localStorage.removeItem('donationCompletion');
            }
          }
        } catch (e) {
          set({ completedDonations: new Set() });
          if (localStorage) {
            try {
              localStorage.removeItem('donationCompletion');
            } catch (cleanupError) {
              // Silently handle cleanup errors
            }
          }
        }
      }
    }
  };
});

export interface JewishTimes {
  sunrise: string;
  shkia: string;
  tzaitHakochavim: string;
  minchaGedolah: string;
  minchaKetanah: string;
  alosHashachar: string;
  chatzos: string;
  chatzotNight: string;
  plagHamincha: string;
  candleLighting?: string;
  havdalah?: string;
  hebrewDate: string;
  location: string;
  coordinates: { lat: number; lng: number };
}

export interface HebcalResponse {
  title: string;
  date: {
    hebrew: string;
  };
  location: {
    title: string;
  };
  items: Array<{
    title: string;
    category: string;
    time?: string;
  }>;
}
