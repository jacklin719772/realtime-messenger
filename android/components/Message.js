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
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ActivityIndicator, Avatar, Button, Checkbox, Colors, Dialog, IconButton, List, Modal, Portal, ProgressBar} from 'react-native-paper';
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
import FileViewer from 'react-native-file-viewer';
import RNFS from "react-native-fs";
import Share from 'react-native-share';
import * as Clipboard from 'expo-clipboard';
import CircularProgress from 'react-native-circular-progress-indicator';

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
      onLongPress={() => setVisible(true)}
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
  const [openSelect, setOpenSelect] = React.useState(false);
  const [localFile, setLocalFile] = React.useState(null);
  const [downloading, setDownloading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const previewFile = async (chat) => {
    const uri = chat.fileURL;
    setOpenSelect(false);
    const fileName = chat?.fileName;
    const file = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    setLocalFile(`${RNFS.DownloadDirectoryPath}/${fileName}`);
    const options = {
      fromUrl: getFileURL(uri),
      toFile: file,
      progress: (res) => {
        // Handle download progress updates if needed
        const progress = (res.bytesWritten / res.contentLength) * 100;
        setProgress(Math.floor(progress));
      },
    };

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download the file',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied!', 'You need to give storage permission to download the file');
          return;
        }
      }
      setDownloading(true);

      // Download the file
      const downloadResult = await RNFS.downloadFile(options).promise;
      setDownloading(false);

      if (downloadResult.statusCode === 200) {
        // Share the file
        handleOpenWithOtherApp(file);
      } else {
        showAlert('Download failed');
      }
    } catch (error) {
      // error
      console.log('Error-----', error);
      showAlert(error.message);
    }
  };

  const handleOpenWithOtherApp = async (url) => {
    console.log(`file://${url}`)
    try {
      await Share.open({
        url: `file://${url}`,
        type: '*/*',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        showAlert('Could not share the file');
        console.error(error);
      }
    }
  };

  const handleOpenPreview = () => {
    setOpen(true);
    setOpenSelect(false);
  }
  
  const copyToClipboard = async (chat) => {
    try {
      await Clipboard.setStringAsync(`https://im.flybird360.com:3003${chat.fileURL}`);
      setOpenSelect(false);
      showAlert('File link copied to clipboard.');
    } catch (error) {
      showAlert(error.message);
    }
  };

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
        width: 150,
        height: 150,
        maxWidth: '100%',
      }}
      onPress={() => setOpenSelect(true)}
      onLongPress={() => setVisible(true)}>
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
      
      <Portal>
        <Dialog
          visible={openSelect}
          onDismiss={() => setOpenSelect(false)}
          style={{
            borderRadius: 16,
          }}
        >
          <View style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Dialog.Title>File Preview</Dialog.Title>
            <IconButton
              icon="window-close"
              color={Colors.black}
              size={25}
              onPress={() => setOpenSelect(false)}
            />
          </View>
          <Dialog.Actions>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
              }}
              onPress={handleOpenPreview}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/preview.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
              }}>Preview</Text>
            </Pressable>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
              }}
              onPress={() => copyToClipboard(chat)}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/copy-to-clipboard.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
              }}>Copy link</Text>
            </Pressable>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
              }}
              onPress={() => previewFile(chat)}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/share.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
              }}>Share</Text>
            </Pressable>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Modal
          visible={downloading}
          onDismiss={() => {}}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text style={{
              fontSize: 16,
              color: Colors.black,
            }}>Downloading file...</Text>
            <CircularProgress
              value={progress}
              radius={30}
              inActiveStrokeColor={Colors.green500}
              inActiveStrokeOpacity={0.2}
              progressValueColor={Colors.green500}
              valueSuffix={'%'}
            />
          </View>
        </Modal>
      </Portal>
    </Pressable>
  );
}

function ImageViewer({chat, setPosition, setVisible}) {
  const [open, setOpen] = React.useState(false);

  const previewFile = (chat) => {
    const uri = chat.fileURL;
    const fileName = chat.fileName;
    const localFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    const options = {
      fromUrl: getFileURL(uri),
      toFile: localFile,
    };

    RNFS.downloadFile(options)
      .promise.then(() => {
        FileViewer.open(localFile)
        .then(() => {
          // Success
        })
        .catch((error) => {
          setOpen(true);
          showAlert('This file type is not supported.');
        });
      })
      .then(() => {
        // success
      })
      .catch((error) => {
        // error
        console.log('Error-----', error);
        showAlert(error.message);
      });
  };

  return (
    <Pressable
      onPress={() => previewFile(chat)}
      onLongPress={() => setVisible(true)}>
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

function FilePreviewer({chat, setVisible}) {
  const [open, setOpen] = React.useState(false);
  const [openSelect, setOpenSelect] = React.useState(false);
  const [localFile, setLocalFile] = React.useState(null);
  const [downloading, setDownloading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const previewFile = async (chat) => {
    const uri = chat.fileURL;
    setOpenSelect(false);
    const fileName = chat.fileName;
    const file = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    setLocalFile(`${RNFS.DownloadDirectoryPath}/${fileName}`);
    const options = {
      fromUrl: getFileURL(uri),
      toFile: file,
      progress: (res) => {
        // Handle download progress updates if needed
        const progress = (res.bytesWritten / res.contentLength) * 100;
        setProgress(Math.floor(progress));
      },
    };

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download the file',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied!', 'You need to give storage permission to download the file');
          return;
        }
      }
      setDownloading(true);

      // Download the file
      const downloadResult = await RNFS.downloadFile(options).promise;
      setDownloading(false);

      if (downloadResult.statusCode === 200) {
        // Share the file
        handleOpenWithOtherApp(file);
      } else {
        showAlert('Download failed');
      }
    } catch (error) {
      // error
      console.log('Error-----', error);
      showAlert(error.message);
    }
  };

  const handleOpenWithOtherApp = async (url) => {
    console.log(`file://${url}`)
    try {
      await Share.open({
        url: `file://${url}`,
        type: '*/*',
      });
    } catch (error) {
      if (error.message !== 'User did not share') {
        showAlert('Could not share the file');
        console.error(error);
      }
    }
  };

  const handleOpenPreview = () => {
    setOpen(true);
    setOpenSelect(false);
  }
  
  const copyToClipboard = async (chat) => {
    try {
      await Clipboard.setStringAsync(`https://im.flybird360.com:3003${chat.fileURL}`);
      setOpenSelect(false);
      showAlert('File link copied to clipboard.');
    } catch (error) {
      showAlert(error.message);
    }
  };

  return (
    <Pressable
      onPress={() => setOpenSelect(true)}
      onLongPress={() => setVisible(true)}>
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
      
      <Portal>
        <Dialog
          visible={openSelect}
          onDismiss={() => setOpenSelect(false)}
          style={{
            borderRadius: 16,
          }}
        >
          <View style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Dialog.Title>File Preview</Dialog.Title>
            <IconButton
              icon="window-close"
              color={Colors.black}
              size={25}
              onPress={() => setOpenSelect(false)}
            />
          </View>
          <Dialog.Actions style={{
            marginTop: 0,
            paddingTop: 0,
          }}>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
              }}
              onPress={handleOpenPreview}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/preview.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
              }}>Preview</Text>
            </Pressable>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
              }}
              onPress={() => copyToClipboard(chat)}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/copy-to-clipboard.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
              }}>Copy link</Text>
            </Pressable>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
              }}
              onPress={() => previewFile(chat)}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/share.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
              }}>Share</Text>
            </Pressable>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Modal
          visible={downloading}
          onDismiss={() => {}}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text style={{
              fontSize: 16,
              color: Colors.black,
            }}>Downloading file...</Text>
            <CircularProgress
              value={progress}
              radius={30}
              inActiveStrokeColor={Colors.green500}
              inActiveStrokeOpacity={0.2}
              progressValueColor={Colors.green500}
              valueSuffix={'%'}
            />
          </View>
        </Modal>
      </Portal>
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

  const {setOpenEditMessage, setOpenReplyMessage, setOpenForwardMessage, setOpenSendMail, setOpenFavorite} = useModal();
  const {setMessageToEdit, setMessageToReply, setMessageToForward, setMessageToSendMail, checkedMessages, setCheckedMessages, isSelecting, setIsSelecting, searchText, setMessageToFavorite} = useMessageFeature();
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

  const [openFeature, setOpenFeature] = useState(false);

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
    setVisible(false)
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

  const downloadFile = async (chat) => {
    const uri = chat.fileURL;
    const fileName = chat.fileName;
    const file = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    const options = {
      fromUrl: getFileURL(uri),
      toFile: file,
    };

    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download the file',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert('Permission Denied! You need to give storage permission to download the file');
          return;
        }
      }
      const downloadResult = await RNFS.downloadFile(options)
        .promise;
      if (downloadResult.statusCode === 200) {
        // Share the file to open it with an appropriate app
        showAlert('File downloaded successfully');
        setVisible(false);
      } else {
        showAlert('Download failed');
      }
    } catch (error) {
      console.log(error);
      showAlert(error.message);
    }
  };

  const initializeFavorite = () => {
    setMessageToFavorite(chat);
    setOpenFavorite(true);
    setVisible(false);
  }

  const removeFavorite = async () => {
    try {
      await postData(`/messages/${chat?.objectId}/favorites/${user?.uid}`);
      showAlert('The file has been removed from your private folder.');
    } catch (error) {
      showAlert(error.message);
    }
    setVisible(false);
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
              setVisible(true);
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
                      setPosition={setPosition}
                      setVisible={setVisible}
                    />
                  )}
                  {replyMessageType === 'video' && (
                    <VideoPlayer
                      chat={{
                        fileURL: chat.replyFileURL,
                      }}
                      setPosition={setPosition}
                      setVisible={setVisible}
                    />
                  )}
                  {replyMessageType === 'audio' && (
                    <AudioPlayer
                      chat={{
                        fileURL: chat.replyFileURL,
                        mediaDuration: chat.replyMediaDuration,
                      }}
                      setPosition={setPosition}
                      setVisible={setVisible}
                    />
                  )}
                  {replyMessageType === 'sticker' && <StickerViewer chat={chat} />}
                  {isReplyText && <Text style={styles.replyText}>{removeHtml(chat?.replyText)}</Text>}
                  {replyMessageType === 'file' && (
                    <FilePreviewer
                      chat={chat}
                      setVisible={setVisible}
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
                      setPosition={setPosition}
                      setVisible={setVisible}
                    />
                  )}
                  {messageType === 'video' && (
                    <VideoPlayer
                      chat={chat}
                      setPosition={setPosition}
                      setVisible={setVisible}
                    />
                  )}
                  {messageType === 'audio' && (
                    <AudioPlayer
                      chat={chat}
                      setPosition={setPosition}
                      setVisible={setVisible}
                    />
                  )}
                  {messageType === 'file' && (
                    <FilePreviewer
                      chat={chat}
                      setVisible={setVisible}
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
                  setPosition={setPosition}
                  setVisible={setVisible}
                />
              )}
              {messageType === 'video' && (
                <VideoPlayer
                  chat={chat}
                  setPosition={setPosition}
                  setVisible={setVisible}
                />
              )}
              {messageType === 'audio' && (
                <AudioPlayer
                  chat={chat}
                  setPosition={setPosition}
                  setVisible={setVisible}
                />
              )}
              {messageType === 'file' && (
                <FilePreviewer
                  chat={chat}
                  setVisible={setVisible}
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
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <Text
            style={{
              color: Colors.black,
              fontSize: 14,
              fontWeight: 'bold',
              paddingLeft: 12,
            }}
          >More Actions</Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={() => {
                setOpenReactionModal(true);
                setVisible(false)
              }}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/reaction.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Reaction</Text>
            </Pressable>
            {chat?.fileURL && <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={() => downloadFile(chat)}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/download.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Download</Text>
            </Pressable>}
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={initializeSelect}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/check.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Select Msg</Text>
            </Pressable>            
            {(senderIsUser && isText) && <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                 width: 55,
              }}
              onPress={() => {
                setMessageToEdit(chat);
                setOpenEditMessage(true);
                setVisible(false)
              }}
            >
              <MaterialCommunityIcons name="pencil" size={25} style={{color: Colors.blue500}} />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Edit</Text>
            </Pressable>}
            {senderIsUser && <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={() => {
                setOpenDeleteConfirm(true);
                setVisible(false)
              }}
            >
              <MaterialCommunityIcons name="delete" size={25} style={{color: Colors.red500}} />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Delete</Text>
            </Pressable>}
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                 width: 55,
              }}
              onPress={() => {
                setMessageToReply(chat);
                setOpenReplyMessage(true);
                setVisible(false)
              }}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/reply.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Reply</Text>
            </Pressable>
            <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={() => {
                setMessageToForward(chat);
                setOpenForwardMessage(true);
                setVisible(false)
              }}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/forward.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Forward</Text>
            </Pressable>
            {chat?.fileURL && <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={() => {
                setMessageToSendMail(chat?.fileURL);
                setOpenSendMail(true);
                setVisible(false)
              }}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/email.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Send email</Text>
            </Pressable>}
            {(chat?.fileURL && !chat?.favorites.includes(user?.uid)) && <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={initializeFavorite}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/favorite.png')}
              />
              <Text style={{
                color: Colors.black,
                fontSize: 12,
                textAlign: 'center',
              }}>Add Favorite</Text>
            </Pressable>}
            {(chat?.fileURL && chat?.favorites.includes(user?.uid)) && <Pressable
              style={{
                alignItems: 'center',
                borderRadius: 14,
                margin: 12,
                width: 55,
              }}
              onPress={removeFavorite}
            >
              <Image
                style={{
                  width: 25,
                  height: 25,
                }}
                source={require('@/files/favorite.png')}
              />
              <Text style={{
                color: Colors.red500,
                fontSize: 12,
                textAlign: 'center',
              }}>Remove Favorite</Text>
            </Pressable>}
          </View>
        {/* <List.Section title="Actions" titleStyle={{
          color: Colors.grey800,
        }}>
          <List.Item
            title="Reaction"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="emoticon-outline" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => {
              setOpenReactionModal(true);
              setVisible(false)
            }}
          />
          {chat?.fileURL && <List.Item
            title="Download"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="download" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => downloadFile(chat)}
          />}
          {(senderIsUser && isText) && <List.Item
            title="Edit"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="pencil" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => {
              setMessageToEdit(chat);
              setOpenEditMessage(true);
              setVisible(false)
            }}
          />}
          {senderIsUser && <List.Item
            title="Delete"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="delete" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => {
              setOpenDeleteConfirm(true);
              setVisible(false)
            }}
          />}
          <List.Item
            title="Check"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="check" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={initializeSelect}
          />
          <List.Item
            title="Reply"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="reply" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => {
              setMessageToReply(chat);
              setOpenReplyMessage(true);
              setVisible(false)
            }}
          />
          <List.Item
            title="Forward"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="forward" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => {
              setMessageToForward(chat);
              setOpenForwardMessage(true);
              setVisible(false)
            }}
          />
          {chat?.fileURL && <List.Item
            title="Send Mail"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="email" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={() => {
              setMessageToSendMail(chat?.fileURL);
              setOpenSendMail(true);
              setVisible(false)
            }}
          />}
          {(chat?.fileURL && chat?.favorites.includes(user?.uid)) && <List.Item
            title="Remove Favorite"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="bookmark" size={24} style={{color: Colors.red500}} />
                )}
              />
            )}
            onPress={removeFavorite}
          />}
          {(chat?.fileURL && !chat?.favorites.includes(user?.uid)) && <List.Item
            title="Add Favorite"
            style={{
              padding: 2,
            }}
            left={props => (
              <List.Icon
                {...props}
                icon={() => (
                  <MaterialCommunityIcons name="bookmark" size={24} style={{color: Colors.black}} />
                )}
              />
            )}
            onPress={initializeFavorite}
          />}
        </List.Section> */}
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
