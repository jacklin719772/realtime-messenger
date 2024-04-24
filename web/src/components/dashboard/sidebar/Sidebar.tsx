import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, SearchIcon, XIcon } from "@heroicons/react/outline";
import Preferences from "components/dashboard/navbar/Preferences";
import Channels from "components/dashboard/sidebar/Channels";
import CreateMessageModal from "components/dashboard/sidebar/CreateMessageModal";
import DirectMessages from "components/dashboard/sidebar/DirectMessages";
import WorkspaceSettings from "components/dashboard/workspaces/WorkspaceSettings";
import Spinner from "components/Spinner";
import { useModal } from "contexts/ModalContext";
import { useUser } from "contexts/UserContext";
import { useWorkspaceById } from "hooks/useWorkspaces";
import { Fragment, useContext } from "react";
import { useParams } from "react-router-dom";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import { useTranslation } from "react-i18next";
import SearchList from "components/dashboard/sidebar/SearchList";
import { ReactionsContext } from "contexts/ReactionsContext";

function WorkspaceDropdownItem({
  setOpen,
  text,
}: {
  setOpen: any;
  text: string;
}) {
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
          onClick={() => setOpen(true)}
        >
          {text}
        </div>
      )}
    </Menu.Item>
  );
}

function WorkspaceDropdown({
  photoURL,
  workspaceName,
  visibleGlobalSearch,
  setVisibleGlobalSearch,
}: {
  photoURL: string | undefined;
  workspaceName: string;
  visibleGlobalSearch: boolean;
  setVisibleGlobalSearch: (visibleGlobalSearch: boolean) => void;
}) {
  const { t } = useTranslation();
  const { setOpenCreateChannel } = useModal();
  const { setOpenInviteTeammates } = useModal();
  const { setOpenWorkspaceSettings } = useModal();
  const { user } = useUser();
  const { workspaceId } = useParams();
  const { value } = useWorkspaceById(workspaceId);
  return (
    <Menu as="div" className="absolute z-10">
      {({ open }) => (
        <>
          <div className="flex items-center">
            <Menu.Button
              as="button"
              className="flex items-center focus:outline-none w-52"
            >
              <h5 className="font-bold tracking-tight truncate">
                {workspaceName}
              </h5>
              <ChevronDownIcon className="h-3 w-3 ml-1 flex-shrink-0" />
            </Menu.Button>
            {!visibleGlobalSearch && <SearchIcon className="h-4 w-4 button" style={{cursor: "pointer"}} onClick={() => setVisibleGlobalSearch(!visibleGlobalSearch)} />}
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
            {user?.uid === value?.ownerId ? (
              <Menu.Items
                static
                className="origin-top-left absolute left-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3 th-bg-bg border th-border-selbg"
              >
                <div className="px-5 flex py-2">
                  <img
                    src={
                      photoURL || `${process.env.PUBLIC_URL}/blank_workspace.png`
                    }
                    alt="message"
                    className="rounded h-10 w-10"
                  />
                  <div className="flex flex-col justify-center px-3 th-color-for">
                    <h5 className="font-bold truncate w-48">{workspaceName}</h5>
                  </div>
                </div>
                <div className="w-full h-px my-2 th-bg-selbg" />
                <WorkspaceDropdownItem
                  setOpen={setOpenInviteTeammates}
                  text={t("Invite_member")}
                />
                <WorkspaceDropdownItem
                  setOpen={setOpenCreateChannel}
                  text={t("Create_a_channel")}
                />
                <div className="w-full h-px my-2 th-bg-selbg" />
                <WorkspaceDropdownItem
                  setOpen={setOpenWorkspaceSettings}
                  text={t("Settings")}
                />
              </Menu.Items>
            ) : (
              <Menu.Items
                static
                className="origin-top-left absolute left-0 mt-2 w-72 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3 th-bg-bg border th-border-selbg"
              >
                <div className="px-5 flex py-2">
                  <img
                    src={
                      photoURL || `${process.env.PUBLIC_URL}/blank_workspace.png`
                    }
                    alt="message"
                    className="rounded h-10 w-10"
                  />
                  <div className="flex flex-col justify-center px-3 th-color-for">
                    <h5 className="font-bold truncate w-48">{workspaceName}</h5>
                  </div>
                </div>
              </Menu.Items>
            )}
          </Transition>
        </>
      )}
    </Menu>
  );
}

export default function Sidebar() {
  const { workspaceId } = useParams();
  const { value } = useWorkspaceById(workspaceId);
  const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);
  const {visibleGlobalSearch, setVisibleGlobalSearch} = useContext(ReactionsContext);
  return (
    <div className="row-span-2 border-r flex flex-col overflow-hidden th-bg-selbg th-border-bg">
      {!value ? (
        <Spinner />
      ) : (
        <div className="h-14 w-full border-b flex items-center justify-between px-4 py-1 th-color-for th-border-bg">
          <WorkspaceDropdown photoURL={photoURL} workspaceName={value?.name} visibleGlobalSearch={visibleGlobalSearch} setVisibleGlobalSearch={setVisibleGlobalSearch} />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 py-5">
          <Channels ownerId={value?.ownerId} />
          <DirectMessages />
        </div>
      </div>
      <Preferences />
      <WorkspaceSettings workspace={value} />
    </div>
  );
}
