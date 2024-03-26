import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { ModalContext } from 'contexts/ModalContext';
import { useUser } from 'contexts/UserContext';
import { Formik } from 'formik';
import { useUserById } from 'hooks/useUsers';
import { userInfo } from 'os';
import React, { Fragment, useContext, useRef, useState } from 'react'
import toast from 'react-hot-toast';
import { postData } from 'utils/api-helpers';
import * as Yup from "yup";
import QuillForwardEdit from './quill/QuillForwardEdit';
import { useForceUpdate } from 'lib/hooks';
import Style from 'components/Style';
import SummernoteLite from "react-summernote-lite";
// to see the default props for SummernoteLite
import { DEFAULT_PROPS } from "react-summernote-lite";

function MailComposer() {
  const forceUpdate = useForceUpdate();
  const cancelButtonRef = useRef(null);
  const {openMailSender, setOpenMailSender, emailRecipient, setEmailRecipient, emailBody, setEmailBody} = useContext(ModalContext);
  const { user } = useUser();
  const { value } = useUserById(user?.uid);
  const editorRef = useRef(null);
  console.log(emailRecipient, emailBody);
  const [imageFiles, setImageFiles] = useState([]);

  return (
    <Transition.Root show={openMailSender} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openMailSender}
        onClose={setOpenMailSender}
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
            <div className="th-bg-bg inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center">
                <div>
                  <h5 className="font-bold th-color-for">
                    Send E-mail
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
                  to: Yup.string().max(100).required(),
                  subject: Yup.string().max(100).notRequired(),
                  text: Yup.string().max(1000).notRequired(),
                })}
                enableReinitialize
                onSubmit={async ({ to, subject, text }, { setSubmitting }) => {
                  setSubmitting(true);
                  try {
                    const { channelId } = await postData("/mail", {
                      from: value?.email,
                      to,
                      subject,
                      html: text,
                    });
                    toast.success("E-mail sent.");
                    setOpenMailSender(false);
                    setEmailRecipient("");
                    setEmailBody("");
                  } catch (err: any) {
                    toast.error(err.message);
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
                    <div className="px-5 pb-2 border-t th-border-selbg w-full h-auto">
                      <div className="mt-2 w-full flex border th-border-for rounded">
                        <span className="flex select-none items-center w-24 px-3 th-color-for sm:text-sm border-r th-border-for bg-gray-200 rounded-l">Recipient</span>
                        <input type="text" defaultValue={emailRecipient} name="to" id="to" onChange={handleChange} autoComplete="to" className="rounded block flex-1 border-0 bg-transparent py-1.5 pl-2 th-color-for placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" placeholder="janesmith" />
                      </div>
                      <div className="mt-2 w-full flex border th-border-for rounded">
                        <span className="flex select-none items-center w-24 px-3 th-color-for sm:text-sm border-r th-border-for bg-gray-200 rounded-l">Subject</span>
                        <input type="text" name="subject" id="subject" onChange={handleChange} autoComplete="subject" className="rounded block flex-1 border-0 bg-transparent py-1.5 pl-2 th-color-for placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" placeholder="janesmith" />
                      </div>
                      <div className="mt-2 w-full rounded border th-border-for quill-form">
                        {/* <QuillForwardEdit
                          editorRef={editorRef}
                          text={values.text}
                          setFieldValue={setFieldValue}
                          placeholder="Enter text"
                          handleSubmit={handleSubmit}
                          forceUpdate={forceUpdate}
                        /> */}
                        <SummernoteLite
                          defaultCodeValue={values.text}
                          placeholder={"Write something here..."}
                          tabsize={2}
                          lang="zh-CN" // only if you want to change the default language
                          height={350 || "50vh"}
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
                            ['view', ['fullscreen', 'codeview', 'help']]
                          ]}
                          fontNames={[
                            "Arial",
                            "Georgia",
                            "Verdana",
                          ]}
                          callbacks={{
                            onImageUpload: function (files: any) {
                              console.log(files);
                              setImageFiles(files);
                            },
                            onKeyup: function (e: any){},
                            onKeyDown: function (e: any){},
                            onPaste: function (e: any){}
                          }}
                        />
                      </div>
                    </div>
                    <div className="px-4 pb-5 pt-1 border-t th-border-selbg sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                      <button onClick={() => setOpenMailSender(false)} className="th-bg-bg th-color-for th-border-for border text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
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
                        Send
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
