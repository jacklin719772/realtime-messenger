import { Dialog, Menu, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import { useModal } from "contexts/ModalContext";
import { useUser } from "contexts/UserContext";
import { UsersContext } from "contexts/UsersContext";
import { Fragment,  useContext,  useEffect,  useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import { getHref } from "utils/get-file-url";
import { v4 as uuidv4 } from "uuid";
import axios from 'axios';


export default function MeetingModal() {
  const { userdata } = useUser();
  const { workspaceId, channelId, dmId } = useParams();
  const jitsiContainerId = "jitsi-container-id";
  const {openMeetingModal, setOpenMeetingModal, setOpenCalling, setOpenReceiving, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, roomName, setRoomName, isVideoDisabled, setIsVideoDisabled, setIframeLoaded, enableMic} = useModal();
  const cancelButtonRef = useRef(null);
  const [jitsi, setJitsi] = useState({});
  const [meetStartTime, setMeetStartTime] = useState(new Date().getTime());
  const [meetEndTime, setMeetEndTime] = useState(new Date().getTime());
  const { value: users } = useContext(UsersContext);

  const loadJitsiScript = () => {
    let resolveLoadJitsiScriptPromise = null;

    const loadJitsiScriptPromise = new Promise((resolve) => {
      resolveLoadJitsiScriptPromise = resolve;
    });

    console.log(document);
    const script = document.createElement("script");
    script.src = "https://meeting.uteamwork.com/external_api.js";
    script.async = true;
    script.onload = resolveLoadJitsiScriptPromise
    document.body.appendChild(script);

    return loadJitsiScriptPromise;
  };

  const initialiseJitsi = async () => {
    if (!window.JitsiMeetExternalAPI) {
      await loadJitsiScript();
    }
    let startTime: number, endTime: number;
    const _jitsi = new window.JitsiMeetExternalAPI("meeting.uteamwork.com", {
      parentNode: document.getElementById(jitsiContainerId),
      roomName,
      configOverwrite: {
        defaultLogoUrl: '',
        hideLogo: true,
        logoClickUrl: 'https://meeting.uteamwork.com',
        logoImageUrl: '',
        startAudioOnly: isVideoDisabled,
        toolbarButtons: isVideoDisabled ? [
          'hangup',
          'microphone',
        ] : [
          'camera',
          'chat',
          'closedcaptions',
          'desktop',
          'download',
          'embedmeeting',
          'etherpad',
          'feedback',
          'filmstrip',
          'fullscreen',
          'hangup',
          'help',
          'highlight',
          'invite',
          'linktosalesforce',
          'livestreaming',
          'microphone',
          'noisesuppression',
          'participants-pane',
          'profile',
          'raisehand',
          'recording',
          'security',
          'select-background',
          'settings',
          'shareaudio',
          'sharedvideo',
          'shortcuts',
          'stats',
          'tileview',
          'toggle-camera',
          'videoquality',
          'whiteboard',
        ],
        prejoinConfig: {
          enabled: false,
        },
        welcomePage: {
          disabled: false,
        },
        startWithAudioMuted: !enableMic,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        APP_NAME: 'Uteamwork Meeting',
        DEFAULT_LOGO_URL: '',
        DEFAULT_WELCOME_PAGE_LOGO_URL: '',
        HIDE_DEEP_LINKING_LOGO: true,
        JITSI_WATERMARK_LINK: '',
        PROVIDER_NAME: 'Uteamwork',
        SHOW_JITSI_WATERMARK: false,
      },
      userInfo: {
        displayName: userdata?.displayName,
      },
      onload: () => {
        setIframeLoaded(true);
      },
    });

    _jitsi.addEventListener("videoConferenceJoined", (info: any) => {
      startTime = new Date().getTime();
    });
    
    _jitsi.addEventListener("participantLeft", (info: any) => {
      if (dmId && senderInfo?.objectId === userdata?.objectId) {
        sendCallMessage(startTime);
      }
      _jitsi.dispose();
      handleClose();
    });
    
    _jitsi.addEventListener("videoConferenceLeft", (info: any) => {
      if (dmId && senderInfo?.objectId === userdata?.objectId) {
        sendCallMessage(startTime);
      }
      _jitsi.dispose();
      handleClose();
    });

    setJitsi(_jitsi)
  };

  const handleClose = () => {
    setOpenMeetingModal(false);
    setOpenCalling(false);
    setOpenReceiving(false);
    setSenderInfo(null);
    setRecipientInfo([]);
    setRoomName("");
    setIsVideoDisabled(false);
    setIframeLoaded(false);
  }

  const sendCallMessage = async (startTime: number) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "Call ended", "duration": "${new Date().getTime() - startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId: channelId || dmId,
      workspaceId,
      chatType: channelId ? "Channel" : "Direct",
    });
  }

  const handleCallingButton = async (user: any) => {
    try {
      await axios.post('/send-message', {
        sender: userdata,
        receiver: [user],
        type: "Calling",
        room: roomName,
        audioOnly: isVideoDisabled,
      });
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message', error);
    }
  }

  useEffect(() => {
    initialiseJitsi();

    return () => {
      jitsi?.dispose?.();
      setIframeLoaded(false);
    }
  }, []);

  return (
    <>
    <Transition.Root show={openMeetingModal} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openMeetingModal}
        onClose={() => {}}
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
            <div className="th-bg-bg inline-block align-bottom rounded-lg th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="th-bg-bg px-4 pt-2 pb-4 sm:p-2 sm:px-4 flex justify-between items-center">
                <h5 className="font-bold th-color-for">
                  {isVideoDisabled ? "Voice Call" : "Video Call"}
                </h5>
                <div className="flex items-center space-x-4">
                  {channelId && (
                  <Menu as="div" className="relative">
                    {({ open }) => (
                      <>
                        <div>
                          <Menu.Button
                            as="div"
                            className="relative"
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              className="cursor-pointer focus:outline-none"
                              onClick={() => {}}
                            >
                              <img src={`${process.env.PUBLIC_URL}/add_meet_member.png`} className="h-5 w-5" alt="add_participant" />
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
                            className="th-bg-bg border th-border-for origin-top-right z-20 absolute right-0 mt-2 w-40 h-64  rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                          >
                            <div className="px-5 flex items-center justify-between">
                              <div className="text-base th-color-for">Users</div>
                            </div>
                            <div className="w-full h-px th-bg-for" />
                            <div className="overflow-y-auto h-56">
                              {users.filter((u: any) => (!recipientInfo.includes(u) && u.objectId !== senderInfo && u.objectId !== userdata.objectId)).map((item: any, index: number) => (
                                <div className="flex justify-between items-center px-2 py-1 th-bg-bg th-color-for border-b th-border-for hover:bg-gray-500 w-full" key={index}>
                                  <div className="flex items-center space-x-2">
                                    <img src={getHref(item.thumbnailURL) || getHref(item.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} alt={item.displayName} className="w-6" />
                                    <div className="font-bold text-sm">{item.displayName}</div>
                                  </div>
                                  <button className="rounded-full bg-transparent th-color-brwhite" onClick={() => {handleCallingButton(item)}}>
                                    <img src={`${process.env.PUBLIC_URL}/call_start.png`} className="h-5 w-5" alt="mic_on" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </Menu.Items>
                        </Transition>
                      </>
                    )}
                  </Menu>
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none"
                    onClick={handleClose}
                  >
                    <XIcon className="h-5 w-5 th-color-for" />
                  </div>
                </div>
              </div>
              <div className="px-4 pb-5 pt-1 w-full h-[500px] max-h-[490px] overflow-y-auto">
                <div className="w-full h-full relative">
                  {/* <iframe src="https://meeting.uteamwork.com/" allow="microphone *; camera *; display-capture *" className="w-full h-full" /> */}
                  <div id={jitsiContainerId} className="w-full h-full" />
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
    </>
  );
}
