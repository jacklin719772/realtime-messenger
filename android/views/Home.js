import NotificationIndicator from '@/components/NotificationIndicator';
import OpenSearchButton from '@/components/OpenSearchButton';
import PresenceIndicator from '@/components/PresenceIndicator';
import {useChannelById, useChannels} from '@/contexts/ChannelsContext';
import {useDetailByChat} from '@/contexts/DetailsContext';
import {
  useDirectMessageById,
  useDirectMessages,
  useDirectRecipient,
} from '@/contexts/DirectMessagesContext';
import { useMessageFeature } from '@/contexts/MessageContext';
import {useModal} from '@/contexts/ModalContext';
import {useParams} from '@/contexts/ParamsContext';
import { useMessagesByChat } from '@/hooks/useMessages';
import { getFormattedTime, getPassedDays } from '@/lib/convert';
import { removeHtml } from '@/lib/removeHtml';
import {getFileURL} from '@/lib/storage';
import {usePresenceByUserId} from '@/lib/usePresence';
import Fontisto from '@expo/vector-icons/Fontisto';
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {Image, ScrollView, View, Text, StyleSheet} from 'react-native';
import {Colors, List, Modal, Portal} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import { showAlert } from '@/lib/alert';
import GlobalSearchModal from './modals/GlobalSearch';

function ChannelItem({channel}) {
  const navigation = useNavigation();
  const {setChatId, setChatType} = useParams();

  const {value: detail} = useDetailByChat(channel?.objectId);

  const {value: ch} = useChannelById(channel?.objectId);

  const {value: messages, loading} = useMessagesByChat(channel?.objectId);

  const [notifications, setNotifications] = React.useState(0);

  // const notifications = channel
  //   ? channel.lastMessageCounter - (detail?.lastRead || 0)
  //   : 0;
  React.useEffect(() => {
    if (ch) {
      // if ((ch.lastMessageCounter - (detail?.lastRead || 0)) === (notifications + 1)) {
      //   showAlert('New message arrived.');
      // }
      setNotifications(ch.lastMessageCounter - (detail?.lastRead || 0));
    }
  }, [ch, detail]);

  return (
    <List.Item
      key={channel.objectId}
      title={channel.name}
      titleStyle={{
        color: Colors.grey800,
        fontWeight: notifications > 0 ? 'bold' : 'normal',
      }}
      description={(!loading && messages && messages.length > 0) ? 
        messages[0]?.text ? 
          messages[0]?.text.includes('[Jitsi_Call_Log:]:') ? `[${JSON.parse(messages[0]?.text.substr(19, messages[0]?.text.length)).type}]` : removeHtml(messages[0]?.text) : 
          messages[0]?.sticker ? 
          `[Sticker] ${messages[0]?.sticker.split(".")[0]}` : `[File] ${messages[0]?.fileName}` : 
          loading ? 'Loading...' : 'No messages'}
      descriptionNumberOfLines={1}
      style={{
        borderColor: Colors.grey300,
        borderBottomWidth: 1,
      }}
      left={props => (
        <List.Icon
          {...props}
          icon={() => (
            <View style={{position: 'relative'}}>
              <Fontisto name="hashtag" size={20} />
              {notifications > 0 && <NotificationIndicator notifications={notifications} />}
            </View>
          )}
        />
      )}
      right={props => (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
          }}>
          <Text
            style={{
              fontSize: 10,
              color: Colors.grey500
            }}>
            {(!loading && messages && messages.length > 0) ? 
              `${getPassedDays(messages[0]?.createdAt)} ${getFormattedTime(messages[0]?.createdAt)}` : 
              loading ? '' : `${getPassedDays(channel?.createdAt)} ${getFormattedTime(channel?.createdAt)}`
            }
          </Text>
        </View>
      )}
      onPress={() => {
        setChatId(channel.objectId);
        setChatType('Channel');
        navigation.navigate('Chat', {
          objectId: channel.objectId,
        });
      }}
    />
  );
}

export function DirectMessageItem({direct}) {
  const navigation = useNavigation();
  const {setChatId, setChatType} = useParams();
  const {value: otherUser, isMe} = useDirectRecipient(direct?.objectId);
  const {isPresent} = usePresenceByUserId(otherUser?.objectId);

  const {value: detail} = useDetailByChat(direct?.objectId);

  const {value: dm} = useDirectMessageById(direct?.objectId);

  const {value: messages, loading} = useMessagesByChat(direct?.objectId);

  const [notifications, setNotifications] = React.useState(0);

  // const notifications = direct
  //   ? direct.lastMessageCounter - (detail?.lastRead || 0)
  //   : 0;
  React.useEffect(() => {
    if (dm) {
      // if ((dm.lastMessageCounter - (detail?.lastRead || 0)) === (notifications + 1)) {
      //   showAlert('New message arrived.');
      // }
      setNotifications(dm.lastMessageCounter - (detail?.lastRead || 0));
    }
  }, [dm, detail]);

  return (
    <List.Item
      key={direct.objectId}
      title={`${otherUser?.displayName}${isMe ? ' (me)' : ''}`}
      titleStyle={{
        color: Colors.grey900,
        fontWeight: notifications > 0 ? 'bold' : 'normal',
      }}
      description={(!loading && messages && messages.length > 0) ? 
        messages[0]?.text ? 
          messages[0]?.text.includes('[Jitsi_Call_Log:]:') ? `[${JSON.parse(messages[0]?.text.substr(19, messages[0]?.text.length)).type}]` : removeHtml(messages[0]?.text) : 
          messages[0]?.sticker ? 
          `[Sticker] ${messages[0]?.sticker.split(".")[0]}` : `[File] ${messages[0]?.fileName}` : 
        loading ? 'Loading...' : 'No messages'}
      descriptionNumberOfLines={1}
      style={{
        borderColor: Colors.grey200,
        borderBottomWidth: 1,
      }}
      left={props => (
        <List.Icon
          {...props}
          icon={() => (
            <View style={{position: 'relative'}}>
              <Image
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 5,
                }}
                source={
                  otherUser?.thumbnailURL
                    ? {uri: getFileURL(otherUser.thumbnailURL)}
                    : require('@/files/blank_user.png')
                }
              />
              <PresenceIndicator isPresent={isPresent} />
              {notifications > 0 && <NotificationIndicator notifications={notifications} />}
            </View>
          )}
        />
      )}
      right={props => (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
          }}>
          <Text
            style={{
              fontSize: 10,
              color: Colors.grey500
            }}>
            {(!loading && messages && messages.length > 0) ? 
              `${getPassedDays(messages[0]?.createdAt)} ${getFormattedTime(messages[0]?.createdAt)}` : 
              loading ? '' : `${getPassedDays(direct?.createdAt)} ${getFormattedTime(direct?.createdAt)}`
            }
          </Text>
        </View>
      )}
      onPress={() => {
        setChatId(direct.objectId);
        setChatType('Direct');
        navigation.navigate('Chat', {
          objectId: direct.objectId,
        });
      }}
    />
  );
}

export default function Home() {
  const {value: channels} = useChannels();
  const {value: directs} = useDirectMessages();
  const {setOpenChannelBrowser, setOpenMemberBrowser, openAddChat, setOpenAddChat, openGlobalSearch} = useModal();
  const {setIsSelecting} = useMessageFeature();

  const [channelsExpanded, setChannelsExpanded] = React.useState(true);
  const [directsExpanded, setDirectsExpanded] = React.useState(true);

  return (
    <ScrollView style={{flex: 1, backgroundColor: Colors.white}}>
      <OpenSearchButton />
      <List.Section title="">
        <List.Accordion
          title={`Channels (${channels?.length})`}
          expanded={channelsExpanded}
          style={{backgroundColor: Colors.white}}
          titleStyle={{color: Colors.grey800}}
          onPress={() => setChannelsExpanded(!channelsExpanded)}>
          {channels.map(channel => (
            <ChannelItem key={channel.objectId} channel={channel} />
          ))}
          <List.Item
            key="Add channels"
            title="Add channels"
            titleStyle={{color: Colors.grey800}}
            left={props => (
              <List.Icon
                {...props}
                icon={() => <Fontisto name="plus-a" size={15} />}
              />
            )}
            onPress={() => setOpenChannelBrowser(true)}
          />
        </List.Accordion>
        <List.Accordion
          title={`Direct messages (${directs?.length})`}
          expanded={directsExpanded}
          style={{backgroundColor: Colors.white}}
          titleStyle={{color: Colors.grey800}}
          onPress={() => setDirectsExpanded(!directsExpanded)}>
          {directs.map(direct => (
            <DirectMessageItem key={direct.objectId} direct={direct} />
          ))}
          <List.Item
            key="Add members"
            title="Add members"
            titleStyle={{color: Colors.grey800}}
            left={props => (
              <List.Icon
                {...props}
                icon={() => <Fontisto name="plus-a" size={15} />}
              />
            )}
            onPress={() => setOpenMemberBrowser(true)}
          />
        </List.Accordion>
      </List.Section>
      {openGlobalSearch && <GlobalSearchModal type="Home" />}
      {openAddChat && (
      <Portal>
        <Modal
          visible={openAddChat}
          onDismiss={() => setOpenAddChat(false)}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalWrapper}
        >
          <List.Section title="" titleStyle={{
            color: Colors.grey800,
          }}>
            <List.Item
              title="Add channels"
              style={{
                padding: 0,
              }}
              left={props => (
                <List.Icon
                  {...props}
                  icon={() => (
                    <MaterialCommunityIcons name="account-group" size={24} style={{color: Colors.black}} />
                  )}
                />
              )}
              onPress={() => {
                setOpenChannelBrowser(true);
                setOpenAddChat(false);
              }}
            />
            <List.Item
              title="Add members"
              style={{
                padding: 0,
              }}
              left={props => (
                <List.Icon
                  {...props}
                  icon={() => (
                    <MaterialCommunityIcons name="message" size={24} style={{color: Colors.black}} />
                  )}
                />
              )}
              onPress={() => {
                setOpenMemberBrowser(true);
                setOpenAddChat(false);
              }}
            />
          </List.Section>
        </Modal>
      </Portal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingTop: 32,
  },
  modalContainer: {
    width: 200,
    marginRight: 0,
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 8,
  }
});
