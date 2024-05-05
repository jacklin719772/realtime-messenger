import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import MembersSection from "components/dashboard/workspaces/MembersSection";
import SettingsSection from "components/dashboard/workspaces/SettingsSection";
import { useModal } from "contexts/ModalContext";
import { useTheme } from "contexts/ThemeContext";
import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import classNames from "utils/classNames";

export default function WorkspaceSettings({ workspace }: { workspace: any }) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const {
    openWorkspaceSettings: open,
    setOpenWorkspaceSettings: setOpen,
    workspaceSettingsSection: section,
    setWorkspaceSettingsSection: setSection,
  } = useModal();

  useEffect(() => {
    if (!open) setSection("members");
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        open={open}
        onClose={setOpen}
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
            <div
              style={{ backgroundColor: themeColors?.background }}
              className="inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
            >
              <div
                style={{ backgroundColor: themeColors?.background }}
                className="pl-8 p-6 pb-4 flex justify-between items-center"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold"
                >
                  {t("Edit_Workspace")}
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpen(false)}
                >
                  <XIcon
                    style={{ color: themeColors?.foreground }}
                    className="h-5 w-5"
                  />
                </div>
              </div>
              <div
                style={{ backgroundColor: themeColors?.background }}
                className="pt-1"
              >
                <RadioGroup
                  as="div"
                  value={section}
                  onChange={setSection}
                  className="flex space-x-6 px-8 text-sm font-normal"
                  style={{ color: themeColors?.foreground }}
                >
                  <RadioGroup.Option
                    value="members"
                    className="focus:outline-none"
                  >
                    {({ checked }) => (
                      <div
                        className={classNames(
                          checked ? "border-b-2" : "",
                          "pb-2 cursor-pointer"
                        )}
                        style={{
                          borderColor: checked ? themeColors?.cyan : "",
                        }}
                      >
                        <span>Members</span>
                      </div>
                    )}
                  </RadioGroup.Option>
                  <RadioGroup.Option
                    value="settings"
                    className="focus:outline-none"
                  >
                    {({ checked }) => (
                      <div
                        className={classNames(
                          checked ? "border-b-2" : "",
                          "pb-2 cursor-pointer"
                        )}
                        style={{
                          borderColor: checked ? themeColors?.cyan : "",
                        }}
                      >
                        <span>{t("Settings")}</span>
                      </div>
                    )}
                  </RadioGroup.Option>
                </RadioGroup>
                <div
                  style={{
                    backgroundColor: themeColors?.background,
                    height: 350, maxHeight: 350
                  }}
                  className="pt-5 border-t th-border-for flex flex-col overflow-y-auto"
                >
                  {section === "members" && <MembersSection />}
                  {section === "settings" && (
                    <SettingsSection workspace={workspace} />
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
