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
import { useChannelById } from "hooks/useChannels";
import { useTranslation } from "react-i18next";


export default function MeetingModal() {
  const { t } = useTranslation();
  const { userdata } = useUser();
  const { workspaceId, channelId, dmId } = useParams();
  const jitsiContainerId = "jitsi-container-id";
  const {openMeetingModal, setOpenMeetingModal, setOpenCalling, setOpenReceiving, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, roomName, setRoomName, isVideoDisabled, setIsVideoDisabled, setIframeLoaded, enableMic, meetingMinimized, setMeetingMinimized} = useModal();
  const cancelButtonRef = useRef(null);
  const [jitsi, setJitsi] = useState({});
  const [meetStartTime, setMeetStartTime] = useState(new Date().getTime());
  const [meetEndTime, setMeetEndTime] = useState(new Date().getTime());
  const { value: users } = useContext(UsersContext);
  const { value } = useChannelById(channelId);

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
          'tileview',
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
        p2p: {
          enable: recipientInfo.length > 1 ? false : true,
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
      if (_jitsi.getNumberOfParticipants() < 2) {
        if (senderInfo?.objectId === userdata?.objectId) {
          sendCallMessage(startTime);
        }
        _jitsi.dispose();
        handleClose();
      }
    });
    
    _jitsi.addEventListener("videoConferenceLeft", (info: any) => {
      if (senderInfo?.objectId === userdata?.objectId) {
        sendCallMessage(startTime);
        _jitsi.dispose();
      }
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

  const handleMinimize = () => {
    setMeetingMinimized(true);
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
      handleClose();
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
        hidden={meetingMinimized}
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
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="th-bg-bg px-4 pt-2 pb-4 sm:p-2 sm:px-4 flex justify-between items-center">
                <h5 className="font-bold th-color-for">
                  {isVideoDisabled ? t("Voice_Call") : t("Video_Call")}
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
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 th-color-for" fill="currentColor" height="512" viewBox="0 0 24 24" width="512">
                                <path d="m6.19995 5.19994c0-1.74772 1.45228-3.2 3.2-3.2 1.38545 0 2.58515.91258 3.02305 2.16149.6247-.21454 1.2911-.33932 1.9837-.35895-.6168-2.18302-2.6378-3.80254104-5.00675-3.80254104-2.85229 0-5.2 2.34771104-5.2 5.20000104 0 1.49262.64293 2.84707 1.66464 3.79921-3.42456 1.41025-5.86459 4.79565-5.86459 8.70065 0 .5522.447715 1 1 1 .55228 0 1-.4478 1-1 0-3.5348 2.55653-6.5393 5.90017-7.244.00507-.79117.14733-1.54985.40418-2.25342-1.21954-.45401-2.1044-1.63823-2.1044-3.00244z"/>
                                <path d="m22 .999939c0-.552285-.4477-1.00000004-1-1.00000004s-1 .44771504-1 1.00000004v1.000001h-1c-.5523 0-1 .44771-1 1 0 .55228.4477 1 1 1h1v1c0 .55228.4477 1 1 1s1-.44772 1-1v-1h1c.5523 0 1-.44772 1-1 0-.55229-.4477-1-1-1h-1z"/>
                                <path clip-rule="evenodd" d="m18.0702 14.2729c1.0618-.9521 1.7298-2.3344 1.7298-3.8728 0-2.87184-2.3281-5.19997-5.2-5.19997-2.8718 0-5.19998 2.32813-5.19998 5.19997 0 1.5384.66798 2.9207 1.72978 3.8727-3.45878 1.394-5.92985 4.7975-5.92985 8.7272 0 .5523.44772 1 1 1 .55229 0 1-.4477 1-1 0-4.0394 3.33865-7.3863 7.37535-7.3999h.0247.0247c4.0366.0136 7.3753 3.3605 7.3753 7.3999 0 .5523.4477 1 1 1s1-.4477 1-1c0-3.9297-2.471-7.3332-5.9298-8.7271zm-3.4702-7.07277c-1.7673 0-3.2 1.4327-3.2 3.19997 0 1.76 1.4209 3.1882 3.1781 3.2l.0219-.0001c.0073 0 .0146 0 .0219.0001 1.7572-.0118 3.1781-1.4399 3.1781-3.2 0-1.76728-1.4327-3.19997-3.2-3.19997z" fill-rule="evenodd"/>
                              </svg>
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
                            <div className="overflow-y-auto h-48">
                              {users?.filter((u: any) => (value?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)).map((item: any, index: number) => (
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
                    onClick={handleMinimize}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 th-color-for" fill="currentColor" viewBox="0 0 90 90" width="90" height="90">
                      <path d="M15.5,65.5L0,80l10,10l14.5-15.5l10,10.5V55.5H5L15.5,65.5z M90,10L80,0L65.5,15.5L55.5,5v29.5H85   l-10.5-10L90,10z"/>
                    </svg>
                  </div>
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
              <div className="px-4 pb-5 pt-1 w-full h-[500px] max-h-[490px] overflow-y-auto border-t th-border-for">
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
