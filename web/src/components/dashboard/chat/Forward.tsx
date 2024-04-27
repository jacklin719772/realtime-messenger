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
  const { themeColors } = useTheme();
  const editor = editorRef?.current?.getEditor();
  const realText = editor?.getText() as string | null | undefined;
  const isText = realText?.trim();
  const {forwardMessage} = useContext(ReactionsContext);

  return (
    <div className="flex justify-end items-center space-x-2 mt-1">
      <button
        type="button"
        className="border border-gray-500 font-medium text-sm h-10 w-20 rounded"
        onClick={() => setEdit(false)}
      >
        Cancel
      </button>
      <button
        className="border border-gray-500 font-medium flex justify-center items-center text-sm th-color-brwhite h-10 w-20 rounded disabled:opacity-50"
        disabled={isSubmitting || !forwardMessage || (!chatId || chatId === "")}
        style={{
          backgroundColor:
            errors.text && isText ? themeColors?.red : themeColors?.blue,
        }}
      >
        {isSubmitting && <Spinner className="th-color-brwhite mr-2 h-3 w-3" />}
        {!isSubmitting && (
          <>
            {errors.text && isText ? (
              <span className="th-color-brwhite">
                {MESSAGE_MAX_CHARACTERS - isText.length}
              </span>
            ) : (
              "Forward"
            )}
          </>
        )}
      </button>
    </div>
  );
}

export default function Forward() {
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
          toast.error(err.message);
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
          `} />
          <div className="pt-2 pb-2">
            <Autocomplete     
              options={autofillList}
              autoHighlight
              size="small"
              getOptionLabel={(option: any) => option.name}
              onChange={(event, option) => handleOnSelect(option)}
              renderOption={(props, option) => (
                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                  <img
                    loading="lazy"
                    width={20}
                    src={option.chatType === "Channel" ? `${process.env.PUBLIC_URL}/channel.png` : (getHref(option?.thumbnailURL) || getHref(option?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`)}
                    alt=""
                  />
                  <span className="text-sm">{option.name} {option.userId === user?.uid && "(me)"}</span>
                </Box>
              )}
              renderInput={(params) => (
                <MuiTextField
                  {...params}
                  autoFocus
                  label="Select for channel or person"
                />
              )}
            />
          </div>
          <div className="w-full h-full border border-gray-500 rounded flex flex-col items-center bg-white">
            <QuillForwardEdit
              editorRef={editorRef}
              text={values.text}
              setFieldValue={setFieldValue}
              placeholder="Add a message, if you'd like."
              handleSubmit={handleSubmit}
              forceUpdate={forceUpdate}
            />
          </div>
          <div className="px-3 py-1 mt-2 mb-2 th-bg-selbg overflow-y-auto" style={{borderLeft: '3px solid grey', maxHeight: 100}}>
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
