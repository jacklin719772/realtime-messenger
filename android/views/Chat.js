import Input from '@/components/Input';
import Message from '@/components/Message';
import PresenceIndicator from '@/components/PresenceIndicator';
import {env} from '@/config/env';
import {useChannelById} from '@/contexts/ChannelsContext';
import {useDetailByChat} from '@/contexts/DetailsContext';
import {
  useDirectMessageById,
  useDirectRecipient,
} from '@/contexts/DirectMessagesContext';
import {useModal} from '@/contexts/ModalContext';
import {useParams} from '@/contexts/ParamsContext';
import {useUser} from '@/contexts/UserContext';
import {useUsers} from '@/contexts/UsersContext';
import {useMessagesByChat} from '@/hooks/useMessages';
import {showAlert} from '@/lib/alert';
import {deleteData, postData} from '@/lib/api-helpers';
import {usePresenceByUserId} from '@/lib/usePresence';
import AudioModal from '@/views/modals/Audio';
import ChannelDetailsModal from '@/views/modals/ChannelDetails';
import DirectDetailsModal from '@/views/modals/DirectDetails';
import MessageTypeModal from '@/views/modals/MessageType';
import StickersModal from '@/views/modals/Stickers';
import {useFormik} from 'formik';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Modal as RNModal,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Checkbox,
  Colors,
  Dialog,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
  TextInput as RNPInput
} from 'react-native-paper';
import * as mime from 'react-native-mime-types';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {v4 as uuidv4} from 'uuid';
import EditMessage from './modals/EditMessage';
import ReplyMessage from './modals/ReplyMessage';
import ForwardMessage from './modals/ForwardMessage';
import SendMail from './modals/SendMail';
import { useMessageFeature } from '@/contexts/MessageContext';
import { equalDate, getFormattedDate } from '@/lib/convert';
import icon from '@/components/icon';
import { getFileURL, uploadFile } from '@/lib/storage';
import MultipleForwardMessage from './modals/MultipleForwardMessage';
import { now } from '@/lib/auth';
import EmojiSelector, { Categories } from '@manu_omg/react-native-emoji-selector';
import VideoRecorder from './modals/VideoRecorder';
import { useMeeting } from '@/contexts/MeetingContext';
import { randomRoomName } from '@/lib/jitsiGenerator';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import WebOfficeModal from './modals/WebOffice';
import FileGalleryModal from './modals/FileGallery';
import FavoriteModal from './modals/Favorite';
import ChatActionModal from './modals/ChatAction';
import UserListModal from './modals/UserList';
import MessageSearchModal from './modals/MessageSearch';

function ChannelHeader({channel}) {
  const {setOpenChannelDetails} = useModal();
  return (
    <Pressable
      onPress={() => setOpenChannelDetails(true)}
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View>
        <Text style={{fontSize: 20, fontWeight: 'bold', marginLeft: -12}}># {channel.name.length > 7 ? `${channel.name.substr(0, 7)}...` : channel.name} ({channel.members.length})</Text>
        {/* <Text style={{fontSize: 14, color: Colors.grey600}}>
          {channel.members.length} members
        </Text> */}
      </View>
    </Pressable>
  );
}

function DirectHeader({otherUser, isMe}) {
  const {setOpenDirectDetails} = useModal();
  const {isPresent} = usePresenceByUserId(otherUser?.objectId);

  return (
    <Pressable
      onPress={() => setOpenDirectDetails(true)}
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: -16,
          }}>
          <PresenceIndicator isPresent={isPresent} absolute={false} />
          <Text
            style={{fontSize: 20, fontWeight: 'bold', paddingHorizontal: 8}}>
            {otherUser.displayName}
            {isMe ? ' (me)' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Chat({navigation}) {
  const {userdata, user} = useUser();
  const {chatId, chatType, workspaceId, messageId, setChatId, setChatType} = useParams();
  const {
    openChannelDetails, 
    openDirectDetails, 
    openStickers, 
    setOpenStickers, 
    openEditMessage, 
    openReplyMessage, 
    openForwardMessage, 
    openSendMail, 
    setOpenSendMail, 
    setInitialUsers,
    openMultipleForwardMessage, 
    setOpenMultipleForwardMessage, 
    openFileGallery, 
    setOpenFileGallery,
    openSearchMessage,
    setOpenSearchMessage,
    openWebOffice,
    setOpenWebOffice,
    webOfficeSrc,
    setWebOfficeSrc,
    openFavorite,
  } = useModal();
  const {messageToEdit, messageToReply, messageToForward, messageToSendMail, setMessageToSendMail, checkedMessages, setCheckedMessages, isSelecting, setIsSelecting, setMessageSent, searchText, setSearchText, isSearching, setIsSearching} = useMessageFeature();
  const { openCalling, setOpenCalling, recipientInfo, setRecipientInfo, senderInfo, setSenderInfo, setRoomName, setIsVideoDisabled, openMeetingModal, isVideoDisabled, setEnableMic } = useMeeting();

  const [checkedUsers, setCheckedUsers] = useState([]);
  const [openMemberModal, setOpenMemberModal] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);
  const {value: users} = useUsers();

  const flatListRef = React.useRef(null);

  React.useEffect(() => {
    console.log('openMenu: ', openMenu);
  }, [openMenu]);

  React.useEffect(() => {
    if (messageId) {
      const index = messages.findIndex(msg => msg.objectId === messageId);
      console.log('Message Exist: ', messageId, index);
      if (index !== -1) {
        flatListRef.current.scrollToIndex({ animated: true, index });
      }
    }
  }, [messageId]);

  // CHANNELS ------------------------------------------------------------
  const {value: channel} = useChannelById(chatId);
  const channelUsers = (chatType === "Channel" && users) ? users.filter((u) => (channel?.members.includes(u?.objectId) && u?.objectId !== userdata?.objectId)) : [];
  const isUserSelected = (user) => {
    return checkedUsers.filter((c) => c?.objectId === user?.objectId).length > 0;
  }

  const handleUserSelect = (checked, user) => {
    if (checked) {
      setCheckedUsers([...checkedUsers, user]);
    } else {
      setCheckedUsers(checkedUsers.filter((i) => i.objectId !== user?.objectId));
    }
  }

  React.useLayoutEffect(() => {
    if (isSelecting) {
      navigation.setOptions({
        headerTitle: () => (
          <Text style={{ fontSize: 20, fontWeight: 'bold', }}>
            {checkedMessages.length > 1 ? `${checkedMessages.length} messages selected` : `${checkedMessages.length} message selected`}
          </Text>
        ),
        headerRight: () => (
          <IconButton
            icon="close"
            color={Colors.grey800}
            size={25}
            onPress={() => {
              setIsSelecting(false);
              setCheckedMessages([]);
            }}
          />
        ),
      });
    } else {
      if (channel) {
        navigation.setOptions({
          headerTitle: () => <ChannelHeader channel={channel} />,
          headerRight: () => (
            <View style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                style={{
                  borderRadius: 14,
                  margin: 4,
                }}
                onPress={() => {
                  setOpenSearchMessage(true);
                  setSearchText("");
                }}
              >
                <MaterialIcons name="search" size={25} color={Colors.grey800} />
              </TouchableOpacity>
              <IconButton
                icon="phone"
                color={Colors.grey800}
                size={25}
                onPress={() => {
                  setOpenMemberModal(true);
                  setIsAudioOnly(true);
                }}
                style={{
                  margin: 0,
                }}
              />
              <IconButton
                icon="video"
                color={Colors.grey800}
                size={25}
                onPress={() => {
                  setOpenMemberModal(true);
                  setIsAudioOnly(false);
                }}
                style={{
                  margin: 0,
                }}
              />
              <IconButton
                icon="dots-vertical"
                color={Colors.grey800}
                size={25}
                onPress={() => {setOpenMenu(true)}}
                style={{
                  margin: 0,
                }}
              />
            </View>
          ),
        });
      }
    }
  }, [channel, isSelecting, checkedMessages]);
  // ---------------------------------------------------------------------

  // DIRECTS -------------------------------------------------------------
  const {value: directMessage} = useDirectMessageById(chatId);
  const {value: otherUser, isMe} = useDirectRecipient(chatId);

  React.useLayoutEffect(() => {
    if (isSelecting) {
      navigation.setOptions({
        headerTitle: () => (
          <Text style={{ fontSize: 20, fontWeight: 'bold', }}>
            {checkedMessages.length > 1 ? `${checkedMessages.length} messages selected` : `${checkedMessages.length} message selected`}
          </Text>
        ),
        headerRight: () => (
          <IconButton
            icon="close"
            color={Colors.grey800}
            size={25}
            onPress={() => {
              setIsSelecting(false);
              setCheckedMessages([]);
            }}
          />
        ),
      });
    } else {
      if (otherUser) {
        navigation.setOptions({
          headerTitle: () => <DirectHeader otherUser={otherUser} isMe={isMe} />,
          headerRight: () => (
            <View style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TouchableOpacity
                style={{
                  borderRadius: 14,
                  margin: 4,
                }}
                onPress={() => {
                  setOpenSearchMessage(true);
                  setSearchText("");
                }}
              >
                <MaterialIcons name="search" size={25} color={Colors.grey800} />
              </TouchableOpacity>
              {!isMe &&
              <IconButton
                icon="phone"
                color={Colors.grey800}
                size={25}
                onPress={() => {handleCallingButton(true)}}
                style={{
                  margin: 0,
                }}
              />}
              {!isMe &&
              <IconButton
                icon="video"
                color={Colors.grey800}
                size={25}
                onPress={() => {handleCallingButton(false)}}
                style={{
                  margin: 0,
                }}
              />}
              <IconButton
                icon="dots-vertical"
                color={Colors.grey800}
                size={25}
                onPress={() => {setOpenMenu(true)}}
                style={{
                  margin: 0,
                }}
              />
              {/* <Menu
                visible={openMenu}
                onDismiss={() => setOpenMenu(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    color={Colors.grey800}
                    size={25}
                    onPress={() => {setOpenMenu(true)}}
                  />
                }
              >
                <Menu.Item onPress={() => {}} title="Item 1" />
                <Menu.Item onPress={() => {}} title="Item 2" />
              </Menu> */}
            </View>
          ),
        });
      }
    }
  }, [otherUser, isSelecting, checkedMessages]);
  // ---------------------------------------------------------------------

  React.useEffect(() => {
    console.log(checkedMessages);
  }, [checkedMessages]);

  React.useEffect(() => {
    setIsSelecting(false);
    setCheckedMessages([]);
  }, []);

  const handleSelect = (checked, message) => {
    if (checked) {
      console.log('1');
      setCheckedMessages([...checkedMessages, message]);
    } else {
      console.log('2');
      setCheckedMessages(checkedMessages.filter((i) => i.objectId !== message?.objectId));
    }
  }
  // MEETING ------------------------------------------------------------
  const handleCallingButton = async (audioOnly) => {
    try {
      const room = randomRoomName();
      await postData('/send-message', {
        sender: userdata,
        receiver: [otherUser],
        type: "Calling",
        room,
        audioOnly,
      });
      console.log('Message sent successfully');
      setRecipientInfo([otherUser]);
      setSenderInfo(userdata);
      setRoomName(room);
      setIsVideoDisabled(audioOnly);
      setOpenCalling(true);
    } catch (err) {
      showAlert(err.message);
    }
  }

  const handleGroupCalling = async (audioOnly) => {
    try {
      const room = randomRoomName();
      await postData('/send-message', {
        sender: userdata,
        receiver: checkedUsers,
        type: "Calling",
        room,
        audioOnly,
      });
      console.log('Message sent successfully');
      setRecipientInfo([otherUser]);
      setSenderInfo(userdata);
      setRoomName(room);
      setIsVideoDisabled(audioOnly);
      setOpenCalling(true);
      setOpenMemberModal(false);
    } catch (err) {
      showAlert(err.message);
    }
  }
  
  const handleTimeout = async (sender, receiver) => {
    try {
      await postData('/send-message', {
        sender,
        receiver,
        type: "Timeout",
        roomName: "",
      });
      console.log('Message sent successfully');
      setOpenCalling(false);
      setRecipientInfo([]);
      setSenderInfo(null);
      setRoomName("");
      setEnableMic(true);
      setIsVideoDisabled(false);
      showAlert('Sorry, but the recipient you are calling right now is not responding.');
    } catch (error) {
      console.error('Error sending message', error);
    }
  }
 
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

  useEffect(() => {
    console.log(new Date());
    let timer;
    if (openCalling && !openMeetingModal) {
      timer = setTimeout(() => {
        sendCallMessage("Missed Call", new Date());
        handleTimeout(userdata, [otherUser]);
      }, 35000);
    } else {
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [openCalling, openMeetingModal, senderInfo, recipientInfo, isVideoDisabled]);

  // LAST READ -----------------------------------------------------------
  const {value: detail} = useDetailByChat(chatId);

  const chatDoc = channel || directMessage;

  const [lastRead, setLastRead] = React.useState(null);
  const [hasNew, setHasNew] = React.useState(false);

  React.useEffect(() => {
    setLastRead(null);
    setHasNew(false);
  }, [chatId]);

  React.useEffect(() => {
    if (chatDoc && chatDoc.lastMessageCounter !== detail?.lastRead) {
      postData(`/users/${user?.uid}/read`, {
        chatType: chatType,
        chatId: chatId,
      });
      if (!hasNew) {
        setLastRead(detail?.lastRead || 0);
        setHasNew(true);
      }
    }
  }, [chatDoc?.lastMessageCounter]);
  // ---------------------------------------------------------------------

  // LOAD DATA AND PAGINATION --------------------------------------------
  const [page, setPage] = React.useState(1);
  const {value: messages, loading} = useMessagesByChat(chatId, page);

  React.useEffect(() => {
    console.log(messages[0]);
  }, [messages]);

  React.useEffect(() => {
    setPage(1);
  }, [chatId]);
  // --------------------------------------------------------------------

  const [messageTypeOpen, setMessageTypeOpen] = React.useState(false);
  const [audioOpen, setAudioOpen] = React.useState(false);
  const [videoOpen, setVideoOpen] = React.useState(false);
  const [fileLoading, setFileLoading] = React.useState(false);

  // FORM ----------------------------------------------------------------
  const {handleSubmit, setFieldValue, values, isSubmitting, resetForm} =
    useFormik({
      initialValues: {
        text: '',
      },
      enableReinitialize: true,
      onSubmit: async val => {
        try {
          const messageId = uuidv4();
          await postData('/messages', {
            objectId: messageId,
            text: `<p>${val.text}</p>`,
            chatId,
            workspaceId,
            chatType,
          });
          setMessageSent(true);
          resetForm();
        } catch (err) {
          showAlert(err.message);
        }
      },
    });
  // ---------------------------------------------------------------------

  const isDeleteDisabled = checkedMessages.length === 0 || checkedMessages.filter((m) => m.senderId !== user?.uid).length > 0;
  const isEmailDisabled = checkedMessages.length === 0 || checkedMessages.filter((m) => (!m.fileURL || m.fileURL === "")).length > 0;

  // TYPING INDICATOR ----------------------------------------------------
  const typingArray = chatDoc?.typing?.filter(typ => typ !== user?.uid);

  // memoize the typing users
  const typingUsers = React.useMemo(
    () =>
      users?.filter(user => {
        return typingArray?.includes(user.objectId);
      }),
    [users, typingArray],
  );

  const typingText = typingUsers
    ?.map(user => `${user.displayName} is typing...`)
    .join(' ');

  React.useEffect(() => {
    const type = chatType === 'Direct' ? 'directs' : 'channels';
    const id = chatId;

    postData(
      `/${type}/${id}/typing_indicator`,
      {
        isTyping: false,
      },
      {},
      false,
    );

    postData(`/${type}/${id}/reset_typing`, {}, {}, false);
    const interval = setInterval(() => {
      postData(`/${type}/${id}/reset_typing`, {}, {}, false);
    }, 30000);

    return () => {
      clearInterval(interval);
      postData(
        `/${type}/${id}/typing_indicator`,
        {
          isTyping: false,
        },
        {},
        false,
      );
      postData(`/${type}/${id}/reset_typing`, {}, {}, false);
    };
  }, [chatId]);
  // ---------------------------------------------------------------------

  const handleOpenEmail = () => {
    let html = '';
    for (const m of checkedMessages) {
      html += `${getFileURL(m?.fileURL)}\n`;
    }
    setOpenSendMail(true);
    setMessageToSendMail(html);
  }

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const handleMultipleDelete = async () => {
    for (const m of checkedMessages) {
      await deleteData(`/messages/${m?.objectId}`);
    }
    setOpenDeleteConfirm(false);
    setIsSelecting(false);
  }

  const [openAddChannelConfirm, setOpenAddChannelConfirm] = useState(false);
  const [channelName, setChannelName] = useState(`${userdata?.displayName.split(" ")[0]}, ${otherUser?.displayName}`);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const createChannelAndInviteMember = async () => {
    try {
      setIsCreateLoading(true);
      const { channelId } = await postData("/channels", {
        name: channelName,
        description: "",
        workspaceId,
      });
      await postData(`/channels/${channelId}/members`, {
        email: otherUser?.email,
      });
      for (const member of checkedMembers) {
        await postData(`/channels/${channelId}/members`, {
          email: member?.email,
        });
      }
      console.log('Channel ID: ', channelId);
      setOpenMenu(false);
      setOpenMembers(false);
      setChatId(channelId);
      setChatType('Channel');
      navigation.navigate('Chat', {
        objectId: channelId,
      });
      showAlert("Channel created and member added.");
      setCheckedMembers([]);
      setChannelName(`${userdata?.displayName.split(" ")[0]}, ${otherUser?.displayName}`);
    } catch (err) {
      showAlert(err.message);
    }
    setIsCreateLoading(false);
    setOpenAddChannelConfirm(false);
  }

  // ---------------- Message Input Tool Button
  const [openEmojiPicker, setOpenEmojiPicker] = useState(false);

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
        showAlert('File uploaded successfully.');
      }
    } catch (err) {
      showAlert(err.message);
    }
  };

  const lauchCamera = async () => {
    setFileLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      });
      await handlePickerResult(result);
    } catch (err) {
      showAlert(err);
    }
    setFileLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    await handlePickerResult(result);
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    await handlePickerResult(result);
  };

  const pickDocument = async () => {
    setFileLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === 'success') {
        await handlePickerResult(result);
      }
    } catch (err) {
      showAlert(err);
    }
    setFileLoading(false);
  }

  const openChannelCalendar = () => {
    setOpenMenu(false);
    navigation.navigate('Calendar', {
      objectId: chatId,
    });
  }

  const openCreateChannel = () => {
    setOpenAddChannelConfirm(true);
  }

  const openGallery = () => {
    setOpenFileGallery(true);
    setOpenMenu(false);
  }

  const openMailComposer = () => {
    setMessageToSendMail('<p></p>');
    setInitialUsers([otherUser.email]);
    setOpenSendMail(true);
    setOpenMenu(false);
  }

  const openWebOfficeView = () => {
    setOpenWebOffice(true);
    setWebOfficeSrc(`https://www.uteamwork.com/webmessenger/ecard1.html?account=${otherUser?.email}&lang=ch&server=https://www.uteamwork.com&name=${userdata?.displayName}&email=${userdata?.email}`);
    setOpenMenu(false);
  }
  //-------Invite members to Create Channel--------
  const [checkedMembers, setCheckedMembers] = useState([]);

  const isChecked = (item) => checkedMembers.includes(item);

  const handleCheckMembers = (item) => {
    console.log(checkedMembers);
    if (isChecked(item)) {
      setCheckedMembers(checkedMembers.filter(c => c !== item));
    } else {
      setCheckedMembers([...checkedMembers, item]);
    }
  }
  //------Clear Chat History---------------
  const [openClear, setOpenClear] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const clearMyMessages = async () => {
    const myMessages = messages.filter(m => m.senderId === user.uid);
    try {
      setClearLoading(true);
      for (const m of myMessages) {
        await deleteData(`/messages/${m?.objectId}`);
      }
      showAlert('All your messages have been deleted successfully.');
      setOpenMenu(false);
      setOpenMembers(false);
    } catch (error) {
      showAlert(error.message);
    }
    setOpenClear(false);
    setClearLoading(false);
  }

  useEffect(() => {
    return () => {
      setLastRead(null);
      setHasNew(false);
      setPage(1);
      setOpenDeleteConfirm(false);
      setOpenEmojiPicker(false);
      setMessageTypeOpen(false);
      setAudioOpen(false);
      setVideoOpen(false);
    }
  }, []);

  return (
    <SafeAreaView
      style={{flex: 1, flexDirection: 'column', backgroundColor: Colors.white}}>
      {isSearching && (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: Colors.grey200,
        }}
      >
        <TextInput
          value={searchText}
          onChangeText={text => setSearchText(text)}
          style={{
            width: '80%',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: Colors.grey700,
            fontSize: 14,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        />
        {/* <IconButton
          icon="text-search"
          color={Colors.black}
          onPress={() => {}}
        /> */}
        <IconButton
          icon="window-close"
          color={Colors.black}
          onPress={() => {
            setIsSearching(false);
            setSearchText("");
          }}
        />
      </View>
      )}
      {loading || fileLoading && <ActivityIndicator style={{paddingVertical: 10}} />}
      {/* MESSAGES */}
      <FlatList
      ref={flatListRef}
        style={{paddingHorizontal: 10}}
        overScrollMode="always"
        ListHeaderComponent={() => (
          <Text
            style={{
              paddingBottom: 5,
              paddingHorizontal: 5,
              color: Colors.grey600,
              fontSize: 12,
            }}
            numberOfLines={1}>
            {typingText}
          </Text>
        )}
        ListFooterComponent={() => (
          <Divider style={{paddingTop: 15, opacity: 0}} />
        )}
        onEndReached={
          !loading &&
          messages?.length > 0 &&
          messages?.length === page * env.MESSAGES_PER_PAGE
            ? () => {
                setPage(page + 1);
              }
            : null
        }
        onEndReachedThreshold={0.1}
        data={messages}
        inverted
        renderItem={({item, index}) => (
          // MESSAGE ITEM
          <View key={index}>
            {(index === messages?.length - 1 || (index < messages?.length - 1 && !equalDate(item?.createdAt, messages[index + 1]?.createdAt))) && (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View
                  style={{
                    marginTop: 5,
                    height: 1,
                    width: '35%',
                    backgroundColor: Colors.grey700,
                  }}
                />
                <Text style={{
                  color: Colors.grey700, 
                  paddingHorizontal: 5
                }}>
                  {getFormattedDate(item?.createdAt)}
                </Text>
                <View
                  style={{
                    marginTop: 5,
                    height: 1,
                    width: '35%',
                    backgroundColor: Colors.grey700,
                  }}
                />
              </View>
            )}
            <Message
              chat={item}
              index={index}
              handleSelect={handleSelect}
              previousSameSender={
                index !== messages?.length
                  ? messages[index + 1]?.senderId === item?.senderId
                  : false
              }
              previousMessageDate={messages[index + 1]?.createdAt}>
              {/* NEW MESSAGE INDICATOR */}
              {lastRead !== null &&
                lastRead + 1 === item?.counter &&
                chatDoc &&
                lastRead !== chatDoc?.lastMessageCounter &&
                item?.senderId !== user?.uid && (
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}>
                    <View
                      style={{
                        marginTop: 5,
                        height: 1,
                        width: '90%',
                        backgroundColor: Colors.red600,
                      }}
                    />
                    <Text style={{color: Colors.red600, paddingHorizontal: 5}}>
                      New
                    </Text>
                  </View>
                )}
            </Message>
          </View>
        )}
        keyExtractor={item => item.objectId}
      />

      {/* BOTTOM SECTION */}
      {isSelecting ? (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={handleOpenEmail}
            disabled={isEmailDisabled}
            style={styles.bottomButton}
          >
            {icon("email")}
            <Text style={{
              fontSize: 12,
            }}>
              E-mail
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setOpenMultipleForwardMessage(true);
            }}
            disabled={checkedMessages.length === 0}
            style={styles.bottomButton}
          >
            {icon("forward")}
            <Text style={{
              fontSize: 12,
            }}>
              Forward
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setOpenDeleteConfirm(true)}
            disabled={isDeleteDisabled}
            style={styles.bottomButton}
          >
            {icon("delete")}
            <Text style={{
              fontSize: 12,
            }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Input
              text={values.text}
              setText={setFieldValue}
              placeholder={"Type message here..."}
              isSubmitting={isSubmitting}
            />
            <IconButton
              icon="emoticon"
              color={openEmojiPicker ? Colors.white : Colors.grey800}
              style={{
                backgroundColor: openEmojiPicker ? Colors.grey800 : Colors.white,
              }}
              size={25}
              onPress={() => setOpenEmojiPicker(!openEmojiPicker)}
            />
            <IconButton
              icon="send"
              color={Colors.grey800}
              size={25}
              disabled={!values.text || isSubmitting || fileLoading}
              onPress={handleSubmit}
            />
          </View>
          <View style={styles.buttonContainer}>
            <IconButton
              icon="microphone"
              color={Colors.black}
              size={25}
              onPress={() => setAudioOpen(true)}
            />
            <IconButton
              icon="camera"
              color={Colors.black}
              size={25}
              onPress={lauchCamera}
            />
            <IconButton
              icon="movie"
              color={Colors.black}
              size={25}
              onPress={() => setVideoOpen(true)}
            />
            <TouchableOpacity
              style={{
                borderRadius: 14,
                margin: 12,
              }}
              onPress={() => setOpenStickers(true)}
            >
              <Avatar.Image size={25} source={require('@/files/sticker.png')} style={{backgroundColor: Colors.transparent}} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                borderRadius: 0,
                margin: 12,
              }}
              onPress={pickDocument}
            >
              <Avatar.Image size={25} source={require('@/files/upload-file.png')} style={{backgroundColor: Colors.transparent}} />
            </TouchableOpacity>
          </View>
          <View style={{
            display: openEmojiPicker ? 'flex' : 'none',
            width: '100%',
            height: 240,
            borderTopWidth: 1,
            borderColor: Colors.grey200,
          }}>
            <EmojiSelector
              showSectionTitles={false}
              category={Categories.all}
              showHistory={true}
              onEmojiSelected={(emoji) => setFieldValue("text", values.text + emoji)}
              columns={10}
              searchbarStyle={{
                paddingHorizontal: 24,
              }}
              searchbarContainerStyle={{
                paddingVertical: 24,
              }}
            />
          </View>
        </>
      )}

      {/* MODALS */}
      {messageTypeOpen && (
        <MessageTypeModal
          open={messageTypeOpen}
          setOpen={setMessageTypeOpen}
          setAudioOpen={setAudioOpen}
        />
      )}
      
      {openStickers && <StickersModal />}
      {openChannelDetails && <ChannelDetailsModal />}
      {openDirectDetails && <DirectDetailsModal />}
      <AudioModal open={audioOpen} setOpen={setAudioOpen} />
      {videoOpen && <VideoRecorder open={videoOpen} setOpen={setVideoOpen} />}
      {(openEditMessage && messageToEdit) && <EditMessage />}
      {(openReplyMessage && messageToReply) && <ReplyMessage />}
      {(openForwardMessage && messageToForward) && <ForwardMessage />}
      {(openSendMail && messageToSendMail) && <SendMail />}
      {(openMultipleForwardMessage && checkedMessages.length > 0) && <MultipleForwardMessage />}
      {openWebOffice && <WebOfficeModal open={openWebOffice} setOpen={setOpenWebOffice} src={webOfficeSrc} />}
      {openFileGallery && <FileGalleryModal />}
      {openFavorite && <FavoriteModal />}
      {openSearchMessage && <MessageSearchModal />}
      <Portal>
          <Dialog visible={openDeleteConfirm} onDismiss={() => setOpenDeleteConfirm(false)}>
            <Dialog.Title>Delete</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Are you want to delete selected messages?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleMultipleDelete}>Delete</Button>
              <Button onPress={() => setOpenDeleteConfirm(false)}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
      </Portal>
      <RNModal
      animationType="fade"
      transparent={true}
      visible={openAddChannelConfirm}
      onRequestClose={() => {
        setOpenAddChannelConfirm(!openAddChannelConfirm);
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
          <Dialog visible={openAddChannelConfirm} onDismiss={() => setOpenAddChannelConfirm(false)}>
            <Dialog.Title>Create channel</Dialog.Title>
            <Dialog.Content>
              <RNPInput
                label="Channel name"
                style={{
                  fontSize: 16,
                  color: Colors.black,
                  width: '100%',
                  backgroundColor: 'transparent',
                  paddingHorizontal: 0,
                }}
                value={channelName}
                onChangeText={text => setChannelName(text)}
              />
            </Dialog.Content>
            <Dialog.Actions style={{
              marginTop: 0,
              paddingTop: 0,
            }}>
              {isCreateLoading && (
                <ActivityIndicator size={18} style={{marginHorizontal: 12}} />
              )}
              <Button onPress={createChannelAndInviteMember} disabled={!channelName || channelName === ""} uppercase={false}>Create</Button>
              <Button onPress={() => setOpenAddChannelConfirm(false)} uppercase={false}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </View>
      </RNModal>
      <RNModal
      animationType="fade"
      transparent={true}
      visible={openClear}
      onRequestClose={() => {
        setOpenClear(!openClear);
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
          <Dialog visible={openClear} onDismiss={() => setOpenClear(false)}>
            <Dialog.Title>Clear your message</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete all your messages?</Text>
            </Dialog.Content>
            <Dialog.Actions style={{
              marginTop: 0,
              paddingTop: 0,
            }}>
              {clearLoading && (
                <ActivityIndicator size={18} style={{marginHorizontal: 12}} />
              )}
              <Button onPress={clearMyMessages} uppercase={false} color={Colors.red500}>Delete</Button>
              <Button onPress={() => setOpenClear(false)} uppercase={false}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </View>
      </RNModal>
      {chatType === "Channel" && (
      <Portal>
        <Modal
          visible={openMemberModal}
          onDismiss={() => setOpenMemberModal(false)}
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
                      <View>
                        <Checkbox
                          status={isUserSelected(user) ? 'checked' : 'unchecked'}
                          onPress={() => handleUserSelect(!isUserSelected(user), user)}
                        />
                      </View>
                    )}
                  />
                )}
              />
            ))}
          </List.Section>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <Button
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.red500,
              }}
              labelStyle={{
                color: Colors.red500,
              }}
              uppercase={false}
              onPress={() => handleGroupCalling(isAudioOnly)}
            >Confirm</Button>
            {checkedUsers.length < channelUsers.length ? 
            <Button
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.blue400,
              }}
              labelStyle={{
                color: Colors.blue400,
              }}
              uppercase={false}
              onPress={() => setCheckedUsers(channelUsers)}
            >Select All</Button> :
            <Button
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.blue400,
              }}
              labelStyle={{
                color: Colors.blue400,
              }}
              uppercase={false}
              onPress={() => setCheckedUsers([])}
            >Unselect All</Button>}
          </View>
        </Modal>
      </Portal>
      )}
      {openMenu &&
      <ChatActionModal
        open={openMenu} 
        setOpen={setOpenMenu} 
        chatType={chatType} 
        otherUser={otherUser}
        isMe={isMe}
        openChannelCalendar={openChannelCalendar} 
        openCreateChannel={openCreateChannel}
        openGallery={openGallery}
        openMailComposer={openMailComposer}
        openWebOfficeView={openWebOfficeView}
        setOpenMembers={setOpenMembers}
        setOpenClear={setOpenClear}
      />
      }
      {chatType === "Direct" && openMembers &&
      <UserListModal
        open={openMembers}
        setOpen={setOpenMembers}
        otherUser={otherUser}
        checkedMembers={checkedMembers}
        setCheckedMembers={setCheckedMembers}
        handleCheckMembers={handleCheckMembers}
        openCreateChannel={openCreateChannel}
      />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 60,
    maxHeight: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 60,
    maxHeight: 120,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: Colors.grey200,
  },
  buttonLeftContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  bottomContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 60,
    maxHeight: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bottomButton: {
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    marginTop: 4,
  },
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
  },
  modalContainer: {
    width: '60%',
    margin: 'auto',
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 8,
  }
});
