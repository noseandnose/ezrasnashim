import TorahModals from "./torah-modals";
import TefillaModals from "./tefilla-modals";
import TimesModals from "./times-modals";
import TableModals from "./table-modals";
import TzedakaModals from "./tzedaka-modals";
import ShopModals from "./shop-modals";
import DonationModal from "./donation-modal";
import CongratulationsModal from "./congratulations-modal";

interface ModalContainerProps {
  onSectionChange?: (section: any) => void;
}

export default function ModalContainer({ onSectionChange }: ModalContainerProps) {
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
    </>
  );
}
