import { Menu, Transition } from "@headlessui/react";
import { BellIcon, SearchIcon } from "@heroicons/react/outline";
import EditPasswordModal from "components/dashboard/EditPasswordModal";
import EditProfile from "components/dashboard/navbar/EditProfile";
import { useModal } from "contexts/ModalContext";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { Fragment, useContext, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.pathname?.includes("user_profile");
  const {visibleFileSearch} = useContext(ReactionsContext);
  const { value: messages, loading } = useMessages();
  const { value: users } = useContext(UsersContext);
  const { setOriginId } = useContext(ReactionsContext);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    if (repliedMessages.length > 0) {
      setDeleteLoading(true);
      for (const m of repliedMessages) {
        await postData(`/messages/${m?.objectId}/notifications`);
      }
      setDeleteLoading(false);
    }
  }

  const notifications = useMemo(() => {
    const repliedMessages = messages.filter((m: any) => (m.replyId && m.replySenderId === userdata?.objectId && m.replySenderId !== m.senderId && !m.isNoticeRead));
    return repliedMessages.map((r: any, index: number) => (
      <div className="flex p-2 th-bg-bg th-color-for border-b cursor-pointer hover:bg-gray-200 w-full" key={index} onClick={() => goMessage(r)}>
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
  }, [messages, loading]);

  const handleLanguageChange = (newLang: string) => {
    localStorage.setItem("currentLanguage", newLang);
    i18n.changeLanguage(newLang);
  };
  
  return (
    <div
      className={classNames(
        profile || visibleFileSearch ? "col-span-4" : "col-span-3",
        "max-h-12 border-b px-4 th-bg-blue th-border-bg grid grid-cols-6"
      )}
    >
      <div className="flex items-center justify-start col-span-2">
        <div className="flex items-center px-2">
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
                      className="rounded h-6 w-6 bg-cover"
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
                    className="th-bg-bg border th-border-selbg origin-top-right z-20 absolute left-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
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
                    <div className="w-full h-px my-2 th-bg-selbg" />
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
                    <div className="w-full h-px my-2 th-bg-selbg" />
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
        <div className="font-bold text-base text-white w-20 truncate">{userdata?.displayName}</div>
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
                        <div className="flex items-center justify-center rounded-full h-4 w-4 th-bg-red text-white" style={{fontSize: 10, lineHeight: 0}}>{notifications?.length}</div>
                      </div>
                    )}
                    <BellIcon className="w-6 h-6 text-white" />
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
                    className="th-bg-bg border th-border-selbg origin-top-right z-20 absolute left-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                  >
                    <div className="px-5 flex items-center justify-between">
                      <div className="text-base">Notification</div>
                      <button className="border-0 text-xs" onClick={clearAllNotifications}>Clear All</button>
                    </div>
                    <div className="w-full h-px my-2 th-bg-selbg" />
                    {(!loading && !deleteLoading) ? (
                      <>
                        {notifications.length === 0 ? (
                          <div className="flex items-center justify-center th-bg-bg th-color-for border-b w-full h-10">
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
      </div>
      <div className="col-span-3 flex items-center justify-center">
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
                  <div className="rounded h-6 w-auto bg-cover text-sm th-color-brwhite">
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
                  className="th-bg-bg border th-border-selbg origin-top-right z-10 absolute right-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                >
                  <div className="w-full h-px my-2 th-bg-selbg" />
                  <NavbarItem
                    text="English"
                    onClick={() => handleLanguageChange("en")}
                  />
                  <NavbarItem
                    text="简体中文"
                    onClick={() => handleLanguageChange("zhs")}
                  />
                  <NavbarItem
                    text="繁體中文"
                    onClick={() => handleLanguageChange("zht")}
                  />
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
