import {useAuth} from '@/contexts/AuthContext';
import {showAlert} from '@/lib/alert';
import {globalStyles} from '@/styles/styles';
import {useFormik} from 'formik';
import {SafeAreaView, View} from 'react-native';
import {Button, TextInput, Title} from 'react-native-paper';
import {HmsPushInstanceId} from "@hmscore/react-native-hms-push";
import React from 'react';
import HMSAvailability, { ErrorCode } from '@hmscore/react-native-hms-availability';
// import { getIpAddressSync } from "react-native-device-info";
// import * as Network from 'expo-network';
import Geolocation from '@react-native-community/geolocation';

export default function Login() {
  const {login} = useAuth();

  const {handleSubmit, handleChange, setFieldValue, values, isSubmitting} = useFormik({
    initialValues: {
      email: '',
      password: '',
      fcmToken: '',
    },
    enableReinitialize: true,
    onSubmit: async val => {
      console.log(val);
      try {
        if (!val.email) {
          showAlert('Email must be set.');
          return;
        }
        if (!val.password) {
          showAlert('Password must be set.');
          return;
        }

        await login(val.email, val.password, val.fcmToken);
      } catch (err) {
        // showAlert('Invalid password.');
        showAlert(err.message);
      }
    },
  });

  const onAppBootStrap = async () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('Current position:', latitude, longitude);

        // Check if the location is china
        if (
          latitude >= 3.86 &&
          latitude <= 53.55 &&
          longitude >= 73.66 &&
          longitude <= 135.05
        ) {
          HMSAvailability.isHuaweiMobileServicesAvailable()
          .then((res) => {
            if (res === 0) {
              HmsPushInstanceId.getToken("")
                .then((result) => {
                  console.log("getToken", result.result);
                  setFieldValue('fcmToken', result.result);
                })
                .catch((err) => {
                  console.log("[getToken] Error/Exception: " + JSON.stringify(err));
                  alert("[getToken] Error/Exception: " + JSON.stringify(err));
                });
            } else if (res === 1) {
              alert('No HMS Core (APK) is found on the device.');
            } else if (res === 2) {
              alert('HMS Core (APK) installed is out of date.');
            } else if (res === 3) {
              alert('HMS Core (APK) installed on the device is unavailable.');
            } else if (res === 9) {
              alert('HMS Core (APK) installed on the device is not the official version.');
            } else if (res === 21) {
              alert('The device is too old to support HMS Core (APK).');
            }
          })
          .catch((err) => { console.log(JSON.stringify(err)) });
        } else {
          HMSAvailability.isHuaweiMobileServicesAvailable()
          .then((res) => {
            if (res === 0) {
              HmsPushInstanceId.getToken("")
                .then((result) => {
                  console.log("getToken", result.result);
                  setFieldValue('fcmToken', result.result);
                })
                .catch((err) => {
                  console.log("[getToken] Error/Exception: " + JSON.stringify(err));
                  alert("[getToken] Error/Exception: " + JSON.stringify(err));
                });
            } else if (res === 1) {
              alert('No HMS Core (APK) is found on the device.');
            } else if (res === 2) {
              alert('HMS Core (APK) installed is out of date.');
            } else if (res === 3) {
              alert('HMS Core (APK) installed on the device is unavailable.');
            } else if (res === 9) {
              alert('HMS Core (APK) installed on the device is not the official version.');
            } else if (res === 21) {
              alert('The device is too old to support HMS Core (APK).');
            }
          })
          .catch((err) => { console.log(JSON.stringify(err)) });
        }
      },
      error => {
        console.error('Getting position failed: ', error.message);
        HMSAvailability.isHuaweiMobileServicesAvailable()
        .then((res) => {
          if (res === 0) {
            HmsPushInstanceId.getToken("")
              .then((result) => {
                console.log("getToken", result.result);
                setFieldValue('fcmToken', result.result);
              })
              .catch((err) => {
                console.log("[getToken] Error/Exception: " + JSON.stringify(err));
                alert("[getToken] Error/Exception: " + JSON.stringify(err));
              });
          } else if (res === 1) {
            alert('No HMS Core (APK) is found on the device.');
          } else if (res === 2) {
            alert('HMS Core (APK) installed is out of date.');
          } else if (res === 3) {
            alert('HMS Core (APK) installed on the device is unavailable.');
          } else if (res === 9) {
            alert('HMS Core (APK) installed on the device is not the official version.');
          } else if (res === 21) {
            alert('The device is too old to support HMS Core (APK).');
          }
        })
        .catch((err) => { console.log(JSON.stringify(err)) });
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 1000,
      }
    );
  };

  React.useEffect(() => {
    onAppBootStrap();
  }, []);

  return (
    <SafeAreaView
      style={{padding: 30, marginTop: 'auto', marginBottom: 'auto'}}>
      <Title style={{fontWeight: '600', fontSize: 30}}>Messenger</Title>
      <View style={{flexDirection: 'column'}}>
        <TextInput
          value={values.email}
          onChangeText={handleChange('email')}
          placeholder="Email"
          dense
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={[globalStyles.input, {marginTop: 20}]}
        />
        <TextInput
          value={values.password}
          onChangeText={handleChange('password')}
          placeholder="Password"
          autoComplete="password"
          autoCapitalize="none"
          label="Password"
          dense
          secureTextEntry
          style={[globalStyles.input, {marginTop: 20}]}
        />
        <Button
          mode="contained"
          loading={isSubmitting}
          disabled={isSubmitting}
          style={{marginTop: 20}}
          onPress={handleSubmit}>
          Sign In
        </Button>
      </View>
    </SafeAreaView>
  );
}
