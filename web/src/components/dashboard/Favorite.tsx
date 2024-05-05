import { Dialog, Menu, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { ModalContext } from 'contexts/ModalContext';
import { useUser } from 'contexts/UserContext';
import { Formik } from 'formik';
import { useUserById } from 'hooks/useUsers';
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast';
import { postData } from 'utils/api-helpers';
import * as Yup from "yup";
import { useForceUpdate } from 'lib/hooks';
import Style from 'components/Style';
// to see the default props for SummernoteLite
import { uploadFile } from 'gqlite-lib/dist/client/storage';
import now from 'utils/now';
import { getHref } from 'utils/get-file-url';
import { TagsInput } from "react-tag-input-component";
import TextField from 'components/TextField';
import TextArea from 'components/TextArea';
import { use } from 'i18next';
import TreeView from "react-accessible-treeview";
import { FolderIcon, FolderOpenIcon } from '@heroicons/react/solid';
import Spinner from 'components/Spinner';
import { toast as toastr } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import classNames from 'utils/classNames';
import axios from "axios";
import ProgressBar from "@ramonak/react-progress-bar";
import { useTranslation } from 'react-i18next';

function Favorite() {
  const { t } = useTranslation();
  const cancelButtonRef = useRef(null);
  const {openFavorite, setOpenFavorite, fileURL, setFileURL, fileMessage, setFileMessage} = useContext(ModalContext);
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
    const treeArray = ary.map((item: any, index: number) => {
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

  const setCategoryValue = (element: any) => {
    setCategoryName(element.name);
    setCategoryId(element.id);
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
    <Transition.Root show={openFavorite} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openFavorite}
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
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="th-color-for w-6 h-6" fill="currentColor">
                    <path d="M29,13a.71.71,0,0,0,0-.21c0-.06,0-.12-.05-.17s-.07-.1-.1-.15a.7.7,0,0,0-.13-.16l0,0L24,8.36V6a1,1,0,0,0-1-1H20L16.64,2.23a1,1,0,0,0-1.28,0L12,5H9A1,1,0,0,0,8,6V8.36L3.36,12.23l0,0a.7.7,0,0,0-.13.16c0,.05-.07.09-.1.15s0,.11-.05.17A.71.71,0,0,0,3,13s0,0,0,0V29a1,1,0,0,0,1,1H28a1,1,0,0,0,1-1V13S29,13,29,13Zm-3.75-1H24V11ZM16,4.3l.84.7H15.16ZM22,7v8.88l-6,3-6-3V7ZM8,12H6.76L8,11ZM27,28H5V14H8v1a1,1,0,0,0-.89.54,1,1,0,0,0,.44,1.34l8,4a1,1,0,0,0,.9,0l8-4a1,1,0,0,0,.44-1.34A1,1,0,0,0,24,15V14h3Z"/>
                    <path d="M18,25H8a1,1,0,0,0,0,2H18a1,1,0,0,0,0-2Z"/>
                    <circle cx="21" cy="26" r="1"/>
                    <circle cx="24" cy="26" r="1"/>
                    <polygon points="13.53 16.5 16 14.7 18.47 16.5 17.53 13.59 20 11.79 16.94 11.79 16 8.89 15.06 11.79 12 11.79 14.47 13.59 13.53 16.5"/>
                  </svg>
                  <h5 className="font-bold th-color-for">
                    {t("File_Collection")}
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenFavorite(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <Formik
                initialValues={{
                  document_id: `${new Date().getTime()}`,
                  version: "",
                  category_id: "",
                  category_name: "",
                  file_path: fileMessage?.fileName,
                  keyword1: "",
                  keyword2: "",
                  keyword3: "",
                  keyword4: "",
                  title: fileMessage?.fileName.split(`.${fileMessage?.fileName.split(".")[fileMessage?.fileName.split(".").length - 1]}`)[0],
                  abstract: "",
                  completed: "0",
                }}
                validationSchema={Yup.object({
                  subject: Yup.string().max(100).notRequired(),
                })}
                enableReinitialize
                onSubmit={async ({ document_id, version, category_id, title, keyword1, keyword2, keyword3, keyword4, file_path, abstract }, { setSubmitting, setFieldValue }) => {
                  if (!file || document_id === "" || category_id === "" || title === "" || (keyword1 === "" && keyword2 === "" && keyword3 === "" && keyword4 === "") || file_path === "") {
                    if (document_id === "" || category_id === "" || title === "" || (keyword1 === "" && keyword2 === "" && keyword3 === "" && keyword4 === "")) {
                      toastr.error('Please input all required fields.', {
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
                    if (!file || file_path === "") {
                      toastr.error('Please select file correctly.', {
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
                    return;
                  }
                  setSubmitting(true);
                  try {
                    let formData = new FormData();
                    const newFileName = `${new Date().getTime()}.${filePath.split(".")[filePath.split(".").length - 1]}`;
                    const data = {
                      document_id,
                      category_id,
                      title,
                      keyword1,
                      keyword2,
                      keyword3,
                      keyword4,
                      file_path,
                      path: `_public/cloud/${newFileName}`,
                      id: null,
                      version,
                      group: "",
                      recording_file_id: 0,
                      recording_file_name: "",
                      abstract,
                    }
                    const Obkey = Object.keys(data);
                    Obkey.forEach(t => {
                      formData.append(t, data[t]);
                    });
                    formData.append("files", file, newFileName);
                    const response = await axios.post("https://www.uteamwork.com/_api/cloudDiskController/upload", formData, {
                      onUploadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        percentage = Math.floor((loaded * 100) / total);
                        console.log(percentage);
                        setFieldValue("completed", percentage.toString());
                      },
                      headers: {
                        "Authorization": `Bearer ${localStorage.getItem("t")}`,
                      },
                    });
                    if (response.statusText !== "OK") {
                      toastr.error('Copying file to your private folder has been failed.', {
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
                    await postData(`/messages/${fileMessage?.objectId}/favorites`);
                    toastr.success('The file has been successfully bookmarked to your private folder.', {
                      position: "top-right",
                      autoClose: 2000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                      theme: "dark",
                    });
                    setFileURL("");
                    setFileMessage(null);
                    setOpenFavorite(false);
                    setTempAddress("");
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
                    <div className="px-5 border-t th-border-for w-full h-auto">
                      <div className="pt-3 w-full flex items-center">
                        <div className="w-1/3 pr-2">
                          <TextField
                            value={values.document_id}
                            handleChange={handleChange}
                            type="text"
                            required
                            label={`${t("File_ID")} *`}
                            name="document_id"
                            autoComplete="document_id"
                            placeholder="12345678"
                            readOnly
                          />
                        </div>
                        <div className="w-1/3 px-2">
                          <TextField
                            value={values.version}
                            handleChange={handleChange}
                            type="text"
                            label={`${t("File_Version")} *`}
                            name="version"
                            autoComplete="version"
                            placeholder="v1.0"
                          />
                        </div>
                        <div className="w-1/3 pl-2">
                          <Menu as="div" className="relative">
                            {({ open }) => (
                              <>
                                <div>
                                  <Menu.Button
                                    as="div"
                                    className="relative mr-2 cursor-pointer appearance-none"
                                  >
                                    <TextField
                                      value={values.category_name}
                                      handleChange={() => {}}
                                      type="text"
                                      required
                                      label={`${t("Directory")} *`}
                                      name="category_name"
                                      autoComplete="category_name"
                                      placeholder=""
                                      readOnly
                                    />
                                  </Menu.Button>
                                </div>
                                <Transition
                                  show={open}
                                  as={Fragment}
                                  enter="transition ease-out duration-100"
                                  enterFrom="transform opacity-0 scale-95"
                                  enterTo="transform opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="transform opacity-100 scale-100"
                                  leaveTo="transform opacity-0 scale-95"
                                >
                                  <Menu.Items
                                    static
                                    className="th-bg-bg border th-border-for origin-top-right z-20 absolute left-0 mt-2 w-full rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                                  >
                                    <div className="px-5 flex py-2">
                                      {fileCategory.length > 0 ?
                                      <TreeView
                                        data={fileCategory}
                                        aria-label="directory tree"
                                        onNodeSelect={({element}: any) => {
                                          setFieldValue("category_name", element.name);
                                          setFieldValue("category_id", element.id);
                                        }}
                                        nodeRenderer={({
                                          element,
                                          isBranch,
                                          isExpanded,
                                          getNodeProps,
                                          level,
                                        }: {
                                          element: any;
                                          isBranch: boolean;
                                          isExpanded: boolean | undefined;
                                          getNodeProps: any;
                                          level: number;
                                        }) => (
                                          <div {...getNodeProps()} className="flex items-center th-color-for cursor-pointer hover:th-bg-selbg" style={{ paddingLeft: 20 * (level - 1) }}>
                                            {isExpanded ?
                                            <FolderOpenIcon className="w-4 h-4 th-color-for" /> :
                                            <FolderIcon className="w-4 h-4 th-color-for" />}
                                            {element.name}
                                          </div>
                                        )}
                                      /> :
                                      <div className="w-full h-20 flex justify-center items-center">
                                        <Spinner className="h-4 w-4 th-color-for" />
                                      </div>}
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </>
                            )}
                          </Menu>
                        </div>
                      </div>
                      <TextField
                        value={values.category_id}
                        handleChange={handleChange}
                        type="hidden"
                        label=""
                        name="category_id"
                        autoComplete="category_id"
                        placeholder=""
                      />
                      <div className="w-full">
                        <TextField
                          value={values.title}
                          handleChange={handleChange}
                          type="text"
                          required
                          label={`${t("Title")} *`}
                          name="title"
                          autoComplete="title"
                          placeholder=""
                        />
                      </div>
                      <div className="w-full columns-2 gap-4">
                        <div className="columns-4">
                          <TextField
                            value={values.keyword1}
                            handleChange={handleChange}
                            type="text"
                            required
                            label={`${t("Keywords")} *`}
                            name="keyword1"
                            autoComplete="keyword1"
                            placeholder=""
                          />
                          <div className="pt-5">
                            <TextField
                              value={values.keyword2}
                              handleChange={handleChange}
                              type="text"
                              required
                              label="     "
                              name="keyword2"
                              autoComplete="keyword2"
                              placeholder=""
                            />
                          </div>
                          <div className="pt-5">
                            <TextField
                              value={values.keyword3}
                              handleChange={handleChange}
                              type="text"
                              required
                              label="     "
                              name="keyword3"
                              autoComplete="keyword3"
                              placeholder=""
                            />
                          </div>
                          <div className="pt-5">
                            <TextField
                              value={values.keyword4}
                              handleChange={handleChange}
                              type="text"
                              required
                              label="     "
                              name="keyword4"
                              autoComplete="keyword4"
                              placeholder=""
                            />
                          </div>
                        </div>
                        <div className="w-full">
                          <TextField
                            value={values.file_path}
                            handleChange={handleChange}
                            type="text"
                            required
                            label={`${t("File")} *`}
                            name="file_path"
                            autoComplete="file_path"
                            placeholder=""
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="w-full">
                        <TextArea
                          value={values.abstract}
                          handleChange={handleChange}
                          infos=""
                          label={`${t("Abstract")} *`}
                          name="abstract"
                          autoComplete="abstract"
                          placeholder=""
                        />
                      </div>
                      <div className="w-full">
                        <TextField
                          value={`${values.completed}`}
                          // handleChange={handleChange}
                          type="hidden"
                          required
                          label=""
                          name="completed"
                          autoComplete="completed"
                          placeholder=""
                          readOnly
                        />
                      </div>
                      <div className="w-full pb-2">
                        {isSubmitting && <ProgressBar completed={parseInt(values.completed)} className="w-full" />}
                      </div>
                    </div>
                    <div className="px-4 pb-5 pt-1 border-t th-border-for sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                      <button onClick={() => setOpenFavorite(false)} className="th-bg-bg th-color-for th-border-for border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
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
                        {t("Favorite")}
                      </button>
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

export default Favorite
