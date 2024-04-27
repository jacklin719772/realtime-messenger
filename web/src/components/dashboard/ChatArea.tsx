import { ChevronDownIcon, SearchIcon } from "@heroicons/react/outline";
import EditChannel from "components/dashboard/channels/EditChannel";
import Editor from "components/dashboard/chat/Editor";
import Messages from "components/dashboard/chat/Messages";
import { useTheme } from "contexts/ThemeContext";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useUser } from "contexts/UserContext";
import { useChannelById } from "hooks/useChannels";
import { useDetailByChat } from "hooks/useDetails";
import { useDirectMessageById } from "hooks/useDirects";
import { useUserById, useUsersByWorkspace } from "hooks/useUsers";
import { Fragment, KeyboardEvent, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { postData } from "utils/api-helpers";
import { getHref } from "utils/get-file-url";
import { useTranslation } from "react-i18next";
import initFindWin from "utils/find5";
import ForwardMessage from "./chat/ForwardMessage";
import ReplyMessage from "./chat/ReplyMessage";
import SelectHeader from "./chat/SelectHeader";
import SelectFooter from "./chat/SelectFooter";
import { toast } from "react-toastify";
import Spinner from "components/Spinner";
import AddChannelConfirm from "./chat/AddChannelConfirm";
import useAuth from "hooks/useAuth";
import { Menu, Transition } from "@headlessui/react";
import { useModal } from "contexts/ModalContext";
import axios from "axios";
import { randomRoomName } from "utils/jitsiGenerator";
import { v4 as uuidv4 } from "uuid";

const SelectChannel = styled.button`
  :hover {
    background-color: ${(props) => props.theme.selectionBackground};
  }
`;

function InviteUserItem({
  item,
  allChecked,
  setAllChecked,
  handleSelect,
}: {
  item: any;
  allChecked: boolean;
  setAllChecked: any;
  handleSelect: any;
}) {
  const [checked, setChecked] = useState(false);

  const handleCheckedChange = (e: any) => {
    setAllChecked(false);
    setChecked(e.target.checked);
  }

  useEffect(() => {
    handleSelect(checked, item);
  }, [checked]);

  useEffect(() => {
    if (allChecked) {
      setChecked(true);
    }
  }, [allChecked]);

  return (
    <div className="flex items-center space-x-2 px-2 py-1 th-bg-bg th-color-for border-b th-border-for hover:bg-gray-500 w-full">
      <div className="flex items-center">
        <input type="checkbox" className="appearance-none checked:bg-blue-500" checked={checked} onChange={handleCheckedChange} />
      </div>
      <div className="flex items-center space-x-4">
        <img src={getHref(item.thumbnailURL) || getHref(item.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} alt={item.displayName} className="w-6" />
        <div className="font-bold text-sm">{item.displayName}</div>
      </div>
    </div>
  )
}

function HeaderChannel() {
  const { userdata } = useUser();
  const { value: users } = useUsersByWorkspace();
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const [open, setOpen] = useState(false);
  const { workspaceId, channelId } = useParams();
  const { value } = useChannelById(channelId);
  const { visibleSearch, setVisibleSearch } = useContext(ReactionsContext);
  const { visibleFileSearch, setVisibleFileSearch } = useContext(ReactionsContext);
  const { openCalling, setOpenCalling, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, setRoomName, setIsVideoDisabled, openMeetingModal, isVideoDisabled } = useModal();
  const [checkedUsers, setCheckedUsers] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);

  const handleSelectUsers = (checked: boolean, userdata: any) => {
    if (checked) {
      console.log('Checked:', userdata);
      if (checkedUsers.filter((c: any) => (c?.objectId === userdata?.objectId)).length === 0) {
        setCheckedUsers([...checkedUsers, userdata]);
      }
    } else {
      console.log('Unchecked: ', userdata);
      setCheckedUsers(checkedUsers.filter((u: any) => u?.objectId !== userdata?.objectId));
    }
  }

  const handleCallingButton = async (audioOnly: boolean) => {
    try {
      const room = randomRoomName();
      await axios.post('/send-message', {
        sender: userdata,
        receiver: checkedUsers,
        type: "Calling",
        room,
        audioOnly,
      });
      console.log('Message sent successfully');
      setOpenCalling(true);
      setRecipientInfo(checkedUsers);
      setSenderInfo(userdata);
      setRoomName(room);
      setIsVideoDisabled(audioOnly);
    } catch (error) {
      console.error('Error sending message', error);
    }
  }
  
  const handleTimeout = async (sender: any, receiver: any[]) => {
    try {
      await axios.post('/send-message', {
        sender,
        receiver,
        type: "Timeout",
        roomName: "",
      });
      console.log('Message sent successfully');
      setOpenCalling(false);
      setRecipientInfo([]);
      setSenderInfo(null);
      setRoomName("");
      setIsVideoDisabled(false);
      setCheckedUsers([]);
      toast.info('Sorry, but the recipient you are calling right now is not responding.', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error sending message', error);
    }
  }
 
  const sendCallMessage = async (type: string, startTime: Date) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "${type}", "duration": "${startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId: channelId,
      workspaceId,
      chatType: "Channel",
    });
  }

  useEffect(() => {
    console.log(new Date());
    let timer: NodeJS.Timeout | undefined;
    if (openCalling && !openMeetingModal) {
      timer = setTimeout(() => {
        sendCallMessage("Missed Call", new Date());
        handleTimeout(userdata, checkedUsers);
      }, 35000);
    } else {
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [openCalling, openMeetingModal, senderInfo, recipientInfo, isVideoDisabled, checkedUsers]);

  return (
    <div className="w-full border-b flex items-center justify-between px-5 py-1 h-14 th-color-selbg th-border-for">
      <div className="flex items-center">
        <SelectChannel
          className="flex items-center cursor-pointer focus:outline-none py-1 pr-2 rounded"
          onClick={() => setOpen(true)}
          theme={themeColors}
        >
          <h5 className="font-bold mr-1 th-color-for max-w-sm truncate">
            {`#${value?.name || ""}`}
          </h5>
          <ChevronDownIcon className="h-4 w-4 th-color-for" />
        </SelectChannel>
        {value?.topic && (
          <span className="ml-3 w-full text-sm th-color-for opacity-70">
            {value?.topic}
          </span>
        )}
        <EditChannel
          open={open}
          setOpen={setOpen}
          name={value?.name}
          topic={value?.topic}
          details={value?.details}
          createdAt={new Date(value?.createdAt)?.toDateString()}
        />
      </div>
      <div className="flex">
        <button
          className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none"
          onClick={() => navigate(`/dashboard/workspaces/${workspaceId}/channels/${channelId}/teamcal`)}
        >
          <img className="h-5 w-5" alt="gallery" src={`${process.env.PUBLIC_URL}/calendar_channel.png`} />
        </button>
        <button
          className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleSearch(!visibleSearch)}
        >
          <img className="h-5 w-5" alt="search" src={`${process.env.PUBLIC_URL}/search.png`} />
        </button>
        <button
          className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleFileSearch(!visibleFileSearch)}
        >
          <img className="h-5 w-5" alt="gallery" src={`${process.env.PUBLIC_URL}/gallery.png`} />
        </button>
        {users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)).length > 0 && (
          <Menu as="div" className="relative">
            {({ open, close }) => (
              <>
                <div>
                  <Menu.Button
                    as="div"
                    className="relative"
                  >
                    <button className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none disabled:opacity-50" disabled={openCalling}>
                      <img className="h-5 w-5" alt="call" src={`${process.env.PUBLIC_URL}/voice_call.png`} />
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
                    className="th-bg-bg border th-border-for origin-top-right z-20 absolute right-0 mt-1 w-48 h-72  rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-2"
                  >
                    <div className="px-5 flex items-center justify-between">
                      <div className="text-base th-color-for">Choose members</div>
                    </div>
                    <div className="w-full h-px th-bg-for" />
                    <div className="overflow-y-auto h-52">
                      {users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)).map((item: any, index: number) => (
                        <div key={index}>
                          <InviteUserItem item={item} allChecked={checked} setAllChecked={setChecked} handleSelect={handleSelectUsers} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end items-center border-t th-border-for pt-2 px-2 space-x-2">
                      <Menu.Item>
                      {({ active }) => (
                        <button className="th-color-cyan border-2 th-border-cyan rounded text-xs px-2 py-1" onClick={() => {
                          handleCallingButton(true);
                        }}>Confirm</button>
                      )}
                      </Menu.Item>
                      {checked &&
                        <button className="th-color-for border-2 th-border-for rounded text-xs px-2 py-1" onClick={() =>  {
                          setCheckedUsers(users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)));
                          setChecked(true);
                        }}>Select All</button>
                      }
                      {!checked &&
                        <button className="th-color-for border-2 th-border-for rounded text-xs px-2 py-1" onClick={() =>  {
                          setCheckedUsers([]);
                          setChecked(false);
                        }}>Unselect All</button>
                      }
                    </div>
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        )}
        {users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)).length > 0 && (
          <Menu as="div" className="relative">
            {({ open, close }) => (
              <>
                <div>
                  <Menu.Button
                    as="div"
                    className="relative"
                  >
                    <button className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none disabled:opacity-50" disabled={openCalling}>
                      <img className="h-5 w-5" alt="call" src={`${process.env.PUBLIC_URL}/video_call.png`} />
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
                    className="th-bg-bg border th-border-for origin-top-right z-20 absolute right-0 mt-1 w-48 h-72  rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-2"
                  >
                    <div className="px-5 flex items-center justify-between">
                      <div className="text-base th-color-for">Choose members</div>
                    </div>
                    <div className="w-full h-px th-bg-for" />
                    <div className="overflow-y-auto h-52">
                      {users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)).map((item: any, index: number) => (
                        <div key={index}>
                          <InviteUserItem item={item} allChecked={checked} setAllChecked={setChecked} handleSelect={handleSelectUsers} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end items-center border-t th-border-for pt-2 px-2 space-x-2">
                      <Menu.Item>
                      {({ active }) => (
                        <button className="th-color-cyan border-2 th-border-cyan rounded text-xs px-2 py-1" onClick={() => {
                          handleCallingButton(false);
                        }}>Confirm</button>
                      )}
                      </Menu.Item>
                      {checked &&
                        <button className="th-color-for border-2 th-border-for rounded text-xs px-2 py-1" onClick={() =>  {
                          setCheckedUsers(users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)));
                          setChecked(true);
                        }}>Select All</button>
                      }
                      {!checked &&
                        <button className="th-color-for border-2 th-border-for rounded text-xs px-2 py-1" onClick={() =>  {
                          setCheckedUsers([]);
                          setChecked(false);
                        }}>Unselect All</button>
                      }
                    </div>
                  </Menu.Items>
                </Transition>
              </>
            )}
          </Menu>
        )}
      </div>
    </div>
  );
}

function HeaderDirectMessage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeColors } = useTheme();
  const { workspaceId, dmId } = useParams();
  const { value: dm } = useDirectMessageById(dmId);
  const { user, userdata } = useUser();
  const { value: userData } = useUserById(user?.uid);
  const otherUserId = dm?.members.find((m: string) => m !== user?.uid);
  const { value } = useUserById(otherUserId || user?.uid);

  const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);
  const { visibleSearch, setVisibleSearch } = useContext(ReactionsContext);
  const { visibleFileSearch, setVisibleFileSearch } = useContext(ReactionsContext);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { openCalling, setOpenCalling, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, setRoomName, setIsVideoDisabled, openMeetingModal, isVideoDisabled } = useModal();

  const createChannelAndInviteMember = async () => {
    setLoading(true);
    try {
      const { channelId } = await postData("/channels", {
        name: `${userData?.displayName.split(" ")[0]}, ${value?.displayName}`,
        description: "",
        workspaceId,
      });
      await postData(`/channels/${channelId}/members`, {
        email: value?.email,
      });
      navigate(
        `/dashboard/workspaces/${workspaceId}/channels/${channelId}`
      );
      toast.success("Channel created and member added.");
    } catch (err: any) {
      toast.error(err.message);
    }
    setOpen(false);
    setLoading(false);
  }

  const handleCallingButton = async (audioOnly: boolean) => {
    try {
      const room = randomRoomName();
      await axios.post('/send-message', {
        sender: userdata,
        receiver: [value],
        type: "Calling",
        room,
        audioOnly,
      });
      console.log('Message sent successfully');
      setRecipientInfo([value]);
      setSenderInfo(userdata);
      setRoomName(room);
      setIsVideoDisabled(audioOnly);
      setOpenCalling(true);
    } catch (error) {
      console.error('Error sending message', error);
    }
  }
  
  const handleTimeout = async (sender: any, receiver: any[]) => {
    try {
      await axios.post('/send-message', {
        sender,
        receiver,
        type: "Timeout",
        roomName: "",
      });
      console.log('Message sent successfully');
      setOpenCalling(false);
      setRecipientInfo([]);
      setSenderInfo(null);
      setRoomName("");
      setIsVideoDisabled(false);
      toast.info('Sorry, but the recipient you are calling right now is not responding.', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      console.error('Error sending message', error);
    }
  }
 
  const sendCallMessage = async (type: string, startTime: Date) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "${type}", "duration": "${startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId: dmId,
      workspaceId,
      chatType: "Direct",
    });
  }

  useEffect(() => {
    console.log(new Date());
    let timer: NodeJS.Timeout | undefined;
    if (openCalling && !openMeetingModal) {
      timer = setTimeout(() => {
        sendCallMessage("Missed Call", new Date());
        handleTimeout(userdata, [value]);
      }, 35000);
    } else {
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [openCalling, openMeetingModal, senderInfo, recipientInfo, isVideoDisabled]);

  return (
    <div className="w-full border-b flex items-center justify-between px-5 py-1 h-14 th-color-selbg th-border-for">
      <SelectChannel
        className="flex items-center cursor-pointer focus:outline-none py-1 pr-2 rounded"
        onClick={() =>
          navigate(
            `${location.pathname.split("/user_profile")[0]}/user_profile/${
              value?.objectId
            }`
          )
        }
        theme={themeColors}
      >
        <img
          alt={value?.objectId}
          className="h-6 w-6 rounded mr-2"
          src={photoURL || `${process.env.PUBLIC_URL}/blank_user.png`}
        />
        <h5 className="font-bold mr-1 th-color-for max-w-sm truncate">
          {value?.displayName}
        </h5>
        <ChevronDownIcon className="h-4 w-4 th-color-for" />
      </SelectChannel>
      <div className="flex">
        {value?.objectId !== user?.uid && (
          <button className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none" disabled={loading} onClick={() =>setOpen(true)}>
            {loading ? <Spinner className="h-5 w-5" /> : 
            <img className="h-5 w-5" alt="add member" src={`${process.env.PUBLIC_URL}/add_user.png`} />}
          </button>
        )}
        <button
          className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleSearch(!visibleSearch)}
        >
          <img className="h-5 w-5" alt="search" src={`${process.env.PUBLIC_URL}/search.png`} />
        </button>
        <button
          className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleFileSearch(!visibleFileSearch)}
        >
          <img className="h-5 w-5" alt="gallery" src={`${process.env.PUBLIC_URL}/gallery.png`} />
        </button>
        {value?.objectId !== user?.uid && (
          <button className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none disabled:opacity-50" disabled={openCalling} onClick={() => handleCallingButton(true)}>
            <img className="h-5 w-5" alt="call" src={`${process.env.PUBLIC_URL}/voice_call.png`} />
          </button>
        )}
        {value?.objectId !== user?.uid && (
          <button className="th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded-lg font-extrabold focus:z-10 focus:outline-none disabled:opacity-50" disabled={openCalling} onClick={() => handleCallingButton(false)}>
            <img className="h-5 w-5" alt="call" src={`${process.env.PUBLIC_URL}/video_call.png`} />
          </button>
        )}
      </div>
      <AddChannelConfirm open={open} setOpen={setOpen} addChannel={createChannelAndInviteMember} loading={loading} />
    </div>
  );
}

export default function ChatArea() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { channelId, dmId } = useParams();
  const { value: channel } = useChannelById(channelId);
  const { value: directMessage } = useDirectMessageById(dmId);
  const { value: detail } = useDetailByChat(channelId || dmId);

  const [lastRead, setLastRead] = useState(null);

  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("");
  const {isSelecting, visibleSearch, setVisibleSearch, setVisibleFileSearch, visibleForward, originId, searchText, visibleReply} = useContext(ReactionsContext);

  useEffect(() => {
    if (!originId) {
      const el = document.getElementById("contentMain")!;
      el.scrollTo(el.scrollHeight, 0);
    }
    setLastRead(null);
    setHasNew(false);
    setInputValue("");
    setFilter("");
    setVisibleSearch(false);
    setVisibleFileSearch(false);
  }, [channelId, dmId]);

  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (channel && channel.lastMessageCounter !== detail?.lastRead) {
      postData(`/users/${user?.uid}/read`, {
        chatType: "Channel",
        chatId: channelId,
      });
      if (!hasNew) {
        setLastRead(detail?.lastRead || 0);
        setHasNew(true);
      }
    } else if (
      directMessage &&
      directMessage.lastMessageCounter !== detail?.lastRead
    ) {
      postData(`/users/${user?.uid}/read`, {
        chatType: "Direct",
        chatId: dmId,
      });
      if (!hasNew) {
        setLastRead(detail?.lastRead || 0);
        setHasNew(true);
      }
    }
  }, [channel?.lastMessageCounter, directMessage?.lastMessageCounter]);

  useEffect(() => {
    initFindWin(false, "contentMain");
  }, []);

  useEffect(() => {
    if (visibleSearch) {
      document.getElementById("fwtext").value = searchText;
      document.getElementById("fwtext").defaultValue = searchText;
      document.getElementById("btnDown")?.click();
    }
  }, [visibleSearch]);

  useEffect(() => {
    if (!visibleSearch) {
      document.getElementById("closeIcon")?.click();
    }
  }, [visibleSearch]);

  const openSearchBar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.code === "KeyF") {
      e.preventDefault();
      setVisibleSearch(!visibleSearch)
    }
  }

  return (
    <div className="row-span-2 flex flex-col overflow-hidden border th-border-for th-bg-bg m-2 rounded-xl" onKeyDown={(e) => openSearchBar(e)} tabIndex={-1}>
      {channelId && <HeaderChannel />}
      {dmId && <HeaderDirectMessage />}
      <div className="min-h-0 flex-1 flex flex-col justify-end overflow-y-auto">
        {/* {visibleSearch && <SearchDialog />} */}
        {/* {visibleFileSearch && <FileSearchDialog />} */}
        {isSelecting && <SelectHeader />}
        <div className="border-b th-border-for" style={visibleSearch ? {} : {display: 'none'}}>
          <div id="findwindow" />
        </div>
        <Messages lastRead={lastRead} filter={filter}  />
        {isSelecting? <SelectFooter /> : <Editor />}
        {visibleForward && <ForwardMessage />}
        {visibleReply && <ReplyMessage />}
      </div>
    </div>
  );
}
