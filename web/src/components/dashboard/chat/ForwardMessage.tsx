import { Dialog, Transition } from '@headlessui/react';
import { SearchIcon, XIcon } from '@heroicons/react/outline';
import { useTheme } from 'contexts/ThemeContext';
import { Fragment, useContext, useRef, useState } from 'react'
import Forward from "components/dashboard/chat/Forward";
import { ReactionsContext } from 'contexts/ReactionsContext';
import Style from 'components/Style';
import { useTranslation } from 'react-i18next';

export default function ForwardMessage() {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const {visibleForward, setVisibleForward, forwardMessage} = useContext(ReactionsContext);
  const cancelButtonRef = useRef(null);
  const [search, setSearch] = useState('');
  
  return (
    <Transition.Root show={visibleForward} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={visibleForward}
        onClose={setVisibleForward}
      >
        <Style css={`
          input:focus {
            border: none
          }
        `} />
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
            <div
              style={{ backgroundColor: themeColors?.background }}
              className="inline-block align-bottom rounded-xl border th-border-for text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full"
            >
              <div
                className="pl-8 p-6 pb-4 flex justify-between items-center"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold max-w-full truncate"
                >
                  {t("Forward this message")}
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setVisibleForward(false)}
                >
                  <XIcon
                    className="h-5 w-5"
                    style={{ color: themeColors?.foreground }}
                  />
                </div>
              </div>
              <div>
                <div
                  className="space-y-6 pt-2 pb-6 border-t th-border-for" 
                  style={{height: 350, maxHeight: 350}}>
                  <div className="w-full flex flex-1 flex-col px-5 pt-1">
                    <div className="mx-5 pb-2">
                      <Forward />
                    </div>
                  </div>
                </div>
                <div className="h-2" />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
