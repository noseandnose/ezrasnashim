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
