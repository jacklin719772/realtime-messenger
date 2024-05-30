import { env } from '@/config/env';
import {useAuth} from '@/contexts/AuthContext';
import { useChannelById } from '@/contexts/ChannelsContext';
import { useMeeting } from '@/contexts/MeetingContext';
import {useModal} from '@/contexts/ModalContext';
import {useParams} from '@/contexts/ParamsContext';
import {useUser} from '@/contexts/UserContext';
import {useMyWorkspaces} from '@/contexts/WorkspacesContext';
import { showAlert } from '@/lib/alert';
import {postData} from '@/lib/api-helpers';
import {globalStyles} from '@/styles/styles';
import ChannelBrowserModal from '@/views/modals/ChannelBrowser';
import MemberBrowserModal from '@/views/modals/MemberBrowser';
import Preferences from '@/views/modals/Preferences';
import SearchModal from '@/views/modals/Search';
import WorkspaceBrowserModal from '@/views/modals/WorkspaceBrowser';
import Workspace from '@/views/Workspace';
import Feather from '@expo/vector-icons/Feather';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import * as Application from 'expo-application';
import React, { useState } from 'react';
import {ActivityIndicator, Image, SafeAreaView, View} from 'react-native';
import {Colors, Dialog, Divider, IconButton, Portal, Text, TouchableRipple} from 'react-native-paper';
import { io } from 'socket.io-client';
import {v4 as uuidv4} from 'uuid';
import MeetingModal from './modals/Meeting';
import { Audio } from 'expo-av';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useMessages } from '@/hooks/useMessages';
import { useKeepAwake } from 'expo-keep-awake';

const DrawerNav = createDrawerNavigator();

function CustomDrawerContent(props) {
  const {value} = useMyWorkspaces();
  const {setOpenPreferences, setOpenWorkspaceBrowser} = useModal();
  const {logout} = useAuth();
  const {workspaceId} = useParams();
  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView {...props}>
        <Text
          style={{
            fontWeight: 'bold',
            paddingHorizontal: 20,
            paddingVertical: 10,
            fontSize: 20,
          }}>
          Workspaces
        </Text>

        <View>
          {value.map(workspace => (
            <TouchableRipple
              style={{paddingHorizontal: 20, paddingVertical: 10}}
              onPress={() =>
                props.navigation.navigate('Workspace', {
                  objectId: workspace.objectId,
                })
              }
              key={workspace.objectId}>
              <View style={[globalStyles.alignStart]}>
                <Image
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    ...(workspaceId === workspace.objectId && {
                      borderWidth: 2,
                      borderColor: Colors.black,
                    }),
                  }}
                  source={
                    workspace.thumbnailURL
                      ? {uri: workspace.thumbnailURL}
                      : require('@/files/blank_workspace.png')
                  }
                />
                <Text
                  style={{
                    paddingHorizontal: 10,
                    fontWeight: 'bold',
                    fontSize: 15,
                  }}>
                  {workspace.name}
                </Text>
              </View>
            </TouchableRipple>
          ))}
        </View>

        <Divider style={{marginVertical: 5}} />

        <TouchableRipple
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          onPress={() => setOpenWorkspaceBrowser(true)}>
          <View style={globalStyles.alignStart}>
            <Feather name="plus-circle" color={Colors.grey800} size={18} />
            <Text style={{paddingHorizontal: 10}}>Add a workspace</Text>
          </View>
        </TouchableRipple>

        <TouchableRipple
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          onPress={() => setOpenPreferences(true)}>
          <View style={globalStyles.alignStart}>
            <Feather name="settings" color={Colors.grey800} size={18} />
            <Text style={{paddingHorizontal: 10}}>Preferences</Text>
          </View>
        </TouchableRipple>

        <TouchableRipple
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          onPress={() => logout()}>
          <View style={globalStyles.alignStart}>
            <Feather name="log-out" color={Colors.grey800} size={18} />
            <Text style={{paddingHorizontal: 10}}>Log out</Text>
          </View>
        </TouchableRipple>
        <Text
          style={{
            paddingHorizontal: 20,
            paddingVertical: 30,
            color: Colors.grey500,
          }}>
          App version: {Application.nativeApplicationVersion}
        </Text>
      </DrawerContentScrollView>
    </View>
  );
}

export default function Main() {
  useKeepAwake();
  const {chatId, chatType, workspaceId} = useParams();
  const {userdata} = useUser();
  const {value, loading} = useMyWorkspaces();
  const {value: channel} = useChannelById(chatId);
  const {
    openMemberBrowser,
    openSearch,
    openPreferences,
    openChannelBrowser,
    openWorkspaceBrowser,
  } = useModal();
  const {
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
    openMeetingModal,
    setOpenMeetingModal,
    enableMic, 
    setEnableMic, 
    iframeLoaded, 
    setIframeLoaded, 
    meetingMinimized,
  } = useMeeting();
  const {user} = useUser();
  const { messageSent, setMessageSent } = useMessageFeature();
  const { messageArrived, setMessageArrived } = useMessages(workspaceId);
  const [sound, setSound] = useState(null);
  const [status, setStatus] = useState(null);
  const [soundSend, setSoundSend] = useState(null);
  const [soundArrive, setSoundArrive] = useState(null);

  const loadSound = async () => {
    try {
      const {sound: soundSource} = await Audio.Sound.createAsync(require('@/files/ringtone.mp3'));
      soundSource.setIsLoopingAsync(true);
      setSound(soundSource);
    } catch (err) {
      console.log(err.message);
    }
  }

  const loadSoundSend = async () => {
    try {
      const {sound: soundSendSource} = await Audio.Sound.createAsync(require('@/files/sendnewmessage.mp3'));
      // soundSendSource.setIsLoopingAsync(true);
      setSoundSend(soundSendSource);
    } catch (err) {
      console.log(err.message);
    }
  }

  const loadSoundArrive = async () => {
    try {
      const {sound: soundArriveSource} = await Audio.Sound.createAsync(require('@/files/receivednewmessage.mp3'));
      // soundArriveSource.setIsLoopingAsync(true);
      setSoundArrive(soundArriveSource);
    } catch (err) {
      console.log(err.message);
    }
  }

  const unloadSound = () => {
    setSound(null);
    setStatus(null);
    sound.unloadAsync();
    soundSend.unloadAsync();
    soundArrive.unloadAsync();
  }

  const pauseSound = async () => {
    await sound.pauseAsync();
  }

  const playSound = async () => {
    await sound.playAsync();
    sound
  }

  const pauseSoundSend = async () => {
    await soundSend.pauseAsync();
    await soundSend.setPositionAsync(0);
  }

  const playSoundSend = async () => {
    await soundSend.playAsync();
  }

  const pauseSoundArrive = async () => {
    await soundArrive.pauseAsync();
    await soundArrive.setPositionAsync(0);
  }

  const playSoundArrive = async () => {
    await soundArrive.playAsync();
  }

  // MEETING ------------------------------------------
  const sendCallMessage = async (type, startTime) => {
    const messageId = uuidv4();
    await postData("/messages", {
      objectId: messageId,
      text: `[Jitsi_Call_Log:]: {"sender": ${JSON.stringify(senderInfo)}, "receiver": ${JSON.stringify(recipientInfo)}, "type": "${type}", "duration": "${startTime}", "audioOnly": ${isVideoDisabled}}`,
      chatId,
      workspaceId,
      chatType,
    });
  }

  const handleStopButton = async () => {
    try {
      await sendCallMessage("Stopped Call", new Date());
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
      setIsVideoDisabled(false);
    } catch (error) {
      showAlert(err.message);
    }
  }

  React.useEffect(() => {
    loadSound();
    loadSoundSend();
    loadSoundArrive();
    return sound
      ? () => {
          unloadSound();
        }
      : undefined;
  }, []);

  React.useEffect(() => {
    if ((openCalling || openReceiving) && !iframeLoaded) {
      if (sound) {
        playSound();
      }
      // SoundPlayer.playUrl(`${env.API_URL}/ringtone.mp3`);
    } else {
      if (sound) {
        pauseSound();
      }
      // SoundPlayer.pause();
    }
  }, [openCalling, openReceiving, iframeLoaded]);

  React.useEffect(() => {
    let timer1;
    let timer2;
    if (messageSent) {
      console.log('Message Sent');
      playSoundSend();
      console.log('f: ', new Date().toISOString());
      timer1 = setTimeout(() => {
        setMessageSent(false);
        console.log('s: ', new Date().toISOString());
      }, 1200);
    } else {
      if (soundSend) {
        pauseSoundSend();
      }
      clearTimeout(timer1);
    }
    if (messageArrived) {
      console.log('Message Arrived');
      playSoundArrive();
      console.log('f: ', new Date().toISOString());
      timer2 = setTimeout(() => {
        setMessageArrived(false);
        console.log('s: ', new Date().toISOString());
      }, 1200);
    } else {
      if (soundArrive) {
        pauseSoundArrive();
      }
      clearTimeout(timer2);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  }, [messageSent, messageArrived, soundSend, soundArrive]);

  React.useEffect(() => {
    const socket = io(env.API_URL);
    socket.on('newMessage', (data) => {
      const { message } = JSON.parse(data);
      const { receiver, sender, type, room, audioOnly } = JSON.parse(message);
      console.log(JSON.parse(message));
      console.log(receiver);
      console.log(user);
      console.log('openCalling: ', openCalling);
      console.log('openReceiving: ', openReceiving);
      if (receiver?.filter((r) => r?.objectId === user?.uid).length > 0 && !openCalling && type === "Calling" && !openReceiving) {
        setOpenReceiving(true);
        setSenderInfo(sender);
        setRecipientInfo(receiver);
        setRoomName(room);
        setIsVideoDisabled(audioOnly);
      }
      if (receiver?.filter((r) => r?.objectId === user?.uid).length > 0 && !openCalling && type === "Timeout" && openReceiving) {
        // sendCallMessage("Missed Call", new Date());
        setOpenReceiving(false);
        setSenderInfo(null);
        setRecipientInfo([]);
        setRoomName("");
        setIsVideoDisabled(false);
        showAlert('Sorry, but this call timed out.');
      }
      if (receiver?.filter((r) => r?.objectId === user?.uid).length > 0 && !openCalling && type === "Stop" && openReceiving) {
        setOpenReceiving(false);
        setSenderInfo(null);
        setRecipientInfo([]);
        setRoomName("");
        setIsVideoDisabled(false);
        showAlert('The caller has interrupted the call.');
      }
      if (receiver?.filter((r) => r?.objectId === user?.uid).length > 0 && openCalling && type === "Reject" && !openReceiving) {
        setRecipientInfo(recipientInfo.filter((u) => u?.objectId !== sender?.objectId));
        if (recipientInfo.length < 2) {
          sendCallMessage("Refused Call", new Date(), sender);
          setOpenCalling(false);
          setSenderInfo(null);
          setRoomName("");
          setIsVideoDisabled(false);
          showAlert('The recipient has declined the call.');
        }
      }
      if (receiver?.filter((r) => r?.objectId === user?.uid).length > 0 && openCalling && type === "Accept" && !openReceiving) {
        setOpenMeetingModal(true);
        showAlert('The recipient has accepted the call.');
      }
    });
    return () => {
      socket.disconnect();
    }
  }, [openCalling, openReceiving, roomName, recipientInfo, isVideoDisabled]);

  // MANAGE THE PRESENCE OF THE USER -------------------------------------
  React.useEffect(() => {
    if (user?.uid) {
      postData(`/users/${user?.uid}/presence`, {}, {}, false);
      const intervalId = setInterval(() => {
        postData(`/users/${user?.uid}/presence`, {}, {}, false);
      }, 30000);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user?.uid]);
  // ---------------------------------------------------------------------

  if (loading || value.length === 0) return <ActivityIndicator />;

  return (
    <SafeAreaView style={{flex: 1}}>
      <DrawerNav.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}>
        {/* SCREENS */}
        <DrawerNav.Screen
          name="Workspace"
          component={Workspace}
          initialParams={{objectId: value[0].objectId}}
          options={{
            headerShown: false,
            swipeEnabled: false,
          }}
        />
      </DrawerNav.Navigator>

      {/* MODALS */}
      {openPreferences && <Preferences />}
      {openSearch && <SearchModal />}
      {openMemberBrowser && <MemberBrowserModal />}
      {openChannelBrowser && <ChannelBrowserModal />}
      {openWorkspaceBrowser && <WorkspaceBrowserModal />}
      {openMeetingModal && <MeetingModal />}
      {openCalling && (
        <Portal>
          {chatType === "Channel" && (
            <Dialog
              visible={openCalling}
              onDismiss={() => {}}
              style={{
                borderRadius: 16,
              }}
            >
              <Dialog.Title>{isVideoDisabled ? `${channel?.name} Voice Call` : `${channel?.name} Video Call`}</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium">Waiting for invitees to accept the invitation</Text>
              </Dialog.Content>
              <Dialog.Actions>
                {iframeLoaded ? (
                  <IconButton
                    icon="bell-off"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setIframeLoaded(false)}
                  />
                ) : (
                  <IconButton
                    icon="bell"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setIframeLoaded(true)}
                  />
                )}
                {enableMic ? (
                  <IconButton
                    icon="microphone-off"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setEnableMic(false)}
                  />
                ) : (
                  <IconButton
                    icon="microphone"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setEnableMic(true)}
                  />
                )}
                <IconButton
                  icon="phone-hangup"
                  color={Colors.red500}
                  size={25}
                  onPress={handleStopButton}
                />
              </Dialog.Actions>
            </Dialog>
          )}
          {chatType === "Direct" && (
            <Dialog
              visible={openCalling}
              onDismiss={() => {}}
              style={{
                borderRadius: 16,
              }}
            >
              <Dialog.Title>{recipientInfo[0]?.displayName}</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium">Waiting for {recipientInfo[0]?.displayName} to accept the invitation</Text>
              </Dialog.Content>
              <Dialog.Actions>
                {iframeLoaded ? (
                  <IconButton
                    icon="bell-off"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setIframeLoaded(false)}
                  />
                ) : (
                  <IconButton
                    icon="bell"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setIframeLoaded(true)}
                  />
                )}
                {enableMic ? (
                  <IconButton
                    icon="microphone-off"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setEnableMic(false)}
                  />
                ) : (
                  <IconButton
                    icon="microphone"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => setEnableMic(true)}
                  />
                )}
                <IconButton
                  icon="phone-hangup"
                  color={Colors.red500}
                  size={25}
                  onPress={handleStopButton}
                />
              </Dialog.Actions>
            </Dialog>
          )}
        </Portal>
      )}
      {openReceiving && (
        <Portal>
          <Dialog
            visible={openReceiving}
            onDismiss={() => {}}
            style={{
              borderRadius: 16,
            }}
          >
            <Dialog.Title>{senderInfo?.displayName}</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">{isVideoDisabled ? "Inviting you to a voice call" : "Inviting you to a video call"}...</Text>
            </Dialog.Content>
            <Dialog.Actions>
              {iframeLoaded ? (
                <IconButton
                  icon="bell-off"
                  color={Colors.grey800}
                  size={25}
                  onPress={() => setIframeLoaded(false)}
                />
              ) : (
                <IconButton
                  icon="bell"
                  color={Colors.grey800}
                  size={25}
                  onPress={() => setIframeLoaded(true)}
                />
              )}
              {enableMic ? (
                <IconButton
                  icon="microphone-off"
                  color={Colors.grey800}
                  size={25}
                  onPress={() => setEnableMic(false)}
                />
              ) : (
                <IconButton
                  icon="microphone"
                  color={Colors.grey800}
                  size={25}
                  onPress={() => setEnableMic(true)}
                />
              )}
              <IconButton
                icon="phone"
                color={Colors.green500}
                size={25}
                onPress={handleAcceptButton}
              />
              <IconButton
                icon="phone-hangup"
                color={Colors.red500}
                size={25}
                onPress={handleRejectButton}
              />
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </SafeAreaView>
  );
}
