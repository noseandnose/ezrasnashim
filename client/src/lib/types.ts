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
  | null;

export interface ModalState {
  activeModal: string | null;
  selectedPsalm: number | null;
  previousSection: string | null;
  previousModal: string | null;
  tehillimActiveTab: 'all' | 'special';
  tehillimReturnTab: 'all' | 'special' | null; // Store the return tab preference
  openModal: (modalId: string, fromSection?: string, psalmNumber?: number) => void;
  closeModal: (returnToPrevious?: boolean) => void;
  setSelectedPsalm: (psalmNumber: number) => void;
  setTehillimActiveTab: (tab: 'all' | 'special') => void;
  setTehillimReturnTab: (tab: 'all' | 'special') => void;
  
  // Convenience methods for specific modals
  isBirkatHamazonModalOpen: boolean;
  openBirkatHamazonModal: () => void;
  closeBirkatHamazonModal: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  activeModal: null,
  selectedPsalm: null,
  previousSection: null,
  previousModal: null,
  tehillimActiveTab: 'all',
  tehillimReturnTab: null,
  openModal: (modalId: string, fromSection?: string, psalmNumber?: number) => {
    const currentModal = get().activeModal;
    set({ 
      activeModal: modalId, 
      previousSection: fromSection || get().previousSection,
      previousModal: currentModal,
      selectedPsalm: psalmNumber || get().selectedPsalm
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
  setTehillimActiveTab: (tab: 'all' | 'special') => set({ tehillimActiveTab: tab }),
  setTehillimReturnTab: (tab: 'all' | 'special') => set({ tehillimReturnTab: tab }),
  
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
  congratulationsShown: boolean;
  completionDate: string;
  completeTask: (task: 'torah' | 'tefilla' | 'tzedaka') => void;
  markTefillaComplete: () => void;
  resetDaily: () => void;
  checkAndShowCongratulations: () => boolean;
}

// Daily modal completion tracking
export interface ModalCompletionState {
  completedModals: Record<string, Set<string>>; // date -> set of modalIds
  markModalComplete: (modalId: string) => void;
  isModalComplete: (modalId: string) => boolean;
  resetModalCompletions: () => void;
}

export const useModalCompletionStore = create<ModalCompletionState>((set, get) => {
  // Load initial state from localStorage
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('modalCompletions');
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = getLocalDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayYear = yesterday.getFullYear();
        const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
        const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayStr = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
        
        // Convert arrays back to Sets, but only keep today and yesterday
        const completedModals: Record<string, Set<string>> = {};
        for (const [date, modals] of Object.entries(parsed)) {
          // Only load today's and yesterday's data (for midnight transition)
          if (date === today || date === yesterdayStr) {
            completedModals[date] = new Set(modals as string[]);
          }
        }
        return completedModals;
      }
    } catch (e) {
      console.error('Failed to load modal completions from storage:', e);
      // Clear corrupted data
      localStorage.removeItem('modalCompletions');
    }
    return {};
  };

  // Save to localStorage whenever state changes
  const saveToStorage = (completedModals: Record<string, Set<string>>) => {
    try {
      // Convert Sets to arrays for JSON serialization
      const toStore: Record<string, string[]> = {};
      for (const [date, modals] of Object.entries(completedModals)) {
        toStore[date] = Array.from(modals);
      }
      localStorage.setItem('modalCompletions', JSON.stringify(toStore));
    } catch (e) {
      console.error('Failed to save modal completions to storage:', e);
    }
  };

  return {
    completedModals: loadFromStorage(),
    markModalComplete: (modalId: string) => {
      const today = getLocalDateString();
      set(state => {
        const newState = { ...state.completedModals };
        if (!newState[today]) {
          newState[today] = new Set();
        } else {
          // Clone the existing Set to ensure proper state update
          newState[today] = new Set(newState[today]);
        }
        newState[today].add(modalId);
        
        // Clean up old dates (keep only today and yesterday for transition period)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayYear = yesterday.getFullYear();
        const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
        const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayStr = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
        
        for (const date in newState) {
          if (date !== today && date !== yesterdayStr) {
            delete newState[date];
          }
        }
        
        saveToStorage(newState);
        return { completedModals: newState };
      });
    },
    isModalComplete: (modalId: string) => {
      const today = getLocalDateString();
      const todaysCompletions = get().completedModals[today];
      return todaysCompletions ? todaysCompletions.has(modalId) : false;
    },
    resetModalCompletions: () => {
      localStorage.removeItem('modalCompletions');
      set({ completedModals: {} });
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
      congratulationsShown: false,
      completionDate: today
    };
    
    return {
      ...initial,
      completeTask: (task: 'torah' | 'tefilla' | 'tzedaka') => {
        const state = get();
        const newState = {
          ...state,
          [`${task}Completed`]: true,
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
          completionDate: today,
        };
        set(newState);
      },
      checkAndShowCongratulations: () => {
        const state = get();
        const allCompleted = state.torahCompleted && state.tefillaCompleted && state.tzedakaCompleted;
        
        if (allCompleted && !state.congratulationsShown) {
          // Mark congratulations as shown
          set({ ...state, congratulationsShown: true });
          return true;
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
    congratulationsShown: false,
    completionDate: today
  };
  
  // Reset if it's a new day
  if (initial.completionDate !== today) {
    initial.torahCompleted = false;
    initial.tefillaCompleted = false;
    initial.tzedakaCompleted = false;
    initial.congratulationsShown = false;
    initial.completionDate = today;
  }
  
  return {
    ...initial,
    completeTask: (task: 'torah' | 'tefilla' | 'tzedaka') => {
      const state = get();
      const newState = {
        ...state,
        [`${task}Completed`]: true,
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
        congratulationsShown: false,
        completionDate: today,
      };
      set(newState);
      localStorage.setItem('dailyCompletion', JSON.stringify(newState));
    },
    checkAndShowCongratulations: () => {
      const state = get();
      const allCompleted = state.torahCompleted && state.tefillaCompleted && state.tzedakaCompleted;
      
      if (allCompleted && !state.congratulationsShown) {
        // Mark congratulations as shown
        const newState = { ...state, congratulationsShown: true };
        set(newState);
        localStorage.setItem('dailyCompletion', JSON.stringify(newState));
        return true;
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
  candleLighting?: string;
  havdalah?: string;
  hebrewDate: string;
  location: string;
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
