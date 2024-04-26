import { MicrophoneIcon, PhoneIcon } from '@heroicons/react/outline'
import axios from 'axios';
import { useModal } from 'contexts/ModalContext'
import { useUser } from 'contexts/UserContext';
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { postData } from 'utils/api-helpers';
import { getHref } from 'utils/get-file-url';
import { v4 as uuidv4 } from "uuid";

function Calling() {
  const { userdata } = useUser();
  const { workspaceId, channelId, dmId } = useParams();
  const { openCalling, setOpenCalling, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, setRoomName, isVideoDisabled, enableMic, setEnableMic, iframeLoaded, setIframeLoaded } = useModal();
  
  const sendCallMessage = async (type: string, startTime: Date) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "${type}", "duration": "${startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId: channelId || dmId,
      workspaceId,
      chatType: channelId ? "Channel" : "Direct",
    });
  }

  const handleStopButton = async () => {
    try {
      await sendCallMessage("Stopped Call", new Date());
      await axios.post('/send-message', {
        sender: userdata,
        receiver: [recipientInfo],
        type: "Stop",
        room: "",
      });
      console.log('Message sent successfully');
      setOpenCalling(false);
      setRecipientInfo([]);
      setSenderInfo(null);
      setRoomName("");
    } catch (error) {
      console.error('Error sending message', error);
    }
  }

  useEffect(() => {
    setEnableMic(true);
    setIframeLoaded(false);
    console.log(recipientInfo);
  }, []);

  return (
    <div className="absolute w-full h-full bg-transparent">
      <div className="absolute w-96 m-auto inset-0 th-bg-bgdark h-40 p-4 flex items-center rounded-xl border th-border-for" hidden={!openCalling}>
        <div className="w-full flex flex-col justify-center space-y-4">
          <div className="flex items-center space-x-4">
            <img src={getHref(recipientInfo[0]?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} className="w-10 h-10" alt={recipientInfo[0]?.displayName} />
            <div className="flex flex-col">
              <div className="font-bold text-base th-color-for">{recipientInfo[0]?.displayName}</div>
              <div className="w-full text-xs th-color-for">Waiting for  {recipientInfo[0]?.displayName}  to accept the invitation...</div>
            </div>
          </div>
          <div className="w-full flex justify-end space-x-4">
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={!iframeLoaded} onClick={() => setIframeLoaded(false)}>
              <img src={`${process.env.PUBLIC_URL}/tone_off.png`} className="h-10 w-10" alt="mic_off" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={iframeLoaded} onClick={() => setIframeLoaded(true)}>
              <img src={`${process.env.PUBLIC_URL}/tone_on.png`} className="h-10 w-10" alt="mic_on" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={!enableMic} onClick={() => setEnableMic(false)}>
              <img src={`${process.env.PUBLIC_URL}/mic_on.png`} className="h-10 w-10" alt="mic_off" />
            </button>
            <button className="rounded-full bg-transparent th-color-brwhite" hidden={enableMic} onClick={() => setEnableMic(true)}>
              <img src={`${process.env.PUBLIC_URL}/mic_off.png`} className="h-10 w-10" alt="mic_on" />
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

export default Calling
