import {useModal} from '@/contexts/ModalContext';
import {Colors, Text, TouchableRipple} from 'react-native-paper';

export default function OpenSearchButton() {
  const {setOpenJumpTo, setActiveTab} = useModal();
  
  return (
    <TouchableRipple
      onPress={() => {
        setActiveTab('DMs');
        setOpenJumpTo(true);
      }}
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
