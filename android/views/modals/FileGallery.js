import {useModal} from '@/contexts/ModalContext';
import {modalStyles} from '@/styles/styles';
import React, { useState } from 'react';
import {FlatList, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Appbar, Colors, Divider, IconButton, Modal as RNPModal, Portal, ProgressBar, List, Dialog, Button} from 'react-native-paper';
import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { useParams } from '@/contexts/ParamsContext';
import { useMessagesByChat } from '@/hooks/useMessages';
import { getFileURL, uploadFile } from '@/lib/storage';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { cacheThumbnails } from '@/lib/thumbnails';
import VideoModal from './Video';
import { convertMsToTime, equalDate, getFileSize, getFormattedDate, getFormattedTime } from '@/lib/convert';
import FullScreenPictureModal from './FullScreenPicture';
import { useUser } from '@/contexts/UserContext';
import { useUserById } from '@/contexts/UsersContext';
import { useMessageFeature } from '@/contexts/MessageContext';
import FilePreviewModal from './FilePreview';
import { showAlert } from '@/lib/alert';
import { postData } from '@/lib/api-helpers';
import { now } from '@/lib/auth';
import {v4 as uuidv4} from 'uuid';
import * as mime from 'react-native-mime-types';
import FileViewer from 'react-native-file-viewer';
import RNFS from "react-native-fs";
import Share from 'react-native-share';
import * as Clipboard from 'expo-clipboard';

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
          size={24}
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
        <Text style={{color: Colors.black, fontSize: 12, textAlign: 'left'}}>
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

  const previewFile = async (chat) => {
    const uri = chat.fileURL;
    setOpenSelect(false);
    const fileName = chat.fileName;
    const file = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    setLocalFile(`${RNFS.DownloadDirectoryPath}/${fileName}`);
    const options = {
      fromUrl: getFileURL(uri),
      toFile: file,
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

      // Download the file
      const downloadResult = await RNFS.downloadFile(options).promise;

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
      
      <Modal
      animationType="fade"
      transparent={true}
      visible={openSelect}
      onRequestClose={() => {
        setOpenMenu(!openSelect);
      }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
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
        </View>
      </Modal>
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
        source={{uri: getFileURL(chat?.fileURL)}}
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

  const previewFile = async (chat) => {
    const uri = chat.fileURL;
    setOpenSelect(false);
    const fileName = chat.fileName;
    const file = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    setLocalFile(`${RNFS.DownloadDirectoryPath}/${fileName}`);
    const options = {
      fromUrl: getFileURL(uri),
      toFile: file,
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

      // Download the file
      const downloadResult = await RNFS.downloadFile(options).promise;

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
      
      <Modal
      animationType="fade"
      transparent={true}
      visible={openSelect}
      onRequestClose={() => {
        setOpenMenu(!openSelect);
      }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
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
        </View>
      </Modal>
    </Pressable>
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

function FileGalleryItem({message}) {
  const {userdata, user} = useUser();
  const senderIsUser = message?.senderId === user?.uid;
  const {value: recipient} = useUserById(message?.senderId);

  const sender = senderIsUser ? userdata : recipient;

  const {openSendMail, setOpenSendMail} = useModal();
  const {messageToSendMail, setMessageToSendMail} = useMessageFeature();

  const [open, setOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(false);

  return (
    <View
      onPress={() => {}}
      style={{
        flexDirection: 'row',
        padding: 5,
      }}>
      <View
        style={{
          width: 55,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}>
        <Image
          style={[styles.image]}
          source={
            sender?.thumbnailURL
              ? {uri: getFileURL(sender?.thumbnailURL)}
              : require('@/files/blank_user.png')
          }
        />
      </View>
      <View
        style={{
          flex: 1,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            ...(getMessageType(message) !== 'text' && {paddingBottom: 8}),
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
            {getFormattedTime(message?.createdAt)}
          </Text>
        </View>
        {getMessageType(message) === 'picture' && (
          <ImageViewer
            chat={message}
          />
        )}
        {getMessageType(message) === 'video' && (
          <VideoPlayer
            chat={message}
          />
        )}
        {getMessageType(message) === 'audio' && (
          <AudioPlayer
            chat={message}
          />
        )}
        {getMessageType(message) === 'file' && (
          <FilePreviewer
            chat={message}
          />
        )}
        {/* <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <IconButton
            icon="eye"
            color={Colors.grey800}
            onPress={() => setOpen(true)}
          />
          <IconButton
            icon="send"
            color={Colors.grey800}
            onPress={() => {
              setMessageToSendMail(message?.fileURL);
              setOpenSendMail(true);
            }}
          />
        </View> */}
      </View>
      <View
        style={{
          width: 45,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
        <IconButton
          icon="dots-horizontal"
          color={Colors.grey800}
          size={28}
          style={{
            margin: 0,
          }}
          onPress={() => setOpenMenu(true)}
        />
      </View>
      <Modal
      animationType="fade"
      transparent={true}
      visible={openMenu}
      onRequestClose={() => {
        setOpenMenu(!openMenu);
      }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* <View
            style={styles.modalContainer}
          >
            <List.Section title="Actions" titleStyle={{
              color: Colors.grey800,
            }}>
              <List.Item
                title="Preview"
                style={{
                  padding: 0,
                }}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={() => (
                      <MaterialCommunityIcons name="eye" size={24} style={{color: Colors.black}} />
                    )}
                  />
                )}
                onPress={() => {
                  setOpen(true);
                  setOpenMenu(false);
                }}
              />
              <List.Item
                title="Send E-mail"
                style={{
                  padding: 0,
                }}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={() => (
                      <MaterialCommunityIcons name="send" size={24} style={{color: Colors.black}} />
                    )}
                  />
                )}
                onPress={() => {
                  setMessageToSendMail(message?.fileURL);
                  setOpenSendMail(true);
                  setOpenMenu(false);
                }}
              />
            </List.Section>
          </View> */}
        <RNPModal
          visible={openMenu}
          onDismiss={() => setOpenMenu(false)}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <List.Section title="More Actions" titleStyle={{
            color: Colors.grey800,
          }}>
            <List.Item
              title="Preview"
              style={{
                padding: 2,
              }}
              left={props => (
                <List.Icon
                  {...props}
                  icon={() => (
                    <MaterialCommunityIcons name="eye" size={24} style={{color: Colors.black}} />
                  )}
                />
              )}
              onPress={() => {
                setOpen(true);
                setOpenMenu(false);
              }}
            />
            <List.Item
              title="Send E-mail"
              style={{
                padding: 2,
              }}
              left={props => (
                <List.Icon
                  {...props}
                  icon={() => (
                    <MaterialCommunityIcons name="send" size={24} style={{color: Colors.black}} />
                  )}
                />
              )}
              onPress={() => {
                setMessageToSendMail(message?.fileURL);
                setOpenSendMail(true);
                setOpenMenu(false);
              }}
            />
          </List.Section>
        </RNPModal>
        </View>
      </Modal>
      {openMenu && (
      <Portal>
        <RNPModal
          visible={openMenu}
          onDismiss={() => setOpenMenu(false)}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <List.Section title="More Actions" titleStyle={{
            color: Colors.grey800,
          }}>
            <List.Item
              title="Preview"
              style={{
                padding: 2,
              }}
              left={props => (
                <List.Icon
                  {...props}
                  icon={() => (
                    <MaterialCommunityIcons name="eye" size={24} style={{color: Colors.black}} />
                  )}
                />
              )}
              onPress={() => {
                setOpen(true);
                setOpenMenu(false);
              }}
            />
            <List.Item
              title="Send E-mail"
              style={{
                padding: 2,
              }}
              left={props => (
                <List.Icon
                  {...props}
                  icon={() => (
                    <MaterialCommunityIcons name="send" size={24} style={{color: Colors.black}} />
                  )}
                />
              )}
              onPress={() => {
                setMessageToSendMail(message?.fileURL);
                setOpenSendMail(true);
                setOpenMenu(false);
              }}
            />
          </List.Section>
        </RNPModal>
      </Portal>
      )}
      {open && (
        <FilePreviewModal
          open={open}
          setOpen={setOpen}
          chat={message}
        />
      )}
    </View>
  )
}

export default function FileGalleryModal() {
  const {chatId, workspaceId} = useParams();
  const {openFileGallery: open, setOpenFileGallery: setOpen} = useModal();
  const {userdata, user} = useUser();
  const {setMessageSent} = useMessageFeature();

  // const senderIsUser = chat?.senderId === user?.uid;
  // const {value: recipient} = useUserById(chat?.senderId);

  const { value: messages } = useMessagesByChat(chatId);
  const [checked, setChecked] = useState("all");
  const [openSelect, setOpenSelect] = useState(false);
  const renderItems = [
    {
      label: 'All',
      value: 'all',
      icon: () => <MaterialCommunityIcons name="folder-outline" color={Colors.grey800} size={18} />,
    },
    {
      label: 'Image',
      value: 'image/',
      icon: () => <MaterialCommunityIcons name="image-outline" color={Colors.grey800} size={18} />,
    },
    {
      label: 'Audio',
      value: 'audio/',
      icon: () => <MaterialCommunityIcons name="music-box-outline" color={Colors.grey800} size={18} />,
    },
    {
      label: 'Video',
      value: 'video/',
      icon: () => <MaterialCommunityIcons name="movie-outline" color={Colors.grey800} size={18} />,
    },
    {
      label: 'Others',
      value: 'others',
      icon: () => <MaterialCommunityIcons name="file-document-outline" color={Colors.grey800} size={18} />,
    },
  ];

  const filteredMessages = React.useMemo(() => {
    const result = (checked === "all") ? messages.filter((message) => message.fileURL) : 
      (checked !== "others") ? messages.filter((message) => message.fileURL && message.fileType.includes(checked)) : 
        messages.filter((message) => message.fileURL && !message?.fileType?.includes("audio/") && !message?.fileType?.includes("video/") && !message?.fileType?.includes("image/"));
    return result;
  },
  [messages, checked]);

  const handlePickerResult = async result => {
    try {
      if (!result.cancelled) {
        // Get file name from URI
        const fileName = result.uri.split('/').pop();
  
        const fileType = mime.lookup(result.uri);
  
        const messageId = uuidv4();
  
        const filePath = await uploadFile(
          'messenger',
          `${now()}.${fileName.split(".").pop()}`,
          result.uri,
          fileType,
          fileName,
        );
  
        await postData('/messages', {
          objectId: messageId,
          text: '',
          chatId,
          workspaceId,
          fileName,
          filePath,
          chatType,
        });
        setMessageSent(true);
      }
    } catch (err) {
      showAlert(err.message);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === 'success') {
        await handlePickerResult(result);
      }
    } catch (err) {
      showAlert(err);
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => {
        setOpen(!open);
      }}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Appbar.Header
            statusBarHeight={0}
            style={{
              width: '100%',
              backgroundColor: '#fff',
            }}>
            <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
            <Appbar.Content title="File Gallery" />
          </Appbar.Header>
          <View
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                padding: 16,
              }}
            >
              <View
                style={{
                  width: '40%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 16,
                }}
              >
                <DropDownPicker
                  open={openSelect}
                  value={checked}
                  items={renderItems}
                  setOpen={setOpenSelect}
                  setValue={setChecked}
                  containerStyle={{
                    height: 50,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: Colors.white,
                  }}
                  listItemContainerStyle={{
                    padding: 0,
                  }}
                />
              </View>
              <Pressable
                style={{
                  flexDirection: 'row',
                  width: '60%',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  paddingVertical: 12,
                }}
                onPress={pickDocument}
              >
                <Text
                  style={{
                    fontSize: 16,
                    textAlign: 'center',
                    color: Colors.grey800
                  }}
                >
                  Upload New File
                </Text>
                <MaterialCommunityIcons name="plus" color={Colors.grey800} size={25} />
              </Pressable>
            </View>
            <View
              style={{
                flex: 1,
                width: '100%',
              }}
            >
              {filteredMessages?.length > 0 ? (
                <FlatList
                  horizontal={false}
                  data={filteredMessages}
                  ListHeaderComponent={() => (
                    <Divider style={{height: 10, opacity: 0}} />
                  )}
                  ListFooterComponent={() => (
                    <Divider style={{height: 10, opacity: 0}} />
                  )}
                  renderItem={({item, index}) => (
                    <View key={index}>
                      {(index === 0 || (index > 0 && !equalDate(item?.createdAt, filteredMessages[index - 1]?.createdAt))) && 
                        <Text
                          style={{
                            fontSize: 15,
                            textAlign: 'center',
                            color: Colors.black,
                          }}
                        >
                          {getFormattedDate(item?.createdAt)}
                        </Text>
                      }
                      <FileGalleryItem message={item} />
                    </View>
                  )}
                  keyExtractor={item => item?.objectId}
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: Colors.black,
                    }}
                  >No files for this category</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
