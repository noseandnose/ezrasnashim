import { lazy, Suspense } from "react";
import { useModalStore } from "@/lib/types";
import TorahModals from "./torah-modals";
import TefillaModals from "./tefilla-modals";
import TimesModals from "./times-modals";
import TableModals from "./table-modals";
import TzedakaModals from "./tzedaka-modals";
import ShopModals from "./shop-modals";
import MeditationModals from "./meditation-modals";
import ParshaVortModal from "./parsha-vort-modal";
import TorahClassModal from "./torah-class-modal";
import LifeClassModal from "./life-class-modal";
import DailyChizukModal from "./daily-chizuk-modal";
import DailyEmunaModal from "./daily-emuna-modal";

const CongratulationsModal = lazy(() => import("./congratulations-modal"));
const AboutModal = lazy(() => import("./about-modal"));
const SponsorDetailsModal = lazy(() => import("./sponsor-details-modal"));
const CommunityImpactModal = lazy(() => import("./community-impact-modal").then(m => ({ default: m.CommunityImpactModal })));
const EventsModal = lazy(() => import("./events-modal").then(m => ({ default: m.EventsModal })));

interface ModalContainerProps {
  onSectionChange?: ((section: any) => void) | undefined;
}

export default function ModalContainer({ onSectionChange }: ModalContainerProps) {
  const { activeModal, closeModal } = useModalStore();
  
  return (
    <>
      <TorahModals onSectionChange={onSectionChange || (() => {})} />
      <TefillaModals onSectionChange={onSectionChange || (() => {})} />
      <TimesModals />
      <TableModals />
      <TzedakaModals />
      <ShopModals />
      <MeditationModals />
      <ParshaVortModal />
      <TorahClassModal />
      <LifeClassModal />
      <DailyChizukModal />
      <DailyEmunaModal />
      
      <Suspense fallback={null}>
        {activeModal === 'congratulations' && <CongratulationsModal />}
      </Suspense>
      
      <Suspense fallback={null}>
        {activeModal === 'about' && <AboutModal />}
      </Suspense>
      
      <Suspense fallback={null}>
        {activeModal === 'sponsor-details' && <SponsorDetailsModal />}
      </Suspense>
      
      <Suspense fallback={null}>
        {activeModal === 'community-impact' && <CommunityImpactModal />}
      </Suspense>
      
      <Suspense fallback={null}>
        {activeModal === 'events' && <EventsModal isOpen={true} onClose={closeModal} />}
      </Suspense>
    </>
  );
}
