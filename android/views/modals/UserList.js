import {modalStyles} from '@/styles/styles';
import {Image, Modal, StyleSheet, Text, TextInput, View} from 'react-native';
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

export default function UserListModal({
  open,
  setOpen,
  otherUser,
  checkedMembers,
  setCheckedMembers,
  handleCheckMembers,
  openCreateChannel,
}) {
  const [search, setSearch] = React.useState("");
  const { value: members } = useUsers();
  const { user, userdata } = useUser();

  const allUsers = React.useMemo(() => 
    members.filter((m) => ((m?.fullName.toLowerCase().includes(search.toLowerCase()) || m?.displayName.toLowerCase().includes(search.toLowerCase())) && m?.objectId !== user.uid && m?.objectId !== otherUser.objectId)).map((m) => {
      return {
        ...m,
        value: m.displayName,
        key: m.objectId,
      }
    }), 
  [search, members]);

  const isChecked = (item) => checkedMembers.includes(item);

  React.useEffect(() => {
    setCheckedMembers([]);
    return () => setCheckedMembers([]);
  }, []);

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
            <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
            <Appbar.Content title="Add Other Members" />
            <Appbar.Action icon="check" disabled={checkedMembers.length < 1} onPress={openCreateChannel} />
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
                borderColor: Colors.grey200,
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
                <View style={styles.listItemContainer}>
                  <Checkbox
                    status={isChecked(item) ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckMembers(item)}
                  />
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
                </View>
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
