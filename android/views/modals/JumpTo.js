import {modalStyles} from '@/styles/styles';
import {Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Appbar, Checkbox, Colors, IconButton} from 'react-native-paper';
import WebView from 'react-native-webview';
import {env} from "@/config/env";
import { Base64 } from 'js-base64';
import { AlphabetList } from 'react-native-section-alphabet-list';
import {MaterialIcons} from '@expo/vector-icons';
import { useUsers } from '@/contexts/UsersContext';
import { useUser } from '@/contexts/UserContext';
import React from 'react';
import { getFileURL } from '@/lib/storage';
import { useDirectMessages } from '@/contexts/DirectMessagesContext';
import { postData } from '@/lib/api-helpers';
import { useParams } from '@/contexts/ParamsContext';
import { getFocusedRouteNameFromRoute, useNavigation, useRoute } from '@react-navigation/native';
import pinyin from 'pinyin';
import { useModal } from '@/contexts/ModalContext';
import { useChannels } from '@/contexts/ChannelsContext';
import Fontisto from '@expo/vector-icons/Fontisto';

export default function JumpToModal() {
  const navigation = useNavigation();
  const [search, setSearch] = React.useState("");
  const { value: members } = useUsers();
  const { user } = useUser();
  const { value: channels } = useChannels();
  const { value: dms } = useDirectMessages();
  const { workspaceId, setChatId, setChatType } = useParams();
  const { openJumpTo: open, setOpenJumpTo: setOpen, activeTab } = useModal();

  const channelList = React.useMemo(() => 
    channels.map((ch) => ({
      ...ch,
      displayName: ch.name,
      fullName: ch.name,
      value: /^[\u4e00-\u9fa5]+$/.test(ch.name) ? pinyin(ch.name).flat().join('') : ch.name,
      key: ch.objectId,
      chatType: 'Channel',
    })).filter((ch) => (ch.name.toLowerCase().includes(search.toLowerCase()))),
  [channels, search]);
  
  const dmUsers = React.useMemo(() => 
    dms.map((dm) => ({
      ...dm,
      displayName: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName,
      fullName: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].fullName,
      photoURL: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].photoURL,
      value: /^[\u4e00-\u9fa5]+$/.test(members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName) ? 
        pinyin(members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName, { style: pinyin.STYLE_NORMAL }).flat().join('') : 
        members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName,
      key: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].objectId,
      chatType: 'Direct',
    })).filter((m) => (m?.fullName.toLowerCase().includes(search.toLowerCase()) || m?.displayName.toLowerCase().includes(search.toLowerCase()))),
  [dms, members, search]);

  const chats = React.useMemo(() =>
    activeTab === 'Home' ? channelList.concat(dmUsers) : dmUsers,
  [channelList, dmUsers, activeTab]);

  const newMessage = async (item) => {
    setChatId(item.objectId);
    setChatType(item.chatType);
    navigation.navigate('Chat', {
      objectId: item.objectId,
    });
    setOpen(false);
  };

  return (
    <Modal
      animationType="fade"
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
              backgroundColor: Colors.blue500,
            }}>
            <Appbar.Action icon="arrow-left" onPress={() => setOpen(!open)} />
            <Appbar.Content title="Search" />
          </Appbar.Header>
          <View
            style={{
              display: 'flex', 
              flexGrow: 1,
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: '100%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '90%',
                marginVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.grey500,
                paddingHorizontal: 8,
              }}
            >
              <MaterialIcons
                name="search"
                color={Colors.grey500}
                size={20}
              />
              <TextInput
                style={{
                  // borderRadius: 12,
                  // borderWidth: 1,
                  // borderColor: Colors.grey200,
                  width: '100%',
                  padding: 4,
                }}
                value={search}
                onChangeText={text => setSearch(text)}
              />
            </View>
            <AlphabetList
              data={chats}
              style={styles.alphabetList}
              indexLetterStyle={styles.indexLetter}
              indexContainerStyle={styles.indexContainer}
              indexLetterContainerStyle={{
                margin: 4,
              }}
              renderCustomItem={(item) => (
                <TouchableOpacity style={styles.listItemContainer} onPress={() => newMessage(item)}>
                  {item.chatType === "Channel" && (
                    <Fontisto name="hashtag" size={20} style={{
                      paddingHorizontal: 10,
                    }} />
                  )}
                  {item.chatType === "Direct" && (
                    <Image
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                      }}
                      source={
                        item?.photoURL
                        ? {uri: getFileURL(item.photoURL)}
                        : require('@/files/blank_user.png')
                      }
                    />
                  )}
                  <View
                    style={{
                      paddingLeft: 8,
                    }}
                  >
                    <Text style={styles.listItemLabel}>{item.displayName}</Text>
                    <Text style={styles.listItemSmallLabel}>{item.fullName}</Text>
                  </View>
                </TouchableOpacity>
              )}
              renderCustomSectionHeader={(section) => (
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeaderLabel}>{section.title}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alphabetList: {
    flex: 1,
    width: '100%',
  },
  listItemContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderTopColor: Colors.grey200,
    borderTopWidth: 1,
  },
  listItemLabel: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  listItemSmallLabel: {
    color: Colors.black,
    fontSize: 12,
  },
  sectionHeaderContainer: {
    height: 24,
    backgroundColor: Colors.grey300,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  sectionHeaderLabel: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  listHeaderContainer: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLetter: { 
    color: Colors.blue500, 
    fontSize: 12,
  },
  indexContainer: {
    marginRight: 12,
  }
});
