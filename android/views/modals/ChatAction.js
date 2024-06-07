import {modalStyles} from '@/styles/styles';
import {Image, Modal, Pressable, Text, TouchableOpacity, View} from 'react-native';
import {Appbar, Colors, List} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import { getFileURL } from '@/lib/storage';

export default function ChatActionModal({
  open,
  setOpen,
  chatType,
  otherUser,
  isMe,
  openChannelCalendar,
  openCreateChannel,
  openGallery,
  openMailComposer,
  openWebOfficeView,
  setOpenMembers,
  setOpenClear,
}) {
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
            <Appbar.Content title="More Actions" />
          </Appbar.Header>
            {chatType === "Direct" && 
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center', 
                  width: '90%', 
                  padding: 8,
                  borderBottomWidth: 1,
                  borderColor: Colors.grey300,
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                  }}
                >
                  <Image
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                    }}
                    source={
                      otherUser?.photoURL
                      ? {uri: getFileURL(otherUser.photoURL)}
                      : require('@/files/blank_user.png')
                    }
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.black,
                    }}
                  >{otherUser.displayName}</Text>
                </View>
                {!isMe &&
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    borderRadius: 14,
                    margin: 12,
                    width: 40,
                    height: 40,
                    borderWidth: 1,
                    borderColor: Colors.grey700,
                    justifyContent: 'center',
                  }}
                  onPress={() => setOpenMembers(true)}
                >
                  <MaterialCommunityIcons name="plus" size={25} color={Colors.black} />
                </TouchableOpacity>}
              </View>
            </View>}
            <View
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                height: '100%',
              }}
            >
              <List.Section
              style={{
                width: '90%',
                height: '100%',
              }}>
                {chatType === "Channel" && 
                <List.Item
                  title="Calendar"
                  style={{
                    padding: 2,
                    borderBottomWidth: 1,
                    borderColor: Colors.grey300,
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <MaterialCommunityIcons name="calendar-month" size={24} style={{color: Colors.black}} />
                      )}
                    />
                  )}
                  onPress={openChannelCalendar}
                />}
                <List.Item
                  title="Gallery"
                  style={{
                    padding: 2,
                    borderBottomWidth: 1,
                    borderColor: Colors.grey300,
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <MaterialCommunityIcons name="image-multiple-outline" size={24} style={{color: Colors.black}} />
                      )}
                    />
                  )}
                  onPress={openGallery}
                />
                {chatType === "Direct" &&
                <List.Item
                  title="Send E-mail to Him"
                  style={{
                    padding: 2,
                    borderBottomWidth: 1,
                    borderColor: Colors.grey300,
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <MaterialCommunityIcons name="email" size={24} style={{color: Colors.black}} />
                      )}
                    />
                  )}
                  onPress={openMailComposer}
                />}
                {chatType === "Direct" &&
                <List.Item
                  title="Visit His weboffice"
                  style={{
                    padding: 2,
                    borderBottomWidth: 1,
                    borderColor: Colors.grey300,
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <MaterialCommunityIcons name="office-building" size={24} style={{color: Colors.black}} />
                      )}
                    />
                  )}
                  onPress={openWebOfficeView}
                />}
                <List.Item
                  title="Clear My Chat History"
                  style={{
                    padding: 2,
                    borderBottomWidth: 1,
                    borderColor: Colors.grey300,
                  }}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={() => (
                        <MaterialCommunityIcons name="delete-outline" size={24} style={{color: Colors.black}} />
                      )}
                    />
                  )}
                  onPress={() => setOpenClear(true)}
                />
              </List.Section>
            </View>
        </View>
      </View>
    </Modal>
  );
}
