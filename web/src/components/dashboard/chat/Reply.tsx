import QuillForwardEdit from "components/dashboard/quill/QuillForwardEdit";
import Spinner from "components/Spinner";
import { MESSAGE_MAX_CHARACTERS } from "config";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useTheme } from "contexts/ThemeContext";
import { Formik } from "formik";
import { useForceUpdate } from "lib/hooks";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { postData } from "utils/api-helpers";
import QuillReader from "../quill/QuillReader";
import { DocumentTextIcon } from "@heroicons/react/outline";
import bytesToSize from "utils/bytesToSize";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { useUser } from "contexts/UserContext";
import { UsersContext } from "contexts/UsersContext";
import { useChannels } from "hooks/useChannels";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getHref } from "utils/get-file-url";
import { useUserById } from "hooks/useUsers";
import classNames from "utils/classNames";
import Style from "components/Style";
import { useModal } from "contexts/ModalContext";
import { useTranslation } from "react-i18next";

function ForwardFooter({
  setEdit,
  isSubmitting,
  errors,
  editorRef,
}: {
  setEdit: any;
  isSubmitting: any;
  errors: any;
  editorRef: any;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const editor = editorRef?.current?.getEditor();
  const realText = editor?.getText() as string | null | undefined;
  const isText = realText?.trim();
  const {forwardMessage} = useContext(ReactionsContext);

  return (
    <div className="flex justify-end items-center space-x-2 mt-1">
      <button
        type="button"
        className="border-2 th-border-for th-color-for font-medium text-sm h-10 w-20 rounded"
        onClick={() => setEdit(false)}
      >
        {t("Cancel")}
      </button>
      <button
        className="border-2 th-border-cyan font-medium flex justify-center items-center text-sm th-color-cyan h-10 w-20 rounded disabled:opacity-50"
        disabled={isSubmitting || !forwardMessage}
      >
        {isSubmitting && <Spinner className="th-color-for mr-2 h-3 w-3" />}
        {!isSubmitting && (
          <>
            {errors.text && isText ? (
              <span className="th-color-brwhite">
                {MESSAGE_MAX_CHARACTERS - isText.length}
              </span>
            ) : (
              t("Reply")
            )}
          </>
        )}
      </button>
    </div>
  );
}

export default function Reply() {
  const { t } = useTranslation();
  const forceUpdate = useForceUpdate();
  const { workspaceId, channelId, dmId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const {setVisibleReply, forwardMessage, setForwardMessage} = useContext(ReactionsContext);
  const [isTyping, setIsTyping] = useState(false);
  const { setMessageSent } = useModal();

  useEffect(() => {
    const type = dmId ? "directs" : "channels";
    const id = dmId || channelId;

    postData(
      `/${type}/${id}/typing_indicator`,
      {
        isTyping: false,
      },
      {},
      false
    );

    postData(`/${type}/${id}/reset_typing`, {}, {}, false);
    const interval = setInterval(() => {
      postData(`/${type}/${id}/reset_typing`, {}, {}, false);
    }, 30000);

    return () => {
      clearInterval(interval);
      postData(
        `/${type}/${id}/typing_indicator`,
        {
          isTyping: false,
        },
        {},
        false
      );
      postData(`/${type}/${id}/reset_typing`, {}, {}, false);
    };
  }, [channelId, dmId]);

  const location = useLocation();
  
  const { value: forwardUser } = useUserById(forwardMessage?.senderId);

  const forwardPhotoURL = getHref(forwardUser?.thumbnailURL) || getHref(forwardUser?.photoURL);
  const forwardFileURL = getHref(forwardMessage?.thumbnailURL) || getHref(forwardMessage?.fileURL);

  const [forwardImageLoaded, setForwardImageLoaded] = useState(false);
  const forwardSizes = useMemo(() => {
    return {
      height: "50px",
      width: `${Math.round(
        (50 * forwardMessage?.mediaWidth) / forwardMessage?.mediaHeight
      )}px`,
    };
  }, [forwardMessage?.mediaHeight, forwardMessage?.mediaWidth]);

  const validate = () => {
    const errors: any = {};

    const editor = editorRef?.current?.getEditor();
    const realText = editor?.getText() as string | null | undefined;

    if (realText && realText.trim().length > MESSAGE_MAX_CHARACTERS)
      errors.text = `Message is too long. Max ${MESSAGE_MAX_CHARACTERS} characters.`;

    return errors;
  };

  return (
    <Formik
      initialValues={{
        text: "",
      }}
      validate={validate}
      enableReinitialize
      onSubmit={async ({ text }, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        try {
          const editor = editorRef?.current?.getEditor();
          const realText = editor?.getText() as string | null | undefined;
          if (!forwardMessage) return;
          const messageId = uuidv4();
          await postData("/messages", {
            objectId: messageId,
            text: realText?.trim() ? text : "",
            chatId: channelId || dmId,
            workspaceId,
            chatType: channelId ? "Channel" : "Direct",
            replyId: forwardMessage?.objectId,
            replyFileType: forwardMessage?.fileType,
            replyFileName: forwardMessage?.fileName,
            replyFileURL: forwardMessage?.fileURL,
            replyFileSize: forwardMessage?.fileSize,
            replyMediaDuration: forwardMessage?.mediaDuration,
            replyMediaHeight: forwardMessage?.mediaHeight,
            replyMediaWidth: forwardMessage?.mediaWidth,
            replyText: forwardMessage?.text,
            replyThumbnailURL: forwardMessage?.thumbnailURL,
            replySenderId: forwardMessage?.senderId,
            replyCreatedAt: new Date(forwardMessage?.createdAt),
          });
          setMessageSent(true);
          const el = document.getElementById("contentMain")!;
          el.scrollTo(el.scrollHeight, 0);
          resetForm();
          setIsTyping(false);
        } catch (err: any) {
          toast.error(t("Replying to message failed."));
        }
        setSubmitting(false);
        setForwardMessage(null);
        setVisibleReply(false);
      }}
    >
      {({
        values,
        setFieldValue,
        handleSubmit,
        isSubmitting,
        errors,
      }) => (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="w-full h-full flex flex-col"
        >
          <Style css={`
            .wrapper>div:nth-child(2) {
              max-height: 200px;
              overflow-y: auto;
            }
            .ql-snow.ql-toolbar {
              border-bottom-width: 1px !important;
              border-bottom-color: rgb(107, 114, 128);
              border-top-left-radius: 4px !important;
              border-top-right-radius: 4px !important;
              border-bottom-left-radius: 0 !important;
              border-bottom-right-radius: 0 !important;
            }
          `} />
          <div className="px-3 py-1 mt-1 mb-2 th-color-for overflow-y-auto rounded-lg border border-l-4 th-border-for" style={{maxHeight: 100}}>
            <div className="flex items-center h-5 pt-1 w-auto">
              <div
                role="button"
                tabIndex={0}
                className="rounded h-5 w-5 bg-cover cursor-pointer focus:outline-none"
                style={{
                  backgroundImage: `url(${
                    forwardPhotoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                  })`,
                }}
                onClick={() =>
                  navigate(
                    `${
                      location.pathname.split("/user_profile")[0]
                    }/user_profile/${forwardUser?.objectId}`
                  )
                }
              />
              <div
                role="button"
                className="font-bold text-sm ml-2 hover:underline cursor-pointer" onClick={() =>
                  navigate(
                    `${
                      location.pathname.split("/user_profile")[0]
                    }/user_profile/${forwardUser?.objectId}`
                  )
              }>{forwardUser?.displayName}</div>
            </div>
            <div className="pt-1">
              {forwardMessage?.text && forwardMessage?.text.replace(/(<([^>]+)>)/ig, '') && <QuillReader text={forwardMessage?.text} isEdited={forwardMessage?.isEdited} />}
              {forwardMessage?.fileURL && (
                <>
                  {forwardMessage?.fileType?.includes("image/") && (
                    <>
                      <div
                        className={classNames(
                          forwardImageLoaded ? "block" : "hidden",
                          "relative my-1"
                        )}
                      >
                        <img
                          className="bg-cover rounded relative focus:outline-none cursor-pointer"
                          onLoad={() => setForwardImageLoaded(true)}
                          alt={forwardMessage?.fileName}
                          src={forwardFileURL}
                          onClick={() => window.location.assign(`${getHref(forwardMessage?.fileURL + '&d=' + forwardMessage?.fileName)}`)}
                          style={{
                            height: forwardSizes?.height,
                            width: forwardSizes?.width,
                          }}
                        />
                      </div>
                      {!forwardImageLoaded && (
                        <div
                          className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                          style={{
                            height: forwardSizes?.height,
                            width: forwardSizes?.width,
                          }}
                        />
                      )}
                    </>
                  )}

                  {forwardMessage?.fileType?.includes("video/") && (
                    <div className="max-h-sm max-w-sm relative my-1">
                      <video
                        className="max-h-sm max-w-sm"
                        controls
                        disablePictureInPicture
                        controlsList="nodownload"
                        poster={getHref(forwardMessage?.thumbnailURL)}
                      >
                        <source
                          src={getHref(forwardMessage?.fileURL)}
                          type={forwardMessage?.fileType}
                        />
                      </video>
                    </div>
                  )}

                  {forwardMessage?.fileType?.includes("audio/") && (
                    <div className="relative my-1">
                      <audio controls controlsList="nodownload">
                        <source src={forwardFileURL} type={forwardMessage?.fileType} />
                      </audio>
                    </div>
                  )}

                  {!forwardMessage?.fileType?.includes("audio/") &&
                    !forwardMessage?.fileType?.includes("video/") &&
                    !forwardMessage?.fileType?.includes("image/") && (
                      <div className="relative my-1">
                        <div className="rounded h-16 w-80 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1 overflow-hidden">
                          <DocumentTextIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <div className="text-gray-300 text-sm font-bold truncate">
                              {forwardMessage?.fileName}
                            </div>
                            <div className="text-gray-400 text-sm truncate">
                              {bytesToSize(forwardMessage?.fileSize)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
          </div>        
          <div className="w-full my-2 h-full border border-gray-500 rounded flex flex-col items-center">
            <QuillForwardEdit
              editorRef={editorRef}
              text={values.text}
              setFieldValue={setFieldValue}
              placeholder={t("Add a message, if you'd like.")}
              handleSubmit={handleSubmit}
              forceUpdate={forceUpdate}
            />
          </div>
          <ForwardFooter
            setEdit={setVisibleReply}
            editorRef={editorRef}
            isSubmitting={isSubmitting}
            errors={errors}
          />
        </form>
      )}
    </Formik>
  );
}
