import { XIcon } from "@heroicons/react/outline";
import AddMemberConfirm from "components/dashboard/chat/AddMemberConfirm";
import RemoveMemberConfirm from "components/dashboard/chat/RemoveMemberConfirm";
import VisitOfficeConfirm from "components/dashboard/chat/VisitOfficeConfirm";
import ChatArea from "components/dashboard/ChatArea";
import Favorite from "components/dashboard/Favorite";
import FileGalleryView from "components/dashboard/FileGalleryView";
import MailComposer from "components/dashboard/MailComposer";
import Navbar from "components/dashboard/navbar/Navbar";
import SearchList from "components/dashboard/sidebar/SearchList";
import Sidebar from "components/dashboard/sidebar/Sidebar";
import Workspaces from "components/dashboard/workspaces/Workspaces";
import LoadingScreen from "components/LoadingScreen";
import { APP_NAME } from "config";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { ModalContext, useModal } from "contexts/ModalContext";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useUser } from "contexts/UserContext";
import { usePresenceByUserId } from "hooks/usePresence";
import { useUserById } from "hooks/useUsers";
import { useMyWorkspaces, useWorkspaceById } from "hooks/useWorkspaces";
import { useContext, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { postData } from "utils/api-helpers";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CalendarView from "components/dashboard/calendar/CalendarView";
import { useChannelById } from "hooks/useChannels";
import EtherpadModal from "components/dashboard/EtherpadModal";
import MinimizedView from "components/dashboard/MinimizedView";
import CreateMessageModal from "components/dashboard/sidebar/CreateMessageModal";
import MeetingModal from "components/dashboard/MeetingModal";
import Calling from "components/dashboard/Calling";
import { io, Socket } from 'socket.io-client';
import Receiving from "components/dashboard/Receiving";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useMessages } from "hooks/useMessages";
import Preferences from "components/dashboard/navbar/Preferences";
import Contact from "components/dashboard/Contact";
import { useTranslation } from "react-i18next";

interface ServerToClientEvents {
  noArg: () => void;
  newMessage: (msg: string) => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

function ProfileViewItem({ value, text }: { value: string; text: string }) {
  const {setEmailRecipient, setEmailBody, setOpenMailSender} = useContext(ModalContext);
  const initializeEmail = () => {
    setEmailRecipient(value);
    setEmailBody("");
    setOpenMailSender(true);
  }
  return (
    <div className="flex flex-col px-5 w-full">
      <span className="font-bold text-sm th-color-for flex items-center">
        {text} {text === "Email address" && 
          <svg xmlns="http://www.w3.org/2000/svg" onClick={initializeEmail} className="ml-2 w-6 h-6 cursor-pointer th-color-for" fill="currentColor" height="512" viewBox="0 0 512 512" width="512">
            <path d="m222.287 278.4 116.154-116.155a8 8 0 0 1 11.313 11.315l-116.154 116.153 85.551 185.36 163.395-445.619-445.619 163.394z"/>
            <path d="m96 424a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
            <path d="m32 400a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 0 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
            <path d="m120 488a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
          </svg>}
      </span>
      <span className="font-normal text-sm truncate w-full th-color-for">{value}</span>
    </div>
  );
}

function ProfileView() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.pathname.split("/user_profile/")[1];
  
  const { value: dms } = useContext(DirectMessagesContext);
  const { user } = useUser();
  const { workspaceId, dmId } = useParams();

  const { value } = useUserById(userId);
  const { isPresent } = usePresenceByUserId(userId);
  const { value: userData } = useUserById(user?.uid);

  const photoURL = getHref(value?.photoURL);

  const dmUsers = dms.map((dm: any) => dm.members.filter((m: any) => m !== user?.uid)[0] ? dm.members.filter((m: any) => m !== user?.uid)[0] : dm.members[0]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [openOffice, setOpenOffice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webOfficeSrc, setWebOfficeSrc] = useState("");

  useEffect(() => {
    setWebOfficeSrc(`https://www.uteamwork.com/webmessenger/ecard1.html?account=${value?.email}&lang=ch&server=https://www.uteamwork.com&name=${userData?.displayName}&email=${userData?.email}`);
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
      toast.error("Adding member failed.", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
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
      toast.error(t("Close conversation failed."), {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
    setLoading(false);
  };
  
  return (
    <div className="row-span-2 border rounded-xl flex flex-col overflow-hidden th-border-for my-2 mr-2 th-bg-bg">
      <div className="h-14 border-b flex items-center justify-between py-1 px-4 th-border-for">
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
            <ProfileViewItem text={t("Display_name")} value={value?.displayName} />
            <ProfileViewItem text="Email address" value={value?.email} />
            {value?.phoneNumber && (
              <ProfileViewItem text="Phone number" value={value?.phoneNumber} />
            )}
            {value?.title && (
              <ProfileViewItem text="What I do?" value={value?.title} />
            )}
          </div>
        </div>
        <div className="w-full px-5 pt-2 flex items-center justify-around pb-8">
          {dmUsers.includes(value.objectId) && (
            <button className="w-28 p-2 border-2 th-border-brred th-color-brred rounded text-xs shadow" onClick={() => setOpenRemove(true)}>
              Remove member
            </button>
          )}
          {!dmUsers.includes(value.objectId) && (
            <button className="w-28 p-2 border-2 th-border-cyan th-color-cyan rounded text-xs shadow" onClick={() => setOpenAdd(true)}>
              Add as member
            </button>
          )}
          <button className="w-28 p-2 border-2 th-border-for th-color-for rounded text-xs shadow" onClick={() => setOpenOffice(true)}>
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
  const { t } = useTranslation();
  const { workspaceId, channelId, dmId } = useParams();
  const { value, loading } = useMyWorkspaces();
  const { user, userdata } = useUser();
  const { value: channel } = useChannelById(channelId || value[0]?.channelId);
  const { value: owner } = useUserById(channel?.createdBy);
  const location = useLocation();
  const profile = location.pathname?.includes("user_profile");
  const calendar = location.pathname?.includes("calendar");
  const teamcal = location.pathname?.includes("teamcal");
  const {visibleFileSearch, visibleGlobalSearch} = useContext(ReactionsContext);
  const {visibleContact, setVisibleContact} = useModal();
  const {openMailSender, openFavorite, uteamworkUserData, etherpadMinimized, setCurrentWorkspaceId, openMeetingModal, openCalling, setOpenCalling, openReceiving, setOpenReceiving, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, roomName, setRoomName, isVideoDisabled, setIsVideoDisabled, setOpenMeetingModal, iframeLoaded} = useContext(ModalContext);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerData, setOwnerData] = useState<any>(null);
  const { soundActivated, messageSent, setMessageSent } = useModal();
  const { messageArrived, setMessageArrived } = useMessages(workspaceId);
  const audio = useMemo(() => new Audio('/ringtone.mp3'), []);
  const soundSend = useMemo(() => new Audio('/sendnewmessage.mp3'), []);
  const soundReceive = useMemo(() => new Audio('/receivednewmessage.mp3'), []);

  const sendCallMessage = async (type: string, startTime: Date, refusedUser?: any) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "${type}", "duration": "${startTime}", "audioOnly": ${isVideoDisabled}, "refusedUser": ${refusedUser ? JSON.stringify(refusedUser) : null}}`,
      chatId: channelId || dmId,
      workspaceId,
      chatType: "Direct",
    });
  }

  useEffect(() => {
    let timer: any;
    if (soundActivated) {
      if (messageSent) {
        console.log('Message Sent');
        soundSend.play();
        timer = setTimeout(() => {
          setMessageArrived(false);
          setMessageSent(false);
        }, 1200);
      } else if (messageArrived) {
        console.log('Message Arrived');
        soundReceive.play();
        timer = setTimeout(() => {
          setMessageArrived(false);
          setMessageSent(false);
        }, 1200);
      }
    } else {
      soundReceive.pause();
      soundSend.pause();
      setMessageSent(false);
      setMessageArrived(false);
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [messageSent, soundActivated, messageArrived]);

  useEffect(() => {
    if ((openCalling || openReceiving) && !iframeLoaded) {
      audio.play();
      audio.loop = true;
    } else {
      audio.pause();
    }
  }, [openCalling, openReceiving, iframeLoaded]);

  useEffect(() => {
    const socket = io();
    socket.on('newMessage', (data: any) => {
      const { message } = JSON.parse(data);
      const { receiver, sender, type, room, audioOnly } = JSON.parse(message);
      console.log(JSON.parse(message));
      console.log(receiver);
      console.log(user);
      console.log('openCalling: ', openCalling);
      console.log('openReceiving: ', openReceiving);
      if (receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0 && !openCalling && type === "Calling" && !openReceiving) {
        setOpenReceiving(true);
        setSenderInfo(sender);
        setRecipientInfo(receiver);
        setRoomName(room);
        setIsVideoDisabled(audioOnly);
        window.parent.postMessage({
          roomName: room,
          name: userdata.displayName,
          sender: sender?.displayName,
          audioOnly,
        }, "*");
      }
      if (receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0 && !openCalling && type === "Timeout" && openReceiving) {
        // sendCallMessage("Missed Call", new Date());
        setOpenReceiving(false);
        setSenderInfo(null);
        setRecipientInfo([]);
        setRoomName("");
        setIsVideoDisabled(false);
        toast.info(t('Sorry, but this call timed out.'), {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      if (receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0 && !openCalling && type === "Stop" && openReceiving) {
        setOpenReceiving(false);
        setSenderInfo(null);
        setRecipientInfo([]);
        setRoomName("");
        setIsVideoDisabled(false);
        toast.info(t('The caller has interrupted the call.'), {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      if (receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0 && openCalling && type === "Reject" && !openReceiving) {
        setRecipientInfo(recipientInfo.filter((u: any) => u?.objectId !== sender?.objectId));
        if (recipientInfo.length < 2) {
          sendCallMessage("Refused Call", new Date(), sender);
          setOpenCalling(false);
          setSenderInfo(null);
          setRoomName("");
          setIsVideoDisabled(false);
          toast.info(t('The recipient has declined the call.'), {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
        }
      }
      if (receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0 && openCalling && type === "Accept" && !openReceiving) {
        setOpenMeetingModal(true);
        // setOpenCalling(false);
        // setSenderInfo(null);
        // setRecipientInfo(null);
        // setRoomName("");
        // setIsVideoDisabled(false);
        toast.info(t('The recipient has accepted the call.'), {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    });
    return () => {
      socket.disconnect();
    }
  }, [openCalling, openReceiving, roomName, recipientInfo, isVideoDisabled]);

  useEffect(() => {
    if (owner) {
      setIsOwner(owner?.email === userdata.email);
    }
  }, [owner, userdata]);

  useEffect(() => {
    if (uteamworkUserData.length > 0) {
      setOwnerData(uteamworkUserData.filter((u: any) => u.email === owner?.email)[0]);
    }
  }, [owner, uteamworkUserData]);

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

  useEffect(() => {
    if (workspaceId) {
      setCurrentWorkspaceId(workspaceId);
    } else if (value.length > 0) {
      setCurrentWorkspaceId(value[0].objectId);
    }
  }, [value, workspaceId]);

  const epadModalRender = useMemo(() => (
    <><EtherpadModal /></>
  ), []);

  if (loading) return <LoadingScreen />;

  if (value?.length === 0) return <Navigate to="/dashboard/new_workspace" />;

  if ((!workspaceId || !value.find((w: any) => w.objectId === workspaceId)) && teamcal) {
    return (
      <Navigate
        to={`/dashboard/workspaces/${value[0].objectId}/channels/${value[0].channelId}/teamcal`}
      />
    );
  }

  if (workspaceId && !channelId && !dmId && teamcal) {
    return (
      <Navigate
        to={`/dashboard/workspaces/${workspaceId}/channels/${
          value.find((w: any) => w.objectId === workspaceId)?.channelId
        }/teamcal`}
      />
    );
  }

  if ((!workspaceId || !value.find((w: any) => w.objectId === workspaceId)) && !calendar)
    return (
      <Navigate
        to={`/dashboard/workspaces/${value[0].objectId}/channels/${value[0].channelId}`}
      />
    );

  if (workspaceId && !channelId && !dmId && !teamcal && !calendar)
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
        {calendar ? (
          <>
          {!visibleContact ? (
            <>
              <Workspaces />
              <CalendarView isOwner={isOwner} ownerData={ownerData} />
            </>
          ) : (
            <>
              <Contact />
              <CalendarView isOwner={isOwner} ownerData={ownerData} />
            </>
          )}
          </>
        ) : (
          <>
            {(!visibleGlobalSearch && !visibleContact) ? (
              <>
                <Workspaces />
                <Sidebar />
              </>
            ) : visibleContact ? <Contact /> : <SearchList />}
            {teamcal ? <CalendarView isOwner={isOwner} ownerData={ownerData} /> : <ChatArea />}
            {visibleFileSearch ? <FileGalleryView /> : profile && <ProfileView />}
            {openMailSender && <MailComposer />}
            {openFavorite && <Favorite />}
          </>
        )}
        <>{epadModalRender}</>
        {etherpadMinimized && <MinimizedView />}
        <Preferences />
        <CreateMessageModal />
        {openCalling && <Calling />}
        {openReceiving && <Receiving />}
        {openMeetingModal && <MeetingModal />}
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </>
  );
}
