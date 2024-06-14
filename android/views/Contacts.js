import {useModal} from '@/contexts/ModalContext';
import {useUser} from '@/contexts/UserContext';
import {getFileURL} from '@/lib/storage';
import { Modal as RNModal, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import {Image, View} from 'react-native';
import {ActivityIndicator, Button, Colors, Dialog, Text} from 'react-native-paper';
import { AlphabetList } from 'react-native-section-alphabet-list';
import {MaterialIcons} from '@expo/vector-icons';
import { useUsers } from '@/contexts/UsersContext';
import React from 'react';
import { useParams } from '@/contexts/ParamsContext';
import { useDirectMessages } from '@/contexts/DirectMessagesContext';
import DirectDetailsModal from './modals/DirectDetails';
import WebOfficeModal from './modals/WebOffice';
import SendMail from './modals/SendMail';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useMessagesByChat } from '@/hooks/useMessages';
import { showAlert } from '@/lib/alert';
import { deleteData } from '@/lib/api-helpers';
import AddDirect from './modals/AddDirect';
import pinyin from 'pinyin';

export default function Contacts() {
  const [search, setSearch] = React.useState("");
  const { value: members } = useUsers();
  const { user } = useUser();
  const { value: dms } = useDirectMessages();
  const {
    openDirectDetails, 
    setOpenDirectDetails,
    openWebOffice,
    setOpenWebOffice,
    webOfficeSrc,
    openSendMail,
  } = useModal();
  const {messageToSendMail} = useMessageFeature();
  const {chatId, setChatType, setChatId} = useParams();
  const [openClear, setOpenClear] = React.useState(false);
  const [clearLoading, setClearLoading] = React.useState(false);
  const {value: messages} = useMessagesByChat(chatId);
  
  const dmUsers = React.useMemo(() => 
    dms.map((dm) => ({
      ...dm,
      userData: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0],
      value: /^[\u4e00-\u9fa5]+$/.test(members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName) ? 
        pinyin(members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName, { style: pinyin.STYLE_NORMAL }).flat().join('') : 
        members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].displayName,
      key: members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].objectId,
    })).filter((m) => (m?.userData.fullName.toLowerCase().includes(search.toLowerCase()) || m?.userData.displayName.toLowerCase().includes(search.toLowerCase()))),
  [dms, members, search]);

  const clearMyMessages = async () => {
    const myMessages = messages.filter(m => m.senderId === user.uid);
    try {
      setClearLoading(true);
      for (const m of myMessages) {
        await deleteData(`/messages/${m?.objectId}`);
      }
      showAlert('All your messages have been deleted successfully.');
      setOpenDirectDetails(false);
    } catch (error) {
      showAlert(error.message);
    }
    setOpenClear(false);
    setClearLoading(false);
  }

  return (
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
        data={dmUsers}
        style={styles.alphabetList}
        indexLetterStyle={styles.indexLetter}
        indexContainerStyle={styles.indexContainer}
        indexLetterContainerStyle={{
          margin: 4,
        }}
        renderCustomItem={(item) => (
          <TouchableOpacity
            style={styles.listItemContainer}
            onPress={() => {
              setChatId(item.objectId);
              setChatType("Direct");
              setOpenDirectDetails(true);
            }}
          >
            <Image
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
              }}
              source={
                item?.userData.photoURL
                ? {uri: getFileURL(item.userData.photoURL)}
                : require('@/files/blank_user.png')
              }
            />
            <View
              style={{
                paddingLeft: 8,
              }}
            >
              <Text style={styles.listItemLabel}>{item.userData.displayName}{item.key === user.uid && " (Me)"}</Text>
              <Text style={styles.listItemSmallLabel}>{item.userData.fullName}</Text>
            </View>
          </TouchableOpacity>
        )}
        renderCustomSectionHeader={(section) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderLabel}>{section.title}</Text>
          </View>
        )}
      />
      {openDirectDetails && <DirectDetailsModal setOpenClear={setOpenClear} />}
      {openWebOffice && <WebOfficeModal open={openWebOffice} setOpen={setOpenWebOffice} src={webOfficeSrc} />}
      {(openSendMail && messageToSendMail) && <SendMail />}
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
    </View>
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
