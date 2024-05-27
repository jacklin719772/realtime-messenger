import {modalStyles} from '@/styles/styles';
import {Modal, View} from 'react-native';
import {Appbar, Colors} from 'react-native-paper';
import WebView from 'react-native-webview';

export default function WebOfficeModal({
  open,
  setOpen,
  src,
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
            <Appbar.Content title="Web Office" />
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
              source={{
                uri: src,
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
