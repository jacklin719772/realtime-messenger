import {modalStyles} from '@/styles/styles';
import {Image, Modal, ScrollView, Text, TextInput, View} from 'react-native';
import {Appbar, Colors, List} from 'react-native-paper';
import {Fontisto, MaterialIcons} from '@expo/vector-icons';
import React from 'react';
import { getFileURL } from '@/lib/storage';
import { useChannels } from '@/contexts/ChannelsContext';
import { useDirectMessages, useDirectRecipient } from '@/contexts/DirectMessagesContext';
import { useModal } from '@/contexts/ModalContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useParams } from '@/contexts/ParamsContext';
import { useMessagesByChat } from '@/hooks/useMessages';
import { usePresenceByUserId } from '@/lib/usePresence';
import PresenceIndicator from '@/components/PresenceIndicator';
import { getFormattedTime, getPassedDays } from '@/lib/convert';

function ChannelItem({channel, search}) {
  const navigation = useNavigation();
  const {setChatId, setChatType} = useParams();
  const {setOpenGlobalSearch, setOpenSearchMessage, setOriginalSearch, setSearchMessageTitle} = useModal();

  const {value: messages, loading} = useMessagesByChat(channel?.objectId);

  const messageCount = (!loading && messages.length > 0) ? 
    messages.filter((m) => (
      (m.text && !m.text.includes('[Jitsi_Call_Log:]:') && m.text.toLowerCase().includes(search.toLowerCase())) ||
      (m.file && m.fileName.toLowerCase().includes(search.toLowerCase()))
    )).length : 0;

  if (!loading && messageCount === 0) {
    return <></>;
  }
  
  return (
    <List.Item
      key={channel.objectId}
      title={channel.name}
      titleStyle={{
        color: Colors.grey800,
        fontWeight: 'normal',
      }}
      description={loading ? "Loading..." : `${messageCount} relevant chat history`}
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
            </View>
          )}
        />
      )}
      right={() => (
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
        setOpenGlobalSearch(false);
        setOpenSearchMessage(true);
        setOriginalSearch(search);
        setSearchMessageTitle(channel.name);
      }}
    />
  );
}

export function DirectMessageItem({direct, search}) {
  const navigation = useNavigation();
  const {setChatId, setChatType} = useParams();
  const {setOpenGlobalSearch, setOpenSearchMessage, setOriginalSearch, setSearchMessageTitle} = useModal();
  const {value: otherUser, isMe} = useDirectRecipient(direct?.objectId);
  const {isPresent} = usePresenceByUserId(otherUser?.objectId);

  const {value: messages, loading} = useMessagesByChat(direct?.objectId);

  const messageCount = (!loading && messages.length > 0) ? 
    messages.filter((m) => (
      (m.text && !m.text.includes('[Jitsi_Call_Log:]:') && m.text.toLowerCase().includes(search.toLowerCase())) ||
      (m.file && m.fileName.toLowerCase().includes(search.toLowerCase()))
    )).length : 0;

  if (!loading && messageCount === 0) {
    return <></>;
  }

  return (
    <List.Item
      key={direct.objectId}
      title={`${otherUser?.displayName}${isMe ? ' (me)' : ''}`}
      titleStyle={{
        color: Colors.grey900,
        fontWeight: 'normal',
      }}
      description={loading ? "Loading..." : `${messageCount} relevant chat history`}
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
            </View>
          )}
        />
      )}
      right={() => (
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
        setOpenGlobalSearch(false);
        setOpenSearchMessage(true);
        setOriginalSearch(search);
        setSearchMessageTitle(`${otherUser?.displayName}${isMe ? ' (me)' : ''}`);
      }}
    />
  );
}

export default function GlobalSearchModal({type}) {
  const [search, setSearch] = React.useState("");
  const {value: channels} = useChannels();
  const {value: directs} = useDirectMessages();
  const {openGlobalSearch, setOpenGlobalSearch, searchOrigin} = useModal();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={openGlobalSearch}
      onRequestClose={() => {
        setOpenGlobalSearch(!openGlobalSearch);
      }}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Appbar.Header
            statusBarHeight={0}
            style={{
              width: '100%',
              backgroundColor: '#fff',
            }}>
            <Appbar.Action icon="arrow-left" onPress={() => setOpenGlobalSearch(!openGlobalSearch)} />
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
            <ScrollView style={{flex: 1, width: '100%'}}>
              <List.Section title="">
                {searchOrigin === "Home" &&
                <>
                  <Text
                    style={{
                      backgroundColor: Colors.grey200,
                      color: Colors.black,
                      padding: 8,
                      fontSize: 16,
                    }}
                  >Channels</Text>
                  {channels.map(channel => (
                    <ChannelItem key={channel.objectId} channel={channel} search={search} />
                  ))}
                </>}
                <Text
                  style={{
                    backgroundColor: Colors.grey200,
                    color: Colors.black,
                    padding: 8,
                    fontSize: 16,
                  }}
                >Direct messages</Text>
                {directs.map(direct => (
                  <DirectMessageItem key={direct.objectId} direct={direct} search={search} />
                ))}
              </List.Section>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}


