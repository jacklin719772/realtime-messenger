import {Text, View} from 'react-native';
import {Colors} from 'react-native-paper';

export default function NotificationIndicator({notifications, absolute = true, style}) {
  return (
    <View
      style={{
        ...(absolute && {position: 'absolute'}),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        right: 0,
        zIndex: 1,
        width: 20,
        height: 20,
        backgroundColor: Colors.white,
        borderRadius: 15,
        padding: 1,
        transform: [{translateX: +5}, {translateY: -5}],
        ...style,
      }}>
      <Text
        style={{
          width: 16,
          height: 16,
          backgroundColor: Colors.red500,
          borderRadius: 10,
          color: Colors.white,
          textAlign: 'center',
          fontSize: 12,
        }}
      >{notifications}</Text>
    </View>
  );
}
