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
    <div className="flex justify-end items-center space-x-2 mt-2">
      <button
        type="button"
        className="border-2 th-border-for th-color-for font-medium text-sm h-10 w-20 rounded"
        onClick={() => setEdit(false)}
      >
        Cancel
      </button>
      <button
        className="border-2 th-color-cyan font-medium flex justify-center items-center text-sm h-10 w-20 rounded disabled:opacity-50"
        disabled={isSubmitting || checkedMessages.length === 0 || (!chatId || chatId === "")}
        style={{
          borderColor:
            errors.text && isText ? themeColors?.brightRed : themeColors?.cyan,
        }}
      >
        {isSubmitting && <Spinner className="th-color-cyan mr-2 h-3 w-3" />}
        {!isSubmitting && (
          <>
            {errors.text && isText ? (
              <span className="th-color-brred">
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
  const { themeColors } = useTheme();
  
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
            .editor .ql-editor {
              color: ${themeColors?.foreground};
              background-color: ${themeColors?.background};
              font-weight: ${themeColors?.messageFontWeight === "light"
                ? "300"
                : "400"};
            }
            .editor .ql-editor {
              border-top-left-radius: 12px;
              border-top-right-radius: 12px;
            }
            .quill > .ql-container > .ql-editor.ql-blank::before {
              color: ${themeColors?.foreground};
              font-style: normal;
              opacity: 0.7;
            }
            .ql-snow.ql-toolbar {
              background-color: ${themeColors?.background};
              border-color: ${hexToRgbA(themeColors?.foreground, "0.5")};
              border-bottom-left-radius: 12px;
              border-bottom-right-radius: 12px;
            }

            /* Code editor */
            .ql-snow .ql-editor pre.ql-syntax {
              background-color: ${themeColors?.brightBlack};
              color: ${themeColors?.brightWhite};
              border-color: ${hexToRgbA(themeColors?.background!, "0.2")};
              border-width: 1px;
            }
            .ql-snow .ql-editor code,
            .ql-snow .ql-editor pre {
              background-color: ${themeColors?.brightBlack};
              color: ${themeColors?.brightWhite};
              border-color: ${hexToRgbA(themeColors?.background!, "0.2")};
              border-width: 1px;
            }

            /* Toolbar icons */
            .ql-snow .ql-stroke {
              stroke: ${themeColors?.foreground};
            }
            .ql-snow .ql-fill,
            .ql-snow .ql-stroke.ql-fill {
              fill: ${themeColors?.foreground};
            }

            /* Link */
            .ql-snow .ql-editor a {
              color: ${themeColors?.cyan};
              text-decoration: none;
            }
            .ql-snow .ql-editor a:hover {
              text-decoration: underline;
            }
            .ql-snow .ql-tooltip.ql-editing {
              left: 0 !important;
            }
            .ql-editor.ql-blank::before {
              color: ${themeColors?.foreground} !important;
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
              options={autofillList}
              autoHighlight
              size="small"
              getOptionLabel={(option: any) => option.name}
              onChange={(event, option) => handleOnSelect(option)}
              renderOption={(props, option) => (
                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
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
                />
              )}
            />
          </div>
          <div className="w-full h-full border th-border-for rounded flex flex-col items-center th-color-for">
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
