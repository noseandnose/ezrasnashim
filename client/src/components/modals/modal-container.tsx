import { lazy, Suspense } from "react";
import { useModalStore } from "@/lib/types";

const TorahModals = lazy(() => import("./torah-modals"));
const TefillaModals = lazy(() => import("./tefilla-modals"));
const TimesModals = lazy(() => import("./times-modals"));
const TableModals = lazy(() => import("./table-modals"));
const TzedakaModals = lazy(() => import("./tzedaka-modals"));
const ShopModals = lazy(() => import("./shop-modals"));
const MeditationModals = lazy(() => import("./meditation-modals"));
const ParshaVortModal = lazy(() => import("./parsha-vort-modal"));
const TorahClassModal = lazy(() => import("./torah-class-modal"));
const LifeClassModal = lazy(() => import("./life-class-modal"));
const DailyChizukModal = lazy(() => import("./daily-chizuk-modal"));
const DailyEmunaModal = lazy(() => import("./daily-emuna-modal"));
const CongratulationsModal = lazy(() => import("./congratulations-modal"));
const AboutModal = lazy(() => import("./about-modal"));
const SponsorDetailsModal = lazy(() => import("./sponsor-details-modal"));
const CommunityImpactModal = lazy(() => import("./community-impact-modal").then(m => ({ default: m.CommunityImpactModal })));
const EventsModal = lazy(() => import("./events-modal").then(m => ({ default: m.EventsModal })));

const TORAH_MODALS = ['halacha', 'emuna', 'chizuk', 'loshon', 'featured', 'gems-of-gratitude', 'torah-challenge', 'pirkei-avot'];
const TEFILLA_MODALS = ['mincha', 'maariv', 'morning-brochas', 'birkat-hamazon', 'tehillim', 'tehillim-text', 'special-tehillim', 'individual-tehillim', 'nishmas', 'nishmas-campaign', 'refuah', 'family', 'life', 'individual-prayer', 'womens-prayers', 'womens-tefillas', 'blessings', 'tefillos', 'personal-prayers', 'gift-of-chatzos'];
const TIMES_MODALS = ['location', 'jerusalem-compass', 'date-calculator-fullscreen'];
const TABLE_MODALS = ['recipe', 'shabbat', 'creative-living', 'marriage-insights'];
const TZEDAKA_MODALS = ['donate', 'tzedaka-daily', 'raffle'];
const SHOP_MODALS = ['shop', 'kiddush-hashem'];
const MEDITATION_MODALS = ['meditation', 'meditation-player'];

function ModalFallback() {
  return null;
}

interface ModalContainerProps {
  onSectionChange?: ((section: any) => void) | undefined;
}

export default function ModalContainer({ onSectionChange }: ModalContainerProps) {
  const { activeModal, closeModal } = useModalStore();
  
  const isTorahModal = activeModal && TORAH_MODALS.includes(activeModal);
  const isTefillaModal = activeModal && TEFILLA_MODALS.includes(activeModal);
  const isTimesModal = activeModal && TIMES_MODALS.includes(activeModal);
  const isTableModal = activeModal && TABLE_MODALS.includes(activeModal);
  const isTzedakaModal = activeModal && TZEDAKA_MODALS.includes(activeModal);
  const isShopModal = activeModal && SHOP_MODALS.includes(activeModal);
  const isMeditationModal = activeModal && MEDITATION_MODALS.includes(activeModal);
  
  return (
    <>
      <Suspense fallback={<ModalFallback />}>
        {isTorahModal && <TorahModals onSectionChange={onSectionChange || (() => {})} />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {isTefillaModal && <TefillaModals onSectionChange={onSectionChange || (() => {})} />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {isTimesModal && <TimesModals />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {isTableModal && <TableModals />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {isTzedakaModal && <TzedakaModals />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {isShopModal && <ShopModals />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {isMeditationModal && <MeditationModals />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'parsha-vort' && <ParshaVortModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'torah-class' && <TorahClassModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'life-class' && <LifeClassModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'daily-chizuk' && <DailyChizukModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'daily-emuna' && <DailyEmunaModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'congratulations' && <CongratulationsModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'about' && <AboutModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'sponsor-details' && <SponsorDetailsModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'community-impact' && <CommunityImpactModal />}
      </Suspense>
      
      <Suspense fallback={<ModalFallback />}>
        {activeModal === 'events' && <EventsModal isOpen={true} onClose={closeModal} />}
      </Suspense>
    </>
  );
}
