import PresenceIndicator from '@/components/PresenceIndicator';
import {useDirectRecipient} from '@/contexts/DirectMessagesContext';
import { useMessageFeature } from '@/contexts/MessageContext';
import {useModal} from '@/contexts/ModalContext';
import {useParams} from '@/contexts/ParamsContext';
import { useUser } from '@/contexts/UserContext';
import {showAlert} from '@/lib/alert';
import {postData} from '@/lib/api-helpers';
import {getFileURL} from '@/lib/storage';
import {usePresenceByUserId} from '@/lib/usePresence';
import {globalStyles, modalStyles} from '@/styles/styles';
import {Feather, MaterialCommunityIcons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {Image, Modal, ScrollView, View} from 'react-native';
import {Appbar, Colors, Divider, IconButton, List, Text, TouchableRipple} from 'react-native-paper';

export default function DirectDetailsModal({
  setOpenClear,
}) {
  const navigation = useNavigation();
  const {chatId} = useParams();
  const {userdata} = useUser();
  const {openDirectDetails: open, setOpenDirectDetails: setOpen, setOpenWebOffice, setWebOfficeSrc, setOpenSendMail, setInitialUsers} = useModal();
  const {setMessageToSendMail} = useMessageFeature();

  const {value: otherUser} = useDirectRecipient(chatId);

  const {isPresent} = usePresenceByUserId(otherUser?.objectId);

  const goToChat = () => {
    setOpen(false);
    navigation.navigate('Chat', {
      objectId: chatId,
    });
  }

  const closeConversation = async () => {
    try {
      await postData(`/directs/${chatId}/close`);
      setOpen(false);
      // navigation.goBack();
    } catch (err) {
      showAlert(err.message);
    }
  };

  const viewWebOffice = () => {
    setOpenWebOffice(true);
    setWebOfficeSrc(`https://www.uteamwork.com/webmessenger/ecard1.html?account=${otherUser?.email}&lang=ch&server=https://www.uteamwork.com&name=${userdata?.displayName}&email=${userdata?.email}`);
  }

  const handleOpenEmail = () => {
    setInitialUsers([otherUser.email]);
    setOpenSendMail(true);
    setMessageToSendMail('<p></p>');
  }

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
            style={{width: '100%', backgroundColor: '#fff'}}>
            <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
            <Appbar.Content title={otherUser?.displayName} />
          </Appbar.Header>
          <View
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              paddingHorizontal: 20,
            }}>
            <View
              style={{
                backgroundColor: Colors.white,
                marginVertical: 15,
                padding: 10,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: Colors.grey200,
                flex: 1,
                justifyContent: 'space-between',
              }}>
              <View style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'center',
              }}>
                <View
                  style={{
                    position: 'relative',
                  }}
                >
                  <Image
                    style={{
                      width: 150,
                      height: 150,
                      borderRadius: 5,
                    }}
                    source={
                      otherUser?.thumbnailURL
                        ? {uri: getFileURL(otherUser.photoURL)}
                        : require('@/files/blank_user.png')
                    }
                  />
                  {/* <PresenceIndicator isPresent={isPresent} /> */}
                </View>
              </View>
              <View
                style={{
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    position: 'relative',
                    paddingHorizontal: 15,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                  <Text numberOfLines={1} style={{fontSize: 16, fontWeight: 'bold'}}>
                    {otherUser?.fullName}
                  </Text>
                  <PresenceIndicator isPresent={isPresent} />
                </View>
              </View>
              <ScrollView style={{
                flex: 1,
              }}>
                <View
                  style={{
                    paddingHorizontal: 15,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'scroll',
                  }}>
                  <Text numberOfLines={1} style={{fontSize: 15, fontWeight: 'bold', paddingVertical: 4}}>
                    Display name
                  </Text>
                  <Text numberOfLines={1} style={{fontSize: 15}}>
                    {otherUser?.displayName}
                  </Text>
                  <Divider style={{margin: 4, backgroundColor: Colors.white}} />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text numberOfLines={1} style={{fontSize: 15, fontWeight: 'bold'}}>
                      Email address
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={{fontSize: 15}}>
                    {otherUser?.email}
                  </Text>
                  <Divider style={{margin: 4, backgroundColor: Colors.white}} />
                  <Text numberOfLines={1} style={{fontSize: 15, fontWeight: 'bold', paddingVertical: 4}}>
                    What I do?
                  </Text>
                  <Text numberOfLines={1} style={{fontSize: 15}}>
                    {otherUser?.title}
                  </Text>
                  <Divider style={{margin: 4, backgroundColor: Colors.white}} />
                  <Text numberOfLines={1} style={{fontSize: 15, fontWeight: 'bold', paddingVertical: 4}}>
                    Phone Number
                  </Text>
                  <Text numberOfLines={1} style={{fontSize: 15}}>
                    {otherUser?.phoneNumber}
                  </Text>
                </View>
                <View
                  style={{
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    marginTop: 32,
                  }}>
                  <List.Section
                  style={{
                    width: '100%',
                    height: '100%',
                  }}>
                    <List.Item
                      title="Send message"
                      style={{
                        padding: 2,
                        borderTopWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: Colors.grey300,
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
                                require('@/files/message.png')
                              }
                            />
                          )}
                        />
                      )}
                      onPress={goToChat}
                    />
                    <List.Item
                      title="Send email"
                      style={{
                        padding: 2,
                        borderBottomWidth: 1,
                        borderColor: Colors.grey300,
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
                                require('@/files/email2.png')
                              }
                            />
                          )}
                        />
                      )}
                      onPress={handleOpenEmail}
                    />
                    <List.Item
                      title="Visit his weboffice"
                      style={{
                        padding: 2,
                        borderBottomWidth: 1,
                        borderColor: Colors.grey300,
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
                                require('@/files/weboffice.png')
                              }
                            />
                          )}
                        />
                      )}
                      onPress={viewWebOffice}
                    />
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
                            <Image
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 5,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              source={
                                require('@/files/clear.png')
                              }
                            />
                          )}
                        />
                      )}
                      onPress={() => setOpenClear(true)}
                    />
                    <List.Item
                      title="Delete contact"
                      style={{
                        padding: 2,
                        borderBottomWidth: 1,
                        borderColor: Colors.grey300,
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
                                require('@/files/delete.png')
                              }
                            />
                          )}
                        />
                      )}
                      onPress={closeConversation}
                    />
                  </List.Section>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
