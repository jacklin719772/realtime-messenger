import Input from '@/components/Input';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useModal } from '@/contexts/ModalContext';
import { useUser } from '@/contexts/UserContext';
import { useUserById } from '@/contexts/UsersContext';
import { modalStyles } from '@/styles/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useFormik } from 'formik';
import React from 'react'
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ActivityIndicator, Appbar, Colors, IconButton, ProgressBar } from 'react-native-paper';
import {v4 as uuidv4} from 'uuid';
import VideoModal from './Video';
import { getFileURL } from '@/lib/storage';
import { removeHtml } from '@/lib/removeHtml';
import { showAlert } from '@/lib/alert';
import { postData } from '@/lib/api-helpers';
import { useParams } from '@/contexts/ParamsContext';
import { getFileSize, getFormattedTime, getPassedDays } from '@/lib/convert';

function AudioPlayer({chat, setPosition, setVisible}) {
  const [sound, setSound] = React.useState(null);
  const [status, setStatus] = React.useState(null);

  async function loadAndPlaySound() {
    const {sound: soundSource} = await Audio.Sound.createAsync({
      uri: getFileURL(chat?.fileURL),
    });
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
              setPosition({
                x: Number(nativeEvent.pageX.toFixed(2)),
                y: Number(nativeEvent.pageY.toFixed(2)),
              });
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
          style={{width: 100, marginBottom: 2}}
          progress={progress || 0}
          color={Colors.grey700}
        />
        <Text style={{color: Colors.black, fontSize: 11, textAlign: 'left'}}>
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

  return (
    <Pressable
      style={{
        width: 150,
        height: 150,
        maxWidth: '100%',
      }}
      onPress={() => setOpen(true)}
      onLongPress={
        setPosition && setVisible
          ? ({nativeEvent}) => {
              setPosition({
                x: Number(nativeEvent.pageX.toFixed(2)),
                y: Number(nativeEvent.pageY.toFixed(2)),
              });
              setVisible(true);
            }
          : null
      }>
      <ImageBackground
        imageStyle={{
          resizeMode: 'cover',
          borderRadius: 10,
          width: 285,
          height: 285,
        }}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
        defaultSource={require('@/files/placeholder_600.jpg')}
        source={file ? {uri: file} : require('@/files/placeholder_600.jpg')}>
        <MaterialIcons
          name="play-arrow"
          size={60}
          style={{color: Colors.white}}
        />
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
              setPosition({
                x: Number(nativeEvent.pageX.toFixed(2)),
                y: Number(nativeEvent.pageY.toFixed(2)),
              });
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
          paddingHorizontal: 8,
          paddingVertical: 4,
          color: Colors.blue400,
          borderColor: Colors.blue400,
          borderWidth: 1,
          borderRadius: 8,
          width: 200,
          maxWidth: '100%',
        }}
      >
        {chat?.fileName} ({getFileSize(chat?.fileSize)})
      </Text>
      {open && (
        <FilePreviewModal
          open={open}
          setOpen={setOpen}
          uri={chat?.fileURL}
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

function ReplyMessage() {
  const {openReplyMessage: open, setOpenReplyMessage: setOpen} = useModal();
  const {messageToReply: message, setMessageToReply: setMessage, setMessageSent} = useMessageFeature();
  const {userdata, user} = useUser();
  const {chatId, chatType, workspaceId} = useParams();

  console.log(message);

  const senderIsUser = message?.senderId === user?.uid;
  const {value: recipient} = useUserById(message?.senderId);

  const sender = senderIsUser ? userdata : recipient;

  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({x: 0, y: 0});

  const messageType = getMessageType(message);
  const isText = messageType === 'text';

  // FORM ----------------------------------------------------------------
  const {handleSubmit, setFieldValue, values, isSubmitting} =
    useFormik({
      initialValues: {
        text: '',
      },
      enableReinitialize: true,
      onSubmit: async val => {
        try {
          if (!message) return;
          const messageId = uuidv4();
          await postData("/messages", {
            objectId: messageId,
            text: val.text.trim() ? `<p>${val.text}</p>` : "",
            chatId,
            workspaceId,
            chatType,
            replyId: message?.objectId,
            replyFileType: message?.fileType,
            replyFileName: message?.fileName,
            replyFileURL: message?.fileURL,
            replyFileSize: message?.fileSize,
            replyMediaDuration: message?.mediaDuration,
            replyMediaHeight: message?.mediaHeight,
            replyMediaWidth: message?.mediaWidth,
            replyText: message?.text,
            replyThumbnailURL: message?.thumbnailURL,
            replySenderId: message?.senderId,
            replyCreatedAt: new Date(message?.createdAt),
          });
          setMessageSent(true);
          setOpen(false);
          setMessage(null);
        } catch (err) {
          showAlert(err.message);
        }
      },
    });
  // ---------------------------------------------------------------------

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => {
        setOpen(!open);
        setMessage(null);
      }}>
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Appbar.Header
              statusBarHeight={0}
              style={{width: '100%', backgroundColor: '#fff'}}>
              <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
              <Appbar.Content title="Reply Message" />
              <Appbar.Action icon="check" onPress={handleSubmit} />
            </Appbar.Header>
            <ScrollView
              style={{
                width: '100%',
                height: '100%',
                paddingHorizontal: 20,
              }}>
              {isSubmitting && <ActivityIndicator style={{paddingVertical: 10}} />}
              <Text
                style={styles.editDescriptionText}
              >Please click the check button to reply this message.</Text>
              <View style={{display: 'flex', flexDirection: 'row', marginVertical: 12}}>
                {/* PROFILE PICTURE LEFT PART */}
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
                {/* MESSAGE RIGHT PART */}
                <View style={{flex: 1}}>{/* MESSAGE HEADER */}
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      ...(!message.text && {paddingBottom: 8}),
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
                      {getPassedDays(message?.createdAt)} {getFormattedTime(message?.createdAt)}
                    </Text>
                  </View>
                  {messageType === 'picture' && (
                    <ImageViewer
                      chat={message}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {messageType === 'video' && (
                    <VideoPlayer
                      chat={message}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {messageType === 'audio' && (
                    <AudioPlayer
                      chat={message}
                      {...(senderIsUser && {setPosition, setVisible})}
                    />
                  )}
                  {messageType === 'file' && (
                    <FileViewer
                      chat={message}
                      {...(senderIsUser && {setVisible})}
                    />
                  )}
                  {messageType === 'sticker' && <StickerViewer chat={message} />}
                  {isText && <Text style={styles.text}>{removeHtml(message?.text)}</Text>}
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Input
                  text={values.text}
                  placeholder="Please enter text if you'd like..."
                  setText={setFieldValue}
                  width="100%"
                  isSubmitting={isSubmitting}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  )
}

export default ReplyMessage

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 60,
    maxHeight: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 8,
  },
  editDescriptionText: {
    fontSize: 16,
    color: Colors.black,
    paddingTop: 24,
    paddingBottom: 12,
  },
  text: {
    fontSize: 15,
    letterSpacing: 0,
    fontWeight: '400',
    textAlign: 'left',
    color: Colors.black,
  },
  image: {
    width: 38,
    height: 38,
    marginLeft: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
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
  }
});
