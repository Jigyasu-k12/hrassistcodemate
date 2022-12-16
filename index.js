/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import OneSignal from 'react-native-onesignal';
import Toast from 'react-native-simple-toast';
import * as RootNavigation from './src/navigations/RootNavigation';



AppRegistry.registerComponent(appName, () => App);

// OneSignal Initialization
OneSignal.setAppId("00bd1ef6-7b9f-44a1-98ce-986d3f9654ce");

// promptForPushNotificationsWithUserResponse will show the native iOS or Android notification permission prompt.
// We recommend removing the following code and instead using an In-App Message to prompt for notification permission (See step 8)
OneSignal.promptForPushNotificationsWithUserResponse();

//Method for handling notifications received while app in foreground
OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
  console.log("OneSignal: notification will show in foreground:", notificationReceivedEvent);
  let notification = notificationReceivedEvent.getNotification();
  console.log("notification: ", notification);
  const data = notification.additionalData
  console.log("additionalData: ", data);
//   Toast.show("New Notification: "+notification?.title);
  // Complete with null means don't show a notification.
  notificationReceivedEvent.complete(notification);
});

//Method for handling notifications opened
OneSignal.setNotificationOpenedHandler(notification => {
  console.log("OneSignal: notification opened:", notification);
  RootNavigation.navigate('Notification');
});

