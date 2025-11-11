import { lazy, Suspense } from "react";
import { useModalStore } from "@/lib/types";

const TorahModals = lazy(() => import("./torah-modals"));
const TefillaModals = lazy(() => import("./tefilla-modals"));
const TimesModals = lazy(() => import("./times-modals"));
const TableModals = lazy(() => import("./table-modals"));
const TzedakaModals = lazy(() => import("./tzedaka-modals"));
const ShopModals = lazy(() => import("./shop-modals"));
const CongratulationsModal = lazy(() => import("./congratulations-modal"));
const AboutModal = lazy(() => import("./about-modal"));
const SponsorDetailsModal = lazy(() => import("./sponsor-details-modal"));
const CommunityImpactModal = lazy(() => import("./community-impact-modal").then(m => ({ default: m.CommunityImpactModal })));
const EventsModal = lazy(() => import("./events-modal").then(m => ({ default: m.EventsModal })));
const MeditationModals = lazy(() => import("./meditation-modals"));

interface ModalContainerProps {
  onSectionChange?: ((section: any) => void) | undefined;
}

const torahModals = ['halacha', 'emuna', 'chizuk', 'loshon', 'featured', 'pirkei-avot'];
const tefillaModals = ['morning-brochas', 'mincha', 'maariv', 'womens-prayers', 'blessings', 'tefillos', 'personal-prayers', 'nishmas-campaign', 'tehillim-text', 'tehillim', 'special-tehillim', 'individual-tehillim', 'nishmas', 'birkat-hamazon', 'after-brochas', 'al-hamichiya', 'brochas', 'individual-brocha', 'global-tehillim', 'me-ein-shalosh', 'compass'];
const timesModals = ['jerusalem-compass', 'date-calculator-fullscreen', 'location'];
const tableModals = ['recipe', 'inspiration', 'parsha', 'parsha-vort'];
const tzedakaModals = ['donate', 'refuah', 'family', 'life', 'individual-prayer', 'gave-elsewhere', 'support-torah', 'torah-dedication', 'wedding-campaign', 'womens-causes', 'infertility-support', 'abuse-support', 'sponsor-day'];
const shopModals = ['shop'];
const meditationModals = ['meditation-categories', 'meditation-list', 'meditation-player'];

export default function ModalContainer({ onSectionChange }: ModalContainerProps) {
  const { activeModal, closeModal } = useModalStore();
  
  const shouldRenderTorah = activeModal && torahModals.includes(activeModal);
  const shouldRenderTefilla = activeModal && tefillaModals.includes(activeModal);
  const shouldRenderTimes = activeModal && timesModals.includes(activeModal);
  const shouldRenderTable = activeModal && tableModals.includes(activeModal);
  const shouldRenderTzedaka = activeModal && tzedakaModals.includes(activeModal);
  const shouldRenderShop = activeModal && shopModals.includes(activeModal);
  const shouldRenderMeditation = activeModal && meditationModals.includes(activeModal);
  
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-full p-4">
          <div className="animate-spin w-8 h-8 border-2 border-pink-300 border-t-transparent rounded-full"></div>
        </div>
      </div>
    }>
      {shouldRenderTorah && <TorahModals onSectionChange={onSectionChange || (() => {})} />}
      {shouldRenderTefilla && <TefillaModals onSectionChange={onSectionChange || (() => {})} />}
      {shouldRenderTimes && <TimesModals />}
      {shouldRenderTable && <TableModals />}
      {shouldRenderTzedaka && <TzedakaModals />}
      {shouldRenderShop && <ShopModals />}
      {shouldRenderMeditation && <MeditationModals />}
      
      {activeModal === 'congratulations' && <CongratulationsModal />}
      {activeModal === 'about' && <AboutModal />}
      {activeModal === 'sponsor-details' && <SponsorDetailsModal />}
      {activeModal === 'community-impact' && <CommunityImpactModal />}
      {activeModal === 'events' && <EventsModal isOpen={true} onClose={closeModal} />}
    </Suspense>
  );
}
