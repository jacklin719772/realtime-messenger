import Input from '@/components/Input';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useModal } from '@/contexts/ModalContext';
import { useUser } from '@/contexts/UserContext';
import { useUserById, useUsers } from '@/contexts/UsersContext';
import { modalStyles } from '@/styles/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useFormik } from 'formik';
import React, { useEffect, useMemo, useState } from 'react'
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ActivityIndicator, Appbar, Colors, ProgressBar } from 'react-native-paper';
import {v4 as uuidv4} from 'uuid';
import VideoModal from './Video';
import { getFileURL } from '@/lib/storage';
import { removeHtml } from '@/lib/removeHtml';
import Autocomplete from 'react-native-autocomplete-input';
import Fontisto from '@expo/vector-icons/Fontisto';
import { useChannels } from '@/contexts/ChannelsContext';
import { useDirectMessages } from '@/contexts/DirectMessagesContext';
import { showAlert } from '@/lib/alert';
import { useNavigation } from '@react-navigation/native';
import { useParams } from '@/contexts/ParamsContext';
import { getFileSize, getFormattedDate, getFormattedTime, getPassedDays } from '@/lib/convert';
import { postData } from '@/lib/api-helpers';
import { cacheThumbnails } from '@/lib/thumbnails';

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

function AutocompleteItem({direct}) {
  const {user} = useUser();

  return (
    <View
      key={direct.objectId}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderColor: Colors.grey200,
        borderBottomWidth: 1,
        height: 40,
        paddingHorizontal: 12,
      }}
    >
      <View style={{
        position: 'relative',
        width: 40,
      }}>
        {direct?.chatType === "Channel" ? 
          <Fontisto name="hashtag" size={20} /> : 
          <Image
            style={{
              width: 30,
              height: 30,
              borderRadius: 5,
            }}
            source={
              direct?.thumbnailURL && direct?.thumbnailURL !== ""
                ? {uri: getFileURL(direct?.thumbnailURL)}
                : require('@/files/blank_user.png')
            }
          />
        }
      </View>
      <Text
        style={{
          color: Colors.grey900,
          fontWeight: 'bold',
        }}
      >{`${direct?.name}${direct?.userId === user?.uid ? ' (me)' : ''}`}</Text>
    </View>
  );
}

function ForwardMessage() {
  const navigation = useNavigation();

  const {openForwardMessage: open, setOpenForwardMessage: setOpen} = useModal();
  const {messageToForward: message, setMessageToForward: setMessage, setMessageSent} = useMessageFeature();
  const {userdata, user} = useUser();
  const {value: channels} = useChannels();
  const {value: directs} = useDirectMessages();
  const {value: members} = useUsers();
  const {workspaceId} = useParams();

  const senderIsUser = message?.senderId === user?.uid;
  const {value: recipient} = useUserById(message?.senderId);

  const sender = senderIsUser ? userdata : recipient;

  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({x: 0, y: 0});
  const [chatId, setChatId] = useState(null);
  const [chatType, setChatType] = useState("Channel");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const messageType = getMessageType(message);
  const isText = messageType === 'text';

  const channelList = useMemo(() => 
    channels.map((channel) => ({
      name: channel.name,
      photoURL: "",
      thumbnailURL: "",
      userId: "",
      objectId: channel.objectId,
      chatType: "Channel"
    }))
  , [channels]);
  const dmList = useMemo(() => 
    directs.map((dm) => ({
      name: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName,
      photoURL: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].photoURL,
      thumbnailURL: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].thumbnailURL,
      userId: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].objectId,
      objectId: dm.objectId,
      chatType: "Direct"
    }))
  , [directs, members]);

  const data = useMemo(() => !focused ? [] : channelList.concat(dmList).filter((d) => d.name.toLowerCase().includes(query.toLowerCase())).map((item, index) => ({
    ...item,
    id: index
  })), [channelList, dmList, query]);

  const suggestions = useMemo(() => data.length === 1 && data[0].name.toLowerCase() === query.toLowerCase() ?
    [] : data
  , [data, query]);

  useEffect(() => {
    if (query === '') {
      setChatId(null);
      setChatType("Channel");
    }
    if (data.length === 1 && data[0].name.toLowerCase() === query.toLowerCase()) {
      setQuery(data[0].name);
      setChatId(data[0].objectId);
      setChatType(data[0].chatType);
    }
  }, [data, query]);

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
          if (!chatId || chatId === "") return;
          const messageId = uuidv4();
          const messageId2 = uuidv4();
          if (val.text?.trim()) {
            await postData("/messages", {
              objectId: messageId,
              text: val.text,
              chatId,
              workspaceId,
              chatType,
            });
          }
          await postData("/messages", {
            objectId: messageId2,
            text: message?.text,
            chatId,
            workspaceId,
            fileName: message?.fileName,
            filePath: message?.fileURL,
            chatType,
            forwardId: message?.objectId,
            forwardChatId: message?.chatId,
            forwardChatType: message?.chatType,
            forwardSenderId: message?.senderId,
            forwardCreatedAt: new Date(message?.createdAt),
          });
          setMessageSent(true);
          console.log('chatId: ', chatId);
          navigation.navigate('Home');
          // navigation.navigate('Chat', {
          //   objectId: chatId,
          // });
          // setOpen(false);
          // setMessage(null);
        } catch (err) {
          showAlert(err.message);
        }
      },
    });
  // ---------------------------------------------------------------------

  useEffect(() => {
    return () => {
      setMessage(null);
      setChatId(null);
      setChatType("Channel");
      setQuery("");
      setVisible(false);
      setPosition({x: 0, y: 0});
    }
  }, []);

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
              <Appbar.Content title="Forward Message" />
              <Appbar.Action icon="check" disabled={chatId === null} onPress={handleSubmit} />
            </Appbar.Header>
            <View style={{
              width: '100%',
              height: 64,
              position: 'relative',
            }}>
              <View style={{
                flex: 1,
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                zIndex: 1,
                paddingHorizontal: 20,
                paddingVertical: 24,
              }}>
                <Autocomplete
                  autoComplete="email"
                  data={suggestions}
                  value={query}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChangeText={(text) => setQuery(text)}
                  ceholder='Select channel or person'
                  flatListProps={{
                    keyboardShouldPersistTaps: 'always',
                    keyExtractor: (item) => item?.objectId,
                    renderItem: ({item}) => (
                      <TouchableOpacity key={item.objectId} onPress={() => {
                        setQuery(item.name);
                        setChatId(item.objectId);
                        setChatType(item.chatType);
                      }}>
                        <AutocompleteItem direct={item} />
                      </TouchableOpacity>
                    )
                  }}
                />
              </View>
            </View>
            <ScrollView
              style={{
                width: '100%',
                height: '100%',
                paddingHorizontal: 20,
              }}>
              {isSubmitting && <ActivityIndicator style={{paddingVertical: 10}} />}
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

export default ForwardMessage

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
