import { Dialog, Transition } from '@headlessui/react';
import { ClockIcon, DocumentIcon, PencilIcon, XIcon } from '@heroicons/react/outline';
import { ModalContext } from 'contexts/ModalContext';
import { useUser } from 'contexts/UserContext';
import { Formik } from 'formik';
import { useUserById } from 'hooks/useUsers';
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import * as Yup from "yup";
import Style from 'components/Style';
// to see the default props for SummernoteLite
import { getHref } from 'utils/get-file-url';
import TextField from 'components/TextField';
import { toast as toastr } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import classNames from 'utils/classNames';
import axios from "axios";
import ProgressBar from "@ramonak/react-progress-bar";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import Dropzone from 'react-dropzone';
import { repeat } from 'lodash';

function EditMeeting({
  event
}: {
  event?: any;
}) {
  const cancelButtonRef = useRef(null);
  const {openEditMeeting, setOpenEditMeeting, fileURL, checkedPrivateFiles, setCheckedPrivateFiles, checkedRecordingFiles, setCheckedRecordingFiles, setOpenPrivateFiles, setOpenRecordingFiles} = useContext(ModalContext);
  const { user } = useUser();
  const { value } = useUserById(user?.uid);
  const [file, setFile] = useState<any>(null);
  const [fileCategory, setFileCategory] = useState<any[]>([]);
  const [filePath, setFilePath] = useState("");
  const [completed, setCompleted] = useState(0);
  const [files, setFiles] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [attachFiles, setAttachFiles] = useState<string[]>([]);
  let percentage = 0;

  const [myContacts, setMyContacts] = useState<any[]>([]);
  const [systemContacts, setSystemContacts] = useState<any[]>([]);

  const getContacts = async () => {
    const response = await axios.post("https://uteamwork.com/_api/user/getContact", {}, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Authorization": `Bearer ${localStorage.getItem("t")}`,
      },
    });
    if (response.statusText === "OK") {
      setMyContacts(response.data.result);
      setSystemContacts(response.data.users);
    } else {
      setMyContacts([]);
      setSystemContacts([]);
    }
  }

  const getFileObject = async (url: string) => {
    const formattedURL = getHref(url);
    if (formattedURL) {
      const response = await fetch(formattedURL);
      console.log(response);
      const blob = await response.blob();
      console.log(blob);
      const filename = url.split("?")[0].split("/")[url.split("?")[0].split("/").length -1];
      console.log(filename);
      setFilePath(filename);
      const file = new File([blob], filename);
      console.log(file);
      setFile(file);
    } else {
      setFile(null);
    }
  }

  const getFileCategory = async () => {
    const response = await fetch('https://www.uteamwork.com/_api/km/getPrivateCategory', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("t")}`,
      }
    });
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      const treeArray = getTreeArray(data.result);
      setFileCategory(treeArray);
    } else {
      setFileCategory([]);
    }
  }

  const getTreeArray = (ary: any[]) => {
    const treeArray = ary.map((item: any) => {
      const id = item.category_id;
      const name = item.name;
      const children = ary.filter((i: any) => i.parent_id === item.id).map((child: any) => (child.category_id));
      const parent = item.parent_id === 0 ? 0 : ary.filter((c: any) => c.id === item.parent_id)[0].category_id;
      return {
        name, children, id, parent,
      }
    });
    const getFirstLevel = ary.filter((el: any) => el.level === 0).map((l: any) => l.category_id);
    treeArray.unshift({ name: "", children: getFirstLevel, id: 0, parent: null });
    console.log(treeArray);
    return treeArray;
  }


  const getFileSizeText = (byte: number) => {
    if (byte < 1024) {
      return byte + ' B';
    } else if ((byte / 1024) < 1024) {
      return (byte / 1024).toFixed(2) + ' KB';
    } else if ((byte / 1024 / 1024) < 1024) {
      return (byte / 1024 / 1024).toFixed(2) + ' MB';
    } else {
      return (byte / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    }
  }

  const onDrop = async (acceptedFiles: any[]) => {
    setFiles(acceptedFiles);
    console.log(acceptedFiles);
    let formData = new FormData();
    formData.append("files", acceptedFiles[0], acceptedFiles[0].name);
    const response = await axios.post("https://uteamwork.com/_api/meeting-manage/uploadDoc", formData, {
      onUploadProgress: (progressEvent) => {
        const { loaded, total } = progressEvent;
        percentage = Math.floor((loaded * 100) / total);
        console.log(percentage);
        setCompleted(percentage);
      },
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("t")}`,
      },
    });
    if (response.statusText !== "OK") {
      toastr.error('File uploading has been failed.', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
    setUploadedFiles([...uploadedFiles, {
      file_name: acceptedFiles[0].name,
      file_path: response.data.path,
    }]);
    setFiles([]);
  }

  const removeFile = (f: any) => {
    setUploadedFiles(uploadedFiles.filter((el: any) => el !== f));
  }

  useEffect(() => {
    if (event) {
      setUploadedFiles(event.meetingDocs);
      setCheckedPrivateFiles(event.private_files);
      setCheckedRecordingFiles(event.recording_files);
    }
  }, [event]);

  useEffect(() => {
    getFileObject(fileURL);
  }, [fileURL]);

  useEffect(() => {
    getFileCategory();
    getContacts();
  }, []);

  useEffect(() => {
    console.log(fileCategory);
  }, [fileCategory]);

  return (
    <Transition.Root show={openEditMeeting} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openEditMeeting}
        onClose={() => {}}
      >
        <Style css={`
          .quill-form .wrapper>div:nth-child(2) {
            max-height: 200px;
            overflow-y: auto;
          }
          .quill-form .ql-snow.ql-toolbar {
            height: 2.5rem !important;
            border-bottom-width: 1px !important;
            border-bottom-color: rgb(107, 114, 128);
            border-top-width: 0 !important;
            border-top-left-radius: 4px !important;
            border-top-right-radius: 4px !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .ql-container.ql-snow {
            height: 200px;
            overflow-y: auto;
          }
          img {
            display: inline-block;
          }
          .rti--container {
            padding: 2px;
            border-radius: 4px;
            border: none;
            width: 758px;
            font-size: 12px;
            --rti-bg: "#fff",
            --rti-border: "#ccc",
            --rti-main: "#3182ce",
            --rti-radius: "0.25rem",
            --rti-s: "0.5rem", /* spacing */
            --rti-tag: "#edf2f7",
            --rti-tag-remove: "#e53e3e",
          }
          .rti--container input {
            border: none;
            outline: none;
            width: 200px;
            background-color: transparent;
          }
          .rti--container input:focus {
            border: none;
            outline: none;
          }
          .note-link-popover .popover-content.note-children-container {
            width: 800px !important;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .note-color.open .note-dropdown-menu {
            display: flex;
            align-items: center;
          }
          .note-para .note-dropdown-menu {
            min-width: 237px !important;
          }
        `} />
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="th-bg-bg inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <img src={`${process.env.PUBLIC_URL}/favorite_add.png`} className="w-6 h-6" alt="favorite" />
                  <h5 className="font-bold th-color-for">
                    Meeting Schedule
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenEditMeeting(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <Formik
                initialValues={!event ? {
                  title: "",
                  start_time: new Date(),
                  timezone: 8,
                  duration: 15,
                  completed: 0,
                  pass: "",
                  enable_repeat: false,
                  is_remind: false,
                  check_remind1: false,
                  check_remind2: false,
                  check_remind3: false,
                  val_remind1: 5,
                  val_remind2: 1,
                  val_remind3: 1,
                  unit_remind1: "Minute",
                  unit_remind2: "Hour",
                  unit_remind3: "Day",
                  all_questioner: false,
                  recording: true,
                  auto_extension: true,
                } : {
                  title: event.title,
                  start_time: new Date(event.start_time),
                  timezone: event.timezone,
                  duration: event.duration,
                  completed: 0,
                  pass: event.pass,
                  enable_repeat: event.repeat === 1 ? true : false,
                  is_remind: event.remind_setting ? true : false,
                  check_remind1: event.remind_1 ? true : false,
                  check_remind2: event.remind_2 ? true : false,
                  check_remind3: event.remind_3 ? true : false,
                  val_remind1: 5,
                  val_remind2: 1,
                  val_remind3: 1,
                  unit_remind1: "Minute",
                  unit_remind2: "Hour",
                  unit_remind3: "Day",
                  all_questioner: event.all_questioner === 1 ? true : false,
                  recording: event.auto_recording === 1 ? true : false,
                  auto_extension: event.auto_extension === 1 ? true : false,
                }}
                validationSchema={Yup.object({
                  subject: Yup.string().max(100).notRequired(),
                })}
                enableReinitialize
                onSubmit={async ({ start_time, title, timezone, duration, is_remind, enable_repeat, check_remind1, check_remind2, check_remind3, val_remind1, val_remind2, val_remind3, unit_remind1, unit_remind2, unit_remind3, recording, all_questioner, auto_extension, pass }, { setSubmitting }) => {
                  if (title === "") {
                    toastr.error('Please input the title of meeting.', {
                      position: "top-right",
                      autoClose: 2000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "dark",
                    });
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const response = await axios.post("https://www.uteamwork.com/_api/instantmeeting/createInstantMeetig", {
                      title,
                      agenda: "",
                      all_questioner: all_questioner ? 1 : 0,
                      auto_extension: auto_extension ? 1 : 0,
                      check_remind1,
                      check_remind2,
                      check_remind3,
                      day_dur: 2,
                      day_mode: 0,
                      default_joint_browsing_page: "",
                      duration,
                      end_method: 0,
                      end_recur: new Date().toISOString().split("T")[0],
                      end_round: 10,
                      hour: start_time.toLocaleTimeString([], {
                        hour: '2-digit',
                        hour12: false,
                      }),
                      invited_users: "",
                      is_edit_modal: false,
                      is_remind,
                      lang: "simplified_chinese",
                      m_date: 1,
                      m_day: 0,
                      m_month: 1,
                      m_week: 0,
                      m_week_month: 1,
                      meetingId: Date.now(),
                      meetingType: 32,
                      min: start_time.toLocaleTimeString([], {
                        minute: '2-digit',
                        hour12: false,
                      }),
                      month_method: 0,
                      pass,
                      password: "",
                      previousMeetingId: null,
                      recording: recording ? 1 : 0,
                      recure_mode: 0,
                      repeat: enable_repeat,
                      resume: 0,
                      resume_file_name: null,
                      startTime: start_time.toISOString().split("T")[0],
                      start_recur: new Date().toISOString().split("T")[0],
                      start_time: start_time.toISOString().split("T")[0] + " " + start_time.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      }),
                      end_time: new Date(start_time.getTime() + duration*60*1000).toISOString().split("T")[0] + " " + new Date(start_time.getTime() + duration*60*1000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      }),
                      timezone,
                      unit_remind1,
                      unit_remind2,
                      unit_remind3,
                      val_remind1,
                      val_remind2,
                      val_remind3,
                      meetingDocs: uploadedFiles,
                      users: [],
                      week_dur: 2,
                    }, {
                      headers: {
                        "Accept": "application/json, text/plain, */*",
                        "Authorization": `Bearer ${localStorage.getItem("t")}`,
                      },
                    });
                    if (response.statusText !== "OK") {
                      toastr.error('Creating the meeting has been failed.', {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                      });
                    }
                    toastr.success('The meeting has been successfully created.', {
                      position: "top-right",
                      autoClose: 2000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "dark",
                    });
                    setOpenEditMeeting(false);
                  } catch (err: any) {
                    toastr.error(err.message, {
                      position: "top-right",
                      autoClose: 2000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "dark",
                    });
                  }
                  setSubmitting(false);
                }}
              >
                {({
                  values,
                  handleChange,
                  isSubmitting,
                  handleSubmit,
                  setFieldValue,
                }) => (
                  <form noValidate onSubmit={handleSubmit}>
                    <div className="px-5 border-t th-border-selbg w-full h-80 overflow-y-auto">
                      <div className="w-full flex items-center">
                        <PencilIcon className="w-4 h-4 mr-2" />
                        <TextField
                          value={values.title}
                          handleChange={handleChange}
                          type="text"
                          required
                          label=""
                          name="title"
                          autoComplete="title"
                          placeholder="Title"
                        />
                      </div>
                      <div className="w-full flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <div className="w-[20%] pr-1">
                          <select name="timezone" onChange={handleChange} value={values.timezone} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50">
                            <option value="-12">(GMT-12:00) International Date Line West</option>
                            <option value="-11">(GMT-11:00) Midway Island, Samoa</option>
                            <option value="-10">(GMT-10:00) Hawaii</option>
                            <option value="-9">(GMT-09:00) Alaska</option>
                            <option value="-8">(GMT-08:00) Pacific Time (US & Canada), Tijuana, Baja California</option>
                            <option value="-7">(GMT-07:00) Arizona, Chihuahua, La Paz, Mazatlan, Mountain Time</option>
                            <option value="-6">(GMT-06:00) Central America, Central Time (US & Canada)</option>
                            <option value="-5">(GMT-05:00) Bogota, Lima, Quito, Rio Branco, Eastern Time (US & Canada)</option>
                            <option value="-4">(GMT-04:00) Atlantic Time (Canada), Caracas, La Paz, Manaus</option>
                            <option value="-3.5">(GMT-03:30) Newfoundland</option>
                            <option value="-3">(GMT-03:00) Brasilia, Buenos Aires, Georgetown, Greenland</option>
                            <option value="-2">(GMT-02:00) Mid-Atlantic</option>
                            <option value="-1">(GMT-01:00) Cape Verde Is, Azores</option>
                            <option value="0">(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London</option>
                            <option value="1">(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna</option>
                            <option value="2">(GMT+02:00) Amman, Athens, Bucharest, Istanbul, Beirut, Minsk</option>
                            <option value="3">(GMT+03:00) Kuwait, Riyadh, Baghdad, Moscow, St. Petersburg, Volgograd</option>
                            <option value="3.5">(GMT+03:30) Tehran</option>
                            <option value="4">(GMT+04:00) Abu Dhabi, Muscat, Baku, Yerevan</option>
                            <option value="4.5">(GMT+04:30) Kabul</option>
                            <option value="5">(GMT+05:00) Yekaterinburg, Islamabad, Karachi, Tashkent</option>
                            <option value="5.5">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                            <option value="6">(GMT+06:00) Almaty, Novosibirsk, Astana, Dhaka</option>
                            <option value="6.5">(GMT+06:30) Yangon (Rangoon)</option>
                            <option value="7">(GMT+07:00) Bangkok, Hanoi, Jakarta, Krasnoyarsk</option>
                            <option value="8">(GMT+08:00) Bejijng, Taipei, Hongkong, Urumqi, Singapore</option>
                            <option value="9">(GMT+09:00) Seoul, Osaka, Sapporo, Tokyo</option>
                            <option value="9.5">(GMT+09:30) Adelaide, Darwin</option>
                            <option value="10">(GMT+10:00) Brisbane, Canberra, Melbourne, Sydney</option>
                            <option value="11">(GMT+11:00) Magadan, Solomon Is., New Caledonia</option>
                            <option value="12">(GMT+12:00) Auckland, Wellington</option>
                            <option value="13">(GMT+13:00) Nuku'alofa</option>
                          </select>
                        </div>
                        <div className="w-auto pr-1">
                          <DatePicker
                            className="text-sm rounded"
                            selected={values.start_time}
                            name="start_time"
                            placeholderText="2024-04-02"
                            onChange={(date: any) => setFieldValue("start_time", date)} //only when value has changed
                            dateFormat="yyyy-MM-dd hh:mm"
                            isClearable={true}
                            showTimeSelect
                            timeIntervals={30}
                            timeCaption="Time"
                          />
                        </div>
                        <div className="w-auto pr-1">
                          <select onChange={handleChange} value={values.duration} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50" name="duration">
                            <option value="5">5 min</option>
                            <option value="10">10 min</option>
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                            <option value="90">90 min</option>
                            <option value="120">120 min</option>
                            <option value="150">150 min</option>
                            <option value="180">180 min</option>
                            <option value="210">210 min</option>
                            <option value="300">300 min</option>
                            <option value="600">600 min</option>
                            <option value="900">900 min</option>
                          </select>
                        </div>
                      </div>
                      <div className="w-full flex items-center py-2">
                        <DocumentIcon className="w-4 h-4 mr-2" />
                        <div className="text-sm mr-2">Meeting documents: </div>
                        <Dropzone onDrop={acceptedFiles => onDrop(acceptedFiles)}>
                          {({getRootProps, getInputProps}) => (
                            <section className="w-auto h-10 cursor-pointer">
                              <div className="rounded w-full h-full flex justify-between border th-border-blue items-center px-4" {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p className="text-sm th-color-blue">Upload</p>
                              </div>
                            </section>
                          )}
                        </Dropzone>
                      </div>
                      <div className="w-full flex items-center pl-6">
                        <div className="w-full h-28 border rounded th-border-for p-2">
                          {uploadedFiles.map((u: any, index: number) => (
                            <div className="flex items-center space-x-2 p-2 th-color-bg th-bg-for">
                              <div className="text-sm">{u.file_name}</div>
                              <XIcon className="w-4 h-4" onClick={() => removeFile(u)} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-full flex items-center pl-6 pt-2 space-x-2">
                        <div className="flex items-center">
                          <input
                            value={values.recording}
                            type="checkbox"
                            name="recording"
                            id="recording"
                            checked={values.recording}
                            onChange={handleChange}
                            className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                          />
                          <div className="text-sm mr-2">Turn on automatic recording</div>
                        </div>
                        <div className="flex items-center">
                          <input
                            value={values.all_questioner}
                            type="checkbox"
                            name="all_questioner"
                            id="all_questioner"
                            checked={values.all_questioner}
                            onChange={handleChange}
                            className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                          />
                          <div className="text-sm mr-2">Free discussion</div>
                        </div>
                        <div className="flex items-center">
                          <input
                            value={values.auto_extension}
                            type="checkbox"
                            name="auto_extension"
                            id="auto_extension"
                            checked={values.auto_extension}
                            onChange={handleChange}
                            className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                          />
                          <div className="text-sm mr-2">Automatic extension</div>
                        </div>
                      </div>
                      <div className="w-full flex items-center pl-6 space-x-2">
                        <div className="text-sm mr-2">Meeting password: </div>
                        <TextField
                          value={values.pass}
                          handleChange={handleChange}
                          type="password"
                          required
                          label=""
                          name="pass"
                          autoComplete="pass"
                          placeholder="Pass"
                        />
                      </div>
                      <div className="w-full flex items-center pl-6 pb-2 space-x-2">
                        <input
                          value={values.enable_repeat}
                          type="checkbox"
                          name="enable_repeat"
                          id="enable_repeat"
                          checked={values.enable_repeat}
                          onChange={handleChange}
                          className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                        />
                        <div className="text-sm mr-2">Recurring</div>
                      </div>
                      <div className="w-full flex items-center pl-6 pb-2 space-x-2">
                        <input
                          value={values.is_remind}
                          type="checkbox"
                          name="is_remind"
                          id="is_remind"
                          checked={values.is_remind}
                          onChange={handleChange}
                          className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                        />
                        <div className="text-sm mr-2">Reminder</div>
                      </div>
                      <div className={classNames(values.is_remind ? "flex" : "hidden", "w-full flex items-center pl-10 pb-2 space-x-2")}>
                        <input
                          value={values.check_remind1}
                          type="checkbox"
                          name="check_remind1"
                          id="check_remind1"
                          checked={values.check_remind1}
                          onChange={handleChange}
                          className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                        />
                        <select onChange={handleChange} value={values.val_remind1} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50 mr-2" name="val_remind1">
                          <option value="5">5 min</option>
                          <option value="10">10 min</option>
                          <option value="15">15 min</option>
                          <option value="20">20 min</option>
                          <option value="25">25 min</option>
                          <option value="30">30 min</option>
                          <option value="35">35 min</option>
                          <option value="40">40 min</option>
                          <option value="45">45 min</option>
                          <option value="50">50 min</option>
                          <option value="55">55 min</option>
                        </select>
                        <select onChange={handleChange} value={values.unit_remind1} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50 mr-2" name="unit_remind1">
                          <option value="Minute">Minute</option>
                          <option value="Hour">Hour</option>
                          <option value="Day">Day</option>
                        </select>
                      </div>
                      <div className="w-full flex items-center pl-10 pb-2 space-x-2">
                        <input
                          value={values.check_remind2}
                          type="checkbox"
                          name="check_remind2"
                          id="check_remind2"
                          checked={values.check_remind2}
                          onChange={handleChange}
                          className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                        />
                        <select onChange={handleChange} value={values.val_remind2} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50 mr-2" name="val_remind2">
                          <option value="5">5 min</option>
                          <option value="10">10 min</option>
                          <option value="15">15 min</option>
                          <option value="20">20 min</option>
                          <option value="25">25 min</option>
                          <option value="30">30 min</option>
                          <option value="35">35 min</option>
                          <option value="40">40 min</option>
                          <option value="45">45 min</option>
                          <option value="50">50 min</option>
                          <option value="55">55 min</option>
                        </select>
                        <select onChange={handleChange} value={values.unit_remind2} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50 mr-2" name="unit_remind2">
                          <option value="Minute">Minute</option>
                          <option value="Hour">Hour</option>
                          <option value="Day">Day</option>
                        </select>
                      </div>
                      <div className="w-full flex items-center pl-10 space-x-2">
                        <input
                          value={values.check_remind3}
                          type="checkbox"
                          name="check_remind3"
                          id="check_remind3"
                          checked={values.check_remind3}
                          onChange={handleChange}
                          className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded"
                        />
                        <select onChange={handleChange} value={values.val_remind3} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50 mr-2" name="val_remind3">
                          <option value="5">5 min</option>
                          <option value="10">10 min</option>
                          <option value="15">15 min</option>
                          <option value="20">20 min</option>
                          <option value="25">25 min</option>
                          <option value="30">30 min</option>
                          <option value="35">35 min</option>
                          <option value="40">40 min</option>
                          <option value="45">45 min</option>
                          <option value="50">50 min</option>
                          <option value="55">55 min</option>
                        </select>
                        <select onChange={handleChange} value={values.unit_remind3} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50 mr-2" name="unit_remind3">
                          <option value="Minute">Minute</option>
                          <option value="Hour">Hour</option>
                          <option value="Day">Day</option>
                        </select>
                      </div>
                    </div>
                    <div className="w-full pb-2 px-4">
                      {files.length > 0 && <ProgressBar completed={completed} className="w-full" />}
                    </div>
                    <div className="px-4 pb-5 pt-1 border-t th-border-selbg sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                      <button onClick={() => setOpenEditMeeting(false)} className="th-bg-bg th-color-for th-border-for border text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                        Cancel
                      </button>
                      {!event && <button type="submit" className={classNames(isSubmitting ? "w-24" : "w-20", "th-bg-bg th-color-blue th-border-blue border text-sm h-10 rounded font-bold focus:z-10 focus:outline-none ml-2 flex items-center justify-center")}>
                        {isSubmitting &&
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 th-color-brwhite"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>}
                        {event ? "Edit" : "Create"}
                      </button>}
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default EditMeeting
