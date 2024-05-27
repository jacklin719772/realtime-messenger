import Input from '@/components/Input';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useModal } from '@/contexts/ModalContext';
import { useUser } from '@/contexts/UserContext';
import { postData } from '@/lib/api-helpers';
import { modalStyles } from '@/styles/styles';
import { useFormik } from 'formik';
import React from 'react'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ActivityIndicator, Appbar, Colors, IconButton } from 'react-native-paper';

function EditMessage() {
  const {openEditMessage: open, setOpenEditMessage: setOpen} = useModal();
  const {messageToEdit: message, setMessageToEdit: setMessage} = useMessageFeature();
  const {userdata} = useUser();

  // FORM ----------------------------------------------------------------
  const {handleSubmit, setFieldValue, values, isSubmitting} =
    useFormik({
      initialValues: {
        text: message?.text.replace(/(<([^>]+)>)/ig, ''),
      },
      enableReinitialize: true,
      onSubmit: async val => {
        try {
          if (val.text.trim()) {
            await postData(`/messages/${message?.objectId}`, {
              text: `<p>${val.text}</p>`,
            });
          }
          setOpen(false);
          setMessage(null);
        } catch (err) {
          showAlert(err.message);
        }
      },
    });
  // ---------------------------------------------------------------------

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={open}
      onRequestClose={() => {
        setOpen(!open);
        setMessage(null);
      }}>
        <View style={modalStyles.centeredView}>
          <View style={modalStyles.modalView}>
            <Appbar.Header
              statusBarHeight={0}
              style={{width: '100%', backgroundColor: '#fff'}}>
              <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
              <Appbar.Content title="Edit Message" />
              <Appbar.Action icon="check" disabled={!values.text || isSubmitting} onPress={handleSubmit} />
            </Appbar.Header>
            <ScrollView
              style={{
                width: '100%',
                height: '100%',
                paddingHorizontal: 20,
              }}>
              {isSubmitting && <ActivityIndicator style={{paddingVertical: 10}} />}
              <Text
                style={styles.editDescriptionText}
              >Please enter the message and click check button.</Text>
              <View style={styles.inputContainer}>
                {/* <IconButton
                  icon="plus"
                  color={Colors.grey800}
                  size={25}
                  onPress={() => {}}
                /> */}
                <Input
                  text={values.text}
                  setText={setFieldValue}
                  isSubmitting={isSubmitting}
                />
                {/* <IconButton
                  icon="send"
                  color={Colors.grey800}
                  size={25}
                  disabled={!values.text || isSubmitting}
                  onPress={handleSubmit}
                /> */}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  )
}

export default EditMessage

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: 60,
    maxHeight: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 8,
  },
  editDescriptionText: {
    fontSize: 16,
    color: Colors.black,
    paddingTop: 24,
    paddingBottom: 12,
  },
});
