import Input from '@/components/Input';
import { useMessageFeature } from '@/contexts/MessageContext';
import { useModal } from '@/contexts/ModalContext';
import { useUser } from '@/contexts/UserContext';
import { modalStyles } from '@/styles/styles';
import { useFormik } from 'formik';
import React, { useRef, useState } from 'react'
import { Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native'
// import EmailChip from 'react-native-email-chip';
// import { TagArea, Chip } from 'react-native-chip-tags';
// import EmailChipInput from '@arelstone/react-native-email-chip';
import EmailTagInput from 'react-native-email-tag-input';
import { ActivityIndicator, Appbar, Avatar, Colors } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import {actions, FONT_SIZE, getContentCSS, RichEditor, RichToolbar} from 'react-native-pell-rich-editor';
import { postData } from '@/lib/api-helpers';
import { showAlert } from '@/lib/alert';
import { removeHtml } from '@/lib/removeHtml';

function SendMail() {
  const {openSendMail: open, setOpenSendMail: setOpen, initialUsers, setInitialUsers} = useModal();
  const {messageToSendMail: message, setMessageToSendMail: setMessage} = useMessageFeature();
  const {userdata} = useUser();

  const [recipients, setRecipients] = useState(initialUsers);

  const richText = useRef(null);

  const onChange = (emails) => {
    const regexEmail = /^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-z]{2,4})$/;
    if (regexEmail.test(emails[emails.length - 1])) {
      setRecipients(emails);
    } else {
      const tempEmails = [...emails];
      tempEmails.splice((emails.length - 1), 1);
      setRecipients(tempEmails);
    }
  }

  React.useEffect(() => {
    console.log(initialUsers);
    setRecipients(initialUsers);
    return () => {
      setRecipients([]);
      setInitialUsers([]);
    }
  }, []);

  // FORM ----------------------------------------------------------------
  const {handleSubmit, setFieldValue, values, isSubmitting} =
    useFormik({
      initialValues: {
        subject: '',
        body: removeHtml(message),
      },
      enableReinitialize: true,
      onSubmit: async val => {
        if (recipients.length === 0) {
          return;
        }
        try {
          let attachments = [];
          await postData("/mail", {
            from: userdata?.email,
            to: recipients,
            subject: val.subject,
            html: val.body,
            attachments
          });
          showAlert("The e-mail sent.")
          setOpen(false);
          setMessage(null);
        } catch (err) {
          showAlert("Sending e-mail failed.");
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
              style={{width: '100%', backgroundColor: Colors.white}}>
              <Appbar.Action icon="window-close" onPress={() => setOpen(!open)} />
              <Appbar.Content title="Send Mail" />
              <Appbar.Action icon="check" disabled={recipients.length === 0 || isSubmitting} onPress={handleSubmit} />
            </Appbar.Header>
            <ScrollView
              style={{
                width: '100%',
                height: '100%',
                paddingHorizontal: 20,
              }}>
              {isSubmitting && <ActivityIndicator style={{paddingVertical: 10}} />}
              <View style={styles.inputContainer}>
                <MaterialIcons name="alternate-email" size={24} color={Colors.grey700} />
                <EmailTagInput
                  value={recipients}
                  textInputStyle={{
                    fontSize: 16,
                    paddingLeft: 12,
                  }}
                  suggessionData={[]}
                  onChange={(emails) => setRecipients(emails)}
                  placeholder="Enter email..."
                  Avatar={({email}) => (
                    <Avatar.Text size={20} label={email.substring(0, 2).toUpperCase()} />
                  )}
                  CloseIcon={() => (
                    <MaterialIcons name="close" size={20} color={Colors.white} />
                  )}
                />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="subject" size={24} color={Colors.grey700} />
                <TextInput
                  value={values.subject}
                  onChangeText={(t) => setFieldValue('subject', t)}
                  style={styles.textInput}
                  placeholder="Subject"
                  placeholderTextColor={Colors.grey400}
                />
              </View>
              <View style={[styles.inputContainer, {
                alignItems: 'flex-start',
              }]}>
                <MaterialIcons name="text-fields" size={24} color={Colors.grey700} />
                <TextInput
                  value={values.body}
                  onChangeText={(t) => setFieldValue('body', t)}
                  style={styles.body}
                  placeholder="Body"
                  multiline
                  numberOfLines={1}
                  placeholderTextColor={Colors.grey400}
                />
              </View>
              {/* <RichEditor ref={richText} /> */}
              {/* <EmojiSelector onEmojiSelected={(emoji) => console.log(emoji)} /> */}
            </ScrollView>
          </View>
        </View>
      </Modal>
  )
}

export default SendMail

const styles = StyleSheet.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.grey500,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    marginTop: 12,
  },
  textInput: {
    width: '93%',
    minHeight: 40,
    maxHeight: 100,
    margin: 0,
    padding: 12,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 17,
    letterSpacing: 0,
    fontWeight: '400',
    alignItems: 'center',
  },
  body: {
    width: '93%',
    minHeight: 40,
    maxHeight: 320,
    margin: 0,
    padding: 12,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 17,
    letterSpacing: 0,
    fontWeight: '400',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    textAlign: 'justify',
  },
});
