import {Alert, Linking} from 'react-native';
import NotificationHandler from './NotificationHandler';
import PushNotification from 'react-native-push-notification';

export default class NotificationService {
  constructor(onTokenReceived: any, onNotificationReceived: any) {
    NotificationHandler.attachTokenReceived(onTokenReceived);
    NotificationHandler.attachNotificationReceived(onNotificationReceived);
    PushNotification.getApplicationIconBadgeNumber(function (number: number) {
      if (number > 0) {
        PushNotification.setApplicationIconBadgeNumber(0);
      }
    });
  }

  checkPermissions() {
    PushNotification.checkPermissions(permissions => {
      if (!permissions.alert && !permissions.badge && !permissions.sound) {
        // The user has not granted permissions, show a dialog here
        showEnableNotificationsDialog();
      }
    });
  }

  requestPermissions() {
    return PushNotification.requestPermissions();
  }

  // cancelNotifications() {
  //   PushNotification.cancelLocalNotifications();
  // }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  abandonPermissions() {
    PushNotification.abandonPermissions();
  }
}

const showEnableNotificationsDialog = () => {
  Alert.alert(
    'Enable Notifications',
    'This app needs notifications to work effectively.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Enable', onPress: () => openSettings()},
    ],
  );
};

const openSettings = () => {
  Linking.openSettings().catch(() => {
    Alert.alert('Unable to open settings');
  });
};
