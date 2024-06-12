import { useChannels } from '@/contexts/ChannelsContext';
import { useDirectMessages } from '@/contexts/DirectMessagesContext';
import { useModal } from '@/contexts/ModalContext';
import {useParams} from '@/contexts/ParamsContext';
import {useWorkspaceById} from '@/contexts/WorkspacesContext';
import {getFileURL} from '@/lib/storage';
import Chat from '@/views/Chat';
import DMs from '@/views/DMs';
import Home from '@/views/Home';
import You from '@/views/You';
import Feather from '@expo/vector-icons/Feather';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import React from 'react';
import {Image, TouchableOpacity} from 'react-native';
import {Colors, IconButton} from 'react-native-paper';
import ChannelCalendar from './ChannelCalendar';
import Contacts from './Contacts';

function showHeader(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';

  switch (routeName) {
    case 'Home':
      return true;
    case 'DMs':
      return false;
    case 'Contacts':
      return false;
    case 'Me':
      return false;
  }
}

const Tab = createBottomTabNavigator();

function Menu() {
  const {setOpenAddDirect} = useModal();
  return (
    <Tab.Navigator
      activeColor={Colors.black}
      in={Colors.grey500}
      screenOptions={{tabBarHideOnKeyboard: true}}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({color}) => (
            <Feather name="home" color={color} size={24} />
          ),
          tabBarLabelStyle: {marginBottom: 3, fontWeight: 'bold'},
          tabBarActiveTintColor: Colors.black,
          tabBarInactiveTintColor: Colors.grey500,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="DMs"
        component={DMs}
        options={{
          tabBarIcon: ({color}) => (
            <Feather name="message-circle" color={color} size={24} />
          ),
          tabBarLabelStyle: {marginBottom: 3, fontWeight: 'bold'},
          headerTitle: 'Direct messages',
          headerTintColor: Colors.white,
          headerStyle: {
            backgroundColor: Colors.blue500,
          },
          headerRight: () => (
            <IconButton
              icon="account-plus"
              size={28}
              color={Colors.white}
              onPress={() => setOpenAddDirect(true)}
            />
          ),
          tabBarActiveTintColor: Colors.black,
          tabBarInactiveTintColor: Colors.grey500,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={Contacts}
        options={{
          tabBarIcon: ({color}) => (
            <Image
              style={{
                width: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                overlayColor: color,
              }}
              source={
                require('@/files/contacts.png')
              }
            />
          ),
          headerTintColor: Colors.white,
          headerStyle: {
            backgroundColor: Colors.blue500,
          },
          headerRight: () => (
            <IconButton
              icon="account-plus"
              size={28}
              color={Colors.white}
              onPress={() => setOpenAddDirect(true)}
            />
          ),
          tabBarLabelStyle: {marginBottom: 3, fontWeight: 'bold'},
          tabBarActiveTintColor: Colors.black,
          tabBarInactiveTintColor: Colors.grey500,
        }}
      />
      <Tab.Screen
        name="Me"
        component={You}
        options={{
          tabBarIcon: ({color}) => (
            <Feather name="user" color={color} size={24} />
          ),
          headerTintColor: Colors.white,
          headerStyle: {
            backgroundColor: Colors.blue500,
          },
          tabBarLabelStyle: {marginBottom: 3, fontWeight: 'bold'},
          tabBarActiveTintColor: Colors.black,
          tabBarInactiveTintColor: Colors.grey500,
        }}
      />
    </Tab.Navigator>
  );
}

const Stack = createStackNavigator();

export default function Workspace({route, navigation}) {
  const {objectId} = route.params;

  const {setWorkspaceId} = useParams();
  const {value: workspace} = useWorkspaceById(objectId);
  const {value: channels} = useChannels();
  const {value: directs} = useDirectMessages();
  const {setOpenAddChat} = useModal();

  React.useEffect(() => {
    setWorkspaceId(objectId);
  }, [objectId]);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Menu"
        component={Menu}
        options={({route}) => ({
          headerTitle: workspace?.name + ' (' + (channels?.length + directs?.length) + ')' || 'Home',
          headerTintColor: Colors.white,
          headerStyle: {
            backgroundColor: Colors.blue500,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Image
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 5,
                  marginLeft: 12,
                }}
                source={
                  workspace?.thumbnailURL
                    ? {uri: getFileURL(workspace.thumbnailURL)}
                    : require('@/files/blank_workspace.png')
                }
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            // <TouchableOpacity onPress={() => {}}>
            //   <Image
            //     style={{
            //       width: 30,
            //       height: 30,
            //       borderRadius: 5,
            //       marginRight: 12,
            //     }}
            //     source={require('@/files/plus-circle.png')}
            //   />
            // </TouchableOpacity>
            <IconButton
              icon="plus-circle-outline"
              size={28}
              color={Colors.white}
              onPress={() => setOpenAddChat(true)}
            />
          ),
          headerShown: showHeader(route),
        })}
      />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerStyle: {
            borderBottomWidth: 1,
            borderBottomColor: Colors.grey300,
          },
        }}
      />
      <Stack.Screen
        name="Calendar"
        component={ChannelCalendar}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerStyle: {
            borderBottomWidth: 1,
            borderBottomColor: Colors.grey300,
          },
        }}
      />
    </Stack.Navigator>
  );
}
