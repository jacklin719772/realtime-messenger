import {modalStyles} from '@/styles/styles';
import {Image, Modal, StyleSheet, View} from 'react-native';
import {
  Appbar,
  Colors,
  IconButton,
  List,
  Modal as RNPModal,
  Portal,
} from 'react-native-paper';
import WebView from 'react-native-webview';
import {env} from "@/config/env";
// import JitsiMeet, { JitsiMeetView } from 'react-native-jitsi-meet';
// import JitsiMeet, { JitsiMeetView } from '@vidit-me/react-native-jitsi-meet';
import { useMeeting } from '@/contexts/MeetingContext';
import { getFileURL } from '@/lib/storage';
import React from 'react';
import {v4 as uuidv4} from 'uuid';
import { postData } from '@/lib/api-helpers';
import { useParams } from '@/contexts/ParamsContext';
import { showAlert } from '@/lib/alert';
import { useUser } from '@/contexts/UserContext';
import { io } from 'socket.io-client';
import { useChannelById } from '@/contexts/ChannelsContext';
import { useUsers } from '@/contexts/UsersContext';

export default function MeetingModal() {
  // console.log("JitsiMeet: ", JitsiMeet);
  // console.log("JitsiMeetView: ", JitsiMeetView);
  const {userdata, user} = useUser();
  const {chatId, chatType, workspaceId} = useParams(); 
  const {
    openMeetingModal,
    setOpenMeetingModal,
    openCalling,
    setOpenCalling,
    openReceiving,
    setOpenReceiving, 
    recipientInfo, 
    setRecipientInfo, 
    senderInfo, 
    setSenderInfo, 
    roomName, 
    setRoomName, 
    isVideoDisabled, 
    setIsVideoDisabled, 
    setIframeLoaded, 
    enableMic, 
    setEnableMic,
    meetingMinimized, 
    setMeetingMinimized,
  } = useMeeting();
  const [startTime, setStartTime] = React.useState(new Date().getTime());
  const [openAddModal, setOpenAddModal] = React.useState(false);

  const {value: users} = useUsers();
  const {value: channel} = useChannelById(chatId);
  const channelUsers = (chatType === "Channel" && users) ? users.filter((u) => (channel?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)) : [];

  const onConferenceTerminated = async () => {
    if (senderInfo?.objectId === userdata?.objectId) {
      sendCallMessage(startTime);
      await handleLeft();
    }
    handleClose();
  }

  const onConferenceJoined = () => {
    setIframeLoaded(true);
    setStartTime(new Date().getTime());
  }

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

  const sendCallMessage = async (startTime) => {
    try {
      const messageId = uuidv4();
      await postData("/messages", {
        objectId: messageId,
        text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "Call ended", "duration": "${new Date().getTime() - startTime}", "audioOnly": ${isVideoDisabled}}`,
        chatId,
        workspaceId,
        chatType,
      });
    } catch (err) {
      showAlert(err.message);
    }
  }

  const handleLeft = async () => {
    try {
      await postData('/send-message', {
        sender: userdata,
        receiver: recipientInfo,
        type: "participantLeft",
        room: roomName,
        audioOnly: isVideoDisabled,
      });
      showAlert('Message sent successfully');
    } catch (err) {
      showAlert(err.message);
    }
  }

  // const startJitsiAsNativeController = async () => {
  //   await JitsiMeet.launchJitsiMeetView({
  //     room: roomName,
  //     userInfo: {
  //       displayName: userdata?.displayName,
  //       email: userdata?.email,
  //     }
  //   });
  // }

  const toolbarButtons = isVideoDisabled ?
    '&config.toolbarButtons=["microphone","tileview","hangup"]' : '';

  React.useEffect(() => {
    const socket = io(env.API_URL);
    socket.on('newMessage', (data) => {
      const { message } = JSON.parse(data);
      const { receiver, type } = JSON.parse(message);
      console.log('1: ', receiver?.filter((r) => r?.objectId === user?.uid).length > 0);
      console.log('2: ', type);
      if (receiver?.filter((r) => r?.objectId === user?.uid).length > 0 && type === "participantLeft") {
        console.log('Meeting ended');
        onConferenceTerminated();
      }
    });
    return () => {
      socket.disconnect();
    }
  }, [user]);
  // React.useEffect(() => {
  //   setTimeout(() => {
  //     try {
  //       console.log(`${env.MEETING_URL}/${roomName}`);
  //       const url = `${env.MEETING_URL}/${roomName}`;
  //       const userInfo = {
  //         displayName: userdata?.displayName,
  //       };
  //       // const options = {
  //       //   audioMuted: !enableMic,
  //       //   audioOnly: isVideoDisabled,
  //       //   videoMuted: false,
  //       // }
  //       JitsiMeet.call(url, userInfo);
  //     } catch (err) {
  //       console.log(err.message);
  //       showAlert(err.message);
  //     }
  //   }, 2000);
  // }, []);

  // React.useEffect(() => {
  //   return () => {
  //     JitsiMeet.endCall();
  //     handleClose();
  //   }
  // }, []);
  React.useEffect(() => {
    return () => setEnableMic(true);
  }, []);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={openMeetingModal}
      onRequestClose={() => {}}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Appbar.Header
            statusBarHeight={0}
            style={{
              width: '100%',
              backgroundColor: '#fff',
            }}>
            <Appbar.Action icon="window-close" onPress={onConferenceTerminated} />
            <Appbar.Content title="Web Meeting" />
            {/* {chatType === "Channel" && <Appbar.Action icon="account-group" onPress={() => setOpenAddModal(true)} />} */}
          </Appbar.Header>
          <View
            style={{
              display: 'flex', 
              flexDirection: 'row',
              flexGrow: 1,
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: '50%',
            }}
          >
            {/* <JitsiMeetView
              options={{
                room: roomName,
                userInfo: {
                  displayName: userdata?.displayName,
                  email: userdata?.email,
                }
              }}
              onConferenceTerminated={e => onConferenceTerminated(e)}
              onConferenceJoined={e => onConferenceJoined(e)}
              style={{
                flex: 1,
                height: '100%',
                width: '100%',
              }}
            /> */}
            <WebView
              source={{
                uri: `${env.MEETING_URL}/${roomName}#userInfo.displayName="${userdata?.displayName}"&config.prejoinConfig.enabled=false&config.startAudioOnly=${isVideoDisabled}&config.startWithAudioMuted=${!enableMic}&config.disableDeepLinking=true${toolbarButtons}`
              }}
              onLoad={onConferenceJoined}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onError={(err) => {
                console.log(err)
              }}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
              }}
            />
          </View>
        </View>
        
        {chatType === "Channel" && (
        <Portal>
          <RNPModal
            visible={openAddModal}
            onDismiss={() => setOpenAddModal(false)}
            contentContainerStyle={styles.modalContainer}
            style={styles.modalWrapper}
          >
            <List.Section title="Members">
              {channelUsers.map(user => (
                <List.Item
                  key={user.objectId}
                  title={user.displayName}
                  titleStyle={{
                    color: Colors.grey800, 
                  }}
                  style={{
                    padding: 4,
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <Image
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 5,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          source={
                            user?.thumbnailURL
                              ? {uri: getFileURL(user?.thumbnailURL)}
                              : require('@/files/blank_user.png')
                          }
                        />
                      )}
                    />
                  )}
                  right={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <IconButton
                          icon="phone"
                          color={Colors.green400}
                          size={25}
                          onPress={() => {}}
                        />
                      )}
                    />
                  )}
                />
              ))}
            </List.Section>
          </RNPModal>
        </Portal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    width: '80%',
    margin: 'auto',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
  },
  modalWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
