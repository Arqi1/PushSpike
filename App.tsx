import React, {Component} from 'react';
import {StyleSheet, View, Alert, Button, ActivityIndicator} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from './.app.config';
import PushNotificationService from './src/services/NotificationService';
import PushNotificationRegistrationService from './src/services/NotificationRegistrationService';
import AppConfig from './.app.config';

interface IState {
  status: string;
  registeredOS: string;
  registeredToken: string;
  isRegistered: boolean;
  isBusy: boolean;
}

class App extends Component<IState> {
  state: IState;
  notificationService: PushNotificationService;
  notificationRegistrationService: PushNotificationRegistrationService;
  deviceId: Promise<string>;

  constructor(props: any) {
    super(props);
    this.deviceId = DeviceInfo.getUniqueId();
    this.state = {
      status: 'Push notifications registration status is unknown',
      registeredOS: '',
      registeredToken: '',
      isRegistered: false,
      isBusy: false,
    };

    this.notificationService = new PushNotificationService(
      this.onTokenReceived.bind(this),
      this.onNotificationReceived.bind(this),
    );

    this.notificationRegistrationService =
      new PushNotificationRegistrationService(Config.apiUrl, Config.apiKey);
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.isBusy && <ActivityIndicator></ActivityIndicator>}
        <View style={styles.button}>
          <Button
            title="Register"
            onPress={this.onRegisterButtonPress.bind(this)}
            disabled={this.state.isBusy}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Deregister"
            onPress={this.onDeregisterButtonPress.bind(this)}
            disabled={this.state.isBusy}
          />
        </View>
      </View>
    );
  }

  async onRegisterButtonPress() {
    if (!this.state.registeredToken || !this.state.registeredOS) {
      Alert.alert("The push notifications token wasn't received.");
      return;
    }

    let status: string = 'Registering...';
    let isRegistered = this.state.isRegistered;
    try {
      this.setState({isBusy: true, status});
      const pnPlatform = this.state.registeredOS == 'ios' ? 'apns' : 'fcm';
      const pnToken = this.state.registeredToken;
      const request = {
        installationId: this.deviceId,
        platform: pnPlatform,
        pushChannel: pnToken,
        tags: [],
      };
      const response = await this.notificationRegistrationService.registerAsync(
        request,
      );
      status = `Registered for ${this.state.registeredOS} push notifications`;
      isRegistered = true;
    } catch (e) {
      status = `Registration failed: ${e}`;
    } finally {
      this.setState({isBusy: false, status, isRegistered});
    }
  }

  async onDeregisterButtonPress() {
    if (!this.notificationService) return;

    let status: string = 'Deregistering...';
    let isRegistered = this.state.isRegistered;
    try {
      this.setState({isBusy: true, status});
      await this.notificationRegistrationService.deregisterAsync(
        await this.deviceId,
      );
      status = 'Deregistered from push notifications';
      isRegistered = false;
    } catch (e) {
      status = `Deregistration failed: ${e}`;
    } finally {
      this.setState({isBusy: false, status, isRegistered});
    }
  }

  onTokenReceived(token: any) {
    console.log(`Received a notification token on ${token.os}`);
    this.setState({
      registeredToken: token.token,
      registeredOS: token.os,
      status: `The push notifications token has been received.`,
    });

    if (
      this.state.isRegistered &&
      this.state.registeredToken &&
      this.state.registeredOS
    ) {
      this.onRegisterButtonPress();
    }
  }

  onNotificationReceived(notification: any) {
    console.log(`Received a push notification on ${this.state.registeredOS}`);
    this.setState({status: `Received a push notification...`});

    if (notification.data.message) {
      Alert.alert(
        AppConfig.appName,
        `${notification.data.action} action received`,
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    margin: 50,
  },
  button: {
    margin: 5,
    width: '100%',
  },
});

export default App;
