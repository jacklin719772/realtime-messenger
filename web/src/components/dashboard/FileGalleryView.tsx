import { DocumentTextIcon, DownloadIcon, EyeIcon, XIcon } from "@heroicons/react/solid";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useUser } from "contexts/UserContext";
import { useChannelById } from "hooks/useChannels";
import { useDirectMessageById } from "hooks/useDirects";
import { useMessagesByChat } from "hooks/useMessages";
import { useUserById } from "hooks/useUsers";
import { Base64 } from "js-base64";
import { useContext, useState, useMemo, useRef, SetStateAction, useEffect } from "react";
import { useParams } from "react-router-dom";
import bytesToSize from "utils/bytesToSize";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import QuillReader from "./quill/QuillReader";
import { RadioGroup } from "@headlessui/react";
import { useTheme } from "contexts/ThemeContext";
import { Formik } from "formik";
import Dropzone, { useDropzone } from "react-dropzone";
import { uploadFile } from "gqlite-lib/dist/client/storage";
import now from "utils/now";
import { v4 as uuidv4 } from "uuid";
import { postData } from "utils/api-helpers";
import toast from "react-hot-toast";
import { useModal } from "contexts/ModalContext";
import { toast as toastr } from "react-toastify";
import { PlusIcon } from "@heroicons/react/outline";
import hexToRgbA from "utils/hexToRgbA";

function MessageItem({
    message,
}: {
    message: any;
}) {
    console.log(message);
    const { themeColors } = useTheme();
    const {value} = useUserById(message?.senderId);
    const {user} = useUser();
    const fileURL = getHref(message?.thumbnailURL) || getHref(message?.fileURL);
    const downloadRef = useRef<any>(null);
    const previewRef = useRef<any>(null);
    const d = new Date(message?.createdAt);
    d?.setHours(d?.getHours() + 8);
    const formattedTime = d?.toLocaleTimeString('zh-CN', {hour12: false});

    const [imageLoaded, setImageLoaded] = useState(false);
    const {setEmailBody, setEmailRecipient, setOpenMailSender, setOpenFavorite, setFileURL, setFileMessage} = useModal();

    const sizes = useMemo(() => {
      return {
        height: `${Math.round(
          (200 * message.mediaHeight) / message.mediaWidth
        )}px`,
        width: "200px",
      };
    }, [message?.mediaHeight, message?.mediaWidth]);
    console.log(message);

    const initializeEmail = (message: any) => {
      let messageBody = '';
      if (message?.text) {
        console.log(message?.text);
        messageBody += message?.text;
      }
      if (message?.fileURL) {
        messageBody += `<a href="${getHref(message?.fileURL + '&d=' + message?.fileName)}" target="_blank">${message?.fileName}</a>`
      }
      setEmailBody(messageBody);
      setEmailRecipient("");
      setOpenMailSender(true);
    }

    const initializeFavorite = (message: any) => {
      setFileURL(message?.fileURL);
      setFileMessage(message);
      setOpenFavorite(true);
    }

    const removeFavorite = async () => {
      try {
        await postData(`/messages/${message?.objectId}/favorites/${user?.uid}`);
        toastr.success('The file has been removed from your private folder.', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } catch (error: any) {
        toastr.error(error.message, {
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
    }

    const getFileSize = (byte: number) => {
      if (byte < 1024) {
        return byte + ' B';
      } else if ((byte / 1024) < 1024) {
        return (byte / 1024).toFixed(2) + ' KB';
      } else if ((byte / 1024 / 1024) < 1024) {
        return (byte / 1024 / 1024).toFixed(2) + ' MB';
      } else {
        return (byte / 1024 / 1024 / 1024).toFixed(2) + ' GB';
      }
    }

    const formatTime = (totalSecond: number) => {
      const hours = Math.floor(totalSecond / 3600);
      const minutes = Math.floor((totalSecond - hours * 3600) / 60);
      const seconds = totalSecond - (hours * 3600 + minutes * 60);
      return `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}:${padToTwoDigits(seconds)}`;
    }

    const padToTwoDigits = (num: number) => {
      return num.toString().padStart(2, '0');
    }

    return (
      <div className="flex flex-col group py-1">
        <div className="flex flex-col flex-1 px-3">
          <div className="th-color-for flex items-center">
            <span
              role="button"
              tabIndex={0}
              className={classNames(
                !value?.displayName ? "opacity-0" : "",
                "font-bold text-sm align-top hover:underline cursor-pointer focus:outline-none max-w-sm truncate"
              )}
            >
              {value?.displayName || "undefined"},
            </span>
            <span className="font-light text-xs ml-2 align-bottom">
              {formattedTime}
            </span>
          </div>
          {message.fileURL && (
          <>
            {message?.fileType?.includes("image/") && (
              <>
                <div
                  className={classNames(
                    imageLoaded ? "block" : "hidden",
                    "relative my-1"
                  )}
                >
                  <img
                    className="bg-cover w-full rounded relative focus:outline-none cursor-pointer"
                    onLoad={() => setImageLoaded(true)}
                    alt={message?.fileName}
                    src={fileURL}
                  />
                </div>
                {!imageLoaded && (
                  <div
                    className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                  />
                )}
              </>
            )}

            {message?.fileType?.includes("video/") && (
              <>
                <div
                  className={classNames(
                    imageLoaded ? "block" : "hidden",
                    "relative my-1"
                  )}
                >
                  <img
                    className="bg-cover w-full rounded relative focus:outline-none cursor-pointer hover:opacity-50"
                    onLoad={() => setImageLoaded(true)}
                    alt={message?.fileName}
                    src={fileURL}
                  />
                  <div className="w-full h-full flex flex-col justify-center items-center th-color-for absolute top-0 left-0 opacity-0 hover:opacity-100" style={{backgroundColor: hexToRgbA(themeColors?.background, "0.5")}}>
                    <div className="text-sm font-bold">{message?.fileName}</div>
                    <div className="text-xs font-medium">
                      {message?.mediaWidth}&times;{message?.mediaHeight} {getFileSize(message?.fileSize)} {formatTime(message?.mediaDuration)}
                    </div>
                  </div>
                </div>
                {!imageLoaded && (
                  <div
                    className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                  />
                )}
              </>
            )}

            {!message?.fileType?.includes("video/") &&
              !message?.fileType?.includes("image/") && (
                <div className="relative my-1">
                  <div className="rounded-xl h-16 w-full relative group border th-border-for flex space-x-2 items-center p-1 overflow-hidden">
                    <DocumentTextIcon className="h-9 w-9 text-blue-500 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <div className="text-gray-300 text-sm font-bold truncate">
                        {message?.fileName}
                      </div>
                      <div className="text-gray-400 text-sm truncate">
                        {bytesToSize(message?.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="opacity-100 top-0 right-0 mx-5 flex items-center">
          <button
            type="button"
            title="Download"
            className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
            onClick={() => downloadRef?.current?.click()}
          >
            <span className="sr-only">Download</span>
            <a
              ref={downloadRef}
              className="hidden"
              download={message?.fileName}
              target="_blank"
              rel="noreferrer"
              href={getHref(message?.fileURL + '&d=' + message?.fileName)}
            >
              Download
            </a>
            <DownloadIcon className="h-4 w-4" />
          </button>

          {(message?.fileType?.includes("audio/") ||
            message?.fileType?.includes("video/") ||
            message?.fileType?.includes("image/")) && (
            <button
              type="button"
              title="Preview"
              className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
              onClick={() => previewRef?.current?.click()}
            >
              <span className="sr-only">Preview</span>
              <a
                ref={previewRef}
                className="hidden"
                target="_blank"
                rel="noreferrer"
                title={getHref(message?.fileURL.replace(/%2F/g, "%252F"))}
                href={`https://im.flybird360.com:8013/onlinePreview?url=${encodeURIComponent(Base64.encode(`https://im.flybird360.com:3003${message?.fileURL.replace(/%2F/g, "%252F")}`))}`}
              >
                Preview
              </a>
              <EyeIcon className="h-4 w-4" />
            </button>
            
          )}

          {(!message?.fileType?.includes("audio/") &&
            !message?.fileType?.includes("video/") &&
            !message?.fileType?.includes("image/")) && (
            <button
              type="button"
              title="Preview"
              className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
              onClick={() => previewRef?.current?.click()}
            >
              <span className="sr-only">Preview</span>
              <a
                ref={previewRef}
                className="hidden"
                target="_blank"
                rel="noreferrer"
                title={getHref(message?.fileURL.replace(/%2F/g, "%252F"))}
                href={`https://im.flybird360.com:8013/onlinePreview?url=${encodeURIComponent(Base64.encode(`http://117.21.178.59:4000${message?.fileURL.replace(/%2F/g, "%252F")}`))}`}
              >
                Preview
              </a>
              <EyeIcon className="h-4 w-4" />
            </button>
            
          )}
          <button
            type="button"
            title="Download"
            className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
            onClick={() => initializeEmail(message)}
          >
            <span className="sr-only">Download</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 th-color-for" fill="currentColor" height="512" viewBox="0 0 512 512" width="512">
              <path d="m222.287 278.4 116.154-116.155a8 8 0 0 1 11.313 11.315l-116.154 116.153 85.551 185.36 163.395-445.619-445.619 163.394z"/>
              <path d="m96 424a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
              <path d="m32 400a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 0 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
              <path d="m120 488a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
            </svg>
          </button>

          {message?.fileURL && (
            <>
            {message?.favorites.includes(user?.uid) ? (
              <button
                type="button"
                title="Remove favorite"
                className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
                onClick={removeFavorite}
              >
                <span className="sr-only">Favorite</span>
                <img className="h-4 w-4" alt="forward" src={`${process.env.PUBLIC_URL}/favorite_remove.png`} />
              </button>
              
            ) : (
              <button
                type="button"
                title="Add favorite"
                className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
                onClick={() => initializeFavorite(message)}
              >
                <span className="sr-only">Favorite</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="th-color-for w-4 h-4" fill="currentColor">
                  <path d="M29,13a.71.71,0,0,0,0-.21c0-.06,0-.12-.05-.17s-.07-.1-.1-.15a.7.7,0,0,0-.13-.16l0,0L24,8.36V6a1,1,0,0,0-1-1H20L16.64,2.23a1,1,0,0,0-1.28,0L12,5H9A1,1,0,0,0,8,6V8.36L3.36,12.23l0,0a.7.7,0,0,0-.13.16c0,.05-.07.09-.1.15s0,.11-.05.17A.71.71,0,0,0,3,13s0,0,0,0V29a1,1,0,0,0,1,1H28a1,1,0,0,0,1-1V13S29,13,29,13Zm-3.75-1H24V11ZM16,4.3l.84.7H15.16ZM22,7v8.88l-6,3-6-3V7ZM8,12H6.76L8,11ZM27,28H5V14H8v1a1,1,0,0,0-.89.54,1,1,0,0,0,.44,1.34l8,4a1,1,0,0,0,.9,0l8-4a1,1,0,0,0,.44-1.34A1,1,0,0,0,24,15V14h3Z"/>
                  <path d="M18,25H8a1,1,0,0,0,0,2H18a1,1,0,0,0,0-2Z"/>
                  <circle cx="21" cy="26" r="1"/>
                  <circle cx="24" cy="26" r="1"/>
                  <polygon points="13.53 16.5 16 14.7 18.47 16.5 17.53 13.59 20 11.79 16.94 11.79 16 8.89 15.06 11.79 12 11.79 14.47 13.59 13.53 16.5"/>
                </svg>
              </button>
              
            )}
            </>
          )}
        </div>
      </div>
    )

}

function FileGalleryView() {
  const { themeColors } = useTheme();
  const { workspaceId, channelId, dmId } = useParams();
  const {setVisibleFileSearch} = useContext(ReactionsContext);
  const [section, setSection] = useState("all");

  const [files, setFiles] = useState<File[]>([]);
  const [galleryUploaded, setGalleryUploaded] = useState(false);

  const { setMessageSent } = useModal();
  
  const { value: messages } = useMessagesByChat(
    channelId || dmId,
    1
  );

  const equalDate = (date1: any, date2: any) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1?.setHours(d1?.getHours() + 8);
    d2?.setHours(d2?.getHours() + 8);
    return d1?.getDate() === d2?.getDate();
  }

  const formattedDate = (date: any) => {
    const d = new Date(date);
    d?.setHours(d?.getHours() + 8);
    const today = new Date(new Date().toDateString());
    const dDate = new Date(d.toDateString());
    console.log(Math.floor((today - dDate) / 86400000));
    if (Math.floor((today - dDate) / 86400000) === 0) {
      return 'Today';
    }
    if (Math.floor((today - dDate) / 86400000) === 1) {
      return 'Yesterday';
    }
    return d?.toLocaleDateString("zh-CN", { year:"numeric", day:"numeric", month:"long"});
  }

  const onDrop = async (acceptedFiles: SetStateAction<File[]>) => {
    setFiles(acceptedFiles);
    console.log(acceptedFiles);
    setGalleryUploaded(true);
  }

  useEffect(() => {
    if (galleryUploaded) {
      const upload =async () => {
        const messageId = uuidv4();
        let filePath: string | undefined;
        if (files?.length) {
          filePath = await uploadFile(
            "messenger",
            `${now()}.${files[0].name.split(".").pop()}`,
            files[0]
          );
        }
        const text = "";
        console.log(files);
        await postData("/messages", {
          objectId: messageId,
          text,
          chatId: channelId || dmId,
          workspaceId,
          ...(files?.length && {
            fileName: files[0]?.name,
            filePath,
          }),
          chatType: channelId ? "Channel" : "Direct",
        });
        setMessageSent(true);
        const el = document.getElementById("contentMain")!;
        el.scrollTo(el.scrollHeight, 0);
        setFiles([]);
      }
      upload();
    }
  }, [galleryUploaded]);

  const filteredMessages = useMemo(() => {
    const result = (section === "all") ? messages.filter((message: any) => message.fileURL).map((message: any, index: number) => (
      <>
        {(index === 0 || (index > 0 && !equalDate(message?.createdAt, messages.filter((message: any) => message.fileURL)[index - 1]?.createdAt))) && (
          <div className="flex w-full justify-center items-center">
            <span className="font-bold w-60 text-lg th-color-for text-center rounded">{formattedDate(message?.createdAt)}</span>
          </div>
        )}
        <MessageItem message={message} key={index} />
      </>
    )) : (section !== "others") ? messages.filter((message: any) => message.fileURL && message.fileType.includes(section)).map((message: any, index: number) => (
      <MessageItem message={message} key={index} />
    )) : messages.filter((message: any) => message.fileURL && !message?.fileType?.includes("audio/") && !message?.fileType?.includes("video/") && !message?.fileType?.includes("image/")).map((message: any, index: number) => (
      <MessageItem message={message} key={index} />
    ));
    return result;
  },
  [messages, section]);

  return (
    <div className="row-span-2 border rounded-xl flex flex-col overflow-hidden th-border-for my-2 mr-2 th-bg-bg">
      <div className="h-14 border-b flex items-center justify-between py-1 px-4 th-border-for">
        <span className="text-base font-bold th-color-for">Gallery</span>
        <XIcon
          onClick={() => setVisibleFileSearch(false)}
          className="h-5 w-5 cursor-pointer th-color-for"
        />
      </div>
      
      <RadioGroup
        as="div"
        value={section}
        onChange={setSection}
        className="flex space-x-6 px-8 text-sm font-normal"
        style={{ color: themeColors?.foreground }}
      >
        <RadioGroup.Option
          value="all"
          className="focus:outline-none"
        >
          {({ checked }) => (
            <div
              className={classNames(
                checked ? "border-b-2" : "",
                "pb-2 cursor-pointer"
              )}
              style={{
                borderColor: checked ? themeColors?.cyan : "",
              }}
            >
              <span>All</span>
            </div>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option
          value="image/"
          className="focus:outline-none"
        >
          {({ checked }) => (
            <div
              className={classNames(
                checked ? "border-b-2" : "",
                "pb-2 cursor-pointer"
              )}
              style={{
                borderColor: checked ? themeColors?.cyan : "",
              }}
            >
              <span>Image</span>
            </div>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option
          value="audio/"
          className="focus:outline-none"
        >
          {({ checked }) => (
            <div
              className={classNames(
                checked ? "border-b-2" : "",
                "pb-2 cursor-pointer"
              )}
              style={{
                borderColor: checked ? themeColors?.cyan : "",
              }}
            >
              <span>Audio</span>
            </div>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option
          value="video/"
          className="focus:outline-none"
        >
          {({ checked }) => (
            <div
              className={classNames(
                checked ? "border-b-2" : "",
                "pb-2 cursor-pointer"
              )}
              style={{
                borderColor: checked ? themeColors?.cyan : "",
              }}
            >
              <span>Video</span>
            </div>
          )}
        </RadioGroup.Option>
        <RadioGroup.Option
          value="others"
          className="focus:outline-none"
        >
          {({ checked }) => (
            <div
              className={classNames(
                checked ? "border-b-2" : "",
                "pb-2 cursor-pointer"
              )}
              style={{
                borderColor: checked ? themeColors?.cyan : "",
              }}
            >
              <span>Others</span>
            </div>
          )}
        </RadioGroup.Option>
      </RadioGroup>
      <Dropzone onDrop={acceptedFiles => onDrop(acceptedFiles)}>
        {({getRootProps, getInputProps}) => (
          <section className="p-4 w-full cursor-pointer th-color-for">
            <div className="rounded-xl border-2 th-border-for w-full h-16 th-bg-selbg flex justify-between items-center px-8" {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drop here to share</p>
              <PlusIcon className="w-8 h-8" />
            </div>
          </section>
        )}
      </Dropzone>
      <div className="flex-1 overflow-y-auto flex flex-col items-center m-1">
        <div className="space-y-3 w-full">
          {filteredMessages}
        </div>
      </div>
    </div>
  );
}

export default FileGalleryView;