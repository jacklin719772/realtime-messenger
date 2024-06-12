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
import { useNavigation } from '@react-navigation/native';
import pinyin from 'pinyin';

export default function AddDirect({
  open,
  setOpen,
}) {
  const navigation = useNavigation();
  const [search, setSearch] = React.useState("");
  const { value: members } = useUsers();
  const { user } = useUser();
  const { value: dms } = useDirectMessages();
  const { workspaceId, setChatId, setChatType } = useParams();
  
  const dmUsers = React.useMemo(() => 
    dms.map((dm) => (
      members.filter((member) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member) => member !== user?.uid)[0] === member.objectId)))[0].objectId
    )),
  [dms, members]);

  const allUsers = React.useMemo(() => 
    members.filter((m) => (
      !dmUsers.includes(m?.objectId) && (m?.fullName.toLowerCase().includes(search.toLowerCase()) || m?.displayName.toLowerCase().includes(search.toLowerCase()))
    )).map((m) => ({
      ...m,
      value: /^[\u4e00-\u9fa5]+$/.test(m.displayName) ? pinyin(m.displayName, { style: pinyin.STYLE_NORMAL }).flat().join('') : m.displayName,
      key: m.objectId,
    })),
  [dmUsers, members, search]);

  const newMessage = async (item) => {
    try {
      const {directId} = await postData('/directs', {
        workspaceId,
        userId: item.objectId,
      });
      setChatId(directId);
      setChatType('Direct');
      navigation.navigate('Chat', {
        objectId: directId,
      });
      setOpen(false);
    } catch (err) {
      showAlert(err.message);
    }
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
              backgroundColor: '#fff',
            }}>
            <Appbar.Action icon="arrow-left" onPress={() => setOpen(!open)} />
            <Appbar.Content title="Add Other Members" />
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
                borderColor: Colors.grey300,
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
              data={allUsers}
              style={styles.alphabetList}
              indexLetterStyle={styles.indexLetter}
              indexContainerStyle={styles.indexContainer}
              indexLetterContainerStyle={{
                margin: 4,
              }}
              renderCustomItem={(item) => (
                <TouchableOpacity style={styles.listItemContainer} onPress={() => newMessage(item)}>
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
