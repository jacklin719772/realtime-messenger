import {modalStyles} from '@/styles/styles';
import {Modal, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import {ActivityIndicator, Appbar, Colors, Modal as RNPModal, TextInput} from 'react-native-paper';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import { showAlert } from '@/lib/alert';
import { postData } from '@/lib/api-helpers';
import axios from 'axios';
import { getUteamToken } from '@/lib/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useModal } from '@/contexts/ModalContext';
import { useMessageFeature } from '@/contexts/MessageContext';
import { getFileURL } from '@/lib/storage';
import TreeView from 'react-native-final-tree-view';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import CircularProgress from 'react-native-circular-progress-indicator';
import RNFS from "react-native-fs";
import * as mime from 'react-native-mime-types';

export default function FavoriteModal() {
  const { openFavorite, setOpenFavorite } = useModal();
  const { messageToFavorite } = useMessageFeature();

  const [file, setFile] = useState(null);
  const [fileCategory, setFileCategory] = useState([]);
  const [filePath, setFilePath] = useState("");
  const [uri, setUri] = useState("");
  const [type, setType] = useState("*/*");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const today = React.useMemo(() => new Date(), []);

  const getFileObject = async (url) => {
    const fileName = url.split("/").pop().split("?")[0];
    setFilePath(fileName);
    const file = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    const options = {
      fromUrl: getFileURL(url),
      toFile: file,
    };

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to download the file',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert('Permission Denied! You need to give storage permission to download the file');
          return;
        }
      }

      // Download the file
      const downloadResult = await RNFS.downloadFile(options).promise;

      if (downloadResult.statusCode === 200) {
        // Share the file
        const fileObj = `file://${file}`;
        const name = fileObj.split('/').pop();
        const type = mime.lookup(fileObj);
        console.log(fileObj, name, type);
        setFile({
          uri: fileObj,
          type,
          name,
        });
        setUri(fileObj);
        setType(type);
      } else {
        showAlert('Download failed');
      }
    } catch (error) {
      // error
      console.log('Error-----', error);
      showAlert(error.message);
    }
    // const formattedURL = getFileURL(url);
    // if (formattedURL) {
    //   const response = await fetch(formattedURL);
    //   console.log(response);
    //   const blob = await response.blob();
    //   console.log(blob);
    //   const filename = url.split("?")[0].split("/")[url.split("?")[0].split("/").length -1];
    //   console.log(filename);
    //   setFilePath(filename);
    //   const file = new File([blob], filename);
    //   console.log(file);
    //   setFile(file);
    // } else {
    //   setFile(null);
    // }
  }

  const getFileCategory = async () => {
    const uteamToken = await getUteamToken();
    const response = await fetch('https://www.uteamwork.com/_api/km/getPrivateCategory', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${uteamToken}`,
      }
    });
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      const treeArray = getTreeArray(data.result, data.result.filter((i) => i.parent_id === 0));
      setFileCategory(treeArray);
    } else {
      setFileCategory([]);
    }
  }

  const getTreeArray = (originalAry, ary) => {
    const formattedArray = ary.map((item) => {
      const id = item.category_id;
      const name = item.name;
      const children = getTreeArray(originalAry, originalAry.filter((i) => i.parent_id === item.id));
      return { id, name, children };
    });
    console.log(JSON.stringify(formattedArray), '---');
    return formattedArray;
  }

  const {handleSubmit, setFieldValue, values, isSubmitting} =
    useFormik({
      initialValues: {
        document_id: `${today.getTime()}`,
        version: "",
        category_id: "",
        category_name: "",
        file_path: messageToFavorite?.fileName,
        keyword1: "",
        keyword2: "",
        keyword3: "",
        keyword4: "",
        title: messageToFavorite?.fileName.split(`.${messageToFavorite?.fileName.split(".")[messageToFavorite?.fileName.split(".").length - 1]}`)[0],
        abstract: "",
        completed: "0",
      },
      enableReinitialize: true,
      onSubmit: async val => {
        const { document_id, version, category_id, title, keyword1, keyword2, keyword3, keyword4, file_path, abstract } = val;
        if (document_id === "" || category_id === "" || title === "" || (keyword1 === "" && keyword2 === "" && keyword3 === "" && keyword4 === "")) {
          showAlert('Please input all required fields.');
          return;
        }
        if (!file || file_path === "") {
          showAlert('Please select file correctly.');
          return;
        }
        try {
          const uteamToken = await getUteamToken();
          let formData = new FormData();
          const newFileName = `${today.getTime()}.${filePath.split(".").pop()}`;1.0
          const data = {
            document_id,
            category_id,
            title,
            keyword1,
            keyword2,
            keyword3,
            keyword4,
            file_path,
            path: `_public/cloud/${newFileName}`,
            id: null,
            version,
            group: "",
            recording_file_id: 0,
            recording_file_name: "",
            abstract,
          }
          const Obkey = Object.keys(data);
          Obkey.forEach(t => {
            formData.append(t, data[t]);
          });
          formData.append("files", {
            uri,
            name: newFileName,
            type,
          });
          
          setUploading(true);
          const response = await axios.post("https://www.uteamwork.com/_api/cloudDiskController/upload", formData, {
            onUploadProgress: (progressEvent) => {
              const { loaded, total } = progressEvent;
              const percentage = Math.floor((loaded * 100) / total);
              console.log(percentage);
              setProgress(percentage);
            },
            headers: {
              "Authorization": `Bearer ${uteamToken}`,
              "Content-Type": "multipart/form-data",
            },
          });
          console.log(response);
          setUploading(false);
          if (response.status !== 200) {
            showAlert('Copying file to your private folder has been failed.');
            return;
          }
          if (response.status === 200) {
            try {
              await postData(`/messages/${messageToFavorite?.objectId}/favorites`);
              showAlert('The file has been successfully bookmarked to your private folder.');
              setOpenFavorite(false);
            } catch (error) {
              showAlert(error.message);
            }
          }
        } catch (err) {
          console.log(err);
          setUploading(false);
          showAlert(err.message);
        }
      },
    });

  const getIndicator = (isExpanded, hasChildrenNodes) => {
    if (!hasChildrenNodes) {
      return <MaterialCommunityIcons name="folder" size={16} color={Colors.black} />;
    } else if (isExpanded) {
      return <MaterialCommunityIcons name="folder-open" size={16} color={Colors.black} />;
    } else {
      return <MaterialCommunityIcons name="folder" size={16} color={Colors.black} />;
    }
  }

  React.useEffect(() => {
    getFileObject(messageToFavorite.fileURL);
  }, [messageToFavorite]);

  React.useEffect(() => {
    getFileCategory();
  }, []);

  React.useEffect(() => {
    console.log(fileCategory);
  }, [fileCategory]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={openFavorite}
      onRequestClose={() => {
        setOpenFavorite(!openFavorite);
      }}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Appbar.Header
            statusBarHeight={0}
            style={{
              width: '100%',
              backgroundColor: '#fff',
            }}>
            <Appbar.Action icon="window-close" onPress={() => setOpenFavorite(!openFavorite)} />
            <Appbar.Content title="Favorite" />
            <Appbar.Action icon="check" disabled={isSubmitting} onPress={handleSubmit} />
          </Appbar.Header>
          <ScrollView
            style={{
              display: 'flex', 
              flexGrow: 1,
              width: '100%', 
              height: '100%',
              padding: 12,
            }}
            contentContainerStyle={{
              alignItems: 'center', 
            }}
          >
            {isSubmitting && <ActivityIndicator style={{paddingVertical: 10}} />}
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <TextInput
                label="File ID"
                style={[styles.input, {
                  width: '48%',
                }]}
                value={values.document_id}
                placeholder='File ID'
                editable={false}
              />
              <TextInput
                label="File Version"
                style={[styles.input, {
                  width: '48%',
                }]}
                value={values.version}
                onChangeText={text => setFieldValue("version", text)}
                placeholder='v1.0'
              />
            </View>
            <TextInput
              label="Category"
              style={styles.input}
              value={values.category_name}
              placeholder='Category'
              editable={false}
            />
            <TreeView
              data={fileCategory}
              renderNode={({node, level, isExpanded, hasChildrenNodes}) => (
                <View
                  style={{
                    width: 300,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      marginLeft: 25 * level,
                    }}
                  >
                    {getIndicator(isExpanded, hasChildrenNodes)}
                    <Text
                      style={{
                        fontSize: 16,
                        color: Colors.black,
                        paddingLeft: 8,
                      }}
                    >
                      {node.name}
                    </Text>
                  </View>
                </View>
              )}
              onNodePress={(e) => {
                setFieldValue("category_name", e.node.name);
                setFieldValue("category_id", e.node.id);
              }}
            />
            <TextInput
              label="Title"
              style={styles.input}
              value={values.title}
              onChangeText={text => setFieldValue("title", text)}
              placeholder='Title'
            />
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <TextInput
                label="Keyword1"
                style={[styles.input, {
                  width: '48%',
                }]}
                value={values.keyword1}
                onChangeText={text => setFieldValue("keyword1", text)}
              />
              <TextInput
                label="Keyword2"
                style={[styles.input, {
                  width: '48%',
                }]}
                value={values.keyword2}
                onChangeText={text => setFieldValue("keyword2", text)}
              />
            </View>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <TextInput
                label="Keyword3"
                style={[styles.input, {
                  width: '48%',
                }]}
                value={values.keyword3}
                onChangeText={text => setFieldValue("keyword3", text)}
              />
              <TextInput
                label="Keyword4"
                style={[styles.input, {
                  width: '48%',
                }]}
                value={values.keyword4}
                onChangeText={text => setFieldValue("keyword4", text)}
              />
            </View>
            <TextInput
              label="File"
              style={styles.input}
              value={values.file_path}
              onChangeText={text => setFieldValue("file_path", text)}
              placeholder='File'
              editable={false}
            />
            <TextInput
              label="Abstract"
              style={styles.input}
              numberOfLines={4}
              multiline
              textAlignVertical='top'
              value={values.abstract}
              onChangeText={text => setFieldValue("abstract", text)}
              placeholder='Abstract'
            />
          </ScrollView>
        </View>
      </View>
      
      <Modal
      animationType="fade"
      transparent={true}
      visible={uploading}
      onRequestClose={() => {}}>
        <View
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <RNPModal
            visible={uploading}
            onDismiss={() => {}}
            contentContainerStyle={styles.modalContainer}
            style={styles.modalWrapper}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text style={{
                fontSize: 16,
                color: Colors.black,
              }}>Uploading file...</Text>
              <CircularProgress
                value={progress}
                radius={30}
                inActiveStrokeColor={Colors.green500}
                inActiveStrokeOpacity={0.2}
                progressValueColor={Colors.green500}
                valueSuffix={'%'}
              />
            </View>
          </RNPModal>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    color: Colors.black,
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  dropdownStyle: {
    marginTop: 12,
    borderColor: Colors.grey400,
    backgroundColor: Colors.transparent,
  },
  dropdownContainerStyle: {
    backgroundColor: Colors.grey50,
    borderColor: Colors.grey400,
  },
  modalContainer: {
    width: '70%',
    margin: 'auto',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
  },
  modalWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
