import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import Spinner from "components/Spinner";
import { useModal } from "contexts/ModalContext";
import React, { Fragment,  useEffect,  useRef } from "react";

export default function EtherpadModal() {
  const {openEtherpad, setOpenEtherpad} = useModal();
  const cancelButtonRef = useRef(null);

  return (
    <Transition.Root show={openEtherpad} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openEtherpad}
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
            <div className="th-bg-bg inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="th-bg-bg px-4 pt-2 pb-4 sm:p-2 sm:pr-4 flex justify-end items-center">
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenEtherpad(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <div className="px-4 pb-5 pt-1 w-full h-[500px]">
                <iframe src="https://uteamwork.com/#/collaedit" allow="microphone *; camera *; display-capture *" className="w-full h-full" />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
