import {modalStyles} from '@/styles/styles';
import {Image, Modal, StyleSheet, View} from 'react-native';
import {
  Appbar,
  Colors,
  IconButton,
  List,
  Modal as RNPModal,
  Portal,
  ActivityIndicator,
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
import { WebViewModal } from 'react-native-webview-modal';

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
    iframeLoaded,
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
      console.log(startTime);
      sendCallMessage(startTime);
      await handleLeft();
    }
    handleClose();
  }

  const onConferenceJoined = () => {
    // setIframeLoaded(true);
    setStartTime(new Date().getTime());
  }

  const handleClose = () => {
    setSenderInfo(null);
    setRecipientInfo([]);
    setRoomName("");
    setIsVideoDisabled(false);
    setIframeLoaded(false);
    setOpenMeetingModal(false);
    setOpenCalling(false);
    setOpenReceiving(false);
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
  const sendCallMessage2 = async (type, startTime) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "${type}", "duration": "${startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId,
      workspaceId,
      chatType,
    });
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
    '&config.toolbarButtons=["microphone","tileview"]' : '&config.toolbarButtons=["microphone","camera","desktop","chat","raisehand","participants-pane","tileview","toggle-camera","profile","invite","videoquality","fullscreen","security","closedcaptions","recording","highlight","livestreaming","sharedvideo","shareaudio","noisesuppression","whiteboard","etherpad","select-background","undock-iframe","dock-iframe","settings","stats","shortcuts","embedmeeting","feedback","download","help","filmstrip"]';

  const handleStopButton = async () => {
    try {
      console.log(recipientInfo);
      await sendCallMessage2("Stopped Call", new Date());
      await postData('/send-message', {
        sender: userdata,
        receiver: recipientInfo,
        type: "Stop",
        room: "",
      });
      console.log('Message sent successfully');
      setOpenCalling(false);
      setRecipientInfo([]);
      setSenderInfo(null);
      setEnableMic(true);
      setRoomName("");
    } catch (err) {
      showAlert(err.message);
    }
  }

  const handleAcceptButton = async () => {
    try {
      await postData('/send-message', {
        sender: userdata,
        receiver: [senderInfo],
        type: "Accept",
        room: roomName,
        audioOnly: isVideoDisabled,
      });
      setOpenMeetingModal(true);
    } catch (err) {
      showAlert(err.message);
    }
  }
  const handleRejectButton = async () => {
    try {
      await postData('/send-message', {
        sender: userdata,
        receiver: [senderInfo],
        type: "Reject",
        room: "",
      });
      console.log('Message sent successfully');
      setOpenReceiving(false);
      setSenderInfo(null);
      setRecipientInfo([]);
      setRoomName("");
      setEnableMic(true);
      setIsVideoDisabled(false);
    } catch (error) {
      showAlert(err.message);
    }
  }

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

  React.useEffect(() => {
    if (openMeetingModal) {
      setIframeLoaded(true);
    }
  }, [openMeetingModal]);

  React.useEffect(() => {
    return () => setEnableMic(true);
  }, []);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={openCalling || openReceiving}
      onRequestClose={() => {}}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Appbar.Header
            statusBarHeight={0}
            style={{
              width: '100%',
              backgroundColor: Colors.grey900,
            }}>
            <Appbar.Action icon="window-close" onPress={onConferenceTerminated} />
            <Appbar.Content title="Web Meeting" />
            {/* {chatType === "Channel" && <Appbar.Action icon="account-group" onPress={() => setOpenAddModal(true)} />} */}
          </Appbar.Header>
          <View
            style={{
              display: 'flex', 
              // flexDirection: 'row',
              flexGrow: 1,
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: '50%',
              backgroundColor: Colors.grey900,
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: '90%',
              }}
            >
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
                renderLoading={() => (
                  <ActivityIndicator size={18} color={Colors.blue500} />
                )}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '0%',
                }}
              />
            </View>
            {/* <WebViewModal
              visible={openMeetingModal}
              source={{
                uri: `${env.MEETING_URL}/${roomName}#userInfo.displayName="${userdata?.displayName}"&config.prejoinConfig.enabled=false&config.startAudioOnly=${isVideoDisabled}&config.startWithAudioMuted=${!enableMic}&config.disableDeepLinking=true${toolbarButtons}`
              }}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
              }}
            /> */}
            {(openCalling && !openMeetingModal) && 
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '10%',
              }}
            >
              {iframeLoaded ? (
                <IconButton
                  icon="bell-off"
                  color={Colors.grey500}
                  size={32}
                  onPress={() => setIframeLoaded(false)}
                />
              ) : (
                <IconButton
                  icon="bell"
                  color={Colors.white}
                  size={32}
                  onPress={() => setIframeLoaded(true)}
                />
              )}
              {/* {enableMic ? (
                <IconButton
                  icon="microphone"
                  color={Colors.white}
                  size={32}
                  onPress={() => setEnableMic(false)}
                />
              ) : (
                <IconButton
                  icon="microphone-off"
                  color={Colors.grey500}
                  size={32}
                  onPress={() => setEnableMic(true)}
                />
              )} */}
              <IconButton
                icon="phone-hangup"
                color={Colors.red500}
                size={32}
                onPress={handleStopButton}
              />
            </View>}
            {(openReceiving && !openMeetingModal) &&
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '10%',
              }}
            >
              {iframeLoaded ? (
                <IconButton
                  icon="bell-off"
                  color={Colors.grey500}
                  size={32}
                  onPress={() => setIframeLoaded(false)}
                />
              ) : (
                <IconButton
                  icon="bell"
                  color={Colors.white}
                  size={32}
                  onPress={() => setIframeLoaded(true)}
                />
              )}
              {/* {enableMic ? (
                <IconButton
                  icon="microphone"
                  color={Colors.white}
                  size={32}
                  onPress={() => setEnableMic(false)}
                />
              ) : (
                <IconButton
                  icon="microphone-off"
                  color={Colors.grey500}
                  size={32}
                  onPress={() => setEnableMic(true)}
                />
              )} */}
              <IconButton
                icon="phone"
                color={Colors.green500}
                size={32}
                onPress={handleAcceptButton}
              />
              <IconButton
                icon="phone-hangup"
                color={Colors.red500}
                size={32}
                onPress={handleRejectButton}
              />
            </View>}
            {openMeetingModal &&
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '10%',
              }}
            >
              <IconButton
                icon="phone-hangup"
                color={Colors.white}
                size={32}
                style={{
                  borderRadius: 8,
                  backgroundColor: Colors.red500,
                }}
                onPress={onConferenceTerminated}
              />
            </View>}
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
