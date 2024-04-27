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
  const {checkedMessages} = useContext(ReactionsContext);

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
        disabled={isSubmitting || checkedMessages.length === 0 || (!chatId || chatId === "")}
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

export default function MultipleForward() {
  const forceUpdate = useForceUpdate();
  const {workspaceId} = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const {setVisibleForwardMultiple, checkedMessages} = useContext(ReactionsContext);
  const { value: channels } = useChannels();
  const { value: dms } = useContext(DirectMessagesContext);
  const { value: members } = useContext(UsersContext);
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [chatType, setChatType] = useState("Channel");
  const { setMessageSent } = useModal();
  
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
          if (checkedMessages.length === 0) return;
          if (!chatId || chatId === "") return;
          for (const m of checkedMessages) {
            if (realText?.trim()) {
              await postData("/messages", {
                objectId: uuidv4(),
                text,
                chatId,
                workspaceId,
                chatType,
              });
            }
            await postData("/messages", {
              objectId: uuidv4(),
              text: m?.text,
              chatId,
              workspaceId,
              fileName: m?.fileName,
              filePath: m?.fileURL,
              chatType,
              forwardId: m?.objectId,
              forwardChatId: m?.chatId,
              forwardChatType: m?.chatType,
              forwardSenderId: m?.senderId,
              forwardCreatedAt: new Date(m?.createdAt),
            });
          }
          setMessageSent(true);
          if (chatType === "Channel") {
            navigate(`/dashboard/workspaces/${workspaceId}/channels/${chatId}`);
          } else {
            navigate(`/dashboard/workspaces/${workspaceId}/dm/${chatId}`);
          }
        } catch (err: any) {
          toast.error(err.message);
        }
        setSubmitting(false);
        setVisibleForwardMultiple(false);
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
          <div className="w-full h-full mb-2 border border-gray-500 rounded flex flex-col items-center bg-white">
            <QuillForwardEdit
              editorRef={editorRef}
              text={values.text}
              setFieldValue={setFieldValue}
              placeholder="Add a message, if you'd like."
              handleSubmit={handleSubmit}
              forceUpdate={forceUpdate}
            />
          </div>
          <ForwardFooter
            setEdit={setVisibleForwardMultiple}
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
