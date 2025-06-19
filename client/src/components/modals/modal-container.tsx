import TorahModals from "./torah-modals";
import TefillaModals from "./tefilla-modals";
import TimesModals from "./times-modals";
import TableModals from "./table-modals";
import TzedakaModals from "./tzedaka-modals";
import ShopModals from "./shop-modals";
import DonationModal from "./donation-modal";
import CongratulationsModal from "./congratulations-modal";

export default function ModalContainer() {
  return (
    <>
      <TorahModals />
      <TefillaModals />
      <TimesModals />
      <TableModals />
      <TzedakaModals />
      <ShopModals />
      <DonationModal />
      <CongratulationsModal />
    </>
  );
}
