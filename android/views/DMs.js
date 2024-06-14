import OpenSearchButton from '@/components/OpenSearchButton2';
import {
  useDirectMessages,
} from '@/contexts/DirectMessagesContext';
import {ScrollView} from 'react-native';
import {
  ActivityIndicator,
  Colors,
  List,
} from 'react-native-paper';
import { DirectMessageItem } from './Home';

export default function DMs() {
  const {value, loading} = useDirectMessages();

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: Colors.white,
      }}>
      <OpenSearchButton />
      {/* <TouchableRipple
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
        onPress={() => setOpenMemberBrowser(true)}>
        <View style={globalStyles.alignStart}>
          <Feather name="plus-circle" color={Colors.grey800} size={18} />
          <Text style={{paddingHorizontal: 10}}>Add members</Text>
        </View>
      </TouchableRipple> */}
      {/* {value.map(dm => (
        <Direct key={dm.objectId} direct={dm} />
      ))} */}
      <List.Section title="">
        {value.map(direct => (
          <DirectMessageItem key={direct.objectId} direct={direct} />
        ))}
      </List.Section>
    </ScrollView>
  );
}
