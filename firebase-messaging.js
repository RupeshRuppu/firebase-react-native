import {View, Text, SafeAreaView, Alert} from 'react-native';
import React, {useEffect, useState} from 'react';
import messaging from '@react-native-firebase/messaging';

const App = () => {
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    /*
      getUserPermission to receive messages.
   */
    if (requestUserPermission()) {
      messaging()
        .getToken()
        .then(fcmToken => {
          console.log('fcmToken', fcmToken);
          setFcmToken(fcmToken);
        })
        .catch(err => {
          console.log('error happened while getting fcm token', err);
        });
    }

    /* when a message got triggered from fcm service and the app is opened via message this functions get's triggered with data received from fcm. else null */

    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        /* if remotemessage exists it means that app is opened via message. */
        if (remoteMessage) {
          console.log(
            'notification caused app to open totally from quit state',
          );
        } else {
          console.log(
            'app opened via another mothod, most likely through manual process.',
          );
        }
      });

    /*  when app is in background state and if user presses a message which gets triggered from fcm service then this callback get's executed. */

    messaging().onNotificationOpenedApp(async remoteMessage => {
      if (remoteMessage) {
        console.log(
          'notification caused app to open from background state',
          remoteMessage,
        );
      } else {
        console.log(
          'notification remoteMessage onNotificationOpenedApp is NULL',
        );
      }
    });

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return () => unsubscribe;
  }, []);

  const requestUserPermission = async () => {
    await messaging().registerDeviceForRemoteMessages();
    try {
      const authorizationStatus = await messaging().requestPermission();
      const {AUTHORIZED, PROVISIONAL} = messaging.AuthorizationStatus;
      return (
        authorizationStatus === AUTHORIZED ||
        authorizationStatus === PROVISIONAL
      );
    } catch (e) {
      console.log('authorization failed for message communication.', e);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text
          style={{fontFamily: 'Manrope-Bold', fontSize: 30, color: '#000000'}}>
          FCM
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default App;
