import { createContext, useContext, useState } from "react";

export const ModalContext = createContext({
  openCreateWorkspace: false,
  setOpenCreateWorkspace: null as any,

  openCreateChannel: false,
  setOpenCreateChannel: null as any,

  openEditPassword: false,
  setOpenEditPassword: null as any,

  openInviteTeammates: false,
  setOpenInviteTeammates: null as any,

  openPreferences: false,
  setOpenPreferences: null as any,

  openCreateMessage: false,
  setOpenCreateMessage: null as any,
  createMessageSection: "",
  setCreateMessageSection: null as any,

  openWorkspaceSettings: false,
  setOpenWorkspaceSettings: null as any,
  workspaceSettingsSection: "",
  setWorkspaceSettingsSection: null as any,
  openMailSender: false,
  setOpenMailSender: null as any,
  emailRecipient: "",
  setEmailRecipient: null as any,
  emailBody: "",
  setEmailBody: null as any,
  openFavorite: false,
  setOpenFavorite: null as any,
  fileURL: "",
  setFileURL: null as any,
  fileMessage: null as any,
  setFileMessage: null as any,
  openEditSchedule: false,
  setOpenEditSchedule: null as any,
  openPrivateFiles: false,
  setOpenPrivateFiles: null as any,
  checkedPrivateFiles: [] as any[],
  setCheckedPrivateFiles: null as any,
  openRecordingFiles: false,
  setOpenRecordingFiles: null as any,
  checkedRecordingFiles: [] as any,
  setCheckedRecordingFiles: null as any,
  openEditMeeting: false,
  setOpenEditMeeting: null as any,
  openEditLive: false,
  setOpenEditLive: null as any,
  uteamworkUserData: [] as any[],
  setUteamworkUserData: null as any,
  openEtherpad: false,
  setOpenEtherpad: null as any,
  etherpadLink: "",
  setEtherpadLink: null as any,
  
  openDeleteEvent: false,
  setOpenDeleteEvent: null as any,

  etherpadMinimized: false,
  setEtherpadMinimized: null as any,

  openDeletePad: false,
  setOpenDeletePad: null as any,
  checkedPads: [] as any[],
  setCheckedPads: null as any,
  currentPadName: "",
  setCurrentPadName: null as any,

  currentWorkspaceId: "",
  setCurrentWorkspaceId: null as any,

  openMeetingModal: false,
  setOpenMeetingModal: null as any,

  openCalling: false,
  setOpenCalling: null as any,
  recipientInfo: [] as any[],
  setRecipientInfo: null as any,

  openReceiving: false,
  setOpenReceiving: null as any,
  senderInfo: null as any,
  setSenderInfo: null as any,
  roomName: "",
  setRoomName: null as any,
  isVideoDisabled: false,
  setIsVideoDisabled: null as any,
  iframeLoaded: false,
  setIframeLoaded: null as any,
  enableMic: true,
  setEnableMic: null as any,
  meetingMinimized: false,
  setMeetingMinimized: null as any,
});

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openCreateWorkspace, setOpenCreateWorkspace] = useState(false);
  const [openCreateChannel, setOpenCreateChannel] = useState(false);
  const [openEditPassword, setOpenEditPassword] = useState(false);
  const [openInviteTeammates, setOpenInviteTeammates] = useState(false);
  const [openPreferences, setOpenPreferences] = useState(false);

  const [openCreateMessage, setOpenCreateMessage] = useState(false);
  const [createMessageSection, setCreateMessageSection] = useState<
    "channels" | "members"
  >("channels");

  const [openWorkspaceSettings, setOpenWorkspaceSettings] = useState(false);
  const [workspaceSettingsSection, setWorkspaceSettingsSection] = useState<
    "members" | "settings"
  >("members");
  const [openMailSender, setOpenMailSender] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [openFavorite, setOpenFavorite] = useState(false);
  const [fileURL, setFileURL] = useState("");
  const [fileMessage, setFileMessage] = useState<any>(null);
  const [openEditSchedule, setOpenEditSchedule] = useState(false);
  const [openPrivateFiles, setOpenPrivateFiles] = useState(false);
  const [openRecordingFiles, setOpenRecordingFiles] = useState(false);
  const [checkedPrivateFiles, setCheckedPrivateFiles] = useState<any[]>([]);
  const [checkedRecordingFiles, setCheckedRecordingFiles] = useState<any[]>([]);
  const [openEditMeeting, setOpenEditMeeting] = useState(false);
  const [openEditLive, setOpenEditLive] = useState(false);
  const [uteamworkUserData, setUteamworkUserData] = useState<any[]>([]);
  const [openEtherpad, setOpenEtherpad] = useState(false);
  const [etherpadLink, setEtherpadLink] = useState("");
  const [openDeleteEvent, setOpenDeleteEvent] = useState(false);
  const [etherpadMinimized, setEtherpadMinimized] = useState(false);
  const [openDeletePad, setOpenDeletePad] = useState(false);
  const [checkedPads, setCheckedPads] = useState<any[]>([]);
  const [currentPadName, setCurrentPadName] = useState("");
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState("");
  const [openMeetingModal, setOpenMeetingModal] = useState(false);
  const [openCalling, setOpenCalling] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<any[]>([]);
  const [openReceiving, setOpenReceiving] = useState(false);
  const [senderInfo, setSenderInfo] = useState<any>(null);
  const [roomName, setRoomName] = useState("");
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [enableMic, setEnableMic] = useState(true);
  const [meetingMinimized, setMeetingMinimized] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        openCreateWorkspace,
        setOpenCreateWorkspace,

        openCreateChannel,
        setOpenCreateChannel,

        openEditPassword,
        setOpenEditPassword,

        openInviteTeammates,
        setOpenInviteTeammates,

        openPreferences,
        setOpenPreferences,

        openCreateMessage,
        setOpenCreateMessage,
        createMessageSection,
        setCreateMessageSection,

        openWorkspaceSettings,
        setOpenWorkspaceSettings,
        workspaceSettingsSection,
        setWorkspaceSettingsSection,

        openMailSender,
        setOpenMailSender,

        emailRecipient,
        setEmailRecipient,
        emailBody,
        setEmailBody,

        openFavorite,
        setOpenFavorite,

        fileURL,
        setFileURL,

        fileMessage,
        setFileMessage,

        openEditSchedule,
        setOpenEditSchedule,

        openPrivateFiles,
        setOpenPrivateFiles,

        openRecordingFiles,
        setOpenRecordingFiles,

        checkedPrivateFiles,
        setCheckedPrivateFiles,

        checkedRecordingFiles,
        setCheckedRecordingFiles,

        openEditMeeting,
        setOpenEditMeeting,
        openEditLive,
        setOpenEditLive,

        uteamworkUserData,
        setUteamworkUserData,

        openEtherpad,
        setOpenEtherpad,
        etherpadLink,
        setEtherpadLink,

        openDeleteEvent,
        setOpenDeleteEvent,

        etherpadMinimized,
        setEtherpadMinimized,

        openDeletePad,
        setOpenDeletePad,
        checkedPads,
        setCheckedPads,
        currentPadName,
        setCurrentPadName,

        currentWorkspaceId,
        setCurrentWorkspaceId,

        openMeetingModal,
        setOpenMeetingModal,

        openCalling,
        setOpenCalling,
        recipientInfo,
        setRecipientInfo,

        openReceiving,
        setOpenReceiving,
        senderInfo,
        setSenderInfo,
        roomName,
        setRoomName,
        isVideoDisabled,
        setIsVideoDisabled,
        iframeLoaded,
        setIframeLoaded,
        enableMic,
        setEnableMic,
        meetingMinimized,
        setMeetingMinimized,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
