import { Dialog, Transition } from '@headlessui/react';
import { BellIcon, ClockIcon, DocumentTextIcon, LocationMarkerIcon, PencilIcon, XIcon } from '@heroicons/react/outline';
import { ModalContext } from 'contexts/ModalContext';
import { useUser } from 'contexts/UserContext';
import { Formik, useFormik } from 'formik';
import { useUserById } from 'hooks/useUsers';
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import * as Yup from "yup";
import Style from 'components/Style';
// to see the default props for SummernoteLite
import { getHref } from 'utils/get-file-url';
import TextField from 'components/TextField';
import TextArea from 'components/TextArea';
import { toast as toastr } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import classNames from 'utils/classNames';
import axios from "axios";
import ProgressBar from "@ramonak/react-progress-bar";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import Dropzone from 'react-dropzone';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function FileViewer({
  event,
  files,
  uploadedFiles,
  checkedPrivateFiles,
  checkedRecordingFiles,
  attachFiles,
  setFiles,
  setUploadedFiles,
  setCheckedPrivateFiles,
  setCheckedRecordingFiles,
  setAttachFiles,
  setOpenPrivateFiles,
  setOpenRecordingFiles,
} : {
  event: any;
  files: any[];
  uploadedFiles: any[];
  checkedPrivateFiles: any[],
  checkedRecordingFiles: any[],
  attachFiles: any[];
  setFiles: any;
  setUploadedFiles: any;
  setCheckedPrivateFiles: any;
  setCheckedRecordingFiles: any;
  setAttachFiles: any;
  setOpenPrivateFiles: any;
  setOpenRecordingFiles: any;
}) {
  const { t } = useTranslation();
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
    const nn = '' + Date.now() + '.' + acceptedFiles[0].name.split('.')[acceptedFiles[0].name.split('.').length - 1];
    const file_path = '_public/cloud/' + nn;
    // let formData = new FormData();
    // formData.append("files", acceptedFiles[0], acceptedFiles[0].name);
    // const response = await axios.post("https://www.uteamwork.com/_api/uploadFile", formData, {
    //   onUploadProgress: (progressEvent) => {
    //     const { loaded, total } = progressEvent;
    //     percentage = Math.floor((loaded * 100) / total);
    //     console.log(percentage);
    //     setCompleted(percentage);
    //   },
    //   headers: {
    //     "Authorization": `Bearer ${localStorage.getItem("t")}`,
    //   },
    // });
    // if (response.statusText !== "OK") {
    //   toastr.error('Copying file to your private folder has been failed.', {
    //     position: "top-right",
    //     autoClose: 2000,
    //     hideProgressBar: false,
    //     closeOnClick: true,
    //     pauseOnHover: true,
    //     draggable: true,
    //     progress: undefined,
    //     theme: "dark",
    //   });
    // }
    setUploadedFiles([...uploadedFiles, {
      file_path,
      file_name: acceptedFiles[0].name,
      size: getFileSizeText(acceptedFiles[0].size),
    }]);
  }

  const removeFile = (f: string) => {
    setAttachFiles(attachFiles.filter((el: string) => el !== f));
    setUploadedFiles(uploadedFiles.filter((el: any) => el.file_name !== f));
    setCheckedPrivateFiles(checkedPrivateFiles.filter((p: any) => p.file_name !== f));
    setCheckedRecordingFiles(checkedRecordingFiles.filter((r: any) => r.recordingFile !== f));
  }

  useEffect(() => {
    if (event) {
      setUploadedFiles(event.uploaded_files);
      setCheckedPrivateFiles(event.private_files);
      setCheckedRecordingFiles(event.recording_files);
    }
  }, [event]);

  useEffect(() => {
    const uploadedAttach = uploadedFiles.map((u: any) => u.file_name);
    const privateAttach = checkedPrivateFiles.map((p: any) => p.file_name);
    const recordingAttach = checkedRecordingFiles.map((r: any) => r.recordingFile);
    setAttachFiles(uploadedAttach.concat(privateAttach).concat(recordingAttach));
  }, [uploadedFiles, checkedPrivateFiles, checkedRecordingFiles]);

  return (
    <>
      <div className="w-full flex items-center space-x-2 pl-6">
        <Dropzone onDrop={acceptedFiles => onDrop(acceptedFiles)}>
          {({getRootProps, getInputProps}) => (
            <section className="w-auto h-10 cursor-pointer">
              <div className="rounded w-full h-full flex justify-between border th-border-cyan items-center px-4" {...getRootProps()}>
                <input {...getInputProps()} />
                <p className="text-sm th-color-cyan">{t("Local_File")}</p>
              </div>
            </section>
          )}
        </Dropzone>
        <div className="cursor-pointer rounded h-10 border th-border-cyan text-sm th-color-cyan px-4 flex items-center" onClick={() => setOpenPrivateFiles(true)}>{t("Private_File")}</div>
        <div className="cursor-pointer rounded h-10 border th-border-cyan text-sm th-color-cyan px-4 flex items-center" onClick={() => setOpenRecordingFiles(true)}>{t("Recording_File")}</div>
      </div>
      {attachFiles.length > 0 && <div className="w-full flex items-center space-x-2 p-2 pl-6">
        {attachFiles.map((f: any, index: number) => (
          <div key={index} className="rounded th-bg-for th-color-bg p-1 flex items-center space-x-2">
            <div className="text-sm">{f}</div>
            <XIcon className="w-4 h-4 th-color-bg cursor-pointer" onClick={() => removeFile(f)} />
          </div>
        ))}
      </div>}
    </>
  );
}

function EditSchedule({
  event
}: {
  event?: any;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const teamcal = location.pathname?.includes("teamcal");
  const cancelButtonRef = useRef(null);
  const {openEditSchedule, setOpenEditSchedule, fileURL, checkedPrivateFiles, setCheckedPrivateFiles, checkedRecordingFiles, setCheckedRecordingFiles, setOpenPrivateFiles, setOpenRecordingFiles} = useContext(ModalContext);
  const { user } = useUser();
  const { value } = useUserById(user?.uid);
  const [file, setFile] = useState<any>(null);
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [tempAddress, setTempAddress] = useState("");
  const [fileCategory, setFileCategory] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [completed, setCompleted] = useState(0);
  const [files, setFiles] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [attachFiles, setAttachFiles] = useState<string[]>([]);
  const {
    values,
    handleChange,
    isSubmitting,
    handleSubmit,
    setFieldValue,
  } = useFormik({
    enableReinitialize: false,
    initialValues: !event ? {
      title: "",
      start_time: new Date((new Date().getTime() + 600 * 1000)),
      end_time: new Date((new Date().getTime() + 4200 * 1000)),
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
      title: teamcal ? event.title.split("--teamcal")[0] : event.title,
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
    validationSchema: Yup.object({
      subject: Yup.string().max(100).notRequired(),
    }),
    onSubmit: async ({ start_time, end_time, title, timezone, is_all_day, repeat, repeat_from, repeat_to, repeat_option, repeat_value, is_edit_repeat, is_mail_remind, description, location, remind }, { setSubmitting, setFieldValue }) => {
      if (title === "") {
        toastr.error(t('Please input all required fields.'), {
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
      if (start_time >= end_time) {
        toastr.error(t('End time must be later than start time.'), {
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
      if (!event && start_time < new Date()) {
        toastr.error(t('Start time must be later than current time.'), {
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
        let formData = new FormData();
        if (files && files.length > 0) {
          formData.append("files", files[0], files[0].name);
        }
        const fileResponse = await axios.post("https://www.uteamwork.com/_api/uploadFile", formData, {
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            percentage = Math.floor((loaded * 100) / total);
            console.log(percentage);
            setFieldValue("completed", percentage);
          },
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("t")}`,
          },
        });
        if (fileResponse.statusText !== "OK") {
          toastr.error(t('Uploading local file has been failed.'), {
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
        const response = event ? await axios.post("https://www.uteamwork.com/_api/event/edit", {
          id: event.id,
          title: teamcal ? title + "--teamcal" : title,
          start_time: is_all_day ? start_time.toISOString().split("T")[0] + " 00:00:00" : start_time.toISOString().split("T")[0] + " " + start_time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          end_time: is_all_day ? end_time.toISOString().split("T")[0] + " 00:00:00" : end_time.toISOString().split("T")[0] + " " + end_time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          is_all_day: is_all_day ? 1 : 0,
          is_edit_repeat,
          is_mail_remind: is_mail_remind ? 1 : 0,
          location,
          remind,
          repeat,
          repeat_from: repeat_from === "" ? start_time.toISOString().split("T")[0] : repeat_from,
          repeat_to: repeat_to === "" ? end_time.toISOString().split("T")[0] : repeat_to,
          repeat_option,
          repeat_value,
          selected_week_days: event.repeat_week_days.split(",").map(Number),
          timezone,
          uploaded_files: uploadedFiles,
          private_files: checkedPrivateFiles,
          recording_files: checkedRecordingFiles,
          description,
          user_lang: "ch",
        }, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Authorization": `Bearer ${localStorage.getItem("t")}`,
          },
        }) : await axios.post("https://www.uteamwork.com/_api/event/create", {
          title: teamcal ? title + "--teamcal" : title,
          start_time: is_all_day ? start_time.toISOString().split("T")[0] + " 00:00:00" : start_time.toISOString().split("T")[0] + " " + start_time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          end_time: is_all_day ? end_time.toISOString().split("T")[0] + " 00:00:00" : end_time.toISOString().split("T")[0] + " " + end_time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          is_all_day: is_all_day ? 1 : 0,
          is_edit_repeat,
          is_mail_remind: is_mail_remind ? 1 : 0,
          location,
          remind,
          repeat,
          repeat_from: repeat_from === "" ? start_time.toISOString().split("T")[0] : repeat_from,
          repeat_to: repeat_to === "" ? end_time.toISOString().split("T")[0] : repeat_to,
          repeat_option,
          repeat_value,
          selected_week_days: [0, 1, 2, 3, 4, 5, 6],
          timezone,
          uploaded_files: uploadedFiles,
          private_files: checkedPrivateFiles,
          recording_files: checkedRecordingFiles,
          description,
          user_lang: "ch",
        }, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Authorization": `Bearer ${localStorage.getItem("t")}`,
          },
        });
        if (response.statusText !== "OK") {
          toastr.error(event ? t('Updating the event has been failed.') : t('Creating the event has been failed.'), {
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
        if (response.statusText === "OK") {
          if (response.data.message === "You have any event at this time already") {
            toastr.error(t(response.data.message), {
              position: "top-right",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
            setFiles([]);
          } else {
            toastr.success(event ? t('The event has been successfully updated.') : t('The event has been successfully created.'), {
              position: "top-right",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
            setOpenEditSchedule(false);
          }
        }
      } catch (err: any) {
        toastr.error(event ? t('Updating the event has been failed.') : t('Creating the event has been failed.'), {
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
    }
  });
  let percentage = 0;

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

  const handleClose = () => {
    setUploadedFiles([]);
    setCheckedPrivateFiles([]);
    setCheckedRecordingFiles([]);
    setOpenEditSchedule(false);
  }

  useEffect(() => {
    getFileObject(fileURL);
  }, [fileURL]);

  useEffect(() => {
    getFileCategory();
  }, []);

  useEffect(() => {
    console.log(fileCategory);
  }, [fileCategory]);

  return (
    <Transition.Root show={openEditSchedule} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openEditSchedule}
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
          .react-datepicker-time__header, .react-datepicker-year-header, .react-datepicker__current-month {
            color: #000 !important;
            font-weight: 700 !important;
            border: none !important;
            outline: none !important;
          }
          .react-datepicker__header.react-datepicker__header--time {
            height: 58.4688px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
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
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <img src={`${process.env.PUBLIC_URL}/calendar.png`} className="w-6 h-6" alt="favorite" />
                  <h5 className="font-bold th-color-for">
                    {event ? t("Edit Event") : t("Add_event")}
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenEditSchedule(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <form noValidate onSubmit={handleSubmit}>
                <div className="px-5 border-t th-border-for w-full h-80 overflow-y-auto">
                  <div className="w-full flex items-center">
                    <PencilIcon className="w-4 h-4 mr-2 th-color-for" />
                    <TextField
                      value={values.title}
                      handleChange={handleChange}
                      type="text"
                      required
                      label=""
                      name="title"
                      autoComplete="title"
                      placeholder={t("Title")}
                    />
                  </div>
                  <div className="w-full flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2 th-color-for" />
                    <div className="w-auto pr-1">
                      <DatePicker
                        className="text-sm rounded th-bg-bg th-color-for border th-border-for"
                        selected={values.start_time}
                        name="start_time"
                        placeholderText="2024-04-02"
                        onChange={(date: any) => {
                          setFieldValue("start_time", date);
                          setFieldValue("end_time", new Date(date.getTime() + 3600 * 1000))
                        }} //only when value has changed
                        dateFormat="yyyy-MM-dd HH:mm"
                        showTimeSelect
                        timeIntervals={15}
                        timeCaption={t("Time")}
                        disabled={values.is_all_day}
                      />
                    </div>
                    <div className="text-sm pr-1 th-color-for">
                      ~
                    </div>
                    <div className="w-auto pr-1">
                      <DatePicker
                        className="text-sm rounded th-bg-bg th-color-for border th-border-for"
                        selected={values.end_time}
                        name="end_time"
                        placeholderText="2024-04-02"
                        onChange={(date: any) => setFieldValue("end_time", date)} //only when value has changed
                        dateFormat="yyyy-MM-dd HH:mm"
                        showTimeSelect
                        timeIntervals={15}
                        timeCaption={t("Time")}
                        disabled={values.is_all_day}
                      />
                    </div>
                    <div className="w-[42%] pr-1">
                      <select name="timezone" onChange={handleChange} value={values.timezone} className="th-bg-bg th-border-for th-color-for focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50">
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
                    <div className="w-[10%] flex items-center justify-end">
                      <label className="text-sm mr-2 th-color-for" htmlFor="#is_all_day">{t("All_day")}</label>
                      <input
                        value={values.is_all_day}
                        type="checkbox"
                        name="is_all_day"
                        id="is_all_day"
                        onChange={(e) => {
                          handleChange(e);
                          setFieldValue("start_time", new Date(values.start_time.toISOString().split("T")[0] + " 00:00:00"));
                          setFieldValue("end_time", new Date(values.end_time.toISOString().split("T")[0] + " 23:59:00"));
                        }}
                        className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 rounded autofill:th-bg-blue"
                      />
                    </div>
                  </div>
                  <div className="w-full flex items-center">
                    <LocationMarkerIcon className="w-4 h-4 mr-2 th-color-for" /> 
                    <TextField
                      value={values.location}
                      handleChange={handleChange}
                      type="text"
                      label=""
                      name="location"
                      autoComplete="location"
                      placeholder={t("Location")}
                    />
                  </div>
                  <div className="w-full flex items-center">
                    <BellIcon className="w-4 h-4 mr-2 th-color-for" /> 
                    {/* <div className="w-[20%] flex items-center mr-2">
                      <select onChange={handleChange} disabled={true} value={values.repeat} className="th-bg-bg th-border-brblack th-color-for th-border- focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50" name="repeat">
                        <option value="0">Not Repeat</option>
                        <option value="1">Daily</option>
                        <option value="2">Weekly</option>
                        <option value="3">Monthly</option>
                        <option value="4">Yearly</option>
                      </select>
                    </div> */}
                    <div className="flex items-center mr-2 th-color-for">
                      <div className="text-sm mr-2">{t("Remind")}: </div>
                      <select name="remind" onChange={handleChange} value={values.remind} className="th-bg-bg th-border-for th-color-for focus:ring-indigo-400 focus:border-indigo-500 block w-full shadow-sm text-sm rounded disabled:opacity-50">
                        <option value="0" selected >Never</option>
                        <option value="5" >5 mins</option>
                        <option value="15" >15 mins</option>
                        <option value="30" >30 mins</option>
                        <option value="60" >1 hour</option>
                        <option value="120" >2 hours</option>
                        <option value="720" >12 hours</option>
                        <option value="1440" >1 day</option>
                        <option value="10080" >1 week</option>
                      </select>
                    </div>
                    <div className="flex items-center th-color-for">
                      <div className="text-sm mr-2">{t("Mail_remined_at_same_time")}</div>
                      <input
                        value={values.is_mail_remind}
                        type="checkbox"
                        name="is_mail_remind"
                        id="is_mail_remind"
                        onChange={handleChange}
                        className="th-bg-blue text-2xl w-6 h-6 border-0 outline-0 mr-2 rounded autofill:th-bg-blue"
                      />
                    </div>
                  </div>
                  <div className="w-full flex">
                    <DocumentTextIcon className="w-4 h-4 mr-2 mt-2 th-color-for" />
                    <TextArea
                      value={values.description}
                      handleChange={handleChange}
                      infos=""
                      label=""
                      name="description"
                      autoComplete="description"
                      placeholder={t("Description")}
                    />
                  </div>
                  <FileViewer
                    event={event}
                    files={files}
                    uploadedFiles={uploadedFiles}
                    checkedPrivateFiles={checkedPrivateFiles}
                    checkedRecordingFiles={checkedRecordingFiles}
                    attachFiles={attachFiles}
                    setFiles={setFiles}
                    setUploadedFiles={setUploadedFiles}
                    setCheckedPrivateFiles={setCheckedPrivateFiles}
                    setCheckedRecordingFiles={setCheckedRecordingFiles}
                    setAttachFiles={setAttachFiles}
                    setOpenPrivateFiles={setOpenPrivateFiles}
                    setOpenRecordingFiles={setOpenRecordingFiles}  
                  />
                  {/* <div className="w-full flex items-center space-x-2 pl-6">
                    <Dropzone onDrop={acceptedFiles => onDrop(acceptedFiles)}>
                      {({getRootProps, getInputProps}) => (
                        <section className="w-auto h-10 cursor-pointer">
                          <div className="rounded w-full h-full flex justify-between border th-border-blue items-center px-4" {...getRootProps()}>
                            <input {...getInputProps()} />
                            <p className="text-sm th-color-blue">Local File</p>
                          </div>
                        </section>
                      )}
                    </Dropzone>
                    <div className="cursor-pointer rounded h-10 border th-border-blue text-sm th-color-blue px-4 flex items-center" onClick={() => setOpenPrivateFiles(true)}>Private File</div>
                    <div className="cursor-pointer rounded h-10 border th-border-blue text-sm th-color-blue px-4 flex items-center" onClick={() => setOpenRecordingFiles(true)}>Recording File</div>
                  </div> */}
                  {/* {attachFiles.length > 0 && <div className="w-full flex items-center space-x-2 p-2 pl-6">
                    {attachFiles.map((f: any, index: number) => (
                      <div key={index} className="rounded th-bg-for th-color-bg p-1 flex items-center space-x-2">
                        <div className="text-sm">{f}</div>
                        <XIcon className="w-4 h-4 th-color-bg cursor-pointer" onClick={() => removeFile(f)} />
                      </div>
                    ))}
                  </div>} */}
                </div>
                <div className="w-full pb-2 px-4">
                  {isSubmitting && <ProgressBar completed={values.completed} className="w-full" />}
                </div>
                <div className="px-4 pb-2 pt-2 border-t th-border-for sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                  <button onClick={handleClose} className="th-bg-bg th-color-for th-border-for border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                    {t("Cancel")}
                  </button>
                  <button type="submit" className={classNames(isSubmitting ? "w-24" : "w-20", "th-bg-bg th-color-cyan th-border-cyan border-2 text-sm h-10 rounded font-bold focus:z-10 focus:outline-none ml-2 flex items-center justify-center")}>
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
                    {event ? t("Save") : t("Create")}
                  </button>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default EditSchedule
