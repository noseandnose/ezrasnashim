import { create } from 'zustand';

export type ModalType = 
  | 'mincha' 
  | 'tehillim' 
  | 'nishmas' 
  | 'refuah' 
  | 'family' 
  | 'life' 
  | 'individual-prayer' 
  | null;

export interface ModalState {
  activeModal: ModalType;
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
