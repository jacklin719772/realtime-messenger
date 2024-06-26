import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { ArchiveIcon, TrashIcon, XIcon } from "@heroicons/react/outline";
import ConfirmationModal from "components/ConfirmationModal";
import EditChannelItems from "components/dashboard/channels/EditChannelItems";
import MembersSection from "components/dashboard/channels/MembersSection";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { useChannelById } from "hooks/useChannels";
import { useWorkspaceById } from "hooks/useWorkspaces";
import React, { Fragment, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { deleteData, postData } from "utils/api-helpers";
import classNames from "utils/classNames";

export default function EditChannel({
  open,
  setOpen,
  name,
  topic,
  details,
  createdAt,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  topic: string;
  details: string;
  createdAt: any;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const cancelButtonRef = useRef(null);
  const [section, setSection] = useState("about");
  const { channelId, workspaceId } = useParams();
  const { value: channel } = useChannelById(channelId);
  const { value } = useWorkspaceById(workspaceId);
  const { user } = useUser();
  const navigate = useNavigate();

  const defaultChannel = value?.channelId === channelId;
  const isOwner = user?.uid === channel?.createdBy;

  useEffect(() => {
    setSection("about");
  }, [open]);

  const [openDeleteChannel, setOpenDeleteChannel] = useState(false);
  const [openArchiveChannel, setOpenArchiveChannel] = useState(false);
  const [openLeaveChannel, setOpenLeaveChannel] = useState(false);

  const deleteChannel = async () => {
    try {
      await deleteData(`/channels/${channelId}`);
      setOpenDeleteChannel(false);
      setOpen(false);
      navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: any) {
      toast.error(t("Deleting channel failed."));
    }
  };

  const archiveChannel = async () => {
    try {
      await postData(`/channels/${channelId}/archive`);
      setOpenArchiveChannel(false);
      setOpen(false);
      navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: any) {
      toast.error(t("Archiving channel failed."));
    }
  };

  const leaveChannel = async () => {
    try {
      await deleteData(`/channels/${channelId}/members/${user?.uid}`);
      setOpenLeaveChannel(false);
      setOpen(false);
      navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: any) {
      toast.error(t("Leaving channel failed."));
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
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
              className="inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full"
            >
              <div
                style={{ backgroundColor: themeColors?.background }}
                className="pl-8 p-6 pb-4 flex justify-between items-center border-b th-border-for"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold max-w-full truncate"
                >
                  {`#${name}`}
                  {defaultChannel ? (
                    <span
                      style={{ color: themeColors?.foreground }}
                      className="text-base opacity-70 px-2"
                    >
                      ({t("default")})
                    </span>
                  ) : null}
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpen(false)}
                >
                  <XIcon
                    className="h-5 w-5"
                    style={{ color: themeColors?.foreground }}
                  />
                </div>
              </div>
              <div className="pt-2" style={{ color: themeColors?.background }}>
                <RadioGroup
                  as="div"
                  value={section}
                  onChange={setSection}
                  className="flex space-x-6 px-8 text-sm font-normal"
                  style={{ color: themeColors?.foreground }}
                >
                  <RadioGroup.Option
                    value="about"
                    className="focus:outline-none"
                  >
                    {({ checked }) => (
                      <div
                        className={classNames(
                          checked ? "border-b-2" : "",
                          "pb-2 cursor-pointer"
                        )}
                        style={{
                          borderColor: checked ? themeColors?.foreground : "",
                        }}
                      >
                        <span>{t("About")}</span>
                      </div>
                    )}
                  </RadioGroup.Option>
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
                          borderColor: checked ? themeColors?.foreground : "",
                        }}
                      >
                        <span>{t("Members")}</span>
                      </div>
                    )}
                  </RadioGroup.Option>
                  {isOwner && (
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
                            borderColor: checked ? themeColors?.foreground : "",
                          }}
                        >
                          <span>{t("Settings")}</span>
                        </div>
                      )}
                    </RadioGroup.Option>
                  )}
                </RadioGroup>
                <div
                  className={classNames(
                    section === "members" ? "" : "px-8",
                    "space-y-4 pt-4 pb-8 th-bg-bg th-border-selbg"
                  )}
                  style={{height: 350, maxHeight: 350}}
                >
                  {section === "about" && (
                    <>
                      <div className="border rounded-xl th-bg-bg th-border-for">
                        <EditChannelItems
                          name={t("Topic")}
                          placeholder={t("Add_a_Topic")}
                          title={t("Edit_Topic")}
                          field="topic"
                          value={topic}
                          editable={t("Edit_Topic_Detail")}
                          isOwner={isOwner}
                        />
                        <EditChannelItems
                          name={t("Description")}
                          placeholder={t("Add_a-description")}
                          title={t("Edit_Description")}
                          field="details"
                          value={details}
                          editable={t("Edit_Description_Detail")}
                          isOwner={isOwner}
                        />
                        <EditChannelItems name={t("Created_at")} value={createdAt} isOwner={isOwner} />
                        {!isOwner && !defaultChannel && (
                          <EditChannelItems
                            name={t("Leave_channel")}
                            color={themeColors?.red}
                            displayDetails={false}
                            onClick={() => setOpenLeaveChannel(true)} isOwner={isOwner}                          />
                        )}
                      </div>
                      <ConfirmationModal
                        text="You can rejoin at any time."
                        title={t("Leave_channel")}
                        onConfirm={leaveChannel}
                        open={openLeaveChannel}
                        setOpen={setOpenLeaveChannel}
                      />
                    </>
                  )}
                  {section === "members" && <MembersSection isOwner={isOwner} />}
                  {section === "settings" && (
                    <>
                      <div
                        style={{
                          backgroundColor: themeColors?.background,
                        }}
                        className="border rounded-xl th-border-for"
                      >
                        <EditChannelItems
                          name={t("Name")}
                          field="name"
                          title={t("Rename_this_channel")}
                          placeholder="e.g. marketing"
                          value={`#${name}`}
                          textArea={false}
                          editable={t("Rename_Detail")}
                          isOwner={isOwner}
                        />
                      </div>
                      {!defaultChannel && (
                        <div
                          style={{
                            backgroundColor: themeColors?.background,
                          }}
                          className="border rounded-xl th-border-for"
                        >
                          <EditChannelItems
                            icon={<ArchiveIcon
                              style={{
                                color: themeColors?.red,
                              }}
                              className="focus-within:h-5 w-5 mr-2" />}
                            color={themeColors?.red}
                            name={t("Archive_channel")}
                            displayDetails={false}
                            onClick={() => setOpenArchiveChannel(true)} isOwner={false}                          />
                          <EditChannelItems
                            icon={<TrashIcon
                              style={{
                                color: themeColors?.red,
                              }}
                              className="focus-within:h-5 w-5 mr-2" />}
                            color={themeColors?.red}
                            name={t("Delete_channel")}
                            displayDetails={false}
                            onClick={() => setOpenDeleteChannel(true)} isOwner={false}                          />
                        </div>
                      )}
                      <ConfirmationModal
                        text={t("Delete_channel_Detail")}
                        title={t("Delete_channel")}
                        onConfirm={deleteChannel}
                        open={openDeleteChannel}
                        setOpen={setOpenDeleteChannel}
                      />
                      <ConfirmationModal
                        text={t("Archive_channel_Detail")}
                        title={t("Archive_channel")}
                        onConfirm={archiveChannel}
                        open={openArchiveChannel}
                        setOpen={setOpenArchiveChannel}
                      />
                    </>
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
