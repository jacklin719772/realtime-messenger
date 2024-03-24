import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { ModalContext } from 'contexts/ModalContext';
import React, { Fragment, useContext, useRef } from 'react'

function MailComposer() {
  const cancelButtonRef = useRef(null);
  const {openMailSender, setOpenMailSender} = useContext(ModalContext);

  return (
    <Transition.Root show={openMailSender} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openMailSender}
        onClose={setOpenMailSender}
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
            <div className="th-bg-bg inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="th-bg-bg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div>
                  <h5 className="font-bold th-color-for">
                    Send E-mail
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenMailSender(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <div className="px-5 py-5 border-t th-border-selbg w-full h-auto">
                <div className="mt-2 w-full flex border th-border-for rounded">
                  <span className="flex select-none items-center w-24 px-3 th-color-for sm:text-sm border-r th-border-for bg-gray-200 rounded-l">Recipient</span>
                  <input type="text" name="username" id="username" autoComplete="username" className="rounded block flex-1 border-0 bg-transparent py-1.5 pl-2 th-color-for placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" placeholder="janesmith" />
                </div>
                <div className="mt-2 w-full flex border th-border-for rounded">
                  <span className="flex select-none items-center w-24 px-3 th-color-for sm:text-sm border-r th-border-for bg-gray-200 rounded-l">Title</span>
                  <input type="text" name="username" id="username" autoComplete="username" className="rounded block flex-1 border-0 bg-transparent py-1.5 pl-2 th-color-for placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" placeholder="janesmith" />
                </div>
                <div className="mt-2 w-full rounded border th-border-for">
                  <textarea className="w-full h-60 border-0 sm:text-sm placeholder:text-gray-400 focus:ring-0 rounded" placeholder="Enter the email content here..." />
                </div>
              </div>
              <div className="px-4 pb-5 pt-1 border-t th-border-selbg sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                <button onClick={() => setOpenMailSender(false)} className="th-bg-bg th-color-for th-border-for border text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                  Cancel
                </button>
                <button onClick={() => setOpenMailSender(false)} className="th-bg-bg th-color-blue th-border-blue border text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                  Send
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default MailComposer
