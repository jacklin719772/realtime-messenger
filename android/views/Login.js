import {useAuth} from '@/contexts/AuthContext';
import {showAlert} from '@/lib/alert';
import {globalStyles} from '@/styles/styles';
import {useFormik} from 'formik';
import {SafeAreaView, View} from 'react-native';
import {Button, TextInput, Title} from 'react-native-paper';
import messaging from '@react-native-firebase/messaging';
import{ HmsPushInstanceId }from "@hmscore/react-native-hms-push";
import React from 'react';

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
        if (!val.fcmToken) {
          showAlert('Please check the connection to network.');
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
    HmsPushInstanceId.getToken("")
      .then((result) => {
        console.log("getToken", result.result);
        setFieldValue('fcmToken', result.result);
      })
      .catch((err) => {
        console.log(err);
        alert("[getToken] Error/Exception: " + JSON.stringify(err));
      });
    // await messaging().registerDeviceForRemoteMessages();
    // const token = await messaging().getToken();
    // console.log('messaging token: ', token);
    // setFieldValue('fcmToken', token);
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
