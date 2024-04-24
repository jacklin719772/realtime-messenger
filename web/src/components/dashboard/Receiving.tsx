import { MicrophoneIcon, PhoneIcon } from '@heroicons/react/outline'
import axios from 'axios';
import { useModal } from 'contexts/ModalContext'
import { useUser } from 'contexts/UserContext';
import React, { useState } from 'react'
import { toast } from 'react-toastify';
import { getHref } from 'utils/get-file-url';

function Receiving() {
  const { userdata } = useUser();
  const { openReceiving, setOpenReceiving, senderInfo, recipientInfo, setRecipientInfo, setSenderInfo, roomName, setRoomName, isVideoDisabled, setIsVideoDisabled, setOpenMeetingModal, enableMic, setEnableMic, iframeLoaded, setIframeLoaded } = useModal();
  const handleAcceptButton = async () => {
    try {
      await axios.post('/send-message', {
        sender: recipientInfo,
        receiver: senderInfo,
        type: "Accept",
        room: roomName,
        audioOnly: isVideoDisabled,
      });
      // console.log('Message sent successfully');
      // setOpenReceiving(false);
      // setSenderInfo(null);
      // setRecipientInfo(null);
      // setRoomName("");
      // setIsVideoDisabled(false);
      // window.parent.postMessage({
      //   roomName,
      //   name: userdata.displayName,
      //   audioOnly: isVideoDisabled,
      // }, "*");
      window.parent.postMessage({
        acceptCall: true,
      }, "*");
      setOpenMeetingModal(true);
    } catch (error) {
      console.error('Error sending message', error);
    }
  }
  const handleStopButton = async () => {
    try {
      await axios.post('/send-message', {
        sender: recipientInfo,
        receiver: senderInfo,
        type: "Reject",
        room: "",
      });
      console.log('Message sent successfully');
      setOpenReceiving(false);
      setSenderInfo(null);
      setRecipientInfo(null);
      setRoomName("");
      setIsVideoDisabled(false);
    } catch (error) {
      console.error('Error sending message', error);
    }
  }

  return (
    <div className="absolute w-full h-full bg-transparent">
      <div className="absolute w-1/3 m-auto inset-0 th-bg-for h-32 p-4 flex items-center" hidden={!openReceiving}>
        <div className="w-full flex flex-col justify-center space-y-4">
          <div className="flex items-center space-x-4">
            <img src={getHref(senderInfo?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} className="w-10 h-10" alt={senderInfo?.displayName} />
            <div className="flex flex-col">
              <div className="font-bold text-base text-white">{senderInfo?.displayName}</div>
              <div className="w-full text-xs text-white">Inviting you to a  {isVideoDisabled ? "Voice" : "Video"}  call...</div>
            </div>
          </div>
          <div className="w-full flex justify-end space-x-4">
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={!iframeLoaded} onClick={() => setIframeLoaded(false)}>
              <img src={`${process.env.PUBLIC_URL}/tone_on.png`} className="h-10 w-10" alt="mic_off" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={iframeLoaded} onClick={() => setIframeLoaded(true)}>
              <img src={`${process.env.PUBLIC_URL}/tone_off.png`} className="h-10 w-10" alt="mic_on" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={!enableMic} onClick={() => setEnableMic(false)}>
              <img src={`${process.env.PUBLIC_URL}/mic_on.png`} className="h-10 w-10" alt="mic_off" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={enableMic} onClick={() => setEnableMic(true)}>
              <img src={`${process.env.PUBLIC_URL}/mic_off.png`} className="h-10 w-10" alt="mic_on" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" onClick={handleAcceptButton}>
              <img src={`${process.env.PUBLIC_URL}/call_start.png`} className="h-10 w-10" alt="mic_on" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" onClick={handleStopButton}>
              <img src={`${process.env.PUBLIC_URL}/call_stop.png`} className="h-10 w-10" alt="mic_on" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Receiving
