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

function Favorite() {
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
            <div className="th-bg-bg inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <img src={`${process.env.PUBLIC_URL}/favorite_add.png`} className="w-6 h-6" alt="favorite" />
                  <h5 className="font-bold th-color-for">
                    File Collection
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
                  file_path: filePath,
                  keyword1: "",
                  keyword2: "",
                  keyword3: "",
                  keyword4: "",
                  title: "",
                  abstract: "",
                }}
                validationSchema={Yup.object({
                  subject: Yup.string().max(100).notRequired(),
                })}
                enableReinitialize
                onSubmit={async ({ document_id, version, title, keyword1, keyword2, keyword3, keyword4, file_path, abstract }, { setSubmitting }) => {
                  if (!file || document_id === "" || categoryId === "" || title === "" || keyword1 === "" || keyword2 === "" || keyword3 === "" || keyword4 === "" || filePath === "") {
                    return;
                  }
                  setSubmitting(true);
                  try {
                    let formData = new FormData();
                    const newFileName = `${new Date().getTime()}.${filePath.split(".")[filePath.split(".").length - 1]}`;
                    const data = {
                      document_id,
                      category_id: categoryId,
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
                    }
                    const Obkey = Object.keys(data);
                    Obkey.forEach(t => {
                      formData.append(t, data[t]);
                    });
                    formData.append("files", file, newFileName);
                    const response = await fetch("https://www.uteamwork.com/_api/cloudDiskController/upload", {
                      method: 'POST',
                      body: formData,
                      headers: {
                        "Authorization": `Bearer ${localStorage.getItem("t")}`,
                      }
                    });
                    const result = await response.json();
                    await postData(`/messages/${fileMessage?.objectId}/favorites`);
                    toast.success(result.message);
                    setFileURL("");
                    setFileMessage(null);
                    setOpenFavorite(false);
                    setTempAddress("");
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                  setSubmitting(false);
                }}
              >
                {({
                  values,
                  handleChange,
                  isSubmitting,
                  handleSubmit,
                }) => (
                  <form noValidate onSubmit={handleSubmit}>
                    <div className="px-5 border-t th-border-selbg w-full h-auto">
                      <div className="pt-3 w-full flex items-center">
                        <div className="w-1/3 pr-2">
                          <TextField
                            value={values.document_id}
                            handleChange={handleChange}
                            type="text"
                            required
                            label="File ID"
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
                            label="File Version"
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
                                      value={categoryName}
                                      handleChange={() => {}}
                                      type="text"
                                      required
                                      label="Directory"
                                      name="directory"
                                      autoComplete="directory"
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
                                    className="th-bg-bg border th-border-for origin-top-right z-20 absolute left-0 mt-2 w-full rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3"
                                  >
                                    <div className="px-5 flex py-2">
                                      {fileCategory.length > 0 ?
                                      <TreeView
                                        data={fileCategory}
                                        aria-label="directory tree"
                                        onNodeSelect={({element}: any) => setCategoryValue(element)}
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
                                          <div {...getNodeProps()} className="flex items-center cursor-pointer hover:th-bg-selbg" style={{ paddingLeft: 20 * (level - 1) }}>
                                            {isExpanded ?
                                            <FolderOpenIcon className="w-4 h-4" /> :
                                            <FolderIcon className="w-4 h-4" />}
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
                      <div className="w-full">
                        <TextField
                          value={values.title}
                          handleChange={handleChange}
                          type="text"
                          required
                          label="Title"
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
                            label="Keywords"
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
                            label="File"
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
                          label="Abstract"
                          name="abstract"
                          autoComplete="abstract"
                          placeholder=""
                        />
                      </div>
                    </div>
                    <div className="px-4 pb-5 pt-1 border-t th-border-selbg sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                      <button onClick={() => setOpenFavorite(false)} className="th-bg-bg th-color-for th-border-for border text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                        Cancel
                      </button>
                      <button type="submit" className="th-bg-bg th-color-blue th-border-blue border text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2 flex items-center justify-center">
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
                        Copy
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