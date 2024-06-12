import {useModal} from '@/contexts/ModalContext';
import {modalStyles} from '@/styles/styles';
import React, { useState } from 'react';
import {ActivityIndicator, FlatList, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Appbar, Colors, Divider, IconButton, ProgressBar, RadioButton} from 'react-native-paper';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import { useParams } from '@/contexts/ParamsContext';
import { useMessage, useMessagesByChat } from '@/hooks/useMessages';
import { getFileURL } from '@/lib/storage';
import { Audio } from 'expo-av';
import { convertMsToTime, equalDate, getFileSize, getFormattedDate, getFormattedTime } from '@/lib/convert';
import { useUser } from '@/contexts/UserContext';
import { useUserById } from '@/contexts/UsersContext';
import FilePreviewModal from './FilePreview';
import dayjs from 'dayjs';
import { removeHtml } from '@/lib/removeHtml';
import { reactions } from '@/lib/reactions';
import { useReactions } from '@/contexts/ReactionsContext';

function AudioPlayer({chat}) {
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
        <Text style={{color: Colors.black, fontSize: 12, textAlign: 'left', width: 118}} numberOfLines={1} ellipsizeMode='middle'>
          {chat?.fileName}
        </Text>
        <ProgressBar
          style={{
            width: 118, 
            marginVertical: 2,
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

function VideoPlayer({chat}) {

  return (
    <View
      style={{
        width: 150,
        height: 150,
        maxWidth: '100%',
      }}>
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
        <Text style={{
          color: Colors.white, 
          textAlign: 'center',
          marginLeft: 4,
        }}
        textBreakStrategy='simple'
        numberOfLines={1}
        ellipsizeMode='middle'>
          {chat?.fileName}
        </Text>
        <MaterialIcons
          name="movie"
          size={32}
          style={{color: Colors.white}}
        />
        <Text style={{
          color: Colors.white, 
          fontSize: 14, 
          textAlign: 'center',
          marginLeft: 4,
        }}>
          {convertMsToTime(Math.floor(chat?.mediaDuration * 1000))}
        </Text>
      </ImageBackground>
    </View>
  );
}

function ImageViewer({chat}) {

  return (
    <View
      style={{
        width: chat?.mediaHeight >= chat?.mediaWidth ? (chat?.mediaWidth * 150) / chat?.mediaHeight : 150,
        maxWidth: '100%',
        height: chat?.mediaHeight >= chat?.mediaWidth ? 150 : (chat?.mediaHeight * 150) / chat?.mediaWidth,
      }}>
      <ImageBackground
        imageStyle={{
          resizeMode: 'cover',
          borderRadius: 10,
          overlayColor: Colors.white,
          width: chat?.mediaHeight >= chat?.mediaWidth ? (chat?.mediaWidth * 150) / chat?.mediaHeight : 150,
          maxWidth: '100%',
          height: chat?.mediaHeight >= chat?.mediaWidth ? 150 : (chat?.mediaHeight * 150) / chat?.mediaWidth,
        }}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
        defaultSource={require('@/files/placeholder_600.jpg')}
        source={{uri: getFileURL(chat?.thumbnailURL || chat?.fileURL)}}>
        <Text
        style={{
          color: Colors.white, 
          textAlign: 'center',
          marginLeft: 4,
        }}
        textBreakStrategy='simple'
        numberOfLines={1}
        ellipsizeMode='middle'>
          {chat?.fileName}
        </Text>
        <MaterialIcons
          name="image"
          size={32}
          style={{color: Colors.white}}
        />
      </ImageBackground>
    </View>
  );
}

function FilePreviewer({chat}) {

  return (
    <View>
      <Text
        textBreakStrategy='simple'
        numberOfLines={1}
        ellipsizeMode='middle'
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          color: Colors.blue400,
          borderColor: Colors.blue400,
          borderWidth: 1,
          borderRadius: 8,
          width: '100%',
        }}
      >
        {chat?.fileName} ({getFileSize(chat?.fileSize)})
      </Text>
    </View>
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

function FileGalleryItem({
  message,
  previousSameSender,
  previousMessageDate,
  index,
}) {
  const {userdata, user} = useUser();
  const {setOpenSearchMessage} = useModal();
  const {chatId, setMessageId} = useParams();
  const senderIsUser = message?.senderId === user?.uid;
  const {value: recipient} = useUserById(message?.senderId);
  const {value: forwardUser} = useUserById(message?.forwardSenderId);
  const {value: replyUser} = useUserById(message?.replySenderId);

  const sender = senderIsUser ? userdata : recipient;

  const { value: forward, loading } = useMessage(message?.forwardId);

  const replyMessageType = getReplyMessageType(message);
  const isReplyText = replyMessageType === 'text';

  const [open, setOpen] = React.useState(false);

  const prevCreatedAt = new Date(previousMessageDate);
  const createdAt = new Date(message?.createdAt);
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
    message?.objectId
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

  return (
    <TouchableOpacity
      onPress={() => {
        setMessageId(message.objectId);
        setOpenSearchMessage(false);
      }}
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
      <View
        style={{
          flex: 1,
        }}
      >
        {displayProfilePicture && (
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
        )}
        {message?.replyId && (
          <View style={{
            display: 'flex', 
            flexDirection: 'row', 
            backgroundColor: Colors.grey200,
            paddingVertical: 2,
            paddingRight: 2,
            borderRadius: 4,
          }}>
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
                  ...(!message.replyText && {paddingBottom: 4}),
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
                  {getFormattedTime(message?.replyCreatedAt)}
                </Text>
              </View>
              {replyMessageType === 'picture' && (
                <ImageViewer
                  chat={{
                    objectId: message?.replyId,
                    fileName: message?.replyFileName,
                    fileType: message?.replyFileType,
                    fileSize: message?.replyFileSize,
                    fileURL: message?.replyFileURL,
                    senderId: message?.replySenderId,
                    createdAt: message?.replyCreatedAt,
                    mediaHeight: message.replyMediaHeight,
                    mediaWidth: message.replyMediaWidth,
                  }}
                />
              )}
              {replyMessageType === 'video' && (
                <VideoPlayer
                  chat={{
                    objectId: message?.replyId,
                    fileName: message?.replyFileName,
                    fileType: message?.replyFileType,
                    fileSize: message?.replyFileSize,
                    fileURL: message?.replyFileURL,
                    senderId: message?.replySenderId,
                    createdAt: message?.replyCreatedAt,
                  }}
                />
              )}
              {replyMessageType === 'audio' && (
                <AudioPlayer
                  chat={{
                    objectId: message?.replyId,
                    fileName: message?.replyFileName,
                    fileType: message?.replyFileType,
                    fileSize: message?.replyFileSize,
                    fileURL: message?.replyFileURL,
                    senderId: message?.replySenderId,
                    createdAt: message?.replyCreatedAt,
                    mediaDuration: message.replyMediaDuration,
                  }}
                />
              )}
              {replyMessageType === 'sticker' && <StickerViewer chat={message} />}
              {isReplyText && <Text style={styles.replyText}>{removeHtml(message?.replyText)}</Text>}
              {replyMessageType === 'file' && (
                <FilePreviewer
                  chat={{
                    objectId: message?.replyId,
                    fileName: message?.replyFileName,
                    fileType: message?.replyFileType,
                    fileSize: message?.replyFileSize,
                    fileURL: message?.replyFileURL,
                    senderId: message?.replySenderId,
                    createdAt: message?.replyCreatedAt
                  }}
                />
              )}
            </View>
          </View>
        )}
        
        {(message?.forwardId && forward && !loading) && (
          <View style={{
            display: 'flex', 
            flexDirection: 'row',
            backgroundColor: Colors.grey200,
            paddingVertical: 2,
            paddingRight: 2,
            borderRadius: 4,
          }}>
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
                  ...(!message.text && {paddingBottom: 4}),
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
                  {getFormattedTime(message?.forwardCreatedAt)}
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
              {getMessageType(message) === 'sticker' && <StickerViewer chat={message} />}
              {getMessageType(message) === 'text' && <Text style={styles.replyText}>{removeHtml(message?.text)}</Text>}
            </View>
          </View>
        )}
        {!message?.forwardId && (
          <>
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
          {getMessageType(message) === 'text' && (
            <Text style={styles.text}>{removeHtml(message.text)}</Text>
          )}
          </>
        )}
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
        }}>
          {reactions.filter((reaction) => Object.keys(groupedReactions).includes(reaction.value || "")).map((reaction, index) => (
            <View key={index} style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: 36,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: reaction.bgColor,
              padding: 1,
              marginRight: 2,
            }}>
              <MaterialCommunityIcons name={reaction.icon} color={reaction.bgColor} size={18} />
              <Text style={{
                fontSize: 12,
                color: reaction.bgColor,
              }}>
                {groupedReactions[(reaction.value) || ""].length || 0}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {open && (
        <FilePreviewModal
          open={open}
          setOpen={setOpen}
          chat={message}
        />
      )}
    </TouchableOpacity>
  )
}

export default function MessageSearchModal() {
  const {chatId} = useParams();
  const {openSearchMessage: open, setOpenSearchMessage: setOpen} = useModal();
  const today = new Date();

  // LOAD DATA AND PAGINATION --------------------------------------------
  const [page, setPage] = useState(1);
  const { value: messages, loading } = useMessagesByChat(chatId, page);
  const [checked, setChecked] = useState("0");
  const [search, setSearch] = useState("");
  const [filterType, setFileterType] = useState(null);
  const [dateFilter, setDateFilter] = useState(dayjs(today).add(-5, 'year').toDate());

  const filteredMessages = React.useMemo(() => {
    const result = messages.filter((message) => (
      (message.text && !message.text.includes('[Jitsi_Call_Log:]: ') && message.text.toLowerCase().includes(search.toLowerCase())) || (message.fileURL && message.fileName.toLowerCase().includes(search.toLowerCase()))
    ) && new Date(message.createdAt).getTime() >= dateFilter.getTime());
    return result;
  },
  [messages, checked]);

  React.useEffect(() => {
    if (checked === "3m") {
      setDateFilter(dayjs(today).add(-3, 'month').toDate());
      console.log(dayjs(today).add(-3, 'month').toDate());
    } else if (checked === "1y") {
      setDateFilter(dayjs(today).add(-1, 'year').toDate());
      console.log(dayjs(today).add(-1, 'year').toDate());
    } else {
      setDateFilter(dayjs(today).add(-5, 'year').toDate());
      console.log(dayjs(today).add(-5, 'year').toDate());
    }
  }, [checked]);

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
            <Appbar.Action icon={filterType ? "window-close" : "arrow-left"} onPress={() => {
              if (!filterType) {
                setOpen(!open);
              } else {
                setFileterType(null);
                setSearch("");
                setChecked("0");
              }
            }} />
            <Appbar.Content title="Search chat history" />
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
                justifyContent: 'center',
                width: '100%',
                padding: 12,
                elevation: 5,
                backgroundColor: '#f8fafc',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <TextInput
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: Colors.grey800,
                    width: '80%',
                    padding: 4,
                  }}
                  value={search}
                  onChangeText={text => setSearch(text)}
                />
                <TouchableOpacity
                  style={{
                    borderRadius: 14,
                    margin: 4,
                  }}
                  onPress={() => {}}
                >
                  <MaterialIcons name="search" size={25} color={Colors.grey800} />
                </TouchableOpacity>
                <IconButton
                  icon="close"
                  color={Colors.grey800}
                  size={25}
                  onPress={() => setSearch("")}
                  style={{
                    margin: 0,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  width: '80%',
                  marginTop: 8,
                  marginLeft: -4,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <RadioButton
                    value="0"
                    status={checked === "0" ? "checked" : "unchecked"}
                    onPress={() => setChecked("0")}
                  />
                  <Text style={{
                    color: Colors.black,
                  }}>All</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <RadioButton
                    value="3m"
                    status={checked === "3m" ? "checked" : "unchecked"}
                    onPress={() => setChecked("3m")}
                  />
                  <Text style={{
                    color: Colors.black,
                  }}>Last 3 months</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <RadioButton
                    value="1y"
                    status={checked === "1y" ? "checked" : "unchecked"}
                    onPress={() => setChecked("1y")}
                  />
                  <Text style={{
                    color: Colors.black,
                  }}>Past year</Text>
                </View>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                width: '100%',
              }}
            >
              {loading && <ActivityIndicator style={{paddingVertical: 10}} />}
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
                  // onEndReached={
                  //   !loading &&
                  //   filteredMessages?.length > 0 &&
                  //   filteredMessages?.length === page * env.MESSAGES_PER_PAGE
                  //     ? () => {
                  //         setPage(page + 1);
                  //       }
                  //     : null
                  // }
                  // onEndReachedThreshold={0.1}
                  // inverted
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
                      <FileGalleryItem
                        message={item}
                        index={index}
                        previousSameSender={
                          index !== filteredMessages?.length
                            ? filteredMessages[index + 1]?.senderId === item?.senderId
                            : false
                        }
                        previousMessageDate={filteredMessages[index + 1]?.createdAt}
                      />
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
                      fontSize: 16,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: Colors.black,
                    }}
                  >No results</Text>
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
  input: {
    fontSize: 16,
    color: Colors.black,
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
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
    width: '70%',
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
