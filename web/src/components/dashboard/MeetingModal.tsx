import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import { useModal } from "contexts/ModalContext";
import { useUser } from "contexts/UserContext";
import { Fragment,  useEffect,  useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import { v4 as uuidv4 } from "uuid";


export default function MeetingModal() {
  const { userdata } = useUser();
  const { workspaceId, channelId, dmId } = useParams();
  const jitsiContainerId = "jitsi-container-id";
  const {openMeetingModal, setOpenMeetingModal, setOpenCalling, setOpenReceiving, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, roomName, setRoomName, isVideoDisabled, setIsVideoDisabled, setIframeLoaded, enableMic} = useModal();
  const cancelButtonRef = useRef(null);
  const [jitsi, setJitsi] = useState({});
  const [meetStartTime, setMeetStartTime] = useState(new Date().getTime());
  const [meetEndTime, setMeetEndTime] = useState(new Date().getTime());

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
    setRecipientInfo(null);
    setRoomName("");
    setIsVideoDisabled(false);
    setIframeLoaded(false);
  }

  const sendCallMessage = async (startTime: number) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "Call ended", "duration": "${new Date().getTime() - startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId: dmId,
      workspaceId,
      chatType: "Direct",
    });
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
            <div className="th-bg-bg inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="th-bg-bg px-4 pt-2 pb-4 sm:p-2 sm:px-4 flex justify-between items-center">
                <h5 className="font-bold th-color-for">
                  Web Meeting
                </h5>
                <div className="flex items-center">
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
