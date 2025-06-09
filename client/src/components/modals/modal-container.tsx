import TorahModals from "./torah-modals";
import TefillaModals from "./tefilla-modals";
import TimesModals from "./times-modals";
import TableModals from "./table-modals";
import TzedakaModals from "./tzedaka-modals";

export default function ModalContainer() {
  return (
    <>
      <TorahModals />
      <TefillaModals />
      <TimesModals />
      <TableModals />
      <TzedakaModals />
    </>
  );
}
