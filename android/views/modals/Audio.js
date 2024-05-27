import { env } from '@/config/env';
import { useMessageFeature } from '@/contexts/MessageContext';
import {useParams} from '@/contexts/ParamsContext';
import {showAlert} from '@/lib/alert';
import {postData} from '@/lib/api-helpers';
import {getIdToken, now} from '@/lib/auth';
import {formatMs, msToSeconds} from '@/lib/convert';
import {uploadFile} from '@/lib/storage';
import {modalStyles} from '@/styles/styles';
import axios from 'axios';
import {Audio} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React from 'react';
import {Modal, Text, View} from 'react-native';
import * as mime from 'react-native-mime-types';
import {
  ActivityIndicator,
  Appbar,
  Colors,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import {v4 as uuidv4} from 'uuid';

function AudioPlayer({uri, setPlayingPosition}) {
  const [sound, setSound] = React.useState(null);
  const [status, setStatus] = React.useState(null);

  async function loadAndPlaySound() {
    const {sound: soundSource} = await Audio.Sound.createAsync({
      uri,
    });
    soundSource.setOnPlaybackStatusUpdate(stat => setStatus(() => stat));
    await soundSource.setProgressUpdateIntervalAsync(100);
    setSound(soundSource);
    await soundSource.playAsync();
  }

  function unloadSound() {
    setSound(null);
    setStatus(null);
    sound.unloadAsync();
  }

  async function pauseSound() {
    await sound.pauseAsync();
    await sound.setPositionAsync(0);
  }

  React.useEffect(() => {
    return sound
      ? () => {
          unloadSound();
        }
      : undefined;
  }, []);

  React.useEffect(() => {
    if (status?.didJustFinish) {
      unloadSound();
    }
  }, [status]);

  const positionMillis = status?.positionMillis || 0;

  React.useEffect(() => {
    if (positionMillis > 0) {
      setPlayingPosition(positionMillis);
    }
  }, [positionMillis]);

  if (status?.isPlaying) {
    return (
      <IconButton
        icon="stop"
        color={Colors.white}
        size={35}
        style={{backgroundColor: Colors.grey500}}
        onPress={pauseSound}
      />
    );
  }
  return (
    <IconButton
      icon="play"
      color={Colors.white}
      size={35}
      style={{backgroundColor: Colors.blue500}}
      onPress={loadAndPlaySound}
    />
  );
}

export default function AudioModal({open, setOpen}) {
  const {chatId, workspaceId, chatType} = useParams();
  const [recording, setRecording] = React.useState(null);
  const [uri, setUri] = React.useState(null);
  const [status, setStatus] = React.useState(null);
  const [playingPosition, setPlayingPosition] = React.useState(0);
  const {setMessageSent} = useMessageFeature();

  const [loading, setLoading] = React.useState(false);

  const [percentage, setPercentage] = React.useState(0);

  function resetStates() {
    setUri(null);
    setStatus(null);
    setRecording(null);
    setPlayingPosition(0);
  }

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const {recording: record} = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY,
      );
      record.setOnRecordingStatusUpdate(stat => setStatus(() => stat));
      record.setProgressUpdateInterval(100);
      setRecording(record);
    } catch (err) {
      showAlert(err.message);
      console.error('Failed to start recording', err.message);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setUri(uri);
  }

  async function deleteRecording() {
    if (uri) {
      await FileSystem.deleteAsync(uri);
      resetStates();
    }
  }

  async function sendRecording() {
    setLoading(true);
    try {
      const duration = msToSeconds(status?.durationMillis) * 1000;

      // if (duration < 5000) {
      //   throw new Error('Cannot send an empty message.');
      // }

      // Get file name from URI
      const fileName = uri.split('/').pop();

      const fileType = mime.lookup(uri);

      const messageId = uuidv4();

      const body = new FormData();
      body.append('key', `${now()}.${fileName.split(".").pop()}`);
      body.append('file', {
        uri,
        type: fileType,
        name: fileName,
      });

      console.log(body);

      const res = await axios.post(
        `${env.GQL_SERVER}/storage/b/messenger/upload`,
        body,
        {
          headers: {
            Authorization: `Bearer ${await getIdToken()}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            setPercentage(Math.floor(loaded / total * 100) / 100);
            console.log(Math.floor(loaded / total * 100) / 100);
          },
        },
      );

      const filePath = res.data.url;
      console.log(filePath);

      await postData('/messages', {
        objectId: messageId,
        text: '',
        chatId,
        workspaceId,
        fileName,
        filePath,
        chatType,
      });
      setMessageSent(true);
      setUri(null);
      setStatus(null);
      setRecording(null);
      setPercentage(0);
      setOpen(false);
    } catch (err) {
      showAlert(err.message);
    }
    setLoading(false);
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => {
        setOpen(!open);
      }}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Appbar.Header
            statusBarHeight={0}
            style={{
              width: '100%',
              backgroundColor: '#fff',
            }}>
            <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
            <Appbar.Content title="Record audio" />
          </Appbar.Header>
          <View
            style={{
              padding: 15,
              width: '100%',
              height: '90%',
            }}>
            {!loading && (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                }}>
                <Text style={{marginBottom: 10}}>
                  {formatMs(playingPosition || status?.durationMillis || 0)}
                </Text>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}>
                  {status?.isDoneRecording && (
                    <IconButton
                      icon="delete"
                      color={Colors.white}
                      size={35}
                      style={{backgroundColor: Colors.grey500}}
                      onPress={deleteRecording}
                    />
                  )}
                  {!status?.isRecording && !status?.isDoneRecording && (
                    <IconButton
                      icon="microphone"
                      color={Colors.white}
                      size={35}
                      style={{backgroundColor: Colors.red600}}
                      onPress={startRecording}
                    />
                  )}
                  {status?.isRecording && !status?.isDoneRecording && (
                    <IconButton
                      icon="stop"
                      color={Colors.white}
                      size={35}
                      style={{backgroundColor: Colors.grey500}}
                      onPress={stopRecording}
                    />
                  )}
                  {!status?.isRecording && status?.isDoneRecording && (
                    <AudioPlayer
                      uri={uri}
                      setPlayingPosition={setPlayingPosition}
                    />
                  )}
                  {status?.isDoneRecording && (
                    <IconButton
                      icon="send"
                      color={Colors.white}
                      size={35}
                      style={{backgroundColor: Colors.green500}}
                      onPress={sendRecording}
                    />
                  )}
                </View>
              </View>
            )}
            {loading && <ActivityIndicator />}
            {loading &&
              <View
                style={{
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: Colors.black,
                    textAlign: 'center',
                  }}
                >{percentage * 100}% uploading... </Text>
                <ProgressBar
                  progress={percentage}
                  color={Colors.red500}
                  style={{
                    height: 8,
                    borderRadius: 4,
                  }}
                />
              </View>
            }
          </View>
        </View>
      </View>
    </Modal>
  );
}
