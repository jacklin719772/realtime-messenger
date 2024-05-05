import QuillForwardEdit from "components/dashboard/quill/QuillForwardEdit";
import Spinner from "components/Spinner";
import { MESSAGE_MAX_CHARACTERS } from "config";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useTheme } from "contexts/ThemeContext";
import { Formik } from "formik";
import { useForceUpdate } from "lib/hooks";
import { useContext, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { postData } from "utils/api-helpers";
import QuillReader from "../quill/QuillReader";
import { DocumentTextIcon } from "@heroicons/react/outline";
import bytesToSize from "utils/bytesToSize";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { useUser } from "contexts/UserContext";
import { UsersContext } from "contexts/UsersContext";
import { useChannels } from "hooks/useChannels";
import { ReactSearchAutocomplete } from "react-search-autocomplete";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getHref } from "utils/get-file-url";
import { useUserById } from "hooks/useUsers";
import classNames from "utils/classNames";
import Style from "components/Style";
import { string } from "yup";
import { Autocomplete, Box, TextField as MuiTextField } from "@mui/material";
import TextField from "components/TextField";
import { useModal } from "contexts/ModalContext";
import hexToRgbA from "utils/hexToRgbA";
import { useTranslation } from "react-i18next";

function ForwardFooter({
  setEdit,
  isSubmitting,
  errors,
  editorRef,
  chatId,
}: {
  setEdit: any;
  isSubmitting: any;
  errors: any;
  dirty: any;
  editorRef: any;
  text: string;
  chatId: string | null;
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
        className="border-2 th-color-cyan font-medium flex justify-center items-center text-sm th-color-brwhite h-10 w-20 rounded disabled:opacity-50"
        disabled={isSubmitting || !forwardMessage || (!chatId || chatId === "")}
        style={{
          borderColor:
            errors.text && isText ? themeColors?.brightRed : themeColors?.cyan,
        }}
      >
        {isSubmitting && <Spinner className="th-color-brwhite mr-2 h-3 w-3" />}
        {!isSubmitting && (
          <>
            {errors.text && isText ? (
              <span className="th-color-brred">
                {MESSAGE_MAX_CHARACTERS - isText.length}
              </span>
            ) : (
              t("Forward")
            )}
          </>
        )}
      </button>
    </div>
  );
}

export default function Forward() {
  const { t } = useTranslation();
  const forceUpdate = useForceUpdate();
  const {workspaceId} = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const {setVisibleForward, forwardMessage} = useContext(ReactionsContext);
  const { value: channels } = useChannels();
  const { value: dms } = useContext(DirectMessagesContext);
  const { value: members } = useContext(UsersContext);
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [chatType, setChatType] = useState("Channel");
  const { setMessageSent } = useModal();
  const { themeColors } = useTheme();

  const location = useLocation();
  
  const { value: forwardUser } = useUserById(forwardMessage?.senderId);

  const forwardPhotoURL = getHref(forwardUser?.thumbnailURL) || getHref(forwardUser?.photoURL);
  const forwardFileURL = getHref(forwardMessage?.thumbnailURL) || getHref(forwardMessage?.fileURL);

  const [forwardImageLoaded, setForwardImageLoaded] = useState(false);
  const forwardSizes = useMemo(() => {
    const ratio = forwardMessage?.mediaWidth / forwardMessage?.mediaHeight;
    return {
      height: "50px",
      width: `${Math.round(
        (50 * forwardMessage?.mediaWidth) / forwardMessage?.mediaHeight
      )}px`,
    };
  }, [forwardMessage?.mediaHeight, forwardMessage?.mediaWidth]);
  
  const channelList = channels.map((channel: any) => ({
    name: channel.name,
    photoURL: "",
    thumbnailURL: "",
    userId: "",
    description: channel.objectId,
    chatType: "Channel"
  }))
  const dmList = dms.map((dm: any) => ({
    name: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].displayName,
    photoURL: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].photoURL,
    thumbnailURL: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].thumbnailURL,
    userId: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].objectId,
    description: dm.objectId,
    chatType: "Direct"
  }));
  const autofillList = channelList.concat(dmList).map((item: any, index: number) => ({
    ...item,
    id: index
  }))

  const validate = () => {
    const errors: any = {};

    const editor = editorRef?.current?.getEditor();
    const realText = editor?.getText() as string | null | undefined;

    if (realText && realText.trim().length > MESSAGE_MAX_CHARACTERS)
      errors.text = `Message is too long. Max ${MESSAGE_MAX_CHARACTERS} characters.`;

    return errors;
  };

  const handleOnSelect = (item: any) => {
    if (!item) {
      setChatId(null);
      setChatType("Channel");
    } else {
      setChatId(item.description);
      setChatType(item.chatType);
    }
  }

  return (
    <Formik
      initialValues={{
        text: "",
      }}
      validate={validate}
      enableReinitialize
      onSubmit={async ({ text }, { setSubmitting }) => {
        setSubmitting(true);
        try {
          const editor = editorRef?.current?.getEditor();
          const realText = editor?.getText() as string | null | undefined;
          if (!forwardMessage) return;
          if (!chatId || chatId === "") return;
          const messageId = uuidv4();
          const messageId2 = uuidv4();
          if (realText?.trim()) {
            await postData("/messages", {
              objectId: messageId,
              text,
              chatId,
              workspaceId,
              chatType,
            });
          }
          await postData("/messages", {
            objectId: messageId2,
            text: forwardMessage?.text,
            chatId,
            workspaceId,
            fileName: forwardMessage?.fileName,
            filePath: forwardMessage?.fileURL,
            chatType,
            forwardId: forwardMessage?.objectId,
            forwardChatId: forwardMessage?.chatId,
            forwardChatType: forwardMessage?.chatType,
            forwardSenderId: forwardMessage?.senderId,
            forwardCreatedAt: new Date(forwardMessage?.createdAt),
          });
          setMessageSent(true);
          if (chatType === "Channel") {
            navigate(`/dashboard/workspaces/${workspaceId}/channels/${chatId}#${messageId}`);
          } else {
            navigate(`/dashboard/workspaces/${workspaceId}/dm/${chatId}#${messageId}`);
          }
        } catch (err: any) {
          toast.error(t("Forward message failed."));
        }
        setSubmitting(false);
        setVisibleForward(false);
      }}
    >
      {({
        values,
        setFieldValue,
        handleSubmit,
        isSubmitting,
        dirty,
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
            fieldset.MuiOutlinedInput-notchedOutline {
              border-color: ${hexToRgbA(themeColors?.foreground, "0.5")} !important;
            }
            .MuiIconButton-root.MuiIconButton-sizeMedium {
              color: ${themeColors?.foreground} !important;
            }
            .MuiInputLabel-formControl {
              color: ${themeColors?.foreground} !important;
            }
            .MuiInputBase-input {
              color: ${themeColors?.foreground} !important;
            }
            .MuiAutocomplete-popper * {
              background-color: ${themeColors?.background} !important;
              border-color: ${themeColors?.foreground} !important;
              color: ${themeColors?.foreground} !important;
            }
          `} />
          <div className="pt-2 pb-2">
            <Autocomplete 
              className="th-border-for th-color-for"    
              options={autofillList}
              autoHighlight
              size="small"
              getOptionLabel={(option: any) => option.name}
              onChange={(event, option) => handleOnSelect(option)}
              sx={{ backgroundColor: themeColors?.background }}
              renderOption={(props, option) => (
                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 }, backgroundColor: themeColors?.background }} {...props}>
                  {option.chatType === "Channel" ?
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 th-color-for mr-4" fill="currentColor" height="384pt" viewBox="0 0 384 384" width="384pt">
                    <path d="m192 0c-105.863281 0-192 86.128906-192 192 0 105.863281 86.136719 192 192 192s192-86.136719 192-192c0-105.871094-86.136719-192-192-192zm0 352c-88.222656 0-160-71.777344-160-160s71.777344-160 160-160 160 71.777344 160 160-71.777344 160-160 160zm0 0"/><path d="m276.847656 141.089844-28.28125 28.285156-33.941406-33.941406 28.277344-28.28125-22.621094-22.632813-28.28125 28.28125-28.28125-28.28125-22.621094 22.632813 28.277344 28.28125-33.941406 33.941406-28.28125-28.285156-22.625 22.628906 28.28125 28.28125-28.28125 28.28125 22.625 22.621094 28.28125-28.277344 33.941406 33.941406-28.277344 28.28125 22.621094 22.625 28.28125-28.28125 28.28125 28.28125 22.621094-22.625-28.277344-28.28125 33.941406-33.941406 28.28125 28.277344 22.625-22.621094-28.28125-28.28125 28.28125-28.28125zm-84.847656 84.855468-33.945312-33.945312 33.945312-33.945312 33.945312 33.945312zm0 0"/>
                  </svg> :
                  <img
                    loading="lazy"
                    width={20}
                    src={(getHref(option?.thumbnailURL) || getHref(option?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`)}
                    alt=""
                  />}
                  <span className="text-sm">{option.name} {option.userId === user?.uid && "(me)"}</span>
                </Box>
              )}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  autoFocus
                  label="Select for channel or person"
                  className="th-color-for"
                />
              )}
            />
          </div>
          <div className="w-full h-full border th-border-for rounded flex flex-col items-center">
            <QuillForwardEdit
              editorRef={editorRef}
              text={values.text}
              setFieldValue={setFieldValue}
              placeholder="Add a message, if you'd like."
              handleSubmit={handleSubmit}
              forceUpdate={forceUpdate}
            />
          </div>
          <div className="px-3 py-1 mt-2 mb-2 th-bg-bg overflow-y-auto border border-l-4 th-border-for rounded-lg" style={{maxHeight: 100}}>
            <div className="flex items-center h-5 pt-1 w-auto th-color-for">
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
                          style={{
                            height: forwardSizes?.height,
                            width: forwardSizes?.width,
                          }}
                          onLoad={() => setForwardImageLoaded(true)}
                          alt={forwardMessage?.fileName}
                          src={forwardFileURL}
                          onClick={() => window.location.assign(`${getHref(forwardMessage?.fileURL + '&d=' + forwardMessage?.fileName)}`)}
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
          <ForwardFooter
            setEdit={setVisibleForward}
            editorRef={editorRef}
            isSubmitting={isSubmitting}
            dirty={dirty}
            errors={errors}
            text={values.text}
            chatId={chatId}
          />
        </form>
      )}
    </Formik>
  );
}
