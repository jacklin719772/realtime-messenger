import {useModal} from '@/contexts/ModalContext';
import { useParams } from '@/contexts/ParamsContext';
import {useUser} from '@/contexts/UserContext';
import {getFileURL} from '@/lib/storage';
import {globalStyles} from '@/styles/styles';
import ProfileModal from '@/views/modals/Profile';
import Feather from '@expo/vector-icons/Feather';
import {Dimensions, FlatList, Image, Pressable, ScrollView, View} from 'react-native';
import {ActivityIndicator, Button, Colors, Dialog, Divider, Portal, Text, TouchableRipple} from 'react-native-paper';
import {Calendar, modeToNum} from 'react-native-big-calendar';
import DropDownPicker from 'react-native-dropdown-picker';
import {MaterialIcons, MaterialCommunityIcons} from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useChannelById } from '@/contexts/ChannelsContext';
import { useUserById } from '@/contexts/UsersContext';
import axios from 'axios';
import { showAlert } from '@/lib/alert';
import dayjs from 'dayjs';
import { getUteamToken } from '@/lib/auth';
import EditEventModal from './modals/EditEvent';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ChannelCalendar() {
  const {chatId, chatType, workspaceId} = useParams();
  const {userdata} = useUser();
  const {setOpenProfile, setOpenPreferences} = useModal();

  const {value: channel} = useChannelById(chatId);
  const {value: owner} = useUserById(channel?.createdBy);

  const today = new Date();
  
  const [mode, setMode] = useState("month");
  const [openSelect, setOpenSelect] = useState(false);
  const [date, setDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const renderItems = [
    {
      label: 'Month',
      value: 'month',
      icon: () => <MaterialCommunityIcons name="calendar-month" color={Colors.grey800} size={18} />,
    },
    {
      label: 'Week',
      value: 'week',
      icon: () => <MaterialCommunityIcons name="calendar-week" color={Colors.grey800} size={18} />,
    },
    {
      label: 'Day',
      value: 'day',
      icon: () => <MaterialCommunityIcons name="calendar-today" color={Colors.grey800} size={18} />,
    },
  ];

  const [allMeeting, setAllMeeting] = useState([]);
  const [uteamworkUserData, setUteamworkUserData] = useState([]);
  const [ownerData, setOwnerData] = useState(null);
  const [events, setEvents] = useState([]);
  const [dateEvents, setDateEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openEventDlg, setOpenEventDlg] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  const _onPrevDate = () => {
    if (mode === 'month') {
      setDate(
        dayjs(date)
          .add(dayjs(date).date() * -1, 'day')
          .toDate(),
      );
    } else {
      setDate(
        dayjs(date)
          .add(modeToNum(mode, date) * -1, 'day')
          .toDate(),
      );
    }
  }

  const _onNextDate = () => {
    setDate(dayjs(date).add(modeToNum(mode, date), 'day').toDate());
  }

  const _onToday = () => {
    setDate(today);
  }

  const getUteamworkUserData =async () => {
    const response = await fetch("https://www.uteamwork.com/_api/annonymous/getUsers", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      }
    });
    const result = await response.json();
    if (result.result) {
      setUteamworkUserData(result.result);
    } else {
      setUteamworkUserData(null);
    }
  }

  const getAllMeeting = async () => {
    try {
      const response = await axios.post("https://www.uteamwork.com/_api/meeting/getAllMeeting2", {
        id: ownerData.memberId,
        email: ownerData.email,
      }, {
        headers: {
          "Accept": "application/json, text/plain, */*",
        },
      });
      const filteredResult = response.data.result.filter((m) => m.title.includes("--teamcal"));
      setAllMeeting(filteredResult);
      const todayEvents = filteredResult.filter((m) => new Date(m.start_time).toLocaleDateString() === selectedDate.toLocaleDateString());
      setDateEvents(todayEvents);
    } catch (err) {
      showAlert(err.message);
      setAllMeeting([]);
    }
  }

  const handlePressCell = (date) => {
    setSelectedDate(date);
    setDateEvents(allMeeting.filter(m => new Date(m.start_time).toLocaleDateString() === date.toLocaleDateString()));
  }

  const handlePressEvent = (event) => {
    if (event.start) {
      setSelectedEvent(allMeeting.filter(m => new Date(m.start_time).toString() === event.start.toString())[0]);
    } else {
      setSelectedEvent(event);
    }
    setOpenEventDlg(true);
  }

  const handleOpenDelete = () => {
    setOpenDelete(true);
    setOpenEventDlg(false);
  }
  
  const handleOpenEdit = () => {
    setOpenEdit(true);
    setEventToEdit(selectedEvent);
    setOpenEventDlg(false);
  }

  const handleDelete = async (event) => {
    try {
      const uteamToken = await getUteamToken();
      console.log(uteamToken);
      const response = await axios.post("https://www.uteamwork.com/_api/event/del", {
        id: event.id,
        is_all_repeat: event.is_all_repeat ? 1 : 0,
      }, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Authorization": `Bearer ${uteamToken}`,
        },
      });
      console.log(response);
      if (response.status !== 200) {
        showAlert('Deleting the event has been failed.');
      }
      if (response.status === 200) {
        showAlert('The event has been successfully deleted.');
      }
      getAllMeeting();
      setOpenDelete(false);
    } catch (err) {
      showAlert(err.message);
    }
  }

  console.log(eventToEdit, openEdit);

  useEffect(() => {
    if (uteamworkUserData.length > 0) {
      setOwnerData(uteamworkUserData.filter((u) => u.email === owner?.email)[0]);
    }
  }, [owner, uteamworkUserData]);

  useEffect(() => {
    getUteamworkUserData();
    return () => {
      setMode('Month');
      setOpenSelect(false);
      setDate(today);
      setSelectedDate(today);
      setAllMeeting([]);
      setUteamworkUserData([]);
      setOwnerData(null);
      setEvents([]);
      setDateEvents([]);
      setSelectedEvent(null);
      setOpenEventDlg(false);
      setOpenDelete(false);
      setOpenEdit(false);
      setEventToEdit(null);
    }
  }, []);

  useEffect(() => {
    if (allMeeting.length > 0) {
      const formattedData = allMeeting.map((item) => ({
        id: item.meetingId ? item.meetingId : item.id,
        start: new Date(item.start_time),
        end: new Date(item.end_time),
        title: item.title.split("--teamcal")[0],
        backgroundColor: item.meetingId ? '#00acac' : '#0078d4',
        borderColor: item.meetingId ? '#00acac' : '#0078d4',
        textColor: '#ffffff',
      }));
      setEvents(formattedData);
    }
  }, [allMeeting]);
  
  useEffect(() => {
    if (!openEdit) {
      if (ownerData) {
        getAllMeeting();
      }
      setEventToEdit(null);
    }
  }, [openEdit, ownerData]);

  return (
    <View style={{flex: 1, backgroundColor: Colors.white}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: 16,
        }}
      >
        <View
          style={{
            width: '40%',
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 16,
          }}
        >
          <DropDownPicker
            open={openSelect}
            value={mode}
            items={renderItems}
            setOpen={setOpenSelect}
            setValue={setMode}
            containerStyle={{
              height: 50,
            }}
            dropDownContainerStyle={{
              backgroundColor: Colors.white,
            }}
            listItemContainerStyle={{
              padding: 0,
            }}
          />
        </View>
        <View
          style={{
            width: '20%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {channel?.createdBy === userdata.objectId && 
          <Pressable
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-around',
              alignItems: 'center',
              borderRadius: 12,
              borderWidth: 1,
              paddingVertical: 12,
              paddingHorizontal: 6,
            }}
            onPress={() => {
              setOpenEdit(true);
            }}
          >
            <MaterialCommunityIcons name="plus" color={Colors.grey800} size={25} />
            <Text>Event</Text>
          </Pressable>}
        </View>
        <View
          style={{
            width: '40%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            style={{
              flexDirection: 'row',
              width: '30%',
              justifyContent: 'space-around',
              alignItems: 'center',
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              borderWidth: 1,
              borderRightWidth: 0,
              paddingVertical: 12,
            }}
            onPress={_onPrevDate}
          >
            <MaterialCommunityIcons name="chevron-left" color={Colors.grey800} size={25} />
          </Pressable>
          <Pressable
            style={{
              flexDirection: 'row',
              width: '30%',
              justifyContent: 'space-around',
              alignItems: 'center',
              borderWidth: 1,
              paddingVertical: 12,
            }}
            onPress={_onToday}
          >
            <MaterialCommunityIcons name="calendar-today" color={Colors.grey800} size={25} />
          </Pressable>
          <Pressable
            style={{
              flexDirection: 'row',
              width: '30%',
              justifyContent: 'space-around',
              alignItems: 'center',
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              borderWidth: 1,
              borderLeftWidth: 0,
              paddingVertical: 12,
            }}
            onPress={_onNextDate}
          >
            <MaterialCommunityIcons name="chevron-right" color={Colors.grey800} size={25} />
          </Pressable>
        </View>
      </View>
      <View
        style={{
          padding: 4,
          paddingTop: 0,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {date.toLocaleDateString("zh-CN", {
            year: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>
      <ScrollView style={{
        flex: 1,
        backgroundColor: Colors.white,
        padding: 12,
      }}>
        <Calendar
          date={date}
          events={events}
          height={SCREEN_HEIGHT - 200}
          mode={mode}
          onPressCell={handlePressCell}
          onPressEvent={handlePressEvent}
          calendarCellTextStyle={{
            fontSize: 14,
          }}
        />
      </ScrollView>
      <Divider style={{marginVertical: 8, height: 2, opacity: 1}} />
      <View
        style={{
          flex: 0.4,
          width: '100%',
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {selectedDate.toLocaleDateString("zh-CN", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </Text>
        <View
          style={{
            flex: 1,
          }}
        >
          {dateEvents?.length > 0 ? (
            <FlatList
              horizontal={false}
              data={dateEvents}
              ListHeaderComponent={() => (
                <Divider style={{height: 10, opacity: 0}} />
              )}
              ListFooterComponent={() => (
                <Divider style={{height: 10, opacity: 0}} />
              )}
              renderItem={({item, index}) => (
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginHorizontal: 12,
                    marginVertical: 2,
                    borderLeftWidth: 4,
                    borderColor: Colors.blue500,
                    backgroundColor: Colors.blue50,
                    paddingVertical: 4,
                  }}
                  onPress={() => handlePressEvent(item)}
                >
                  <View
                    style={{
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {new Date(item.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {new Date(item.end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                      }}
                    >{item?.title.split("--teamcal")[0]}</Text>
                  </View>
                </Pressable>
              )}
              keyExtractor={item => item?.id}
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  textAlign: 'center',
                  color: Colors.black,
                }}
              >No files for this category</Text>
            </View>
          )}
        </View>
      </View>
      {selectedEvent && (
      <Portal>
        <Dialog
          visible={openEventDlg}
          onDismiss={() => setOpenEventDlg(false)}
          style={{
            borderRadius: 16,
          }}
        >
          <Dialog.Title >Event Information</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{fontSize: 16,}}>Title: {selectedEvent.title.split("--teamcal")[0]}</Text>
            <Text variant="bodyMedium" style={{fontSize: 16,}}>Start time: {
              new Date(selectedEvent.start_time).toLocaleString("zh-CN", {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
            <Text variant="bodyMedium" style={{fontSize: 16,}}>End time: { 
              new Date(selectedEvent.end_time).toLocaleString("zh-CN", {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            {channel?.createdBy === userdata.objectId && 
            <Button
              onPress={handleOpenEdit}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.blue500,
                marginRight: 8,
              }}
              labelStyle={{
                color: Colors.blue500,
              }}
            >Detail</Button>}
            {channel?.createdBy === userdata.objectId && 
            <Button
              onPress={handleOpenDelete}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.red500,
                marginRight: 8,
              }}
              labelStyle={{
                color: Colors.red500,
              }}
            >Delete</Button>}
            <Button
              onPress={() => setOpenEventDlg(false)}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.grey700,
              }}
              labelStyle={{
                color: Colors.grey700,
              }}
            >Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      )}
      {openDelete && (
      <Portal>
        <Dialog
          visible={openDelete}
          onDismiss={() => setOpenDelete(false)}
          style={{
            borderRadius: 16,
          }}
        >
          <Dialog.Title >Delete Event</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Are you want to delete this event?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => handleDelete(selectedEvent)}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.red500,
                marginRight: 8,
              }}
              labelStyle={{
                color: Colors.red500,
              }}
            >Delete</Button>
            <Button
              onPress={() => setOpenDelete(false)}
              uppercase={false}
              style={{
                borderRadius: 6,
                borderWidth: 2,
                borderColor: Colors.grey700,
              }}
              labelStyle={{
                color: Colors.grey700,
              }}
            >Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      )}
      {openEdit && <EditEventModal open={openEdit} setOpen={setOpenEdit} eventToEdit={eventToEdit} />}
    </View>
  );
}
