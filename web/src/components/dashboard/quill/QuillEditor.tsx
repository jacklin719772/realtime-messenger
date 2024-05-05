import { Popover } from "@headlessui/react";
import {
  DocumentTextIcon,
  EmojiHappyIcon,
  MicrophoneIcon,
  PhotographIcon,
  PlayIcon,
  XIcon,
} from "@heroicons/react/outline";
import { PaperAirplaneIcon } from "@heroicons/react/solid";
import Spinner from "components/Spinner";
import Style from "components/Style";
import { MESSAGE_MAX_CHARACTERS, STICKERS_COUNT } from "config";
import { useTheme } from "contexts/ThemeContext";
import data from "@emoji-mart/data/sets/14/apple.json";
import Picker from "@emoji-mart/react";
import { ReactComponent as AttachFileIcon } from "icons/attach_file.svg";
import debounce from "lodash/debounce";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DropzoneState } from "react-dropzone";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { getGQLServerUrl } from "config";
import { useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import classNames from "utils/classNames";
import hexToRgbA from "utils/hexToRgbA";
// import { uploadFile } from "gqlite-lib/dist/client/storage";
// #1 import quill-image-uploader
// import ImageUploader from "quill-image-uploader";
// import ImageResize from 'quill-image-resize-module-react';
import "quill-mention";
import 'quill-mention/dist/quill.mention.min.css';
import VoiceMessage from "../chat/VoiceMessage";
import { ReactionsContext } from "contexts/ReactionsContext";
import VideoMessage from "../chat/VideoMessage";
import { getIdToken } from "gqlite-lib/dist/client/auth";
import { UsersContext } from "contexts/UsersContext";
import { useUser } from "contexts/UserContext";
import { getHref } from "utils/get-file-url";
import { useModal } from "contexts/ModalContext";
import { useTranslation } from "react-i18next";

// #2 register module
// Quill.register("modules/imageUploader", ImageUploader);
// Quill.register('modules/imageResize', ImageResize);
// Quill.register("modules/mention", Mention);

const getChat = async (workspaceId: string, chatType: string) => {
  const headers: any = {
    "Content-Type": "application/json",
  };
  const idToken = await getIdToken();
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }
  if (chatType === "channels") {
    const data = {
      operationName: "ListChannels",
      variables: {
         workspaceId
      },
      query: "query ListChannels($updatedAt: Date, $userId: String, $workspaceId: String, $name: String) {\n  listChannels(\n    updatedAt: $updatedAt\n    userId: $userId\n    workspaceId: $workspaceId\n    name: $name\n  ) {\n    objectId\n    createdBy\n    details\n    isArchived\n    isDeleted\n    lastMessageCounter\n    lastMessageText\n    members\n    name\n    topic\n    typing\n    workspaceId\n    createdAt\n    updatedAt\n  }\n}"
    }
  
    const res = await fetch(`${getGQLServerUrl()}/graphql`, {
      method: "post",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e: any = await res.json();
      const error = new Error(e.error.message);
      throw error;
    } else {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1)
        return await res.json();
    }
  } else {
    const data = {
      operationName: "ListDirects",
      variables: {
         workspaceId
      },
      query: "query ListDirects($updatedAt: Date, $workspaceId: String, $userId: String) {\n  listDirects(updatedAt: $updatedAt, workspaceId: $workspaceId, userId: $userId) {\n    objectId\n    active\n    lastMessageCounter\n    lastMessageText\n    lastTypingReset\n    members\n    typing\n    workspaceId\n    createdAt\n    updatedAt\n  }\n}"
    }
  
    const res = await fetch(`${getGQLServerUrl()}/graphql`, {
      method: "post",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e: any = await res.json();
      const error = new Error(e.error.message);
      throw error;
    } else {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1)
        return await res.json();
    }
  }
  return;
}

function EmojiDropdown({
  onEmojiClick,
  editor,
}: {
  onEmojiClick: any;
  editor: any;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  return (
    <>
      <Style
        css={`
          .emoji-mart {
            background-color: ${themeColors?.background};
            border-color: ${themeColors?.selectionBackground};
          }
          .emoji-mart-bar {
            border-color: ${themeColors?.selectionBackground};
          }
          .emoji-mart-category-label span {
            background-color: ${themeColors?.background};
            color: ${themeColors?.foreground};
          }
          .emoji-mart-search input {
            background-color: ${themeColors?.background};
            border-color: ${themeColors?.selectionBackground};
          }
          .emoji-mart-search-icon svg {
            fill: ${themeColors?.foreground};
          }
          .emoji-mart-skin-swatches {
            background-color: ${themeColors?.background};
            border-color: ${themeColors?.selectionBackground};
          }
          em-emoji-picker {
            height: 350px !important;
            --background-color: ${themeColors?.background} !important;
          }
        `}
      />
      <Popover as="div" className="z-10 relative">
        {({ open }) => (
          <>
            <Popover.Button
              as="button"
              title={t("Emoticon")}
              className="flex items-center focus:outline-none"
              onClick={() => editor?.blur()}
            >
              <EmojiHappyIcon
                style={{ color: themeColors?.foreground }}
                className="h-5 w-5"
              />
            </Popover.Button>

            {open && (
              <div>
                <Popover.Panel
                  static
                  className="origin-top-left absolute bottom-0 right-0"
                >
                  <Picker
                    data={data}
                    onEmojiSelect={onEmojiClick}
                    locale="zh"
                    title="Emojis"
                    showPreview={false}
                    native
                    set="apple"
                    previewPosition="none"
                    style={{ height: 335 }}
                  />
                </Popover.Panel>
              </div>
            )}
          </>
        )}
      </Popover>
    </>
  );
}

function StickersDropdown() {
  const { t } = useTranslation();
  const stickers = useMemo(() => {
    return Array.from(
      Array(STICKERS_COUNT),
      (_, index) => `sticker${index + 1 < 10 ? `0${index + 1}` : index + 1}.png`
    );
  }, []);

  const { workspaceId, channelId, dmId } = useParams();
  const { setMessageSent } = useModal();

  const [loading, setLoading] = useState("");

  const sendSticker = async (sticker: string) => {
    setLoading(sticker);
    try {
      await postData("/messages", {
        chatId: channelId || dmId,
        workspaceId,
        chatType: channelId ? "Channel" : "Direct",
        sticker,
      });
      setMessageSent(true);
    } catch (err: any) {
      toast.error(t("Sending sticker failed."));
    }
    setLoading("");
  };

  return (
    <Popover as="div" className="z-10 relative">
      {({ open }) => (
        <>
          <Popover.Button
            as="button"
            title={t("Sticker")}
            className="flex items-center focus:outline-none"
          >
            <PhotographIcon className="h-5 w-5 th-color-for" />
          </Popover.Button>

          {open && (
            <div>
              <Popover.Panel
                static
                className="th-bg-bg th-border-for origin-top-left max-h-96 overflow-y-scroll w-72 absolute bottom-0 right-0 shadow border rounded py-2 px-2 grid grid-cols-3 gap-1"
              >
                {stickers.map((sticker) => (
                  <div
                    role="button"
                    tabIndex={0}
                    key={sticker}
                    className="flex items-center justify-center focus:outline-none relative"
                    onClick={() => sendSticker(sticker)}
                  >
                    <img
                      alt={sticker}
                      className={classNames(
                        "h-full w-full rounded-sm cursor-pointer"
                      )}
                      src={`${process.env.PUBLIC_URL}/stickers/${sticker}`}
                    />
                    {loading === sticker && (
                      <div className="w-full h-full z-20 opacity-50 bg-white absolute inset-0 flex items-center justify-center">
                        <Spinner className="text-gray-700" />
                      </div>
                    )}
                  </div>
                ))}
              </Popover.Panel>
            </div>
          )}
        </>
      )}
    </Popover>
  );
}

function CustomToolbar({
  isSubmitting,
  errors,
  isFiles,
  editor,
  setHasText,
  openDropzone,
  text,
}: {
  isSubmitting: boolean;
  errors: any;
  isFiles: boolean;
  editor: any;
  setHasText: any;
  openDropzone: any;
  text: string;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const realText = editor?.getText() as string | null | undefined;
  const isText = realText?.trim();
  const {setVisibleAudioRecorder, setVisibleVideoRecorder, setVoiceBlob, setVideoBlob} = useContext(ReactionsContext);

  useEffect(() => {
    if (isText) {
      setHasText(true);
    } else {
      setHasText(false);
    }
  }, [isText]);

  const sendDisabled = isSubmitting || (!isFiles && !isText && !text.includes("src=\"http"));

  const onEmojiClick = (emojiObject: any) => {
    const range = editor?.getLength() - 1;
    editor?.insertText(range, emojiObject.native);
  };

  const handleOnVoiceClick = () => {
    setVoiceBlob(null);
    setVisibleAudioRecorder(true);
  }

  const handleOnVideoClick = () => {
    setVideoBlob(null);
    setVisibleVideoRecorder(true);
  }

  return (
    <div id="toolbar" className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-strike" />
        <button className="ql-blockquote" />
        <button className="ql-code" />
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-code-block" />
        <button className="ql-link" />
        {/* <button className="ql-image" /> */}
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <button
          className="mx-1 h-5 w-5 th-color-for p-0"
          title={t("Video_message")}
          onClick={handleOnVideoClick}
        >
          <svg className="h-auto w-full th-color-for" xmlns="http://www.w3.org/2000/svg" version="1.0" width="512" height="452" strokeWidth="50" viewBox="0 0 512.000000 452.000000" preserveAspectRatio="xMidYMid meet">
            <g transform="translate(0.000000,452.000000) scale(0.100000,-0.100000)" fill="currentColor" stroke="currentColor">
              <path d="M880 4505 c-84 -19 -229 -91 -305 -152 -128 -104 -237 -295 -264 -464 -15 -88 -15 -1259 -1 -1259 6 0 34 18 63 39 57 43 216 141 228 141 4 0 9 231 11 513 3 501 4 513 26 572 36 95 84 159 164 215 138 97 41 91 1328 88 l1125 -3 55 -22 c85 -35 189 -119 228 -183 71 -119 67 -41 67 -1280 0 -1025 -1 -1119 -17 -1170 -29 -93 -76 -160 -153 -218 -104 -78 -155 -94 -310 -101 l-129 -6 -12 -85 c-6 -47 -19 -116 -28 -153 -9 -38 -16 -71 -16 -74 0 -3 87 -3 193 -1 210 6 245 12 372 74 39 19 96 55 128 80 66 51 163 177 212 274 61 121 67 155 72 388 3 117 8 212 12 210 22 -9 193 -135 508 -374 266 -201 284 -210 406 -202 89 6 162 41 213 103 69 84 64 -5 64 1257 0 1090 -1 1145 -19 1184 -47 103 -139 164 -258 172 -121 8 -141 -2 -403 -198 -129 -97 -248 -189 -265 -204 -16 -15 -43 -35 -60 -44 -16 -8 -65 -41 -107 -74 -42 -32 -79 -58 -81 -58 -3 0 -7 96 -10 213 -5 236 -11 268 -78 397 -84 161 -195 276 -333 343 -160 78 -41 72 -1371 74 -989 1 -1201 -1 -1255 -12z m3928 -2308 l-3 -514 -305 229 c-367 275 -440 330 -519 386 l-61 44 0 369 0 369 61 43 c73 51 125 89 519 385 l305 229 3 -514 c1 -282 1 -744 0 -1026z"/>
              <path d="M1175 2711 c-200 -24 -443 -121 -616 -247 -97 -71 -274 -255 -336 -350 -156 -240 -223 -466 -223 -753 0 -244 36 -404 137 -605 70 -139 129 -222 238 -335 127 -132 229 -208 380 -281 223 -109 358 -140 606 -140 230 0 377 31 566 120 156 74 337 200 392 274 8 10 37 42 65 70 100 100 213 298 274 481 50 148 65 271 59 463 -6 197 -25 290 -90 449 -82 199 -156 310 -310 465 -189 192 -422 319 -682 373 -92 19 -354 28 -460 16z m-323 -499 c37 -35 42 -45 46 -95 2 -32 8 -57 12 -57 4 0 42 16 84 36 247 114 531 106 776 -22 87 -45 228 -166 247 -212 35 -83 -34 -182 -127 -182 -39 0 -62 12 -125 66 -60 51 -190 110 -288 131 -118 25 -244 11 -375 -42 -60 -24 -38 -35 71 -35 l88 0 41 -38 c35 -33 41 -45 45 -88 5 -58 -18 -103 -69 -134 -31 -19 -51 -20 -291 -20 -271 0 -279 1 -329 48 -42 39 -50 102 -46 355 3 206 5 225 24 255 31 49 71 72 127 72 42 0 53 -5 89 -38z m1164 -1028 c19 -9 44 -31 57 -48 21 -30 22 -40 25 -294 3 -256 2 -264 -19 -302 -22 -39 -84 -80 -121 -80 -67 0 -125 64 -135 151 -3 27 -9 49 -13 49 -5 0 -35 -13 -68 -30 -33 -16 -100 -42 -148 -56 -77 -24 -107 -28 -224 -28 -150 -1 -226 13 -348 63 -121 50 -299 187 -323 248 -31 83 39 183 129 183 43 0 65 -12 128 -70 56 -50 187 -111 284 -131 114 -24 298 2 396 55 28 15 26 15 -59 16 -132 0 -184 33 -202 126 -8 47 24 118 67 144 31 19 50 20 286 20 214 0 259 -3 288 -16z"/>
            </g>
          </svg>
        </button>
        <button
          className="h-5 w-5 th-color-for p-0"
          title={t("Voice_message")}
          onClick={handleOnVoiceClick}
        >
          <MicrophoneIcon className="h-full w-full th-color-for" />
        </button>
        <StickersDropdown />
        <EmojiDropdown onEmojiClick={onEmojiClick} editor={editor} />
        <button
          className="h-5 w-5 th-color-for p-0"
          title={t("Attach_file")}
          onClick={() => {
            openDropzone();
          }}
        >
          <AttachFileIcon
            className="w-full h-full th-color-for"
          />
        </button>
        <button
          id="sendButton"
          title={t("Send")}
          type="submit"
          disabled={sendDisabled}
          className={classNames(isSubmitting ? "opacity-50" : "")}
          style={{
            backgroundColor:
              // eslint-disable-next-line
              errors.text && isText
                ? themeColors?.brightRed
                : isText || isFiles
                ? themeColors?.green
                : "transparent",
          }}
        >
          {!isSubmitting && (
            <>
              {errors.text && isText ? (
                <span className="th-color-brwhite">
                  {MESSAGE_MAX_CHARACTERS - isText.length}
                </span>
              ) : (
                <PaperAirplaneIcon
                  className={classNames(
                    isText ? "th-color-brwhite" : "th-color-for",
                    "transform rotate-90 h-5 w-5"
                  )}
                />
              )}
            </>
          )}
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 th-color-for"
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
            </svg>
          )}
        </button>
      </div>
    </div>
  );
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
        className="bg-cover rounded h-20 w-20 relative group"
        style={{ backgroundImage: `url(${URL.createObjectURL(file)})` }}
      >
        {children}
      </div>
    );
  if (file?.type?.includes("video/") || file?.type?.includes("audio/"))
    return (
      <div
        key={file.lastModified}
        className="rounded h-20 w-44 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1"
      >
        <PlayIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
        <div className="text-gray-300 font-bold text-sm truncate">
          {file.name}
        </div>
        {children}
      </div>
    );
  return (
    <div
      key={file.lastModified}
      className="rounded h-20 w-44 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1"
    >
      <DocumentTextIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
      <div className="text-gray-300 text-sm font-bold truncate">
        {file.name}
      </div>
      {children}
    </div>
  );
}

function FileViewer({
  setFiles,
  files,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const filesViewer = useMemo(
    () => (
      <div
        className={classNames(
          files?.length ? "" : "hidden",
          "w-full h-24 px-3 flex py-2"
        )}
      >
        {files?.length &&
          Array.from(files).map((file) => (
            <FileThumbnail file={file} key={file.lastModified}>
              <div className="absolute top-0 right-0 bg-gray-700 p-1 rounded-full transform translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100">
                <XIcon
                  className="text-white h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setFiles([]);
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

const handleTyping = debounce((setIsTyping) => {
  setIsTyping(false);
}, 3000);

interface EditorProps {
  placeholder: string;
  setFieldValue: any;
  text: string;
  handleSubmit: any;
  isSubmitting: boolean;
  errors: any;
  editorRef: any;
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  editor: any;
  setHasText: React.Dispatch<React.SetStateAction<boolean>>;
  dropzone: DropzoneState;
  isTyping: any;
  setIsTyping: any;
  mentionMembers: any[];
}

function Editor({
  placeholder,
  setFieldValue,
  text,
  handleSubmit,
  isSubmitting,
  errors,
  editorRef,
  files,
  setFiles,
  editor,
  setHasText,
  dropzone,
  isTyping,
  setIsTyping,
  mentionMembers,
}: EditorProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openDropzone,
  } = dropzone;
  const { t } = useTranslation();
  const { themeColors } = useTheme();

  const { channelId, dmId } = useParams();
  const [refresh, setRefresh] = useState(false);
  // const [modules, setModules] = useState(null);
  const { user } = useUser();
  const { value: members } = useContext(UsersContext);
  // const { value: channel } = useChannelById(channelId);
  // const { value: direct } = useDirectMessageById(dmId);

  // const chat = channel || direct;

  const modules = useMemo(
    () => ({
      toolbar: {
        container: "#toolbar",
      },
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {
          tab: false,
          custom: {
            key: 13,
            shiftKey: true,
            handler: () => {
              handleSubmit();
            },
          },
        },
      },
      mention: {
        allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
        defaultMenuOrientation: 'top',
        source: async function(searchTerm: string, renderList: any) {
          console.log('mentionMembers in Module: ', mentionMembers);
          const location = window.location.href;
          const workspaceId = location.split("/dashboard/workspaces/")[1]?.split("/")[0];
          const chatType = location.split("/dashboard/workspaces/")[1]?.split("/")[1];
          const chatId = location.split("/dashboard/workspaces/")[1]?.split("/")[2];

          const chats = await getChat(workspaceId, chatType);
          const chatMembers = chatType === "channels" ? chats.data.listChannels.filter((c: any) => c.objectId === chatId)[0].members : chats.data.listDirects.filter((c: any) => c.objectId === chatId)[0].members;
          console.log(chatMembers);
          const mentions = mentionMembers.filter((m: any) => chatMembers.includes(m.objectId));
          console.log(mentionMembers);
          console.log(mentions);

          const filteredMembers = mentions.map((item: any, index: number) => ({
            id: index + 1,
            value: item.objectId === user?.uid ? `${item.displayName} (you)` : item.displayName,
            fullName: item.fullName,
            photoURL: getHref(item.photoURL) || getHref(item.thumbnailURL) || `${process.env.PUBLIC_URL}/blank_user.png`,
          }));
          filteredMembers.unshift({
            id: 0,
            value: t("All"),
            fullName: t("All"),
            photoURL: `${process.env.PUBLIC_URL}/blank_user.png`,
          });

          let values: any[] = [];
          if (mentionMembers.length > 0) {
            values = filteredMembers
          }
          // let values: any[] = [];
  
          if (searchTerm.length === 0) {
            renderList(values, searchTerm);
          } else {
            const matches = [];
            for (let i = 0; i < values.length; i++)
              if (
                ~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())
              )
                matches.push(values[i]);
            renderList(matches, searchTerm);
          }
        },
        renderLoading: () => {
          const htmlObj = document.createElement('div');
          htmlObj.style.display = 'flex';
          htmlObj.style.justifyContent = 'center';
          htmlObj.style.alignItems = 'center';
          htmlObj.style.height = '44px';
          htmlObj.innerHTML = `<svg
              class="animate-spin h-4 w-4 th-color-for"
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
            </svg>
          `;
          return htmlObj;
        },
        renderItem: (item: any) => {
          const htmlObj = document.createElement('div');
          htmlObj.style.display = 'flex';
          htmlObj.style.justifyContent = 'flex-start';
          htmlObj.style.alignItems = 'center';
          htmlObj.style.height = '40px';
          htmlObj.innerHTML = `<div class="w-8 h-8 pr-2 py-1">
            <img src="${item.photoURL}" alt="${item.value}" class="w-full h-full" />
          </div>
          <div class="font-bold text-sm pr-2">${item.value}</div>
          <div class="text-sm truncate">${item.fullName}</div>
          `;
          return htmlObj;
        }
      },
    }),
    []
  );

  // useEffect(() => {
  //   setModules({
  //     toolbar: {
  //       container: "#toolbar",
  //     },
  //     clipboard: {
  //       matchVisual: false,
  //     },
  //     keyboard: {
  //       bindings: {
  //         tab: false,
  //         custom: {
  //           key: 13,
  //           shiftKey: true,
  //           handler: () => {
  //             handleSubmit();
  //           },
  //         },
  //       },
  //     },
  //     // # 4 Add module and upload function
  //     imageUploader: {
  //       upload: (file: File) => {
  //         return new Promise(async (resolve, reject) => {
  //           const messageId = uuidv4();
  //           // const formData = new FormData();
  //           // formData.append("image", file);
  //           try {
  //             const filePath = await uploadFile(
  //               "messenger",
  //               `Message/${messageId}/${Date.now()}.${file.name.split(".").pop()}`,
  //               file
  //             );
  //             console.log(filePath);
  //             resolve(`${getGQLServerUrl()}${filePath}`);
  //           } catch (error) {
  //             reject("Upload failed");
  //             console.error("Error:", error);
  //           }
  //         });
  //       }
  //     },
  //     imageResize: {
  //       parchment: Quill.import('parchment'),
  //       modules: ['Resize', 'DisplaySize', 'Toolbar']
  //     },
  //     mention: {
  //       allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
  //       defaultMenuOrientation: 'top',
  //       source: function(searchTerm: string, renderList: any) {
  //         let values = [];
  //         if (members && members.length > 0) {
  //           values = members
  //         }
  //         // let values: any[] = [];
  
  //         if (searchTerm.length === 0) {
  //           renderList(values, searchTerm);
  //         } else {
  //           const matches = [];
  //           for (let i = 0; i < values.length; i++)
  //             if (
  //               ~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())
  //             )
  //               matches.push(values[i]);
  //           renderList(matches, searchTerm);
  //         }
  //       }
  //     },
  //   });
  // }, [members]);

  useEffect(() => {
    setFieldValue("text", "");
    document
      .querySelector("#chat-editor > div > div.ql-editor.ql-blank")
      ?.setAttribute("data-placeholder", placeholder);
  }, [placeholder]);

  const debounceRequest = useCallback(() => {
    handleTyping(setIsTyping);
  }, []);

  useEffect(() => {
    const type = dmId ? "directs" : "channels";
    const id = dmId || channelId;
    if (isTyping) {
      postData(
        `/${type}/${id}/typing_indicator`,
        {
          isTyping: true,
        },
        {},
        false
      );
    }
  }, [isTyping]);

  useEffect(() => {
    let interval: any;
    const type = dmId ? "directs" : "channels";
    const id = dmId || channelId;

    if (isTyping && !isSubmitting) {
      interval = setInterval(() => {
        postData(
          `/${type}/${id}/typing_indicator`,
          {
            isTyping: true,
          },
          {},
          false
        );
      }, 3000);
    } else {
      clearInterval(interval);
      postData(
        `/${type}/${id}/typing_indicator`,
        {
          isTyping: false,
        },
        {},
        false
      );
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    setRefresh(!refresh);
  }, [mentionMembers]);
  
  useEffect(() => {
    const qlEditor = document.querySelector('.ql-editor');
    qlEditor?.addEventListener('paste', e => {
      if (e.clipboardData.items[0].kind === "file") {
        setFiles([...files, e.clipboardData.items[0].getAsFile()]);
      }
    });
    return () => {
      qlEditor?.addEventListener('paste', e => {
        if (e.clipboardData.items[0].kind === "file") {
          setFiles([...files, e.clipboardData.items[0].getAsFile()]);
        }
      });
    }
  }, []);

  return (
    <div className="flex flex-col w-full">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Style
          css={`
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
              border-color: ${isDragActive
                ? themeColors?.blue
                : hexToRgbA(themeColors?.foreground, "0.5")};
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
          `}
        />
        <ReactQuill
          onChange={(e) => {
            setFieldValue("text", e);
            setIsTyping(true);
            debounceRequest();
          }}
          value={text}
          className="editor"
          placeholder={placeholder}
          modules={modules}
          formats={[
            "bold",
            "italic",
            "strike",
            "list",
            "code",
            "link",
            "blockquote",
            "code-block",
            // "image",
            "mention"
          ]}
          theme="snow"
          id="chat-editor"
          ref={editorRef}
        />
        <FileViewer files={files} setFiles={setFiles} />
        <CustomToolbar
          isSubmitting={isSubmitting}
          errors={errors}
          isFiles={!!files?.length}
          editor={editor}
          setHasText={setHasText}
          openDropzone={openDropzone}
          text={text}
        />
        <VoiceMessage />
        <VideoMessage />
      </div>
    </div>
  );
}

export default Editor;
