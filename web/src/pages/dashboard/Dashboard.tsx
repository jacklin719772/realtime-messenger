import { XIcon } from "@heroicons/react/outline";
import AddMemberConfirm from "components/dashboard/chat/AddMemberConfirm";
import RemoveMemberConfirm from "components/dashboard/chat/RemoveMemberConfirm";
import VisitOfficeConfirm from "components/dashboard/chat/VisitOfficeConfirm";
import ChatArea from "components/dashboard/ChatArea";
import FileGalleryView from "components/dashboard/FileGalleryView";
import Navbar from "components/dashboard/navbar/Navbar";
import SearchList from "components/dashboard/sidebar/SearchList";
import Sidebar from "components/dashboard/sidebar/Sidebar";
import Workspaces from "components/dashboard/workspaces/Workspaces";
import LoadingScreen from "components/LoadingScreen";
import { APP_NAME } from "config";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useUser } from "contexts/UserContext";
import { usePresenceByUserId } from "hooks/usePresence";
import { useUserById } from "hooks/useUsers";
import { useMyWorkspaces } from "hooks/useWorkspaces";
import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { postData } from "utils/api-helpers";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";

function ProfileViewItem({ value, text }: { value: string; text: string }) {
  return (
    <div className="flex flex-col px-5 w-full">
      <span className="font-bold text-sm th-color-for flex items-center">
        {text} {text === "Email address" && <img src={`${process.env.PUBLIC_URL}/send_email.png`} alt={value} className="ml-2 w-6 h-6 cursor-pointer" />}
      </span>
      <span className="font-normal text-sm truncate w-full th-color-for">{value}</span>
    </div>
  );
}

function ProfileView() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.pathname.split("/user_profile/")[1];
  
  const { value: dms } = useContext(DirectMessagesContext);
  const { user } = useUser();
  const { workspaceId, dmId } = useParams();

  const { value } = useUserById(userId);
  const { isPresent } = usePresenceByUserId(userId);

  const photoURL = getHref(value?.photoURL);

  const dmUsers = dms.map((dm: any) => dm.members.filter((m: any) => m !== user?.uid)[0] ? dm.members.filter((m: any) => m !== user?.uid)[0] : dm.members[0]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [openOffice, setOpenOffice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webOfficeSrc, setWebOfficeSrc] = useState("");

  useEffect(() => {
    setWebOfficeSrc(`https://www.uteamwork.com/webmessenger/ecard.html?account=${value?.email}&lang=ch&server=https://www.uteamwork.com&name=${value?.displayName}`);
  }, [value]);

  const newMessage = async () => {
    setLoading(true);
    try {
      const { directId } = await postData("/directs", {
        workspaceId,
        userId: value?.objectId,
      });
      navigate(`/dashboard/workspaces/${workspaceId}/dm/${directId}`);
      setOpenAdd(false);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const closeConversation = async () => {
    setLoading(true);
    try {
      const dm = dms.filter((dm: any) => dm.members.includes(user?.uid) && dm.members.includes(value?.objectId))[0];
      const id = dm?.objectId;
      await postData(`/directs/${dm?.objectId}/close`);
      if (dmId === id) navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };
  
  return (
    <div className="row-span-2 border-l flex flex-col overflow-hidden th-border-selbg">
      <div className="h-14 border-b flex items-center justify-between py-1 px-4 th-border-selbg">
        <h5 className="text-base font-bold th-color-for">Profile</h5>
        <XIcon
          onClick={() => navigate(location.pathname.split("/user_profile")[0])}
          className="h-5 w-5 cursor-pointer th-color-for"
        />
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-between">
        <div className="flex flex-col items-center w-full">
          <div
            className="h-40 w-40 md:h-32 md:w-32 lg:h-44 lg:w-44 rounded mt-4 bg-cover"
            style={{
              backgroundImage: `url(${
                photoURL || `${process.env.PUBLIC_URL}/blank_user.png`
              })`,
            }}
          />
          <div className="flex items-center justify-center mt-4 mb-2 w-full">
            <span className="font-bold text-base truncate max-w-3/4 th-color-for">
              {value?.fullName}
            </span>
            <div
              className={classNames(
                isPresent
                  ? "bg-green-500"
                  : "bg-transparent border border-gray-500",
                "h-2 w-2 rounded-full ml-2"
              )}
            />
          </div>
          <div className="space-y-3 w-full">
            <ProfileViewItem text="Display name" value={value?.displayName} />
            <ProfileViewItem text="Email address" value={value?.email} />
            {value?.phoneNumber && (
              <ProfileViewItem text="Phone number" value={value?.phoneNumber} />
            )}
            {value?.title && (
              <ProfileViewItem text="What I do?" value={value?.title} />
            )}
          </div>
        </div>
        <div className="w-full px-5 pt-2 flex items-center justify-between pb-8">
          {dmUsers.includes(value.objectId) && (
            <button className="w-28 p-2 border border-red-500 th-color-brred rounded text-xs shadow" onClick={() => setOpenRemove(true)}>
              Remove member
            </button>
          )}
          {!dmUsers.includes(value.objectId) && (
            <button className="w-28 p-2 border th-border-blue th-color-blue rounded text-xs shadow" onClick={() => setOpenAdd(true)}>
              Add as member
            </button>
          )}
          <button className="w-28 p-2 border th-border-for rounded text-xs shadow" onClick={() => setOpenOffice(true)}>
            Visit weboffice
          </button>
        </div>
      </div>
      <AddMemberConfirm open={openAdd} setOpen={setOpenAdd} addMember={newMessage} loading={loading} />
      <RemoveMemberConfirm open={openRemove} setOpen={setOpenRemove} removeMember={closeConversation} loading={loading} />
      <VisitOfficeConfirm open={openOffice} setOpen={setOpenOffice} officeSrc={webOfficeSrc} loading={loading} />
    </div>
  );
}

export default function Dashboard() {
  const { workspaceId, channelId, dmId } = useParams();
  const { value, loading } = useMyWorkspaces();
  const { user } = useUser();
  const location = useLocation();
  const profile = location.pathname?.includes("user_profile");
  const {visibleFileSearch, visibleGlobalSearch} = useContext(ReactionsContext);

  useEffect(() => {
    if (user?.uid) {
      postData(`/users/${user?.uid}/presence`, {}, {}, false);
      const intId = setInterval(() => {
        postData(`/users/${user?.uid}/presence`, {}, {}, false);
      }, 30000);
      return () => clearInterval(intId);
    }
  }, [user?.uid]);

  useEffect(() => {
    const appHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    window.addEventListener("resize", appHeight);
  }, []);

  if (loading) return <LoadingScreen />;

  if (value?.length === 0) return <Navigate to="/dashboard/new_workspace" />;

  if (!workspaceId || !value.find((w: any) => w.objectId === workspaceId))
    return (
      <Navigate
        to={`/dashboard/workspaces/${value[0].objectId}/channels/${value[0].channelId}`}
      />
    );

  if (workspaceId && !channelId && !dmId)
    return (
      <Navigate
        to={`/dashboard/workspaces/${workspaceId}/channels/${
          value.find((w: any) => w.objectId === workspaceId)?.channelId
        }`}
      />
    );

  return (
    <>
      <Helmet>
        <title>{APP_NAME}</title>
      </Helmet>
      <div
        className={classNames(
          visibleFileSearch || profile ? "grid-cols-profile" : "grid-cols-main",
          "h-screen grid overflow-hidden grid-rows-main"
        )}
      >
        <Navbar />
        {!visibleGlobalSearch ? (
          <>
            <Workspaces />
            <Sidebar />
          </>
        ) : <SearchList />}
        <ChatArea />
        {visibleFileSearch ? <FileGalleryView /> : profile && <ProfileView />}
      </div>
    </>
  );
}
