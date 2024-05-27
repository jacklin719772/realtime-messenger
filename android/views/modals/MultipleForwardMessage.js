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
import { getFormattedDate, getFormattedTime, getPassedDays } from '@/lib/convert';
import { postData } from '@/lib/api-helpers';

function AutocompleteItem({direct}) {
  const {user} = useUser();

  return (
    <View
      key={direct.objectId}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
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

function MultipleForwardMessage() {
  const navigation = useNavigation();

  const {openMultipleForwardMessage: open, setOpenMultipleForwardMessage: setOpen} = useModal();
  const {checkedMessages, setCheckedMessages, setIsSelecting, setMessageSent} = useMessageFeature();
  const {userdata, user} = useUser();
  const {value: channels} = useChannels();
  const {value: directs} = useDirectMessages();
  const {value: members} = useUsers();
  const {workspaceId} = useParams();

  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({x: 0, y: 0});
  const [chatId, setChatId] = useState(null);
  const [chatType, setChatType] = useState("Channel");
  const [query, setQuery] = useState("");

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

  const data = useMemo(() => query === '' ? [] : channelList.concat(dmList).filter((d) => d.name.toLowerCase().includes(query.toLowerCase())).map((item, index) => ({
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
          if (checkedMessages.length === 0) return;
          if (!chatId || chatId === "") return;
          for (const m of checkedMessages) {
            if (val.text?.trim()) {
              await postData("/messages", {
                objectId: uuidv4(),
                text: val.text,
                chatId,
                workspaceId,
                chatType,
              });
            }
            await postData("/messages", {
              objectId: uuidv4(),
              text: m?.text,
              chatId,
              workspaceId,
              fileName: m?.fileName,
              filePath: m?.fileURL,
              chatType,
              forwardId: m?.objectId,
              forwardChatId: m?.chatId,
              forwardChatType: m?.chatType,
              forwardSenderId: m?.senderId,
              forwardCreatedAt: new Date(m?.createdAt),
            });
            setMessageSent(true);
          }
          console.log('chatId: ', chatId);
          setCheckedMessages([]);
          setIsSelecting(false);
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
              <Appbar.Content title={checkedMessages.length > 1 ? `Forward ${checkedMessages.length} Messages` : `Forward ${checkedMessages.length} Message`} />
              <Appbar.Action icon="check" disabled={chatId === null} onPress={handleSubmit} />
            </Appbar.Header>
            <View style={{
              width: '100%',
              height: 64,
              position: 'relative',
              marginBottom: 12,
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
                  data={suggestions}
                  value={query}
                  onChangeText={(text) => setQuery(text)}
                  placeholder='Select channel or person'
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
              <View style={styles.inputContainer}>
                <Input
                  text={values.text}
                  placeholder="Please enter text if you'd like..."
                  setText={setFieldValue}
                  isSubmitting={isSubmitting}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  )
}

export default MultipleForwardMessage

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
