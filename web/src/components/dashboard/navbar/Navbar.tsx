import { Menu, Transition } from "@headlessui/react";
import { BellIcon, SearchIcon } from "@heroicons/react/outline";
import EditPasswordModal from "components/dashboard/EditPasswordModal";
import EditProfile from "components/dashboard/navbar/EditProfile";
import { useModal } from "contexts/ModalContext";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import hexToRgbA from "utils/hexToRgbA";
import { useTranslation } from "react-i18next";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useMessages } from "hooks/useMessages";
import Spinner from "components/Spinner";
import { UsersContext } from "contexts/UsersContext";
import { deleteData, postData } from "utils/api-helpers";
import { forIn } from "lodash";
import { useNavigatorOnline } from "hooks/useNavigatorOnline";
import { getIdToken } from "gqlite-lib/dist/client/auth";
import { clearInterval } from "timers";
import { getAPIUrl } from "config";
import { ExclamationIcon } from "@heroicons/react/solid";

function NavbarItem({ onClick, text }: { onClick: any; text: string }) {
  return (
    <Menu.Item>
      {({ active }) => (
        <div
          role="button"
          tabIndex={0}
          className={classNames(
            active ? "th-bg-blue th-color-brwhite" : "th-bg-bg th-color-for",
            "block px-5 py-1 text-sm cursor-pointer focus:outline-none"
          )}
          onClick={onClick}
        >
          {text}
        </div>
      )}
    </Menu.Item>
  );
}

const SearchInput = styled.input`
  ::placeholder {
    color: ${(props) => hexToRgbA(props.theme.brightWhite, "0.8")};
  }
`;

export default function Navbar() {
  const { i18n, t } = useTranslation();
  const { themeColors } = useTheme();
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const { setOpenPreferences } = useModal();
  const { setOpenEditPassword } = useModal();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.pathname?.includes("user_profile");
  const {visibleFileSearch} = useContext(ReactionsContext);
  const { value: messages, loading } = useMessages(workspaceId);
  const { value: users } = useContext(UsersContext);
  const { setOriginId } = useContext(ReactionsContext);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { roomName, meetingMinimized, setMeetingMinimized, isVideoDisabled } = useModal();
  
  const isOnline = useNavigatorOnline();
  const [connected, setConnected] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [uteamwork, setUteamwork] = useState(false);

  useEffect(() => {
    const intervalId1 = setInterval(async () => {
      try {
        const response = await fetch(`${getAPIUrl()}/warm`);
        if (response.ok) {
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch (error) {
        setConnected(false);
      }
    }, 15000);
    return () =>  clearInterval(intervalId1);
  }, []);

  useEffect(() => {
    const intervalId2 = setInterval(async () => {
      try {
        const idToken = await getIdToken();
        if (idToken) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        setAuthenticated(false);
      }
    }, 15000);
    return () => clearInterval(intervalId2);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("t") && String(localStorage.getItem("t")).length > 30) {
      setUteamwork(true);
    }
    const intervalId3 = setInterval(() => {
      if (localStorage.getItem("t") && String(localStorage.getItem("t")).length > 30) {
        setUteamwork(true);
      } else {
        setUteamwork(false);
      }
    }, 15000);
    return () => clearInterval(intervalId3);
  }, []);

  const { userdata } = useUser();
  const photoURL =
    getHref(userdata?.thumbnailURL) || getHref(userdata?.photoURL);

  const goMessage = async (message: any) => {
    setDeleteLoading(true);
    await postData(`/messages/${message?.objectId}/notifications`);
    setDeleteLoading(false);
    if (message?.chatType === "Channel") {
      navigate(`/dashboard/workspaces/${message?.workspaceId}/channels/${message?.chatId}`);
    } else {
      navigate(`/dashboard/workspaces/${message?.workspaceId}/dm/${message?.chatId}`);
    }
    if (!message?.isDeleted) {
      setOriginId(message?.objectId);
    }
  }

  const clearAllNotifications = async () => {
    const repliedMessages = messages.filter((m: any) => (m.replyId && m.replySenderId === userdata?.objectId && m.replySenderId !== m.senderId && !m.isNoticeRead));
    const mentionedMessages = messages.filter((m: any) => (m.senderId !== userdata?.objectId && m.text.includes(`<span contenteditable="false">@${userdata.displayName}</span>`) && !m.isNoticeRead));
    const missedCallMessages = messages.filter((m: any) => (m?.text.includes("[Jitsi_Call_Log:]:") && !m.isNoticeRead)).filter((message: any) => (JSON.parse(message?.text.substr(19, message?.text.length)).type === "Missed Call" && JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.objectId === userdata?.objectId));
    if (missedCallMessages.concat(repliedMessages).concat(mentionedMessages).length > 0) {
      setDeleteLoading(true);
      for (const m of repliedMessages.concat(mentionedMessages)) {
        await postData(`/messages/${m?.objectId}/notifications`);
      }
      setDeleteLoading(false);
    }
  }

  const notifications = useMemo(() => {
    const repliedMessages = messages.filter((m: any) => (m.replyId && m.replySenderId === userdata?.objectId && m.replySenderId !== m.senderId && !m.isNoticeRead));
    const repliedHtml = repliedMessages.map((r: any, index: number) => (
      <div className="flex p-2 th-bg-bg th-color-for border-b th-border-for cursor-pointer hover:bg-gray-200 w-full" key={index} onClick={() => goMessage(r)}>
        <div className="flex justify-center items-center w-10 pr-2">
          <img src={getHref(users.filter((m: any) => m?.objectId === r?.senderId)[0].thumbnailURL) || 
            getHref(users.filter((m: any) => m?.objectId === r?.senderId)[0].photoURL) || 
            `${process.env.PUBLIC_URL}/blank_user.png`} alt={r?.senderId} className="w-full" />
        </div>
        <div className="w-60">
          <div className="font-bold text-sm">{users.filter((m: any) => m?.objectId === r?.senderId)[0].displayName} replied to your message:</div>
          <div className="font-medium text-xs truncate">{r.text.replace(/(<([^>]+)>)/ig, '')}</div>
          <div className="font-medium text-xs">{new Date(r.createdAt).toLocaleString()}</div>
        </div>
      </div>
    ));
    const mentionedMessages = messages.filter((m: any) => (m.senderId !== userdata?.objectId && m.text.includes(`<span contenteditable="false">@${userdata.displayName}</span>`) && !m.isNoticeRead));
    const mentionedHtml = mentionedMessages.map((r: any, index: number) => (
      <div className="flex p-2 th-bg-bg th-color-for border-b th-border-for cursor-pointer hover:bg-gray-200 w-full" key={index} onClick={() => goMessage(r)}>
        <div className="flex justify-center items-center w-10 pr-2">
          <img src={getHref(users.filter((m: any) => m?.objectId === r?.senderId)[0].thumbnailURL) || 
            getHref(users.filter((m: any) => m?.objectId === r?.senderId)[0].photoURL) || 
            `${process.env.PUBLIC_URL}/blank_user.png`} alt={r?.senderId} className="w-full" />
        </div>
        <div className="w-60">
          <div className="font-bold text-sm">{users.filter((m: any) => m?.objectId === r?.senderId)[0].displayName} mentioned you:</div>
          <div className="font-medium text-xs truncate">{r.text.replace(/(<([^>]+)>)/ig, '')}</div>
          <div className="font-medium text-xs">{new Date(r.createdAt).toLocaleString()}</div>
        </div>
      </div>
    ));
    const missedCallMessages = messages.filter((m: any) => (m?.text.includes("[Jitsi_Call_Log:]:") && !m.isNoticeRead)).filter((message: any) => (JSON.parse(message?.text.substr(19, message?.text.length)).type === "Missed Call" && JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.objectId === userdata?.objectId));
    const missedCallHtml = missedCallMessages.map((r: any, index: number) => (
      <div className="flex p-2 th-bg-bg th-color-for border-b th-border-for cursor-pointer hover:bg-gray-200 w-full" key={index} onClick={() => goMessage(r)}>
        <div className="flex justify-center items-center w-10 pr-2">
          <img src={getHref(users.filter((m: any) => m?.objectId === r?.senderId)[0].thumbnailURL) || 
            getHref(users.filter((m: any) => m?.objectId === r?.senderId)[0].photoURL) || 
            `${process.env.PUBLIC_URL}/blank_user.png`} alt={r?.senderId} className="w-full" />
        </div>
        <div className="w-60">
          <div className="font-bold text-sm">You missed {users.filter((m: any) => m?.objectId === r?.senderId)[0].displayName}'s call:</div>
          <div className="font-medium text-xs">{new Date(r.createdAt).toLocaleString()}</div>
        </div>
      </div>
    ));
    return missedCallHtml.concat(mentionedHtml).concat(repliedHtml);
  }, [messages, loading]);

  const handleLanguageChange = (newLang: string) => {
    localStorage.setItem("currentLanguage", newLang);
    i18n.changeLanguage(newLang);
  };
  
  return (
    <div
      className={classNames(
        profile || visibleFileSearch ? "col-span-4" : "col-span-3",
        "max-h-12 px-4 th-bg-blue grid grid-cols-6"
      )}
    >
      <div className="flex items-center justify-start col-span-3">
        <div className="flex items-center pl-1 pr-3">
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                <div>
                  <Menu.Button
                    as="div"
                    className="relative mr-2 cursor-pointer appearance-none"
                  >
                    <div className="th-bg-blue rounded-full h-3 w-3 absolute bottom-0 right-0 transform translate-x-1 translate-y-1 flex items-center justify-center">
                      <div
                        style={{
                          backgroundColor: "#94e864",
                        }}
                        className="rounded-full h-2 w-2"
                      />
                    </div>
                    <div
                      className="rounded h-7 w-7 bg-cover p-px"
                      style={{
                        backgroundImage: `url(${
                          photoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                        })`,
                      }}
                    />
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
                    className="th-bg-bg border th-border-for origin-top-right z-20 absolute left-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                  >
                    <div className="px-5 flex py-2">
                      <img
                        src={
                          photoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                        }
                        alt="message"
                        className="rounded h-10 w-10"
                      />
                      <div className="flex flex-col px-3">
                        <h5 className="font-bold th-color-for w-48 truncate">
                          {userdata?.displayName || userdata?.fullName}
                        </h5>
                        <div className="flex items-center">
                          <div
                            style={{ backgroundColor: "#007a5a" }}
                            className="rounded-full h-2 w-2 mr-2"
                          />
                          <h6 className="text-sm font-medium capitalize th-color-for">
                            {t("Active")}
                          </h6>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-px my-2 th-bg-forbr" />
                    <NavbarItem
                      text={t("Edit_profile")}
                      onClick={() => setOpenEditProfile(true)}
                    />
                    <NavbarItem
                      text={t("Preferences")}
                      onClick={() => setOpenPreferences(true)}
                    />
                    <NavbarItem
                      text={t("Change_password")}
                      onClick={() => setOpenEditPassword(true)}
                    />
                    <div className="w-full h-px my-2 th-bg-forbr" />
                    <NavbarItem
                      text={t("Sign_out")}
                      onClick={() => {
                        navigate("/dashboard/logout");
                      }}
                    />
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        </div>
        <div className="text-sm th-color-brblue w-20 truncate">{userdata?.displayName}</div>
        <div className="flex items-center justify-end">
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                <div>
                  <Menu.Button
                    as="div"
                    className="relative cursor-pointer appearance-none"
                  >
                    {notifications?.length > 0 && (
                      <div className="th-bg-blue rounded-full h-5 w-5 absolute top-0 right-0 transform translate-x-1 -translate-y-1 flex items-center justify-center">
                        <div className="flex items-center justify-center rounded-full h-4 w-4 th-bg-red th-color-for font-medium" style={{fontSize: 10, lineHeight: 0}}>{notifications?.length}</div>
                      </div>
                    )}
                    <BellIcon className="w-6 h-6 th-color-brblue" />
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
                    className="th-bg-bg border th-border-for origin-top-right z-20 absolute left-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                  >
                    <div className="px-5 flex items-center justify-between">
                      <div className="text-base th-color-for">Notification</div>
                      <button className="border-0 text-xs th-color-for" onClick={clearAllNotifications}>Clear All</button>
                    </div>
                    <div className="w-full h-px my-2 th-bg-forbr" />
                    {(!loading && !deleteLoading) ? (
                      <>
                        {notifications.length === 0 ? (
                          <div className="flex items-center justify-center th-bg-bg th-color-for border-b th-border-for w-full h-10">
                            No notifications
                          </div>
                        ) : notifications}
                      </>
                    ) : (
                      <div className="w-full h-20 flex justify-center items-center">
                        <Spinner className="h-4 w-4 th-color-for" />
                      </div>
                    )}
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        </div>
        {meetingMinimized && roomName !== "" && (
          <div className="ml-5 flex items-center">
            <div className="text-sm th-color-brblue">{isVideoDisabled ? "Voice " : "Video "} Call is running...</div>
            <button className="p-2" onClick={() => setMeetingMinimized(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 th-color-for" fill="currentColor" height="512" viewBox="0 0 512 512" width="512">
                <path d="m507.53 129.124-126.612-124.807c-2.807-2.766-6.589-4.317-10.53-4.317h-295.557c-8.284 0-15 6.716-15 15v114.958c-34.332 8.632-59.831 39.752-59.831 76.725v157.483c0 36.973 25.499 68.093 59.831 76.725v56.109c0 8.284 6.716 15 15 15h422.169c8.284 0 15-6.716 15-15v-357.194c0-4.015-1.61-7.864-4.47-10.682zm-122.142-78.275 75.028 73.958h-60.037c-8.267 0-14.991-6.729-14.991-15zm-355.388 313.318v-157.484c0-27.08 22.031-49.111 49.111-49.111h157.395c27.08 0 49.111 22.031 49.111 49.111v157.483c0 27.08-22.031 49.111-49.111 49.111h-157.395c-27.08.001-49.111-22.03-49.111-49.11zm59.831 117.833v-38.722h146.675c43.622 0 79.111-35.489 79.111-79.111v-157.484c0-43.622-35.489-79.111-79.111-79.111h-146.675v-97.572h265.557v79.806c0 24.813 20.183 45 44.991 45h81.621v327.194z"/><path d="m255.542 293.902c3.501-5.109 3.501-11.846 0-16.955-58.629-80.42-137.239-79.916-195.468 0-3.501 5.109-3.501 11.846 0 16.955 58.629 80.419 137.238 79.918 195.468 0zm-164.021-8.44c32.543-37.58 71.694-56.868 116.626-16.324 6.638 5.817 12.088 11.708 15.979 16.287-3.891 4.579-9.341 10.469-15.979 16.287-34.054 30.238-66.681 30.186-100.679 0-6.62-5.803-12.06-11.679-15.947-16.25z"/><path d="m172.808 285.425c0-8.284-6.716-15-15-15-19.897.79-19.892 29.213 0 30 8.285 0 15-6.716 15-15z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="col-span-2 flex items-center">
        {!isOnline ?
        <div className="text-xs rounded-lg px-2 py-1 focus:outline-none th-color-brwhite th-bg-red font-medium flex items-center justify-center">
          <ExclamationIcon className="w-5 h-5 th-color-brwhite" />
          <div className="text-sm">Please check your network connection status.</div>
        </div> : !connected ?
        <div className="text-xs rounded-lg px-2 py-1 focus:outline-none th-color-brwhite th-bg-red font-medium flex items-center justify-center">
          <ExclamationIcon className="w-5 h-5 th-color-brwhite" />
          <div className="text-sm">Connection to the server is failed. Please refresh the page.</div>
        </div> : !authenticated ? 
        <div className="text-xs rounded-lg px-2 py-1 focus:outline-none th-color-brwhite th-bg-red font-medium flex items-center justify-center">
          <ExclamationIcon className="w-5 h-5 th-color-brwhite" />
          <div className="text-sm">You authentication is expired. Please re-sign in.</div>
        </div> : !uteamwork ? 
        <div className="text-xs rounded-lg px-2 py-1 focus:outline-none th-color-brwhite th-bg-red font-medium flex items-center justify-center">
          <ExclamationIcon className="w-5 h-5 th-color-brwhite" />
          <div className="text-sm">Please sign out and re-sign in from uteamwork.</div>
        </div> : ""}
        {/* <div
          style={{
            paddingTop: "1px",
            paddingBottom: "1px",
            backgroundColor: hexToRgbA(themeColors?.brightBlue, "0.4")!,
            borderColor: hexToRgbA(themeColors?.selectionBackground, "0.5")!,
          }}
          className="px-3 flex items-center justify-center w-9/12 rounded-md border"
        >
          <SearchIcon
            className="h-4 w-4 mr-2"
            style={{ color: hexToRgbA(themeColors?.brightWhite, "0.8")! }}
          />
          <SearchInput
            theme={themeColors}
            className="w-full bg-transparent th-color-brwhite border-0 focus:outline-none"
            placeholder={t("Search")}
          />
        </div> */}
      </div>
      <div className="flex items-center justify-end col-span-1">
        <Menu as="div" className="relative">
          {({ open }) => (
            <>
              <div>
                <Menu.Button
                  as="div"
                  className="relative mr-2 cursor-pointer appearance-none"
                >
                  <div className="rounded w-auto bg-cover text-sm th-color-brblue">
                    { i18n.language === "en" ? "English" : i18n.language === "zhs" ? "简体中文" : "繁體中文" }
                  </div>
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
                  className="th-bg-bg border th-border-for origin-top-right z-10 absolute right-0 mt-2 w-32 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                >
                  <div className="w-full h-px th-bg-forbr" />
                  <NavbarItem
                    text="English"
                    onClick={() => handleLanguageChange("en")}
                  />
                  <div className="w-full h-px th-bg-forbr" />
                  <NavbarItem
                    text="简体中文"
                    onClick={() => handleLanguageChange("zhs")}
                  />
                  <div className="w-full h-px th-bg-forbr" />
                  <NavbarItem
                    text="繁體中文"
                    onClick={() => handleLanguageChange("zht")}
                  />
                  <div className="w-full h-px th-bg-forbr" />
                </Menu.Items>
              </Transition>
            </>
          )}
        </Menu>
        <img
          src="https://www.uteamwork.com/webmessenger/assets/images/web_messanger_logo.png"
          alt="logo"
          className="h-10 w-auto rounded-md"
        />
      </div>
      <EditProfile open={openEditProfile} setOpen={setOpenEditProfile} />
      <EditPasswordModal />
    </div>
  );
}
