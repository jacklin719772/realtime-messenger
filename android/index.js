/**
 * @format
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from '@/App';
import {name as appName} from '@/app.json';
// import messaging from '@react-native-firebase/messaging';
// import notifee, { EventType } from '@notifee/react-native';

import {
  HmsPushMessaging,
  RNRemoteMessage,
  HmsLocalNotification,
  HmsPushEvent,
} from "@hmscore/react-native-hms-push";

// notifee.onBackgroundEvent(async ({ type, detail }) => {
//     const { notification, pressAction } = detail;
  
//     // Check if the user pressed the "Mark as read" action
//     if (type === EventType.ACTION_PRESS && pressAction.id === 'mark-as-read') {
//       // Remove the notification
//         await notifee.cancelNotification(notification.id);
//     }
// });

// messaging().setBackgroundMessageHandler(async remoteMessage => {
//     console.log('Message handled in the background!', remoteMessage);
//     const channelId = await notifee.createChannel({
//         id: 'default',
//         name: 'Default Channel',
//     });

//     const { title, body } = remoteMessage.notification;
  
//       // Display a notification
//     await notifee.displayNotification({
//         title,
//         body,
//         android: {
//             channelId,
//             // pressAction is needed if you want the notification to open the app when pressed
//             pressAction: {
//             id: 'default',
//             },
//         },
//     });
// });
HmsPushMessaging.turnOnPush()
  .then((result) => {
    console.log("turnOnPush", result);
  })
  .catch((err) => {
    console.log("[turnOnPush] Error/Exception: " + JSON.stringify(err));
  });

HmsPushEvent.onNotificationOpenedApp((result) => {
  console.log("onNotificationOpenedApp", result);
});

HmsPushMessaging.setBackgroundMessageHandler((dataMessage) => {
  console.log(dataMessage, dataMessage);
  HmsLocalNotification.localNotification({
    [HmsLocalNotification.Attr.title]: JSON.parse(new RNRemoteMessage(
      dataMessage
    ).getData()).pushbody.title,
    [HmsLocalNotification.Attr.message]: JSON.parse(new RNRemoteMessage(
      dataMessage
    ).getData()).pushbody.description,
    [HmsLocalNotification.Attr.largeIcon]: JSON.parse(new RNRemoteMessage(
      dataMessage
    ).getData()).pushbody.params["key1"],
  })
    .then((result) => {
      console.log("[Headless] DataMessage Received", result);
    })
    .catch((err) => {
      console.log(
        "[LocalNotification Default] Error/Exception: " + JSON.stringify(err)
      );
    });

  return Promise.resolve();
});


AppRegistry.registerComponent(appName, () => App);