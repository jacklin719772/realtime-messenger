import {modalStyles} from '@/styles/styles';
import {Image, Modal, Text, View} from 'react-native';
import {Appbar, Colors} from 'react-native-paper';
import WebView from 'react-native-webview';
import {env} from "@/config/env";
import { Base64 } from 'js-base64';

export default function FilePreviewModal({
  open,
  setOpen,
  chat,
}) {

  return (
    <Modal
      animationType="fade"
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
            <Appbar.Content title={chat?.fileName} />
          </Appbar.Header>
          <View
            style={{
              display: 'flex', 
              flexDirection: 'row',
              flexGrow: 1,
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: '100%',
            }}
          >
            <WebView
              // originWhitelist={['*']}
              source={{
                // html: '<h1>This is a static HTML source!</h1>'
                uri: `${env.PREVIEW_URL}${encodeURIComponent(Base64.encode(`${env.GQL_SERVER}${chat?.fileURL.replace(/%2F/g, "%252F")}`))}`
              }}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                borderWidth: 1,
                borderColor: Colors.grey200,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
