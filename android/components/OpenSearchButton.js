import {useModal} from '@/contexts/ModalContext';
import { useNavigation } from '@react-navigation/native';
import {Colors, Text, TouchableRipple} from 'react-native-paper';

export default function OpenSearchButton() {
  const navigation = useNavigation();

  const goToContacts = () => {
    navigation.navigate('Contacts');
  }

  return (
    <TouchableRipple
      onPress={goToContacts}
      borderless
      style={{
        margin: 10,
        borderRadius: 5,
      }}>
      <Text
        style={{
          color: Colors.grey600,
          borderWidth: 0.5,
          borderRadius: 5,
          padding: 8,
          borderColor: Colors.grey400,
          backgroundColor: Colors.white,
        }}>
        Jump to...
      </Text>
    </TouchableRipple>
  );
}
