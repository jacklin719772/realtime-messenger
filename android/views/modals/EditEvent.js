import {modalStyles} from '@/styles/styles';
import {Image, Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {ActivityIndicator, Appbar, Checkbox, Colors, IconButton, TextInput} from 'react-native-paper';
import WebView from 'react-native-webview';
import {env} from "@/config/env";
import { Base64 } from 'js-base64';
import React, { useState } from 'react';
import { useFormik } from 'formik';
import { showAlert } from '@/lib/alert';
import { postData } from '@/lib/api-helpers';
import axios from 'axios';
import { getUteamToken } from '@/lib/auth';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker'
import { useFocusEffect } from '@react-navigation/native';

const renderItems = [
  { label: "(GMT-12:00) International Date Line West", value: "-12" },
  { label: "(GMT-11:00) Midway Island, Samoa", value: "-11" },
  { label: "(GMT-10:00) Hawaii", value: "-10" },
  { label: "(GMT-09:00) Alaska", value: "-9" },
  { label: "(GMT-08:00) Pacific Time (US & Canada), Tijuana, Baja California", value: "-8" },
  { label: "(GMT-07:00) Arizona, Chihuahua, La Paz, Mazatlan, Mountain Time", value: "-7" },
  { label: "(GMT-06:00) Central America, Central Time (US & Canada)", value: "-6" },
  { label: "(GMT-05:00) Bogota, Lima, Quito, Rio Branco, Eastern Time (US & Canada)", value: "-5" },
  { label: "(GMT-04:00) Atlantic Time (Canada), Caracas, La Paz, Manaus", value: "-4" },
  { label: "(GMT-03:30) Newfoundland", value: "-3.5" },
  { label: "(GMT-03:00) Brasilia, Buenos Aires, Georgetown, Greenland", value: "-3" },
  { label: "(GMT-02:00) Mid-Atlantic", value: "-2" },
  { label: "(GMT-01:00) Cape Verde Is, Azores", value: "-1" },
  { label: "(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London", value: "0" },
  { label: "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", value: "1" },
  { label: "(GMT+02:00) Amman, Athens, Bucharest, Istanbul, Beirut, Minsk", value: "2" },
  { label: "(GMT+03:00) Kuwait, Riyadh, Baghdad, Moscow, St. Petersburg, Volgograd", value: "3" },
  { label: "(GMT+03:30) Tehran", value: "3.5" },
  { label: "(GMT+04:00) Abu Dhabi, Muscat, Baku, Yerevan", value: "4" },
  { label: "(GMT+04:30) Kabul", value: "4.5" },
  { label: "(GMT+05:00) Yekaterinburg, Islamabad, Karachi, Tashkent", value: "5" },
  { label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi", value: "5.5" },
  { label: "(GMT+06:00) Almaty, Novosibirsk, Astana, Dhaka", value: "6" },
  { label: "(GMT+06:30) Yangon (Rangoon)", value: "6.5" },
  { label: "(GMT+07:00) Bangkok, Hanoi, Jakarta, Krasnoyarsk", value: "7" },
  { label: "(GMT+08:00) Bejijng, Taipei, Hongkong, Urumqi, Singapore", value: "8" },
  { label: "(GMT+09:00) Seoul, Osaka, Sapporo, Tokyo", value: "9" },
  { label: "(GMT+09:30) Adelaide, Darwin", value: "9.5" },
  { label: "(GMT+10:00) Brisbane, Canberra, Melbourne, Sydney", value: "10" },
  { label: "(GMT+11:00) Magadan, Solomon Is., New Caledonia", value: "11" },
  { label: "(GMT+12:00) Auckland, Wellington", value: "12" },
  { label: "(GMT+13:00) Nuku'alofa", value: "13" }
];

const remindItems = [
  { label: "Never", value: "0" },
  { label: "5 mins", value: "5" },
  { label: "15 mins", value: "15" },
  { label: "30 mins", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
  { label: "12 hours", value: "720" },
  { label: "1 day", value: "1440" },
  { label: "1 week", value: "10080" }
];

export default function EditEventModal({
  open,
  setOpen,
  eventToEdit,
}) {
  const [openSelect, setOpenSelect] = useState(false);
  const [openRemind, setOpenRemind] = useState(false);
  const [startDateVisible, setStartDateVisible] = useState(false);
  const [startDateMode, setStartDateMode] = useState('date');
  const [endDateVisible, setEndDateVisible] = useState(false);
  const [endDateMode, setEndDateMode] = useState('date');
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachFiles, setAttachFiles] = useState([]);

  const [value, setValue] = useState('');

  const event = React.useMemo(() => eventToEdit, [eventToEdit]);
  const today = React.useMemo(() => new Date(), []);

  const {handleSubmit, setFieldValue, values, isSubmitting} =
    useFormik({
      initialValues: !event ? {
        title: "",
        start_time: new Date((today.getTime() + (600 * 1000))),
        end_time: new Date((today.getTime() + 4200 * 1000)),
        timezone: 8,
        is_all_day: false,
        repeat: 0,
        repeat_from: "",
        repeat_to: "",
        repeat_option: 1,
        repeat_value: 1,
        remind: 0,
        is_edit_repeat: true,
        is_mail_remind: false,
        description: "",
        location: "",
        completed: 0,
      } : {
        title: event.title.split("--teamcal")[0],
        start_time: new Date(event.start_time),
        end_time: new Date(event.end_time),
        timezone: event.timezone,
        is_all_day: event.is_all_day === 0 ? false : true,
        repeat: event.repeat ? event.repeat : 0,
        repeat_from: event.repeat_from ? event.repeat_from : "",
        repeat_to: event.repeat_to ? event.repeat_to : "",
        repeat_option: event.repeat_option,
        repeat_value: event.repeat_value,
        remind: event.remind,
        is_edit_repeat: true,
        is_mail_remind: event.is_mail_remind === 0 ? false : true,
        description: event.description,
        location: event.location,
        completed: 0,
      },
      enableReinitialize: true,
      onSubmit: async val => {
        if (val.title === "") {
          showAlert('Please input all required fields.');
          return;
        }
        if (val.start_time >= val.end_time) {
          showAlert('End time must be later than start time.');
          return;
        }
        if (!val.event && val.start_time < new Date()) {
          showAlert('Start time must be later than current time.');
          return;
        }
        try {
          const uteamToken = await getUteamToken();
          console.log(val.end_time);
          const response = event ? await axios.post("https://www.uteamwork.com/_api/event/edit", {
            id: event.id,
            title: val.title + "--teamcal",
            start_time: val.is_all_day ? val.start_time.toISOString().split("T")[0] + " 00:00:00" : val.start_time.toISOString().split("T")[0] + " " + val.start_time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            end_time: val.is_all_day ? val.end_time.toISOString().split("T")[0] + " 00:00:00" : val.end_time.toISOString().split("T")[0] + " " + val.end_time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            is_all_day: val.is_all_day ? 1 : 0,
            is_edit_repeat: val.is_edit_repeat,
            is_mail_remind: val.is_mail_remind ? 1 : 0,
            location: val.location,
            remind: val.remind,
            repeat: val.repeat,
            repeat_from: val.repeat_from === "" ? val.start_time.toISOString().split("T")[0] : val.repeat_from,
            repeat_to: val.repeat_to === "" ? val.end_time.toISOString().split("T")[0] : val.repeat_to,
            repeat_option: val.repeat_option,
            repeat_value: val.repeat_value,
            selected_week_days: event.repeat_week_days.split(",").map(Number),
            timezone: val.timezone,
            uploaded_files: [],
            private_files: [],
            recording_files: [],
            description: val.description,
            user_lang: "ch",
          }, {
            headers: {
              "Accept": "application/json, text/plain, */*",
              "Authorization": `Bearer ${uteamToken}`,
            },
          }) : await axios.post("https://www.uteamwork.com/_api/event/create", {
            title: val.title + "--teamcal",
            start_time: val.is_all_day ? val.start_time.toISOString().split("T")[0] + " 00:00:00" : val.start_time.toISOString().split("T")[0] + " " + val.start_time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            end_time: val.is_all_day ? val.end_time.toISOString().split("T")[0] + " 00:00:00" : val.end_time.toISOString().split("T")[0] + " " + val.end_time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            is_all_day: val.is_all_day ? 1 : 0,
            is_edit_repeat: val.is_edit_repeat,
            is_mail_remind: val.is_mail_remind ? 1 : 0,
            location: val.location,
            remind: val.remind,
            repeat: val.repeat,
            repeat_from: val.repeat_from === "" ? val.start_time.toISOString().split("T")[0] : val.repeat_from,
            repeat_to: val.repeat_to === "" ? val.end_time.toISOString().split("T")[0] : val.repeat_to,
            repeat_option: val.repeat_option,
            repeat_value: val.repeat_value,
            selected_week_days: [0, 1, 2, 3, 4, 5, 6],
            timezone: val.timezone,
            uploaded_files: [],
            private_files: [],
            recording_files: [],
            description: val.description,
            user_lang: "ch",
          }, {
            headers: {
              "Accept": "application/json, text/plain, */*",
              "Authorization": `Bearer ${uteamToken}`,
            },
          });
          console.log(response);
          if (response.status !== 200) {
            showAlert('Updating the event has been failed.');
          }
          if (response.status === 200) {
            if (response.data.message === "You have any event at this time already") {
              showAlert(response.data.message);
            } else {
              showAlert(event ? 'The event has been successfully updated.' : 'The event has been successfully created.');
              setOpen(false);
            }
          }
        } catch (err) {
          showAlert(err.message);
        }
      },
    });

  // React.useEffect(() => {
  //   // if (event) {
  //   //   setTitle(event.title.split("--teamcal")[0]);
  //   // }
  //   return () => {
  //     setEvent(null);
  //   }
  // }, []);

  const onChangeStartDate = (event, selectedDate) => {
    setStartDateVisible(false);
    setFieldValue("start_time", selectedDate);
    setFieldValue("end_time", new Date(selectedDate.getTime() + 3600 * 1000))
  }

  const showStartDateMode = (currentMode) => {
    setStartDateVisible(true);
    setStartDateMode(currentMode);
  }

  const showStartDatepicker = () => {
    showStartDateMode('date');
  }

  const showStartTimepicker = () => {
    showStartDateMode('time');
  }

  const onChangeEndDate = (event, selectedDate) => {
    setEndDateVisible(false);
    setFieldValue("end_time", selectedDate);
  }

  const showEndDateMode = (currentMode) => {
    setEndDateVisible(true);
    setEndDateMode(currentMode);
  }

  const showEndDatepicker = () => {
    showEndDateMode('date');
  }

  const showEndTimepicker = () => {
    showEndDateMode('time');
  }

  const handleAllDayCheckbox = () => {
    setFieldValue("is_all_day", !values.is_all_day);
    setFieldValue("start_time", new Date(values.start_time.toISOString().split("T")[0] + " 00:00:00"));
    setFieldValue("end_time", new Date(values.end_time.toISOString().split("T")[0] + " 23:59:00"));
  }

  React.useEffect(() => {
    setFieldValue("timezone", value);
  }, [value]);
  
  useFocusEffect(
    React.useCallback(() => {
      setValue(event ? event.timezone : '8');
    }, []),
  );

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
            <Appbar.Content title={event? "Edit Event" : "Add Event"} />
            <Appbar.Action icon="check" onPress={handleSubmit} />
          </Appbar.Header>
          <View
            style={{
              display: 'flex', 
              flexGrow: 1,
              width: '100%', 
              height: '100%',
              padding: 12,
              alignItems: 'center', 
            }}
          >
            {isSubmitting && <ActivityIndicator style={{paddingVertical: 10}} />}
            <TextInput
              label="Title"
              style={styles.input}
              value={values.title}
              onChangeText={text => setFieldValue("title", text)}
              placeholder='Title'
            />
            <DropDownPicker
              open={openSelect}
              value={value}
              items={renderItems}
              setOpen={setOpenSelect}
              setValue={setValue}
              // onChangeValue={(value) => setFieldValue("timezone", value)}
              // onSelectItem={(item) => setFieldValue("timezone", item.value)}
              placeholder="Select timezone"
              style={styles.dropdownStyle}
              dropDownContainerStyle={styles.dropdownContainerStyle}
              listItemContainerStyle={{
                padding: 0,
              }}
              listItemLabelStyle={{
                fontSize: 16,
              }}
              textStyle={{
                fontSize: 16,
              }}
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
                label="Start time"
                style={[styles.input, {
                  width: '75%',
                }]}
                value={`${values.start_time.toISOString().split("T")[0]} ${values.start_time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}`}
                placeholder='Start Time'
              />
              <IconButton
                icon="calendar"
                color={Colors.blue500}
                size={25}
                onPress={showStartDatepicker}
                style={{
                  margin: 0,
                }}
              />
              <IconButton
                icon="clock"
                color={Colors.blue500}
                size={25}
                onPress={showStartTimepicker}
                style={{
                  margin: 0,
                }}
              />
              {startDateVisible &&
              <DateTimePicker
                mode={startDateMode}
                value={values.start_time}
                is24Hour={true}
                onChange={onChangeStartDate}
              />}
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
                label="End time"
                style={[styles.input, {
                  width: '75%',
                }]}
                value={`${values.end_time.toISOString().split("T")[0]} ${values.end_time.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}`}
                placeholder='End Time'
              />
              <IconButton
                icon="calendar"
                color={Colors.blue500}
                size={25}
                onPress={showEndDatepicker}
                style={{
                  margin: 0,
                }}
              />
              <IconButton
                icon="clock"
                color={Colors.blue500}
                size={25}
                onPress={showEndTimepicker}
                style={{
                  margin: 0,
                }}
              />
              {endDateVisible &&
              <DateTimePicker
                mode={endDateMode}
                value={values.end_time}
                is24Hour={true}
                onChange={onChangeEndDate}
              />}
            </View>
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <Checkbox
                status={values.is_all_day ? 'checked' : 'unchecked'}
                onPress={handleAllDayCheckbox}
              />
              <Text style={{
                fontSize: 16,
                color: Colors.black,
              }}>All Day</Text>
            </View>
            <TextInput
              label="Location"
              style={styles.input}
              value={values.location}
              onChangeText={text => setFieldValue("location", text)}
              placeholder='Location'
            />
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12,
              }}
            >
              <View
                style={{
                  width: '50%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DropDownPicker
                  open={openRemind}
                  value={values.remind}
                  s
                  items={remindItems}
                  setOpen={setOpenRemind}
                  // setValue={(value, text) => setFieldValue("timezone", text)}
                  onChangeValue={(value) => setFieldValue("remind", value)}
                  onSelectItem={(item) => setFieldValue("remind", item.value)}
                  placeholder="Select remind"
                  style={[styles.dropdownStyle, {
                    marginTop: 0,
                  }]}
                  dropDownContainerStyle={styles.dropdownContainerStyle}
                  listItemContainerStyle={{
                    padding: 0,
                  }}
                  listItemLabelStyle={{
                    fontSize: 16,
                  }}
                  textStyle={{
                    fontSize: 16,
                  }}
                />
              </View>
              <View
                style={{
                  width: '50%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Checkbox
                  disabled={values.remind == "0"}
                  status={values.is_mail_remind ? 'checked' : 'unchecked'}
                  onPress={() => setFieldValue("is_mail_remind", !values.is_mail_remind)}
                />
                <Text disabled={values.remind == "0"} style={{
                  fontSize: 16,
                  color: Colors.black,
                }}>E-mail remind</Text>
              </View>
            </View>
            <TextInput
              label="Description"
              style={styles.input}
              numberOfLines={4}
              multiline
              textAlignVertical='top'
              value={values.description}
              onChangeText={text => setFieldValue("description", text)}
              placeholder='Description'
            />
          </View>
        </View>
      </View>
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
})
