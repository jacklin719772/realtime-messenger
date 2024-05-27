import React, { createContext, useState } from "react";

export const MeetingContext = createContext({
  openMeetingModal: false,
  setOpenMeetingModal: () => {},

  openCalling: false,
  setOpenCalling: () => {},
  recipientInfo: [],
  setRecipientInfo: () => {},

  openReceiving: false,
  setOpenReceiving: () => {},
  senderInfo: null,
  setSenderInfo: () => {},
  roomName: "",
  setRoomName: () => {},
  isVideoDisabled: false,
  setIsVideoDisabled: () => {},
  iframeLoaded: false,
  setIframeLoaded: () => {},
  enableMic: true,
  setEnableMic: () => {},
  meetingMinimized: false,
  setMeetingMinimized: () => {},
});

export function useMeeting() {
  return React.useContext(MeetingContext);
}

export function MeetingProvider({children}) {
  const [openMeetingModal, setOpenMeetingModal] = useState(false);
  const [openCalling, setOpenCalling] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState([]);
  const [openReceiving, setOpenReceiving] = useState(false);
  const [senderInfo, setSenderInfo] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [isVideoDisabled, setIsVideoDisabled] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [enableMic, setEnableMic] = useState(true);
  const [meetingMinimized, setMeetingMinimized] = useState(false);

  return (
    <MeetingContext.Provider
      value={{
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
      }}>
      {children}
    </MeetingContext.Provider>
  );
}