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

function MessageItem({
    message,
}: {
    message: any;
}) {
    const {value} = useUserById(message?.senderId);
    const fileURL = getHref(message?.thumbnailURL) || getHref(message?.fileURL);
    const downloadRef = useRef<any>(null);
    const previewRef = useRef<any>(null);
    const d = new Date(message?.createdAt);
    d?.setHours(d?.getHours() + 8);
    const formattedTime = d?.toLocaleTimeString('zh-CN', {hour12: false});

    const [imageLoaded, setImageLoaded] = useState(false);
    const {setEmailBody, setEmailRecipient, setOpenMailSender, setOpenFavorite, setFileURL} = useModal();

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
      setOpenFavorite(true);
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

            {!message?.fileType?.includes("video/") &&
              !message?.fileType?.includes("image/") && (
                <div className="relative my-1">
                  <div className="rounded h-16 w-full relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1 overflow-hidden">
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
            <img className="h-4 w-4" alt="send-email" src={`${process.env.PUBLIC_URL}/send_email.png`} />
          </button>
          {message?.fileURL && (
            <button
              type="button"
              className="th-bg-bg th-color-for relative inline-flex items-center px-3 py-1 h-8 text-sm font-medium focus:z-10 focus:outline-none"
              onClick={() => setFileURL(message)}
            >
              <span className="sr-only">Favorite</span>
              <img className="h-4 w-4" alt="forward" src={`${process.env.PUBLIC_URL}/favorite_add.png`} />
            </button>
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
    <div className="row-span-2 border-l flex flex-col overflow-hidden th-border-selbg">
      <div className="h-14 border-b flex items-center justify-between py-1 px-4 th-border-selbg">
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
                borderColor: checked ? themeColors?.brightBlue : "",
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
                borderColor: checked ? themeColors?.brightBlue : "",
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
                borderColor: checked ? themeColors?.brightBlue : "",
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
                borderColor: checked ? themeColors?.brightBlue : "",
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
                borderColor: checked ? themeColors?.brightBlue : "",
              }}
            >
              <span>Others</span>
            </div>
          )}
        </RadioGroup.Option>
      </RadioGroup>
      <Dropzone onDrop={acceptedFiles => onDrop(acceptedFiles)}>
        {({getRootProps, getInputProps}) => (
          <section className="p-4 w-full" style={{cursor: 'pointer'}}>
            <div className="rounded w-full h-16 th-bg-selbg flex justify-between items-center px-8" {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drop here to share</p>
              <p className="text-4xl">+</p>
            </div>
          </section>
        )}
      </Dropzone>
      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        <div className="space-y-3 w-full">
          {filteredMessages}
        </div>
      </div>
    </div>
  );
}

export default FileGalleryView;