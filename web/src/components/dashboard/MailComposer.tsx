import { Dialog, Transition } from '@headlessui/react';
import { DocumentTextIcon, PlayIcon, XIcon } from '@heroicons/react/outline';
import { ModalContext } from 'contexts/ModalContext';
import { useUser } from 'contexts/UserContext';
import { Formik } from 'formik';
import { useUserById } from 'hooks/useUsers';
import { userInfo } from 'os';
import React, { Fragment, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ReactComponent as AttachFileIcon } from "icons/attach_file.svg"
import toast from 'react-hot-toast';
import { postData } from 'utils/api-helpers';
import * as Yup from "yup";
import QuillForwardEdit from './quill/QuillForwardEdit';
import { useForceUpdate } from 'lib/hooks';
import Style from 'components/Style';
import SummernoteLite from "react-summernote-lite";
// to see the default props for SummernoteLite
import { DEFAULT_PROPS } from "react-summernote-lite";
import Dropzone from 'react-dropzone';
import { uploadFile } from 'gqlite-lib/dist/client/storage';
import now from 'utils/now';
import classNames from 'utils/classNames';
import { getHref } from 'utils/get-file-url';
import { TagsInput } from "react-tag-input-component";
import { useTheme } from 'contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

function FileViewer({
  setFiles,
  files,
}: {
  files: any[];
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const filesViewer = useMemo(
    () => (
      <div
        className={classNames(
          files?.length ? "" : "hidden",
          "w-4/5 h-16 px-3 flex py-2"
        )}
      >
        {files?.length &&
          Array.from(files).map((file) => (
            <FileThumbnail file={file} key={file.lastModified}>
              <div className="absolute top-0 right-0 bg-gray-700 p-1 rounded-full transform translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100">
                <XIcon
                  className="text-white h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setFiles(files.filter((f: any) => f !== file));
                  }}
                />
              </div>
            </FileThumbnail>
          ))}
      </div>
    ),
    [files]
  );
  return filesViewer;
}

function FileThumbnail({
  file,
  children,
}: {
  file: File;
  children: React.ReactNode;
}) {
  if (file.type.includes("image/"))
    return (
      <div
        key={file.lastModified}
        className="bg-cover rounded h-15 w-20 border th-border-for mr-2 relative group"
        style={{ backgroundImage: `url(${URL.createObjectURL(file)})` }}
      >
        <div className="th-color-for font-bold text-xs truncate">
          {file.name}
        </div>
        {children}
      </div>
    );
  if (file?.type?.includes("video/") || file?.type?.includes("audio/"))
    return (
      <div
        key={file.lastModified}
        className="rounded h-15 w-20 relative group bg-gray-800 border th-border-for flex space-x-2 items-center p-1 mr-2"
      >
        <PlayIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <div className="th-color-for font-bold text-xs truncate">
          {file.name}
        </div>
        {children}
      </div>
    );
  return (
    <div
      key={file.lastModified}
      className="rounded h-15 w-20 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1 mr-2"
    >
      <DocumentTextIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
      <div className="text-gray-300 text-xs font-bold truncate">
        {file.name}
      </div>
      {children}
    </div>
  );
}

function MailComposer() {
  const { t } = useTranslation();
  const forceUpdate = useForceUpdate();
  const cancelButtonRef = useRef(null);
  const {openMailSender, setOpenMailSender, emailRecipient, setEmailRecipient, emailBody, setEmailBody} = useContext(ModalContext);
  const { user } = useUser();
  const { value } = useUserById(user?.uid);
  const editorRef = useRef(null);
  console.log(emailRecipient, emailBody);
  const [files, setFiles] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [tempAddress, setTempAddress] = useState("");
  const { themeColors } = useTheme();

  useEffect(() => {
    setBody(emailBody);
    setRecipients([emailRecipient]);
  }, [])

  const onDrop = async (acceptedFiles: any[]) => {
    setFiles(files.concat(acceptedFiles));
    console.log(acceptedFiles);
  }

  const handleRecipients = (e: string[]) => {
    setTempAddress("");
    const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (e.length > 0) {
      if (e[e.length - 1].match(validRegex)) {
        console.log(e[e.length -1]);
        setRecipients(e);
      } else {
        setRecipients(e.filter((i: any) => i.match(validRegex)));
      }
    } else {
      setRecipients([]);
    }
  }

  const handleTempAddress = (e: any) => {
    const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (e.target.value && e.target.value !== "" && e.target.value.match(validRegex)) {
      setTempAddress(e.target.value);
    }
  }

  return (
    <Transition.Root show={openMailSender} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openMailSender}
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
            padding-left: 2px;
            padding-right: 2px;
            padding-top: 0;
            padding-bottom: 0;
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
            font-size: 0.875rem !important;
          }
          .rti--container input:focus {
            border: none;
            outline: none;
          }
          .rti--tag {
            background-color: ${themeColors?.foreground} !important;
            color: ${themeColors?.background} !important;
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
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left shadow-xl transform transition-all sm:my-2 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div>
                  <h5 className="font-bold th-color-for">
                    {t("Send_E-mail")}
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpenMailSender(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <Formik
                initialValues={{
                  to: emailRecipient,
                  subject: "",
                  text: emailBody,
                }}
                validationSchema={Yup.object({
                  subject: Yup.string().max(100).notRequired(),
                })}
                enableReinitialize
                onSubmit={async ({ to, subject, text }, { setSubmitting }) => {
                  if (tempAddress === "" && recipients.length === 0) {
                    return;
                  }
                  setSubmitting(true);
                  console.log(text);
                  try {
                    let attachments = [];
                    if (files) {
                      if (files?.length) {
                        for (let file of files) {
                          let filePath: string | undefined;
                          filePath = await uploadFile(
                            "messenger",
                            `${now()}.${file.name.split(".").pop()}`,
                            file,
                          );
                          attachments.push({
                            'filename': file.name,
                            'path': getHref(filePath),
                          });
                        }
                      }
                    }
                    const { channelId } = await postData("/mail", {
                      from: value?.email,
                      to: recipients.concat([tempAddress]),
                      subject,
                      html: body,
                      attachments
                    });
                    toast.success(t("E-mail sent."));
                    setOpenMailSender(false);
                    setEmailRecipient("");
                    setEmailBody("");
                    setTempAddress("");
                  } catch (err: any) {
                    toast.error(t("Sending e-mail failed."));
                  }
                  setSubmitting(false);
                }}
              >
                {({
                  values,
                  setFieldValue,
                  handleChange,
                  isSubmitting,
                  handleSubmit,
                }) => (
                  <form noValidate onSubmit={handleSubmit}>
                    <div className="px-5 border-t th-border-for w-full h-auto">
                      <div className="mt-2 w-full flex border th-border-for rounded th-color-for">
                        <span className="flex select-none items-center w-24 px-3 sm:text-sm border-r th-border-for rounded-l">{t("Recipient")}</span>
                        <TagsInput value={recipients} onChange={handleRecipients} onKeyUp={handleTempAddress} name="to" placeHolder="mail@example.com" />
                      </div>
                      <div className="mt-2 w-full flex border th-border-for rounded th-color-for">
                        <span className="flex select-none items-center w-24 px-3 sm:text-sm border-r th-border-for rounded-l">{t("Subject")}</span>
                        <input type="text" name="subject" id="subject" onChange={handleChange} autoComplete="subject" className="rounded block flex-1 border-0 bg-transparent py-1.5 pl-2 th-color-for placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" placeholder={t("Please_input_the_subject")} />
                      </div>
                      
                      <div className="mt-2 w-full rounded border th-border-for bg-white text-black quill-form">
                        <SummernoteLite
                          name="text"
                          defaultCodeValue={values.text}
                          placeholder={t("Write_something_here")}
                          tabsize={2}
                          lang="zh-CN" // only if you want to change the default language
                          height={150}
                          dialogsInBody={true}
                          blockquoteBreakingLevel={0}
                          toolbar={[
                            ['style', ['style']],
                            ['font', ['bold', 'underline', 'clear']],
                            ['fontsize', ['fontsize']],
                            ['fontname', ['fontname']],
                            ['color', ['color']],
                            ['para', ['ul', 'ol', 'paragraph']],
                            ['table', ['table']],
                            ['insert', ['link', 'picture', 'video']],
                            ['view', ['fullscreen', 'codeview']]
                          ]}
                          fontNames={[
                            "Arial",
                            "Georgia",
                            "Verdana",
                          ]}
                          callbacks={{
                            onChange: (content: any) => {
                              setBody(content);
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center">
                        <Dropzone onDrop={acceptedFiles => onDrop(acceptedFiles)}>
                          {({getRootProps, getInputProps}) => (
                            <section className="py-2 pr-4 w-1/5" style={{cursor: 'pointer'}}>
                              <div className="rounded w-full h-12 th-bg-bg flex justify-between border th-border-for th-color-for items-center px-4" {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p className="text-sm">{t("Files")}</p>
                                <AttachFileIcon className="h-5 w-5 cursor-pointer th-color-for" />
                              </div>
                            </section>
                          )}
                        </Dropzone>
                        <FileViewer files={files} setFiles={setFiles} />
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-2 border-t th-border-for sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                      <button onClick={() => setOpenMailSender(false)} className="th-bg-bg th-color-for th-border-for border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                        {t("Cancel")}
                      </button>
                      <button type="submit" className="th-bg-bg th-color-cyan th-border-cyan border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2 flex items-center justify-center">
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
                        {t("Send")}
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

export default MailComposer
