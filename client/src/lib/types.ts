import { create } from 'zustand';

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
  | 'donate'
  | 'about'
  | 'location'
  | 'sponsor-details'
  | null;

export interface ModalState {
  activeModal: string | null;
  selectedPsalm: number | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setSelectedPsalm: (psalmNumber: number) => void;
  
  // Convenience methods for specific modals
  isBirkatHamazonModalOpen: boolean;
  openBirkatHamazonModal: () => void;
  closeBirkatHamazonModal: () => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  activeModal: null,
  selectedPsalm: null,
  openModal: (modalId: string) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  setSelectedPsalm: (psalmNumber: number) => set({ selectedPsalm: psalmNumber }),
  
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

export const useModalCompletionStore = create<ModalCompletionState>((set, get) => ({
  completedModals: {},
  markModalComplete: (modalId: string) => {
    const today = new Date().toISOString().split('T')[0];
    set(state => {
      const newState = { ...state.completedModals };
      if (!newState[today]) {
        newState[today] = new Set();
      }
      newState[today].add(modalId);
      return { completedModals: newState };
    });
  },
  isModalComplete: (modalId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysCompletions = get().completedModals[today];
    return todaysCompletions ? todaysCompletions.has(modalId) : false;
  },
  resetModalCompletions: () => {
    set({ completedModals: {} });
  }
}));

export const useDailyCompletionStore = create<DailyCompletionState>((set, get) => {
  const today = new Date().toISOString().split('T')[0];
  
  // For testing: reset on every page load/restart
  // For production: comment out the line below and uncomment the localStorage logic
  const isTestMode = true; // Set to false for production
  
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
