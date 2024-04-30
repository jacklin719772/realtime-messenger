import { CheckCircleIcon, DocumentTextIcon, DownloadIcon, EyeIcon, PaperAirplaneIcon, ReplyIcon } from "@heroicons/react/outline";
import { PencilIcon, TrashIcon } from "@heroicons/react/solid";
import DeleteConfirm from "components/dashboard/chat/DeleteConfirm";
import EditMessage from "components/dashboard/chat/EditMessage";
import QuillReader from "components/dashboard/quill/QuillReader";
import { ReactionModal } from "components/ReactionModal";
import Spinner from "components/Spinner";
import { ReactionsContext, useReactions } from "contexts/ReactionsContext";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { useUserById } from "hooks/useUsers";
import { reactions } from "lib/reactions";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { deleteData, postData } from "utils/api-helpers";
import bytesToSize from "utils/bytesToSize";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import hexToRgbA from "utils/hexToRgbA";
import { Base64 } from 'js-base64';
import ForwardMessage from "./ForwardMessage";
import { useMessage } from "hooks/useMessages";
import { useChannelById, useChannels } from "hooks/useChannels";
import { useDirectMessageById } from "hooks/useDirects";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { channel } from "diagnostics_channel";
import { ModalContext } from "contexts/ModalContext";
import { toast as toastr } from "react-toastify";
import { randomRoomName } from "utils/jitsiGenerator";
import axios from "axios";

const MessageDiv = styled.div`
  :hover {
    background-color: ${(props) =>
      hexToRgbA(props.theme.selectionBackground, "0.4")};
  }
`;

function UserName({ id }: { id: string }) {
  const { value } = useUserById(id);

  return (
    <span className="after:content-[',_'] last:after:content-['_'] font-semibold">
      {value?.displayName}
    </span>
  );
}

function Reactions({ groupedReactions }: { groupedReactions: any[] }) {
  const keys = Object.keys(groupedReactions);

  return (
    <div className="flex space-x-2 mt-1 px-8">
      {reactions
        .filter((reaction) => keys.includes(reaction.value || ""))
        .map((reaction) => (
          <div
            className="flex items-center th-color-for py-[3px] pl-[3px] pr-[5px] rounded-full border th-border-selbg group relative"
            key={reaction.value}
          >
            <div
              className={classNames(
                reaction.bgColor,
                "w-5 h-5 rounded-full flex items-center justify-center"
              )}
            >
              <reaction.icon
                className={classNames(
                  reaction.iconColor,
                  "flex-shrink-0 h-3 w-3"
                )}
                aria-hidden="true"
              />
            </div>
            <div className="text-sm pl-1">
              {groupedReactions[(reaction.value || "") as any].length || 0}
            </div>
            <div className="bg-white shadow-lg rounded-lg p-2 hidden absolute group-hover:block origin-top-left bottom-0 left-0 -translate-y-8 w-44 z-50">
              {groupedReactions[(reaction.value || "") as any]
                .map((r: any) => r.userId)
                .map((userId: string) => (
                  <UserName key={userId} id={userId} />
                ))}
              reacted.
            </div>
          </div>
        ))}
    </div>
  );
}

export default function Message({
  message,
  previousSameSender,
  previousMessageDate,
  children,
  index,
  editMessage,
  setEditMessage,
  handleSelect,
}: {
  message: any;
  previousSameSender: boolean;
  previousMessageDate: any;
  children: React.ReactNode;
  index: number;
  editMessage: string;
  setEditMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSelect: (e: any, message: any) => void,
}) {
  const messageReader = useMemo(
    () => <QuillReader text={message?.text} isEdited={message?.isEdited} />,
    [message]
  );

  const edit = editMessage === message?.objectId;

  const { themeColors } = useTheme();

  const { user, userdata } = useUser();

  const downloadRef = useRef<any>(null);

  const previewRef = useRef<any>(null);

  const checkRef = useRef<any>(null);

  const navigate = useNavigate();

  const location = useLocation();

  const { value } = useUserById(message?.senderId);

  const { channelId, dmId } = useParams();
  const chatId = channelId || dmId;

  const { reactions: messageReactions } = useReactions(
    chatId,
    message?.objectId
  );

  // group reactions by value
  const groupedReactions = useMemo(() => {
    let groups: any = {};
    messageReactions.forEach((reaction) => {
      groups[reaction.reaction] = [
        ...(groups[reaction.reaction] || []),
        reaction,
      ];
    });
    return groups;
  }, [messageReactions]);

  const myReaction = messageReactions.find(
    (reaction) => reaction.userId === user?.uid
  )?.reaction;

  const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);

  const fileURL = getHref(message?.thumbnailURL) || getHref(message?.fileURL);

  const replyFileURL = getHref(message?.replyThumbnailURL) || getHref(message?.replyFileURL);

  const [open, setOpen] = useState(false);
  
  const {isSelecting, setIsSelecting, setVisibleForward, setVisibleReply, setForwardMessage, originId, setOriginId} = useContext(ReactionsContext);
  // const [forward, setForward] = useState<any>(null);
  const {setOpenMailSender, setEmailBody, setEmailRecipient, setOpenFavorite, setFileURL, setFileMessage, setOpenCalling, setRecipientInfo, setSenderInfo, setRoomName, setIsVideoDisabled} = useContext(ModalContext);

  const [loadingDelete, setLoadingDelete] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);

  const [checked, setChecked] = useState(false);

  const getFormattedDateTime = (str: string) => {
    const d = new Date(str);
    d?.setHours(d?.getHours() + 8);
    const formattedTime = d?.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    return formattedTime;
  }

  const sizes = useMemo(() => {
    const ratio = message?.mediaWidth / message?.mediaHeight;
    if (ratio < 1) {
      return {
        height: "384px",
        width: `${Math.round(
          (384 * message.mediaWidth) / message.mediaHeight
        )}px`,
      };
    }
    return {
      height: `${Math.round(
        (384 * message.mediaHeight) / message.mediaWidth
      )}px`,
      width: "384px",
    };
  }, [message?.mediaHeight, message?.mediaWidth]);

  const deleteMessage = async () => {
    setLoadingDelete(true);
    try {
      await deleteData(`/messages/${message?.objectId}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingDelete(false);
    setOpen(false);
  };

  const prevCreatedAt = new Date(previousMessageDate);

  const createdAt = new Date(message?.createdAt);

  const displayProfilePicture = useMemo(
    () =>
      !previousSameSender ||
      (index + 1) % 30 === 0 ||
      (previousSameSender &&
        prevCreatedAt &&
        createdAt &&
        createdAt?.getTime() - prevCreatedAt?.getTime() > 600000),
    [previousSameSender, index, prevCreatedAt, createdAt]
  );

  const { value: forward, loading } = useMessage(message?.forwardId);
  const { value: forwardUser } = useUserById(message?.forwardSenderId);
  const { value: replyUser } = useUserById(message?.replySenderId);

  const forwardPhotoURL = getHref(forwardUser?.thumbnailURL) || getHref(forwardUser?.photoURL);
  const replyPhotoURL = getHref(replyUser?.thumbnailURL) || getHref(replyUser?.photoURL);

  const [forwardImageLoaded, setForwardImageLoaded] = useState(false);

  const showForward = () => {
    if (message?.text || message?.fileURL) {
      setForwardMessage(message);
    } else {
      setForwardMessage(forward);
    }
    setVisibleForward(true);
  }

  const showReply = () => {
    if (message?.text || message?.fileURL) {
      setForwardMessage(message);
    } else {
      setForwardMessage(forward);
    }
    setVisibleReply(true);
  }

  const goOriginal = (forward: any) => {
    if (forward?.chatType === "Channel") {
      navigate(`/dashboard/workspaces/${forward?.workspaceId}/channels/${forward?.chatId}`);
    } else {
      navigate(`/dashboard/workspaces/${forward?.workspaceId}/dm/${forward?.chatId}`);
    }
    if (!forward?.isDeleted) {
      setOriginId(forward?.objectId);
    }
  }

  const goRepliedOriginal = (id: string) => {
    const el = document.getElementById(id)!;
    if (el) {
      el.scrollIntoView();
    }
  }

  const initializeSelect = () => {
    console.log(checkRef);
    checkRef?.current.click();
    setIsSelecting(true);
  }

  const initializeEmail = (message: any) => {
    let messageBody = '';
    if (message?.text) {
      console.log(message?.text);
      messageBody += message?.text;
    }
    if (message?.fileURL) {
      messageBody += `<a href="${getHref(message?.fileURL + '&d=' + message?.fileName)}" target="_blank">${message?.fileName}</a>`
    }
    setEmailBody(messageBody);
    setEmailRecipient("");
    setOpenMailSender(true);
  }

  const initializeFavorite = (message: any) => {
    setFileURL(message?.fileURL);
    setFileMessage(message);
    setOpenFavorite(true);
  }

  const removeFavorite = async () => {
    try {
      await postData(`/messages/${message?.objectId}/favorites/${user?.uid}`);
      toastr.success('The file has been removed from your private folder.', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error: any) {
      toastr.error(error.message, {
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

  const { value: forwardChannel } = useChannelById(forward?.chatId);
  const forwardChatName = forwardChannel?.name;

  const getFormattedTime = (date: any) => {
    const d = new Date(date);
    d?.setHours(d?.getHours() + 8);
    const today = new Date(new Date().toDateString());
    const dDate = new Date(d.toDateString());
    if (Math.floor((today - dDate) / 86400000) === 0) {
      return 'Today';
    }
    if (Math.floor((today - dDate) / 86400000) === 1) {
      return 'Yesterday';
    }
    return d?.toLocaleDateString("zh-CN", { day:"numeric", month:"short"});
  }

  const handleCallingButton = async (receiver: any, audioOnly: boolean) => {
    try {
      const room = randomRoomName();
      await axios.post('/send-message', {
        sender: userdata,
        receiver,
        type: "Calling",
        room,
        audioOnly,
      });
      console.log('Message sent successfully');
      setOpenCalling(true);
      setRecipientInfo(receiver);
      setSenderInfo(userdata);
      setRoomName(room);
      setIsVideoDisabled(audioOnly);
    } catch (error) {
      console.error('Error sending message', error);
    }
  }

  const { value: channels } = useChannels();
  const { value: dms } = useContext(DirectMessagesContext);
  const isOriginViewAllowed = channels?.filter((channel: any) => channel.objectId === message?.forwardChatId).length > 0 || dms?.filter((channel: any) => channel.objectId === message?.forwardChatId).length > 0;

  useEffect(() => {
    if (originId) {
      const el = document.getElementById(originId)!;
      if (el) {
        el.scrollIntoView();
        setOriginId(null);
      }
    }
  }, []);

  useEffect(() => {
    handleSelect(checked, message);
  }, [checked]);

  useEffect(() => {
    if (!isSelecting) {
      setChecked(false);
    }
  }, [isSelecting]);

  const messageRender = useMemo(
    () => (
      <>
        {message?.text.includes("[Jitsi_Call_Log:]:") ?
        <>
        {JSON.parse(message?.text.substr(19, message?.text.length)).type === "Call ended" &&  
      <div className="flex flex-1 group w-full pl-12 items-center">
        <div className="w-96 px-4 py-2 m-2 rounded-lg th-bg-selbg flex justify-between items-center border th-border-for">
          <div className="flex items-center space-x-2">
            <div className="text-sm th-color-for">{JSON.parse(message?.text.substr(19, message?.text.length)).type}</div>
            <div className="text-sm th-color-for">
              {String(Math.floor(parseInt(JSON.parse(message?.text.substr(19, message?.text.length)).duration) / 1000 / 60)).padStart(2, "0")}:
              {String(Math.floor(parseInt(JSON.parse(message?.text.substr(19, message?.text.length)).duration) / 1000) - Math.floor(parseInt(JSON.parse(message?.text.substr(19, message?.text.length)).duration) / 1000 / 60) * 60).padStart(2, "0")}
            </div>
          </div>
          <div className="flex items-center">
            <button className="rounded-full bg-transparent th-color-brwhite" onClick={
              () => {
                if (JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0) {
                  handleCallingButton([JSON.parse(message?.text.substr(19, message?.text.length)).sender], JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                } else {
                  handleCallingButton(JSON.parse(message?.text.substr(19, message?.text.length)).receiver, JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                }
              }
            }>
              <img src={`${process.env.PUBLIC_URL}/call_start.png`} className="h-10 w-10" alt="mic_on" />
            </button>
          </div>
        </div>
      </div>}
      {(JSON.parse(message?.text.substr(19, message?.text.length)).type === "Missed Call" && JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0) &&  
      <div className="flex flex-1 group w-full pl-12 items-center">
        <div className="w-96 px-4 py-2 m-2 rounded-lg th-bg-selbg flex justify-between items-center border th-border-for">
          <div className="flex items-center space-x-2">
            <div className="text-sm th-color-for">{JSON.parse(message?.text.substr(19, message?.text.length)).type}</div>
            <div className="text-sm th-color-for">
              {new Date(JSON.parse(message?.text.substr(19, message?.text.length)).duration).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button className="rounded-full bg-transparent th-color-brwhite" onClick={
              () => {
                if (JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0) {
                  handleCallingButton([JSON.parse(message?.text.substr(19, message?.text.length)).sender], JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                } else {
                  handleCallingButton(JSON.parse(message?.text.substr(19, message?.text.length)).receiver, JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                }
              }
            }>
              <img src={`${process.env.PUBLIC_URL}/call_start.png`} className="h-10 w-10" alt="mic_on" />
            </button>
          </div>
        </div>
      </div>
        }
        {(JSON.parse(message?.text.substr(19, message?.text.length)).type === "Stopped Call" && JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0) &&  
        <div className="flex flex-1 group w-full pl-12 items-center">
          <div className="w-96 px-4 py-2 m-2 rounded-lg th-bg-selbg flex justify-between items-center border th-border-for">
            <div className="flex items-center space-x-2">
              <div className="text-sm th-color-for">{JSON.parse(message?.text.substr(19, message?.text.length)).type}</div>
              <div className="text-sm th-color-for">
                {new Date(JSON.parse(message?.text.substr(19, message?.text.length)).duration).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </div>
            </div>
            <div className="flex items-center">
              <button className="rounded-full bg-transparent th-color-brwhite" onClick={
                () => {
                  if (JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.filter((r: any) => r?.objectId === user?.uid).length > 0) {
                    handleCallingButton([JSON.parse(message?.text.substr(19, message?.text.length)).sender], JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                  } else {
                    handleCallingButton(JSON.parse(message?.text.substr(19, message?.text.length)).receiver, JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                  }
                }
              }>
                <img src={`${process.env.PUBLIC_URL}/call_start.png`} className="h-10 w-10" alt="mic_on" />
              </button>
            </div>
          </div>
        </div>
        }
        {(JSON.parse(message?.text.substr(19, message?.text.length)).type === "Refused Call" && JSON.parse(message?.text.substr(19, message?.text.length)).sender?.objectId === user?.uid) &&  
        <div className="flex flex-1 group w-full pl-12 items-center">
          <div className="w-96 px-4 py-2 m-2 rounded-lg th-bg-selbg flex justify-between items-center border th-border-for">
            <div className="flex items-center space-x-2">
              <div className="text-sm th-color-for">{JSON.parse(message?.text.substr(19, message?.text.length)).type}</div>
              <div className="text-sm th-color-for">
                {new Date(JSON.parse(message?.text.substr(19, message?.text.length)).duration).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </div>
            </div>
            <div className="flex items-center">
              <button className="rounded-full bg-transparent th-color-brwhite" onClick={
                () => {
                  if (JSON.parse(message?.text.substr(19, message?.text.length)).receiver?.objectId === user?.uid) {
                    handleCallingButton([JSON.parse(message?.text.substr(19, message?.text.length)).sender], JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                  } else {
                    handleCallingButton([JSON.parse(message?.text.substr(19, message?.text.length))?.refusedUser], JSON.parse(message?.text.substr(19, message?.text.length)).audioOnly);
                  }
                }
              }>
                <img src={`${process.env.PUBLIC_URL}/call_start.png`} className="h-10 w-10" alt="mic_on" />
              </button>
            </div>
          </div>
        </div>
        }
        </>
        : 
      <div className="flex flex-1 group w-full">
        {displayProfilePicture && (
          <div className="flex flex-col items-start h-full pt-1 w-6">
            <div
              role="button"
              tabIndex={0}
              className="rounded h-6 w-6 bg-cover cursor-pointer focus:outline-none"
              style={{
                backgroundImage: `url(${
                  photoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                })`,
              }}
              onClick={() =>
                navigate(
                  `${
                    location.pathname.split("/user_profile")[0]
                  }/user_profile/${value?.objectId}`
                )
              }
            />
          </div>
        )}

        {!displayProfilePicture && (
          <div className="flex flex-col">
            {message?.forwardId && <div className="flex flex-col items-start pt-1 w-6">
              <PaperAirplaneIcon className="p-1 w-full rotate-90 th-color-for" />
            </div>}
            <div className="flex flex-col items-start h-full pt-1 w-6 opacity-0 group-hover:opacity-100">
              <span className="font-light text-xs align-bottom th-color-for">
                {getFormattedDateTime(message?.createdAt)}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 pl-3 w-10/12">
          {displayProfilePicture && (
            <div
              className={classNames(
                edit ? "th-color-black" : "th-color-for",
                "flex items-center"
              )}
            >
              <span
                role="button"
                tabIndex={0}
                className={classNames(
                  !value?.displayName ? "opacity-0" : "",
                  "font-bold text-sm align-top hover:underline cursor-pointer focus:outline-none max-w-sm truncate"
                )}
                onClick={() =>
                  navigate(
                    `${
                      location.pathname.split("/user_profile")[0]
                    }/user_profile/${value?.objectId}`
                  )
                }
              >
                {value?.displayName || "undefined"}
              </span>
              <span className="font-light text-xs ml-2 align-bottom">
                {getFormattedDateTime(message?.createdAt)}
              </span>
            </div>
          )}

          <div className={classNames(
            message?.replyId ? "p-2 pl-0" : ""
          )}>
            {message?.replyId && (
              <div className="px-4 py-1 mt-2 mr-2 cursor-pointer shadow rounded-lg border border-l-4 th-border-for" onClick={() => goRepliedOriginal(message?.replyId)}>
                <div className="py-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 th-color-for">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                </div>
                <div className="flex items-center h-5 py-1 w-auto">
                  <div
                    role="button"
                    tabIndex={0}
                    className="rounded h-5 w-5 bg-cover cursor-pointer focus:outline-none"
                    style={{
                      backgroundImage: `url(${
                        replyPhotoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                      })`,
                    }}
                    onClick={() =>
                      navigate(
                        `${
                          location.pathname.split("/user_profile")[0]
                        }/user_profile/${replyUser?.objectId}`
                      )
                    }
                  />
                  <div
                    role="button"
                    className="font-bold text-sm ml-2 hover:underline cursor-pointer th-color-for" onClick={() =>
                      navigate(
                        `${
                          location.pathname.split("/user_profile")[0]
                        }/user_profile/${replyUser?.objectId}`
                      )
                  }>{replyUser?.displayName}</div>
                  <div className="px-2 th-color-for text-xs">{getFormattedTime(message?.replyCreatedAt)}</div>
                </div>
                <div className="pt-1">
                  {message?.replyText && <QuillReader text={message?.replyText} isEdited={false} />}
                  {message?.replyFileURL && (
                    <>
                      {message?.replyFileType?.includes("image/") && (
                        <>
                          <div
                            className={classNames(
                              imageLoaded ? "block" : "hidden",
                              "relative my-1"
                            )}
                          >
                            <img
                              className="bg-cover max-w-sm max-h-sm rounded relative focus:outline-none"
                              onLoad={() => setImageLoaded(true)}
                              alt={message?.replyFileName}
                              src={replyFileURL}
                              // onClick={() => window.location.assign(`${getHref(forward?.fileURL + '&d=' + forward?.fileName)}`)}
                            />
                          </div>
                          {!imageLoaded && (
                            <div
                              className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                              style={{
                                height: sizes?.height,
                                width: sizes?.width,
                              }}
                            />
                          )}
                        </>
                      )}

                      {message?.fileType?.includes("video/") && (
                        <div className="max-h-sm max-w-sm relative my-1">
                          <video
                            className="max-h-sm max-w-sm"
                            controls
                            disablePictureInPicture
                            controlsList="nodownload"
                            poster={getHref(message?.replyThumbnailURL)}
                          >
                            <source
                              src={getHref(message?.replyFileURL)}
                              type={message?.replyFileType}
                            />
                          </video>
                        </div>
                      )}

                      {message?.replyFileType?.includes("audio/") && (
                        <div className="relative my-1">
                          <audio controls controlsList="nodownload">
                            <source src={replyFileURL} type={message?.replyFileType} />
                          </audio>
                        </div>
                      )}

                      {!message?.replyFileType?.includes("audio/") &&
                        !message?.replyFileType?.includes("video/") &&
                        !message?.replyFileType?.includes("image/") && (
                          <div className="relative my-1">
                            <div className="rounded-xl h-16 w-80 relative group border th-border-for flex space-x-2 items-center p-1 overflow-hidden">
                              <DocumentTextIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <div className="text-gray-300 text-sm font-bold truncate">
                                  {message?.replyFileName}
                                </div>
                                <div className="text-gray-400 text-sm truncate">
                                  {bytesToSize(message?.replyFileSize)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            )}

            {message?.forwardId && forward && !loading ? (
              <div className="px-4 py-1 mt-2 border border-l-4 th-border-for rounded-lg">
                <div className="flex items-center h-5 pt-1 w-auto">
                  <div
                    role="button"
                    tabIndex={0}
                    className="rounded h-5 w-5 bg-cover cursor-pointer focus:outline-none"
                    style={{
                      backgroundImage: `url(${
                        forwardPhotoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                      })`,
                    }}
                    onClick={() =>
                      navigate(
                        `${
                          location.pathname.split("/user_profile")[0]
                        }/user_profile/${forwardUser?.objectId}`
                      )
                    }
                  />
                  <div
                    role="button"
                    className="font-bold text-sm ml-2 hover:underline cursor-pointer th-color-for" onClick={() =>
                      navigate(
                        `${
                          location.pathname.split("/user_profile")[0]
                        }/user_profile/${forwardUser?.objectId}`
                      )
                  }>{forwardUser?.displayName}</div>
                </div>
                <div className="pt-1">
                  {message?.text && <QuillReader text={message?.text} isEdited={message?.isEdited} />}
                  {message?.fileURL && (
                    <>
                      {message?.fileType?.includes("image/") && (
                        <>
                          <div
                            className={classNames(
                              imageLoaded ? "block" : "hidden",
                              "relative my-1"
                            )}
                          >
                            <img
                              className="bg-cover max-w-sm max-h-sm rounded relative focus:outline-none"
                              onLoad={() => setImageLoaded(true)}
                              alt={message?.fileName}
                              src={fileURL}
                              // onClick={() => window.location.assign(`${getHref(forward?.fileURL + '&d=' + forward?.fileName)}`)}
                            />
                          </div>
                          {!imageLoaded && (
                            <div
                              className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                              style={{
                                height: sizes?.height,
                                width: sizes?.width,
                              }}
                            />
                          )}
                        </>
                      )}

                      {message?.fileType?.includes("video/") && (
                        <div className="max-h-sm max-w-sm relative my-1">
                          <video
                            className="max-h-sm max-w-sm"
                            controls
                            disablePictureInPicture
                            controlsList="nodownload"
                            poster={getHref(message?.thumbnailURL)}
                          >
                            <source
                              src={getHref(message?.fileURL)}
                              type={message?.fileType}
                            />
                          </video>
                        </div>
                      )}

                      {message?.fileType?.includes("audio/") && (
                        <div className="relative my-1">
                          <audio controls controlsList="nodownload">
                            <source src={fileURL} type={message?.fileType} />
                          </audio>
                        </div>
                      )}

                      {!message?.fileType?.includes("audio/") &&
                        !message?.fileType?.includes("video/") &&
                        !message?.fileType?.includes("image/") && (
                          <div className="relative my-1">
                            <div className="rounded h-16 w-80 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1 overflow-hidden">
                              <DocumentTextIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <div className="text-gray-300 text-sm font-bold truncate">
                                  {message?.fileName}
                                </div>
                                <div className="text-gray-400 text-sm truncate">
                                  {bytesToSize(message?.fileSize)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
                {(isOriginViewAllowed && !forward?.isDeleted) && (
                <div className="text-xs flex items-center">
                  <div className="pr-2 button th-color-for hover:underline cursor-pointer border-r th-border-for" onClick={() => goOriginal(forward)}>
                    {message?.forwardChatType === "Channel" ? `Posted in #${forwardChatName}` : "Direct message"}
                  </div>
                  <div className="px-2 th-color-for hover:underline cursor-pointer border-r th-border-for" style={{cursor: 'pointer'}} onClick={() => goOriginal(forward)}>
                    {getFormattedTime(message?.forwardCreatedAt)}
                  </div>
                  <div className="px-2 th-color-cyan hover:underline cursor-pointer th-border-for" style={{cursor: 'pointer'}} onClick={() => goOriginal(forward)}>
                    {message?.forwardChatType === "Channel" ? "View message" : "View conversation"}
                  </div>
                </div>
                )}
              </div>
            ) : (
              <>
                {(message?.text && !edit && message?.text.replace(/(<([^>]+)>)/ig, '')) && messageReader}

                {(message?.text && edit && message?.text.replace(/(<([^>]+)>)/ig, '')) && (
                  <EditMessage setEdit={setEditMessage} message={message} />
                )}

                {message.fileURL && !edit && (
                  <>
                    {message?.fileType?.includes("image/") && (
                      <>
                        <div
                          className={classNames(
                            imageLoaded ? "block" : "hidden",
                            "relative my-1"
                          )}
                        >
                          <img
                            className="bg-cover max-w-sm max-h-sm rounded relative focus:outline-none"
                            onLoad={() => setImageLoaded(true)}
                            alt={message?.fileName}
                            src={fileURL}
                            // onClick={() => downloadRef?.current?.click()}
                          />
                        </div>
                        {!imageLoaded && (
                          <div
                            className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                            style={{
                              height: sizes?.height,
                              width: sizes?.width,
                            }}
                          />
                        )}
                      </>
                    )}
      
                    {message?.fileType?.includes("video/") && (
                      <div className="max-h-sm max-w-sm relative my-1">
                        <video
                          className="max-h-sm max-w-sm"
                          controls
                          disablePictureInPicture
                          controlsList="nodownload"
                          poster={getHref(message?.thumbnailURL)}
                        >
                          <source
                            src={getHref(message?.fileURL)}
                            type={message?.fileType}
                          />
                        </video>
                      </div>
                    )}
      
                    {message?.fileType?.includes("audio/") && (
                      <div className="relative my-1">
                        <audio className="w-96" controls controlsList="nodownload">
                          <source src={fileURL} type={message?.fileType} />
                        </audio>
                      </div>
                    )}
      
                    {!message?.fileType?.includes("audio/") &&
                      !message?.fileType?.includes("video/") &&
                      !message?.fileType?.includes("image/") && (
                        <div className="relative my-1">
                          <div className="rounded h-16 w-80 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1 overflow-hidden">
                            <DocumentTextIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <div className="text-gray-300 text-sm font-bold truncate">
                                {message?.fileName}
                              </div>
                              <div className="text-gray-400 text-sm truncate">
                                {bytesToSize(message?.fileSize)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </>
                )}
              </>
            )}

            {message?.sticker && (
              <img
                className="h-32 w-32 my-2 rounded-sm"
                alt={message?.sticker}
                src={`${process.env.PUBLIC_URL}/stickers/${message?.sticker}`}
              />
            )}
          </div>
        </div>

        <div className={classNames(
          !isSelecting ? "hidden" : "",
          "flex items-center px-4 w-6" 
        )}>
          <input type="checkbox" ref={checkRef} className="w-5 h-5 rounded" value={message?.objectId} checked={checked} onChange={(e) => setChecked(!checked)} />
        </div>

        {!isSelecting && (
          <div
            className={classNames(
              edit ? "opacity-0" : "opacity-0 group-hover:opacity-100",
              "absolute top-0 right-0 mx-5 transform -translate-y-3 z-10 inline-flex shadow-sm rounded-md -space-x-px"
            )}
          >
            <ReactionModal
              messageId={message?.objectId}
              myReaction={myReaction}
            />

            {message?.fileURL && (
              <button
                type="button"
                className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                onClick={() => downloadRef?.current?.click()}
              >
                <span className="sr-only">Download</span>
                <a
                  ref={downloadRef}
                  className="hidden"
                  download={message?.fileName}
                  target="_blank"
                  rel="noreferrer"
                  href={getHref(message?.fileURL + '&d=' + message?.fileName)}
                >
                  Download
                </a>
                <DownloadIcon className="h-4 w-4" />
              </button>
              
            )}

            {message?.fileURL &&
            (message?.fileType?.includes("audio/") ||
                  message?.fileType?.includes("video/") ||
                  message?.fileType?.includes("image/")) && (
              <button
                type="button"
                className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                onClick={() => previewRef?.current?.click()}
              >
                <span className="sr-only">Preview</span>
                <a
                  ref={previewRef}
                  className="hidden"
                  target="_blank"
                  rel="noreferrer"
                  title={getHref(message?.fileURL.replace(/%2F/g, "%252F"))}
                  href={`https://im.flybird360.com:8013/onlinePreview?url=${encodeURIComponent(Base64.encode(`https://im.flybird360.com:3003${message?.fileURL.replace(/%2F/g, "%252F")}`))}`}
                >
                  Download
                </a>
                <EyeIcon className="h-4 w-4" />
              </button>
              
            )}

            {message?.fileURL &&
            (!message?.fileType?.includes("audio/") &&
                  !message?.fileType?.includes("video/") &&
                  !message?.fileType?.includes("image/")) && (
              <button
                type="button"
                className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                onClick={() => previewRef?.current?.click()}
              >
                <span className="sr-only">Preview</span>
                <a
                  ref={previewRef}
                  className="hidden"
                  target="_blank"
                  rel="noreferrer"
                  title={getHref(message?.fileURL.replace(/%2F/g, "%252F"))}
                  href={`https://im.flybird360.com:8013/onlinePreview?url=${encodeURIComponent(Base64.encode(`http://117.21.178.59:4000${message?.fileURL.replace(/%2F/g, "%252F")}`))}`}
                >
                  Download
                </a>
                <EyeIcon className="h-4 w-4" />
              </button>
              
            )}

            {(message?.text && message?.senderId === user?.uid && !message?.forwardId) && (
              <button
                type="button"
                className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                onClick={() => setEditMessage(message?.objectId)}
              >
                <span className="sr-only">Edit</span>
                <PencilIcon className="h-4 w-4" />
              </button>
            )}

            {message?.senderId === user?.uid && (
              <button
                type="button"
                className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                onClick={() => setOpen(true)}
              >
                <span className="sr-only">Delete</span>
                {loadingDelete ? (
                  <Spinner className="h-4 w-4 th-color-for" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              type="button"
              className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
              onClick={initializeSelect}
            >
              <span className="sr-only">Select</span>
              <CheckCircleIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
              onClick={showReply}
            >
              <span className="sr-only">Reply</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
              </svg>
            </button>

            <button
              type="button"
              className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
              onClick={showForward}
            >
              <span className="sr-only">Forward</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 th-color-for" fill="currentColor" viewBox="0 0 323.125 323.125">
                <path d="M319.516,145.044l-152.87-92.766c-2.315-1.407-5.21-1.453-7.569-0.124  c-2.361,1.329-3.821,3.827-3.821,6.536v43.082c-15.843,2.401-41.1,7.818-66.708,19.82C31.676,148.247,1.115,193.889,0.171,253.585  l-0.17,10.733c-0.033,2.081,0.8,4.082,2.301,5.525c1.401,1.347,3.265,2.094,5.198,2.094c0.137,0,0.275-0.004,0.413-0.011L24.723,271  c2.628-0.145,4.989-1.657,6.219-3.985l2.643-5.002c21.067-39.875,82.997-55.747,121.67-59.499v41.708  c0,2.709,1.46,5.207,3.821,6.536c2.359,1.328,5.253,1.281,7.569-0.124l152.87-92.766c2.241-1.359,3.609-3.79,3.609-6.412  C323.125,148.834,321.757,146.403,319.516,145.044z M182.868,166.778l-9.856-0.147c-0.513-0.007-1.047-0.012-1.611-0.012  c-25.95,0-79.28,7.039-121.178,31.644c11.29-18.526,28.926-33.521,52.695-44.752c34.699-16.395,70.419-18.619,70.746-18.638  l9.481-0.493c3.985-0.207,7.111-3.499,7.111-7.49v-19.346l72.361,43.911l-72.361,43.911v-21.088  C190.255,170.179,186.965,166.839,182.868,166.778z"/>
              </svg>
            </button>
            
            <button
              type="button"
              className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
              onClick={() => initializeEmail(message)}
            >
              <span className="sr-only">Forward</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 th-color-for" fill="currentColor" height="512" viewBox="0 0 512 512" width="512">
                <path d="m222.287 278.4 116.154-116.155a8 8 0 0 1 11.313 11.315l-116.154 116.153 85.551 185.36 163.395-445.619-445.619 163.394z"/>
                <path d="m96 424a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
                <path d="m32 400a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 0 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
                <path d="m120 488a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
              </svg>
            </button>

            {message?.fileURL && (
              <>
              {(message?.fileURL && message?.favorites.includes(user?.uid)) ? (
                <button
                  type="button"
                  className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                  onClick={removeFavorite}
                >
                  <span className="sr-only">Favorite</span>
                  <img className="h-4 w-4" alt="forward" src={`${process.env.PUBLIC_URL}/favorite_remove.png`} />
                </button>
                
              ) : (
                <button
                  type="button"
                  className="th-bg-bg th-border-for th-color-for relative inline-flex items-center px-3 py-1 border text-sm font-medium focus:z-10 focus:outline-none"
                  onClick={() => initializeFavorite(message)}
                >
                  <span className="sr-only">Favorite</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="th-color-for w-4 h-4" fill="currentColor">
                    <path d="M29,13a.71.71,0,0,0,0-.21c0-.06,0-.12-.05-.17s-.07-.1-.1-.15a.7.7,0,0,0-.13-.16l0,0L24,8.36V6a1,1,0,0,0-1-1H20L16.64,2.23a1,1,0,0,0-1.28,0L12,5H9A1,1,0,0,0,8,6V8.36L3.36,12.23l0,0a.7.7,0,0,0-.13.16c0,.05-.07.09-.1.15s0,.11-.05.17A.71.71,0,0,0,3,13s0,0,0,0V29a1,1,0,0,0,1,1H28a1,1,0,0,0,1-1V13S29,13,29,13Zm-3.75-1H24V11ZM16,4.3l.84.7H15.16ZM22,7v8.88l-6,3-6-3V7ZM8,12H6.76L8,11ZM27,28H5V14H8v1a1,1,0,0,0-.89.54,1,1,0,0,0,.44,1.34l8,4a1,1,0,0,0,.9,0l8-4a1,1,0,0,0,.44-1.34A1,1,0,0,0,24,15V14h3Z"/>
                    <path d="M18,25H8a1,1,0,0,0,0,2H18a1,1,0,0,0,0-2Z"/>
                    <circle cx="21" cy="26" r="1"/>
                    <circle cx="24" cy="26" r="1"/>
                    <polygon points="13.53 16.5 16 14.7 18.47 16.5 17.53 13.59 20 11.79 16.94 11.79 16 8.89 15.06 11.79 12 11.79 14.47 13.59 13.53 16.5"/>
                  </svg>
                </button>
                
              )}
              </>
            )}
          </div>
        )}
      </div>}
      </>
    ),
    [
      photoURL,
      fileURL,
      message,
      value?.objectId,
      value?.displayName,
      edit,
      loadingDelete,
      imageLoaded,
      displayProfilePicture,
      myReaction,
      forward,
      loading,
      forwardImageLoaded,
    ]
  );

  return (
    <>
    {message?.text.includes("[Jitsi_Call_Log:]:") ?
    <div className="w-full" id={message?.objectId}>
      {children}
      {messageRender}
    </div> :
    <div className="w-full first:mb-4 last:mt-4" id={message?.objectId}>
      {children}

      <MessageDiv
        theme={themeColors}
        className={classNames(
          edit ? "py-2" : "py-1",
          "px-5 w-full flex items-start relative"
        )}
        style={{
          backgroundColor: edit ? hexToRgbA(themeColors?.yellow, "0.7")! : "",
        }}
      >
        <div className="flex flex-col flex-1 w-full">
          {messageRender}
          {!edit && <Reactions groupedReactions={groupedReactions} />}
        </div>
      </MessageDiv>
      <DeleteConfirm open={open} setOpen={setOpen} deleteMessage={deleteMessage} />
    </div>
    }
    </>
  );
}
