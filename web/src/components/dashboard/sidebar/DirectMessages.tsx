import { Disclosure, Menu, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon, DotsHorizontalIcon, PlusIcon, XIcon } from "@heroicons/react/outline";
import AddTeammatesModal from "components/dashboard/workspaces/AddTeammatesModal";
import Spinner from "components/Spinner";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { useModal } from "contexts/ModalContext";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { useDetailByChat } from "hooks/useDetails";
import { usePresenceByUserId } from "hooks/usePresence";
import { useUserById } from "hooks/useUsers";
import { ReactComponent as ArrowIcon } from "icons/arrow.svg";
import { Fragment, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import { useTranslation } from "react-i18next";
import { DetailsContext } from "contexts/DetailsContext";

function DirectMessage({ dm }: { dm: any }) {
  const { themeColors } = useTheme();
  const navigate = useNavigate();
  const { workspaceId, dmId } = useParams();

  const { user } = useUser();

  const isMe = dm?.members?.length === 1 && dm?.members[0] === user?.uid;
  const otherUserId = dm?.members.find((m: string) => m !== user?.uid);

  const { value } = useUserById(otherUserId || user?.uid);
  const { isPresent } = usePresenceByUserId(otherUserId || user?.uid);

  const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);

  const { value: detail } = useDetailByChat(dm?.objectId);
  const notifications = dm
    ? dm.lastMessageCounter - (detail?.lastRead || 0)
    : 0;

  const [loading, setLoading] = useState(false);

  const selected = dmId === dm?.objectId;

  const typingArray = dm?.typing?.filter((typ: any) => typ !== user?.uid);

  const closeConversation = async () => {
    setLoading(true);
    try {
      const id = dm?.objectId;
      await postData(`/directs/${dm?.objectId}/close`);
      if (dmId === id) navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };
  return (
    <div
      className="relative py-1 flex items-center justify-between cursor-pointer focus:outline-none group"
      style={{
        backgroundColor: selected ? themeColors?.blue : "transparent",
        color: selected ? themeColors?.brightWhite : themeColors?.foreground,
      }}
    >
      <div
        className="pl-8 flex items-center w-full focus:outline-none"
        role="button"
        tabIndex={0}
        onClick={() =>
          navigate(`/dashboard/workspaces/${workspaceId}/dm/${dm?.objectId}`)
        }
      >
        <div className="relative mr-2 flex-shrink-0">
          <div
            className={classNames(
              selected ? "th-bg-blue" : "th-bg-selbg",
              "rounded-full h-3 w-3 absolute bottom-0 right-0 transform translate-x-1 translate-y-1 flex items-center justify-center"
            )}
          >
            <div
              style={{
                backgroundColor: isPresent ? "#94e864" : "transparent",
              }}
              className={classNames(
                isPresent ? "" : "border border-gray-400",
                "rounded-full h-2 w-2"
              )}
            />
          </div>
          <img
            src={photoURL || `${process.env.PUBLIC_URL}/blank_user.png`}
            alt="message"
            className="rounded h-5 w-5"
          />
        </div>
        <div
          className={classNames(
            notifications ? "font-semibold" : "",
            "truncate w-36",
            selected ? "th-color-brwhite" : "th-color-brblue"
          )}
        >
          {!isMe ? value?.displayName : `${value?.displayName} (me)`}
        </div>
      </div>
      <div className="mr-3">
        {notifications > 0 && !typingArray?.length && (
          <div
            style={{
              paddingTop: "2px",
              paddingBottom: "2px",
              marginTop: "2px",
              marginBottom: "2px",
            }}
            className="text-xs rounded px-2 focus:outline-none th-color-brwhite th-bg-red font-semibold flex items-center justify-center"
            role="button"
            tabIndex={0}
            onClick={() =>
              navigate(
                `/dashboard/workspaces/${workspaceId}/dm/${dm?.objectId}`
              )
            }
          >
            {notifications}
          </div>
        )}
        {notifications > 0 && typingArray?.length > 0 && (
          <div
            style={{
              paddingTop: "2px",
              paddingBottom: "2px",
              marginTop: "2px",
              marginBottom: "2px",
            }}
            className="rounded flex items-centerjustify-center px-1 th-color-brwhite th-bg-red font-semibold text-xs"
          >
            <DotsHorizontalIcon className="h-4 w-4 animate-bounce" />
          </div>
        )}
        {!notifications && !loading && typingArray?.length > 0 && (
          <div
            style={{ paddingTop: "4px", paddingBottom: "4px" }}
            className="rounded flex items-center justify-center px-2 th-color-brwhite font-semibold text-xs"
          >
            <DotsHorizontalIcon className="h-4 w-4 animate-bounce" />
          </div>
        )}
        {!notifications && !typingArray?.length && loading && (
          <Spinner className="h-4 w-4 flex-shrink-0 m-1" />
        )}
        {!notifications && !loading && !typingArray?.length && (
          <XIcon
            onClick={closeConversation}
            className="flex-shrink-0 h-6 w-6 p-1 opacity-0 group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}

function AddTeammates() {
  const { t } = useTranslation();
  const { setOpenCreateMessage: setOpen, setCreateMessageSection: setSection } =
    useModal();
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center px-8 cursor-pointer focus:outline-none pt-2"
      onClick={() => {
        setOpen(true);
        setSection("members");
      }}
    >
      <div className="flex items-center justify-center rounded p-1 mr-2 th-bg-brblue">
        <PlusIcon className="h-3 w-3 th-color-brwhite" />
      </div>
      <h5 className="th-color-brblue">{t("Add_members")}</h5>
    </div>
  );
}

export default function DirectMessages() {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const { value } = useContext(DirectMessagesContext);
  const { value: details } = useContext(DetailsContext);
  const [dmList, setDmList] = useState<any[]>([]);
  const [type, setType] = useState("Unread");

  const sortByTime = () => {
    const sorted = [...dmList].sort((a: any, b: any) => new Date(b?.updatedAt).getTime() - new Date(a?.updatedAt).getTime());
    console.log(sorted);
    setType("Time");
    setDmList(sorted);
  }

  const sortByUnread = () => {
    const sorted = [...dmList].sort((a: any, b: any) => (
      b?.lastMessageCounter - details?.find((p: any) => p.chatId === b?.objectId)?.lastRead
    ) - (
      a?.lastMessageCounter - details?.find((p: any) => p.chatId === a?.objectId)?.lastRead
    ));
    console.log(sorted);
    setType("Unread");
    setDmList(sorted);
  }

  useEffect(() => {
    if (value && value.length > 0) {
      setDmList(value);
    }
  }, [value]);

  useEffect(() => {
    if (dmList.length > 0 && type === "Unread") {
      sortByUnread();
    }
    if (dmList.length > 0 &&type === "Time") {
      sortByTime();
    }
  }, [dmList, type]);

  return (
    <div>
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <div className="flex items-center">
              <Disclosure.Button className="flex justify-between items-center px-4 cursor-pointer">
                <div className="flex items-center">
                  <ArrowIcon
                    className={classNames(
                      open ? "transform rotate-90" : "",
                      "h-4 w-4 mr-2"
                    )}
                    style={{
                      color: themeColors?.brightBlue,
                    }}
                  />
                  <h5 className="th-color-brblue">{t("Direct_messages")}</h5>
                </div>
              </Disclosure.Button>
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <div>
                      <Menu.Button
                        as="div"
                        className="relative mr-2 cursor-pointer appearance-none"
                      >
                        <button className="th-color-for w-6 h-6 flex justify-center items-center p-1">
                          <ChevronDownIcon className="w-full h-full th-color-for" />
                        </button>
                      </Menu.Button>
                    </div>
                    <Transition
                      show={open}
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items
                        static
                        className="left-0 th-bg-bg border th-border-for origin-top-right z-20 absolute mt-1 w-32 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-2"
                      >
                        <div className="th-color-for font-bold text-sm px-2 pb-1">Sort by</div>
                        <div className="w-full h-px th-bg-forbr" />
                        <Menu.Item>
                          {({ active }) => (
                            <div
                              role="button"
                              tabIndex={0}
                              className={classNames(
                                active ? "th-bg-blue th-color-brwhite" : "th-bg-bg th-color-for", 
                                "px-4 py-1 text-sm cursor-pointer focus:outline-none flex items-center space-x-2"
                              )}
                              onClick={() => setType("Time")}
                            >
                              {type === "Time" ? <CheckIcon className="w-4 h-4 th-color-for" /> : <div className="w-4 h-4 th-color-for" />}
                              <div className="th-color-for text-sm">Time</div>
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <div
                              role="button"
                              tabIndex={0}
                              className={classNames(
                                active ? "th-bg-blue th-color-brwhite" : "th-bg-bg th-color-for", 
                                "px-4 py-1 text-sm cursor-pointer focus:outline-none flex items-center space-x-2"
                              )}
                              onClick={() => setType("Unread")}
                            >
                              {type === "Unread" ? <CheckIcon className="w-4 h-4 th-color-for" /> : <div className="w-4 h-4 th-color-for" />}
                              <div className="th-color-for text-sm">Unread</div>
                            </div>
                          )}
                        </Menu.Item>
                        <div className="w-full h-px th-bg-forbr" />
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            </div>
            <Disclosure.Panel
              style={{ color: themeColors?.foreground }}
              className="pt-3 pb-2 text-sm space-y-1"
            >
              {dmList?.map((doc: any) => (
                <DirectMessage key={doc.objectId} dm={doc} />
              ))}
              <AddTeammates />
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <AddTeammatesModal />
    </div>
  );
}
