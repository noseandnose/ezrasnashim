import { create } from 'zustand';

export type ModalType = 
  | 'mincha' 
  | 'tehillim' 
  | 'tehillim-text'
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
  | null;

export interface ModalState {
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  openModal: (modalId: string) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));

// Daily completion tracking
export interface DailyCompletionState {
  torahCompleted: boolean;
  tefillaCompleted: boolean;
  tzedakaCompleted: boolean;
  completionDate: string;
  completeTask: (task: 'torah' | 'tefilla' | 'tzedaka') => void;
  resetDaily: () => void;
  checkAndShowCongratulations: () => boolean;
}

export const useDailyCompletionStore = create<DailyCompletionState>((set, get) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Load from localStorage
  const stored = localStorage.getItem('dailyCompletion');
  const initial = stored ? JSON.parse(stored) : {
    torahCompleted: false,
    tefillaCompleted: false,
    tzedakaCompleted: false,
    completionDate: today
  };
  
  // Reset if it's a new day
  if (initial.completionDate !== today) {
    initial.torahCompleted = false;
    initial.tefillaCompleted = false;
    initial.tzedakaCompleted = false;
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
    resetDaily: () => {
      const newState = {
        torahCompleted: false,
        tefillaCompleted: false,
        tzedakaCompleted: false,
        completionDate: today,
      };
      set(newState);
      localStorage.setItem('dailyCompletion', JSON.stringify(newState));
    },
    checkAndShowCongratulations: () => {
      const state = get();
      return state.torahCompleted && state.tefillaCompleted && state.tzedakaCompleted;
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
