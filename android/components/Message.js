import {env} from '@/config/env';
import {useUser} from '@/contexts/UserContext';
import {useUserById} from '@/contexts/UsersContext';
import {convertMsToTime, getFileSize, getFormattedTime} from '@/lib/convert';
import {removeHtml} from '@/lib/removeHtml';
import {getFileURL} from '@/lib/storage';
import {cacheThumbnails} from '@/lib/thumbnails';
import FullScreenPictureModal from '@/views/modals/FullScreenPicture';
import VideoModal from '@/views/modals/Video';
import { useActionSheet } from '@expo/react-native-action-sheet';
import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import {Audio} from 'expo-av';
import React, { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ActivityIndicator, Button, Checkbox, Colors, Dialog, IconButton, List, Modal, Portal, ProgressBar} from 'react-native-paper';
import icon from './icon';
import { deleteData, postData } from '@/lib/api-helpers';
import { showAlert } from '@/lib/alert';
import { useModal } from '@/contexts/ModalContext';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useMessage } from '@/hooks/useMessages';
import { Reaction } from 'react-native-reactions';
import { reactions } from '@/lib/reactions';
import { useReactions } from '@/contexts/ReactionsContext';
import { useParams } from '@/contexts/ParamsContext';
import FilePreviewModal from '@/views/modals/FilePreview';
import { useMeeting } from '@/contexts/MeetingContext';
import { randomRoomName } from '@/lib/jitsiGenerator';
import Highlighter from '@luciapp/react-native-highlight-words';

function AudioPlayer({chat, setPosition, setVisible}) {
  const [sound, setSound] = React.useState(null);
  const [status, setStatus] = React.useState(null);

  async function loadAndPlaySound() {
    console.log(sound);
    const {sound: soundSource} = await Audio.Sound.createAsync({
      uri: getFileURL(chat?.fileURL),
    });
    console.log(soundSource);
    soundSource.setOnPlaybackStatusUpdate(stat => setStatus(() => stat));
    soundSource.setProgressUpdateIntervalAsync(200);
    setSound(soundSource);
    await soundSource.playAsync();
  }

  function unloadSound() {
    setSound(null);
    setStatus(null);
    sound.unloadAsync();
  }

  async function pauseSound() {
    await sound.pauseAsync();
  }

  async function playSound() {
    await sound.playAsync();
  }

  React.useEffect(() => {
    return sound
      ? () => {
          unloadSound();
        }
      : undefined;
  }, []);

  React.useEffect(() => {
    if (status?.didJustFinish) {
      unloadSound();
    }
  }, [status]);

  const positionMillis = status?.positionMillis || 0;
  const durationMillis = status?.durationMillis || chat?.mediaDuration || 0;
  const progress = positionMillis / durationMillis;

  return (
    <Pressable
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onLongPress={
        setPosition && setVisible
          ? ({nativeEvent}) => {
              // setPosition({
              //   x: Number(nativeEvent.pageX.toFixed(2)),
              //   y: Number(nativeEvent.pageY.toFixed(2)),
              // });
              setVisible(true);
            }
          : null
      }
      onPress={() => {
        if (status?.isPlaying) {
          pauseSound();
        } else if (sound) {
          playSound();
        } else {
          loadAndPlaySound();
        }
      }}>
      {status?.isPlaying && (
        <MaterialIcons name="pause" size={24} style={{color: Colors.black}} />
      )}
      {!status?.isPlaying && (
        <MaterialIcons
          name="play-arrow"
          size={28}
          style={{color: Colors.black}}
        />
      )}
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          marginLeft: 5,
        }}>
        <ProgressBar
          style={{
            width: 118, 
            marginBottom: 2,
            height: 8,
            borderRadius: 4,
          }}
          progress={progress || 0}
          color={Colors.grey700}
        />
        <Text style={{color: Colors.black, fontSize: 14, textAlign: 'left'}}>
          {convertMsToTime(
            positionMillis === 0
              ? Math.floor(chat?.mediaDuration * 1000)
              : positionMillis,
          )}
        </Text>
      </View>
    </Pressable>
  );
}

function VideoPlayer({chat, setPosition, setVisible}) {
  const [file, setFile] = React.useState('');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (chat?.fileURL) {
      (async () => {
        const uri = await cacheThumbnails(chat);
        setFile(uri);
      })();
    }
  }, [chat?.fileURL]);

  React.useEffect(() => {
    return () => {
      setOpen(false);
      setFile('');
    }
  }, []);

  return (
    <Pressable
      style={{
        width: 300,
        height: 300,
        maxWidth: '100%',
      }}
      onPress={() => setOpen(true)}
      onLongPress={
        setPosition && setVisible
          ? ({nativeEvent}) => {
              // setPosition({
              //   x: Number(nativeEvent.pageX.toFixed(2)),
              //   y: Number(nativeEvent.pageY.toFixed(2)),
              // });
              setVisible(true);
            }
          : null
      }>
      <ImageBackground
        imageStyle={{
          resizeMode: 'cover',
          borderRadius: 10,
          width: 150,
          height: 150,
        }}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
        defaultSource={require('@/files/placeholder_600.jpg')}
        source={chat?.thumbnailURL ? {uri: getFileURL(chat?.thumbnailURL)} : require('@/files/placeholder_600.jpg')}>
        <MaterialIcons
          name="play-arrow"
          size={60}
          style={{color: Colors.white}}
        />
        <Text style={{
          color: Colors.white, 
          fontSize: 14, 
          textAlign: 'left',
          marginLeft: 4,
        }}>
          {convertMsToTime(Math.floor(chat?.mediaDuration * 1000))}
        </Text>
      </ImageBackground>
      {open && (
        <VideoModal
          open={open}
          setOpen={setOpen}
          uri={getFileURL(chat?.fileURL)}
        />
      )}
    </Pressable>
  );
}

function ImageViewer({chat, setPosition, setVisible}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Pressable
      onPress={() => setOpen(true)}
      onLongPress={
        setPosition && setVisible
          ? ({nativeEvent}) => {
              // setPosition({
              //   x: Number(nativeEvent.pageX.toFixed(2)),
              //   y: Number(nativeEvent.pageY.toFixed(2)),
              // });
              setVisible(true);
            }
          : null
      }>
      <Image
        style={{
          resizeMode: 'cover',
          borderRadius: 10,
          overlayColor: Colors.white,
          width: chat?.mediaHeight >= chat?.mediaWidth ? (chat?.mediaWidth * 150) / chat?.mediaHeight : 150,
          maxWidth: '100%',
          height: chat?.mediaHeight >= chat?.mediaWidth ? 150 : (chat?.mediaHeight * 150) / chat?.mediaWidth,
        }}
        defaultSource={require('@/files/placeholder_600.jpg')}
        source={{uri: getFileURL(chat?.thumbnailURL || chat?.fileURL)}}
      />
      {open && (
        <FullScreenPictureModal
          open={open}
          setOpen={setOpen}
          uri={getFileURL(chat?.fileURL)}
          width={chat?.mediaWidth}
          height={chat?.mediaHeight}
        />
      )}
    </Pressable>
  );
}

function FileViewer({chat, setVisible}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Pressable
      onPress={() => setOpen(true)}
      onLongPress={
        setVisible
          ? ({nativeEvent}) => {
              // setPosition({
              //   x: Number(nativeEvent.pageX.toFixed(2)),
              //   y: Number(nativeEvent.pageY.toFixed(2)),
              // });
              setVisible(true);
            }
          : null
      }>
      <Text
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          color: Colors.blue400,
          borderColor: Colors.blue400,
          borderWidth: 1,
          borderRadius: 8,
          width: 300,
          maxWidth: '100%',
          flexWrap: 'wrap',
        }}
      >
        {chat?.fileName} ({getFileSize(chat?.fileSize)})
      </Text>
      {open && (
        <FilePreviewModal
          open={open}
          setOpen={setOpen}
          chat={chat}
        />
      )}
    </Pressable>
  );
}

function StickerViewer({chat}) {
  return (
    <Image
      style={{
        resizeMode: 'cover',
        width: 150,
        height: 150,
        borderRadius: 5,
      }}
      defaultSource={require('@/files/placeholder_200.jpg')}
      source={{uri: `${env.LINK_CLOUD_STICKER}/${chat?.sticker}`}}
    />
  );
}

function getMessageType(chat) {
  if (chat?.text) return 'text';
  if (chat.fileType?.includes('image')) return 'picture';
  if (chat.fileType?.includes('video')) return 'video';
  if (chat.fileType?.includes('audio')) return 'audio';
  if (chat.sticker) return 'sticker';
  return 'file';
}

function getReplyMessageType(chat) {
  if (chat?.replyText) return 'text';
  if (chat.replyFileType?.includes('image')) return 'picture';
  if (chat.replyFileType?.includes('video')) return 'video';
  if (chat.replyFileType?.includes('audio')) return 'audio';
  if (chat.sticker) return 'sticker';
  if (chat.replyFileURL) return 'file';
  return null;
}

export default function Message({
  chat,
  handleSelect,
  previousSameSender,
  previousMessageDate,
  index,
  children,
}) {
  const {chatId} = useParams();
  const {userdata, user} = useUser();

  const senderIsUser = chat?.senderId === user?.uid;
  const {value: recipient} = useUserById(chat?.senderId);
  const {value: forwardUser} = useUserById(chat?.forwardSenderId);
  const {value: replyUser} = useUserById(chat?.replySenderId);

  const sender = senderIsUser ? userdata : recipient;

  const { value: forward, loading } = useMessage(chat?.forwardId);

  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({x: 0, y: 0});
  const [selectedEmoji, setSelectedEmoji] = useState();
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [openReactionModal, setOpenReactionModal] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState(false);

  const {setOpenEditMessage, setOpenReplyMessage, setOpenForwardMessage, setOpenSendMail} = useModal();
  const {setMessageToEdit, setMessageToReply, setMessageToForward, setMessageToSendMail, checkedMessages, setCheckedMessages, isSelecting, setIsSelecting, searchText} = useMessageFeature();
  const {setOpenCalling, setRecipientInfo, setSenderInfo, setRoomName, setIsVideoDisabled} = useMeeting();

  const messageType = getMessageType(chat);
  const isText = messageType === 'text';

  const replyMessageType = getReplyMessageType(chat);
  const isReplyText = replyMessageType === 'text';

  const isMessageSelected = checkedMessages.filter((c) => c?.objectId === chat?.objectId).length > 0;

  const prevCreatedAt = new Date(previousMessageDate);
  const createdAt = new Date(chat?.createdAt);
  const displayProfilePicture = React.useMemo(
    () =>
      !previousSameSender ||
      (index + 1) % 30 === 0 ||
      (previousSameSender &&
        prevCreatedAt &&
        createdAt &&
        createdAt?.getTime() - prevCreatedAt?.getTime() > 600000),
    [previousSameSender, index, prevCreatedAt, createdAt],
  );

  const { reactions: messageReactions } = useReactions(
    chatId,
    chat?.objectId
  );
  const groupedReactions = React.useMemo(() => {
    let groups = {};
    messageReactions.forEach((reaction) => {
      groups[reaction.reaction] = [
        ...(groups[reaction.reaction] || []),
        reaction,
      ];
    });
    return groups;
  }, [messageReactions]);

  const {showActionSheetWithOptions} = useActionSheet();
  const selectAction = () => {
    if (senderIsUser) {
      showActionSheetWithOptions(
        {
          icons: [icon('insert-emoticon'), icon('edit'), icon('delete'), icon('check'), icon('reply'), icon('forward'), icon('email')],
          options: ['Reaction', 'Edit', 'Delete', 'Check', 'Reply', 'Forward', 'Send Mail'],
          cancelButtonIndex: 7,
          useModal: true,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            setOpenReactionModal(true);
          }
          if (buttonIndex === 1) {
            setMessageToEdit(chat);
            setOpenEditMessage(true);
          }
          if (buttonIndex === 2) {
            setOpenDeleteConfirm(true);
          }
          if (buttonIndex === 3) {
            initializeSelect();
          }
          if (buttonIndex === 4) {
            setMessageToReply(chat);
            setOpenReplyMessage(true);
          }
          if (buttonIndex === 5) {
            setMessageToForward(chat);
            setOpenForwardMessage(true);
          }
          if (buttonIndex === 6) {
            if (chat?.fileURL) {
              setMessageToSendMail(chat?.fileURL);
              setOpenSendMail(true);
            } else {
              showAlert("Select file message to send email");
            }
          }
        },
      );
    } else {
      showActionSheetWithOptions(
        {
          icons: [icon('insert-emoticon'), icon('check'), icon('reply'), icon('forward'), icon('email')],
          options: ['Reaction', 'Check', 'Reply', 'Forward', 'Send Mail'],
          cancelButtonIndex: 5,
          useModal: true,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            setOpenReactionModal(true);
          }
          if (buttonIndex === 1) {
            initializeSelect();
          }
          if (buttonIndex === 2) {
            setMessageToReply(chat);
            setOpenReplyMessage(true);
          }
          if (buttonIndex === 3) {
            setMessageToForward(chat);
            setOpenForwardMessage(true);
          }
          if (buttonIndex === 4) {
            if (chat?.fileURL) {
              setMessageToSendMail(chat?.fileURL);
              setOpenSendMail(true);
            } else {
              showAlert("Select file message to send email");
            }
          }
        },
      );
    }
  };

  const deleteMessage = async () => {
    setLoadingOperation(true);
    try {
      setVisible(false);
      await deleteData(`/messages/${chat?.objectId}`);
    } catch (err) {
      showAlert(err.message);
    }
    setOpenDeleteConfirm(false);
    setLoadingOperation(false);
  };

  const initializeSelect = () => {
    if (!isMessageSelected) {
      setCheckedMessages([...checkedMessages, chat]);
    }
    setIsSelecting(true);
  }

  const reactMessage = async (e) => {
    try {
      await postData(`/messages/${chat?.objectId}/reactions`, {
        reaction: e.value,
      });
      setOpenReactionModal(false)
    } catch (err) {
      showAlert(err.message);
    }
  }

  const handleCallingButton = async (receiver, audioOnly) => {
    try {
      const room = randomRoomName();
      await postData('/send-message', {
        sender: userdata,
        receiver,
        type: "Calling",
        room,
        audioOnly,
      });
      console.log('Message sent successfully');
      setOpenCalling(true);
      setRecipientInfo(receiver);
      setSenderInfo(userdata);
      setRoomName(room);
      setIsVideoDisabled(audioOnly);
    } catch (err) {
      showAlert(err.message);
    }
  }

  return (
    <View>
      {children}
      {chat?.text.includes("[Jitsi_Call_Log:]:") ? (
        <>
          {(JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Call ended" ||
            (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Missed Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
            (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Stopped Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
            (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Refused Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).sender?.objectId === user?.uid)
            ) && (
              <View
                style={{
                  width: '100%',
                  display: 'flex', 
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderRadius: 12,
                  borderColor: Colors.green400,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                }}
              >
                <View style={{
                  height: '100%',
                  display: 'flex', 
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {(JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Call ended" ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Missed Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Stopped Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Refused Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).sender?.objectId === user?.uid)) && 
                  <Text style={{
                    fontSize: 14,
                    color: Colors.green400,
                    marginRight: 12,
                  }}>
                    {JSON.parse(chat?.text.substr(19, chat?.text.length)).type}
                  </Text>
                }
                {JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Call ended" && (
                  <Text style={{
                    fontSize: 16,
                    color: Colors.green400,
                  }}>
                    {String(Math.floor(parseInt(JSON.parse(chat?.text.substr(19, chat?.text.length)).duration) / 1000 / 60)).padStart(2, "0")}:
                    {String(Math.floor(parseInt(JSON.parse(chat?.text.substr(19, chat?.text.length)).duration) / 1000) - Math.floor(parseInt(JSON.parse(chat?.text.substr(19, chat?.text.length)).duration) / 1000 / 60) * 60).padStart(2, "0")}
                  </Text>
                )}
                {((JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Missed Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Stopped Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Refused Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).sender?.objectId === user?.uid)) && (
                  <Text style={{
                    fontSize: 14,
                    color: Colors.green400,
                  }}>
                    {new Date(JSON.parse(chat?.text.substr(19, chat?.text.length)).duration).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </Text>
                )}
                </View>
                <View style={{
                  height: '100%',
                  display: 'flex', 
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}>
                  {(JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Call ended" ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Missed Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) ||
                  (JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Stopped Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0)) && (
                  <IconButton
                    icon="phone"
                    color={Colors.green400}
                    size={25}
                    onPress={() => {
                      if (JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.filter((r) => r?.objectId === user?.uid).length > 0) {
                        handleCallingButton([JSON.parse(chat?.text.substr(19, chat?.text.length)).sender], JSON.parse(chat?.text.substr(19, chat?.text.length)).audioOnly);
                      } else {
                        handleCallingButton(JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver, JSON.parse(chat?.text.substr(19, chat?.text.length)).audioOnly);
                      }
                    }}
                  />
                  )}
                  {(JSON.parse(chat?.text.substr(19, chat?.text.length)).type === "Refused Call" && JSON.parse(chat?.text.substr(19, chat?.text.length)).sender?.objectId === user?.uid) && (
                  <IconButton
                    icon="phone"
                    color={Colors.green400}
                    size={25}
                    onPress={() => {
                      if (JSON.parse(chat?.text.substr(19, chat?.text.length)).receiver?.objectId === user?.uid) {
                        handleCallingButton([JSON.parse(chat?.text.substr(19, chat?.text.length)).sender], JSON.parse(chat?.text.substr(19, chat?.text.length)).audioOnly);
                      } else {
                        handleCallingButton([JSON.parse(chat?.text.substr(19, chat?.text.length))?.refusedUser], JSON.parse(chat?.text.substr(19, chat?.text.length)).audioOnly);
                      }
                    }}
                  />
                  )}
                  <IconButton
                    icon="delete"
                    color={Colors.red500}
                    size={25}
                    onPress={() => setOpenDeleteConfirm(true)}
                  />
                </View>
              </View>
            )}
        </>
      ) : (
        <Pressable
          key={chat?.objectId}
          onLongPress={({nativeEvent}) => {
              // setPosition({
              //   x: Number(nativeEvent.pageX.toFixed(2)),
              //   y: Number(nativeEvent.pageY.toFixed(2)),
              // });
              // setVisible(true);
              selectAction();
            }
          }
          style={{display: 'flex', flexDirection: 'row', marginTop: 8}}>
          {/* PROFILE PICTURE LEFT PART */}
          <View
            style={{
              width: 55,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
            }}>
            {displayProfilePicture && (
              <Image
                style={[styles.image]}
                source={
                  sender?.thumbnailURL
                    ? {uri: getFileURL(sender?.thumbnailURL)}
                    : require('@/files/blank_user.png')
                }
              />
            )}
          </View>
  
          {/* MESSAGE RIGHT PART */}
          <View style={{flex: 1}}>
            {/* MESSAGE HEADER */}
            {displayProfilePicture && (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  ...(messageType !== 'text' && {paddingBottom: 8}),
                }}>
                <Text
                  style={{
                    paddingRight: 5,
                    fontWeight: 'bold',
                    fontSize: 15,
                    color: Colors.black,
                  }}>
                  {sender?.displayName}
                </Text>
                <Text style={{fontSize: 12, paddingBottom: 2}}>
                  {getFormattedTime(chat?.createdAt)}
                </Text>
              </View>
            )}
            {chat?.replyId && (
              <View style={{display: 'flex', flexDirection: 'row', marginTop: 4}}>
                {/* PROFILE PICTURE LEFT PART */}
                <View
                  style={{
                    width: 40,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                  }}>
                  <Image
                    style={[styles.replyImage]}
                    source={
                      replyUser?.thumbnailURL
                        ? {uri: getFileURL(replyUser?.thumbnailURL)}
                        : require('@/files/blank_user.png')
                    }
                  />
                </View>
                {/* MESSAGE RIGHT PART */}
                <View style={{flex: 1}}>{/* MESSAGE HEADER */}
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      ...(!chat.replyText && {paddingBottom: 8}),
                    }}>
                    <Text
                      style={{
                        paddingRight: 5,
                        fontWeight: 'bold',
                        fontSize: 12,
                        color: Colors.black,
                      }}>
                      {replyUser?.displayName}
                    </Text>
                    <Text style={{fontSize: 10, paddingBottom: 2}}>
                      {getFormattedTime(chat?.replyCreatedAt)}
                    </Text>
                  </View>
                  {replyMessageType === 'picture' && (
                    <ImageViewer
                      chat={{
                        fileURL: chat.replyFileURL,
                        mediaHeight: chat.replyMediaHeight,
                        mediaWidth: chat.replyMediaWidth,
                      }}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {replyMessageType === 'video' && (
                    <VideoPlayer
                      chat={{
                        fileURL: chat.replyFileURL,
                      }}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {replyMessageType === 'audio' && (
                    <AudioPlayer
                      chat={{
                        fileURL: chat.replyFileURL,
                        mediaDuration: chat.replyMediaDuration,
                      }}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {replyMessageType === 'sticker' && <StickerViewer chat={chat} />}
                  {isReplyText && <Text style={styles.replyText}>{removeHtml(chat?.replyText)}</Text>}
                  {replyMessageType === 'file' && (
                    <FileViewer
                      chat={chat}
                      {...(senderIsUser && {setVisible})}
                    />
                  )}
                </View>
              </View>
            )}
            {(chat?.forwardId && forward && !loading) ? (
              <View style={{display: 'flex', flexDirection: 'row', marginTop: 0}}>
                {/* PROFILE PICTURE LEFT PART */}
                <View
                  style={{
                    width: 40,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                  }}>
                  <Image
                    style={[styles.replyImage]}
                    source={
                      forwardUser?.thumbnailURL
                        ? {uri: getFileURL(forwardUser?.thumbnailURL)}
                        : require('@/files/blank_user.png')
                    }
                  />
                </View>
                {/* MESSAGE RIGHT PART */}
                <View style={{flex: 1}}>{/* MESSAGE HEADER */}
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      ...(!chat.text && {paddingBottom: 8}),
                    }}>
                    <Text
                      style={{
                        paddingRight: 5,
                        fontWeight: 'bold',
                        fontSize: 12,
                        color: Colors.black,
                      }}>
                      {forwardUser?.displayName}
                    </Text>
                    <Text style={{fontSize: 10, paddingBottom: 2}}>
                      {getFormattedTime(chat?.forwardCreatedAt)}
                    </Text>
                  </View>
                  {messageType === 'picture' && (
                    <ImageViewer
                      chat={chat}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {messageType === 'video' && (
                    <VideoPlayer
                      chat={chat}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {messageType === 'audio' && (
                    <AudioPlayer
                      chat={chat}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {messageType === 'file' && (
                    <FileViewer
                      chat={chat}
                      {...(senderIsUser && {setVisible})}
                    />
                  )}
                  {messageType === 'sticker' && <StickerViewer chat={chat} />}
                  {isText &&
                    <Highlighter
                      highlightStyle={{
                        backgroundColor: Colors.yellow500,
                      }}
                      searchWords={[searchText]}
                      textToHighlight={removeHtml(chat?.text)}
                      style={styles.replyText}
                    />
                  }
                  {/* {isText && <Text style={styles.replyText}>{removeHtml(chat?.text)}</Text>} */}
                </View>
              </View>
            ) : (
              <>
              {messageType === 'picture' && (
                <ImageViewer
                  chat={chat}
                  {...(senderIsUser && {setPosition, setVisible})}
                />
              )}
              {messageType === 'video' && (
                <VideoPlayer
                  chat={chat}
                  {...(senderIsUser && {setPosition, setVisible})}
                />
              )}
              {messageType === 'audio' && (
                <AudioPlayer
                  chat={chat}
                  {...(senderIsUser && {setPosition, setVisible})}
                />
              )}
              {messageType === 'file' && (
                <FileViewer
                  chat={chat}
                  {...(senderIsUser && {setVisible})}
                />
              )}
              {messageType === 'sticker' && <StickerViewer chat={chat} />}
              {isText &&
                <Highlighter
                  highlightStyle={{
                    backgroundColor: Colors.yellow500,
                  }}
                  searchWords={[searchText]}
                  textToHighlight={removeHtml(chat?.text)}
                  style={styles.text}
                />
              }
              {/* {isText && <Text style={styles.text}>{removeHtml(chat?.text)}</Text>} */}
              </>
            )}
          </View>
          {isSelecting && (
            <View>
              <Checkbox
                status={isMessageSelected ? 'checked' : 'unchecked'}
                onPress={() => handleSelect(!isMessageSelected, chat)}
              />
            </View>
          )}
        </Pressable>
      )}
      <View style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 55,
        marginTop: 4,
      }}>
        {reactions.filter((reaction) => Object.keys(groupedReactions).includes(reaction.value || "")).map((reaction, index) => (
          <View key={index} style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: 36,
            borderRadius: 20,
            padding: 2,
            backgroundColor: reaction.bgColor,
            marginRight: 2,
          }}>
            <MaterialCommunityIcons name={reaction.icon} color={reaction.iconColor} size={18} />
            <Text style={{
              fontSize: 12,
              color: Colors.white,
            }}>
              {groupedReactions[(reaction.value) || ""].length || 0}
            </Text>
          </View>
        ))}
      </View>
      <Portal>
        <Dialog
          visible={openDeleteConfirm}
          onDismiss={() => setOpenDeleteConfirm(false)}
          style={{
            borderRadius: 16,
          }}
        >
          <Dialog.Title>Delete</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{

            }}>Are you want to delete this message?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            {loadingOperation && (
              <ActivityIndicator size={18} style={{marginHorizontal: 12}} />
            )}
            <Button
              onPress={deleteMessage}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.red500,
                marginRight: 8,
              }}
              labelStyle={{
                color: Colors.red500,
              }}
            >Delete</Button>
            <Button
              onPress={() => setOpenDeleteConfirm(false)}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.blue400,
              }}
              labelStyle={{
                color: Colors.blue400,
              }}
            >Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Modal
          visible={openReactionModal}
          onDismiss={() => setOpenReactionModal(false)}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <List.Section title="Reactions">
            {reactions.map(reaction => (
              <List.Item
                key={reaction.icon}
                title={reaction.name}
                titleStyle={{
                  color: Colors.grey800, 
                  fontWeight: (messageReactions.filter((m) => m.userId === user.uid).length > 0 && messageReactions.filter((m) => m.userId === user.uid)[0].reaction === reaction.value) ? 'bold' : 'normal',
                }}
                style={{
                  padding: 4,
                  borderWidth: (messageReactions.filter((m) => m.userId === user.uid).length > 0 && messageReactions.filter((m) => m.userId === user.uid)[0].reaction === reaction.value) ? 1 : 0,
                  borderColor: Colors.blue400,
                  borderRadius: 8,
                  backgroundColor: (messageReactions.filter((m) => m.userId === user.uid).length > 0 && messageReactions.filter((m) => m.userId === user.uid)[0].reaction === reaction.value) ? Colors.grey200 : Colors.transparent,
                }}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={() => <MaterialCommunityIcons color={reaction.bgColor} name={reaction.icon} size={24} />}
                  />
                )}
                onPress={() => reactMessage(reaction)}
                disabled={messageReactions.filter((m) => m.userId === user.uid).length > 0 && messageReactions.filter((m) => m.userId === user.uid)[0].reaction === reaction.value}
              />
            ))}
          </List.Section>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  rowStyle: {
    margin: 0,
    width: '77%',
    marginVertical: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    letterSpacing: 0,
    fontWeight: '400',
    textAlign: 'left',
    color: Colors.black,
  },
  textItalic: {
    fontSize: 15,
    letterSpacing: 0,
    fontWeight: '400',
    textAlign: 'left',
    color: Colors.grey600,
    fontStyle: 'italic',
  },
  image: {
    width: 38,
    height: 38,
    marginLeft: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    padding: 4,
    paddingHorizontal: 8,
    minWidth: 10,
    elevation: 2,
    height: 'auto',
    maxWidth: '100%',
    marginRight: 0,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyImage: {
    width: 32,
    height: 32,
    marginLeft: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyText: {
    fontSize: 12,
    letterSpacing: 0,
    fontWeight: '400',
    textAlign: 'left',
    color: Colors.black,
  },
  modalContainer: {
    width: '75%',
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
