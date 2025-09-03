import TorahModals from "./torah-modals";
import TefillaModals from "./tefilla-modals";
import TimesModals from "./times-modals";
import TableModals from "./table-modals";
import TzedakaModals from "./tzedaka-modals";
import ShopModals from "./shop-modals";
import DonationModal from "./donation-modal";
import CongratulationsModal from "./congratulations-modal";
import AboutModal from "./about-modal";
import LocationModal from "./location-modal";
import SponsorDetailsModal from "./sponsor-details-modal";
import { CommunityImpactModal } from "./community-impact-modal";
import { useModalStore } from "@/lib/types";

interface ModalContainerProps {
  onSectionChange?: ((section: any) => void) | undefined;
}

export default function ModalContainer({ onSectionChange }: ModalContainerProps) {
  const { activeModal, closeModal } = useModalStore();
  
  return (
    <>
      <TorahModals onSectionChange={onSectionChange} />
      <TefillaModals onSectionChange={onSectionChange} />
      <TimesModals />
      <TableModals />
      <TzedakaModals />
      <ShopModals />
      <DonationModal />
      <CongratulationsModal />
      <AboutModal />
      <LocationModal 
        isOpen={activeModal === 'location'} 
        onClose={closeModal} 
      />
      <SponsorDetailsModal />
      <CommunityImpactModal />
    </>
  );
}
