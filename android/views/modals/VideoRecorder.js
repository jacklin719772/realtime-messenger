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
import {Audio, Video} from 'expo-av';
import {Camera} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import {Dimensions, Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import * as mime from 'react-native-mime-types';
import {
  ActivityIndicator,
  Appbar,
  Colors,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import {v4 as uuidv4} from 'uuid';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

export default function VideoRecorder({open, setOpen}) {
  const {chatId, workspaceId, chatType} = useParams();
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] =useState(null);
  const [camera, setCamera] = useState(null);
  const [record, setRecord] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [recordingStatus, setRecordingStatus] = useState('ready');
  const [playingPosition, setPlayingPosition] = React.useState(0);

  const {setMessageSent} = useMessageFeature();

  const [loading, setLoading] = useState(false);

  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});

  const [recordingMillis, setRecordingMillis] = useState(0);

  const positionMillis = status?.positionMillis || 0;

  const [percentage, setPercentage] = React.useState(0);

  useEffect(() => {
    (async () => {
      try {
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraStatus.status === 'granted');
        const audioStatus = await Camera.requestMicrophonePermissionsAsync();
        setHasAudioPermission(audioStatus.status === 'granted');
      } catch (err) {
        showAlert(err.message);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (positionMillis > 0) {
      setPlayingPosition(positionMillis);
    }
  }, [positionMillis]);

  const takeVideo = async () => {
    setRecordingStatus('start');
    if(camera){
      try {
        const data = await camera.recordAsync({
          // VideoQuality: ['2160p'],
          // maxDuration: 10,
          // maxFileSize: 200,
          // mute: false,
          // videoBitrate: 5000000,
        });
        setRecord(data.uri);
        console.log(data.uri);
        setRecordingStatus('done');
      } catch (err) {
        showAlert(err.message);
      }
    }
  }

  useEffect(() => {
    return () => {
      setStatus(null);
      setRecord(null);
      setRecordingStatus('ready');
      setRecordingMillis(0);
      setPercentage(0);
      setType(Camera.Constants.Type.back);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (recordingStatus === 'start') {
      console.log('time interval', recordingMillis);
      interval = setInterval(() => setRecordingMillis(recordingMillis + 1000), 1000);
    }
    return () => {
      clearInterval(interval);
      // setRecordingMillis(0);
    }
  }, [recordingStatus, recordingMillis]);

  const stopVideo = async () => {
    camera.stopRecording();
  }

  async function sendVideo() {
    setLoading(true);
    try {
      const duration = msToSeconds(status?.durationMillis) * 1000;

      // if (duration < 3000) {
      //   throw new Error('Cannot send an empty message.');
      // }

      // Get file name from URI
      const fileName = record.split('/').pop();
      const fileType = mime.lookup(record);
      const messageId = uuidv4();

      const body = new FormData();
      body.append('key', `${now()}.${fileName.split(".").pop()}`);
      body.append('file', {
        uri: record,
        type: fileType,
        name: fileName,
      });

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
            <Appbar.Content title="Record video" />
          </Appbar.Header>
          <ScrollView
            style={{
              padding: 15,
              width: '100%',
              height: '90%',
            }}>
              {
                hasCameraPermission === null || hasAudioPermission === null ? (
                  <View />
                ) :
                hasCameraPermission === false || hasAudioPermission === false ? (
                  <Text>No access to camera</Text>
                ) :
                (
                  <>
                  {loading && <ActivityIndicator style={{paddingVertical: 12}} />}
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
                  {!loading && (
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 'auto',
                        height: '100%',
                      }}>
                      <Text style={{marginBottom: 10}}>
                        {recordingStatus === 'ready' || recordingStatus === 'start' ? formatMs(recordingMillis) : formatMs(status?.positionMillis || 0)}
                      </Text>

                      {recordingStatus === 'done' && record ? (
                        <View style={styles.cameraContainer}>
                          <Video
                            ref={video}
                            style={styles.fixedRatio}
                            source={{
                              uri: record,
                            }}
                            useNativeControls
                            resizeMode='contain'
                            isLooping
                            onPlaybackStatusUpdate={status => setStatus(() => status)}
                          />
                        </View>
                      ) : (
                        <View style={styles.cameraContainer}>
                          <Camera
                            style={styles.fixedRatio}
                            ref={ref => setCamera(ref)}
                            type={type}
                            ratio={"4:3"}
                            onCameraReady={() => setRecordingStatus('ready')}
                          />
                        </View>
                      )}
      
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}>
                        <IconButton
                          icon="camera-flip"
                          color={Colors.white}
                          size={35}
                          style={{backgroundColor: Colors.green400}}
                          onPress={() => {
                            setType(
                              type === Camera.Constants.Type.back
                              ? Camera.Constants.Type.front
                              : Camera.Constants.Type.back
                            );
                          }}
                        />
                        {(recordingStatus === 'done') ? <IconButton
                          icon="backup-restore"
                          color={Colors.white}
                          size={35}
                          style={{backgroundColor: Colors.blue400}}
                          onPress={() => {
                            setRecordingStatus('ready');
                            setRecordingMillis(0);
                          }}
                        /> :
                        (recordingStatus !== 'start') ? <IconButton
                          icon="record"
                          color={Colors.red500}
                          size={35}
                          style={{backgroundColor: Colors.blue400}}
                          onPress={takeVideo}
                        /> :
                        <IconButton
                          icon="stop"
                          color={Colors.white}
                          size={35}
                          style={{backgroundColor: Colors.red500}}
                          onPress={stopVideo}
                        /> }
                        <IconButton
                          disabled={recordingStatus !== 'done' || record === null}
                          icon={status?.isPlaying ? "pause" : "play"}
                          color={Colors.white}
                          size={35}
                          style={{backgroundColor: Colors.orange400}}
                          onPress={() => status?.isPlaying ? video.current.pauseAsync() : video.current.playAsync()}
                        />
                        <IconButton
                          disabled={recordingStatus !== 'done' || record === null}
                          icon="send"
                          color={Colors.white}
                          size={35}
                          style={{backgroundColor: Colors.pink500}}
                          onPress={sendVideo}
                        />
                      </View>
                    </View>
                  )}
                  </>
                )
              }
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    width: '100%',
    height: 600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedRatio: {
    width: (deviceWidth / deviceHeight) *600,
    height: 600,
  }
});
