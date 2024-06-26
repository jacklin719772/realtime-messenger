import { Dialog, Transition } from "@headlessui/react";
import { TrashIcon, XIcon } from "@heroicons/react/outline";
import { useModal } from "contexts/ModalContext";
import React, { Fragment,  useRef } from "react";
import { useTranslation } from "react-i18next";

export default function DeleteConfirm({
  handleDelete,
}: {
  handleDelete: any;
}) {
  const { t } = useTranslation();
  const cancelButtonRef = useRef(null);
  const {openDeletePad, setOpenDeletePad, checkedPads} = useModal();

  return (
    <Transition.Root show={openDeletePad} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openDeletePad}
        onClose={() => {}}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="th-bg-bg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <TrashIcon className="th-color-for w-6" />
                  <h5 className="font-bold th-color-for">
                    {t("Are_you_want_to_delete_this_pad")}
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenDeletePad(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <div className="px-4 pb-2 pt-2 border-t th-border-for sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                <button onClick={() => setOpenDeletePad(false)} className="th-bg-bg th-color-for th-border-for border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                  {t("Cancel")}
                </button>
                <button onClick={() => handleDelete(checkedPads)} className="th-bg-bg th-color-brred th-border-brred border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none">
                  {t("Delete")}
                </button>
                {/* <ModalButton onClick={deleteMessage} text="Delete" />
                <ModalButton onClick={() => setOpen(false)} text="Cancel" /> */}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
