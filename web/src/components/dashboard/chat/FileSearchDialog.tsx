import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { ArrowLeftIcon, DocumentTextIcon, DownloadIcon, EyeIcon, SearchIcon, XIcon } from "@heroicons/react/outline";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { useChannelById } from "hooks/useChannels";
import { useMessagesByChat } from "hooks/useMessages";
import { useUserById } from "hooks/useUsers";
import { useWorkspaceById } from "hooks/useWorkspaces";
import { Fragment, useContext, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import bytesToSize from "utils/bytesToSize";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import QuillReader from "../quill/QuillReader";
import { Base64 } from "js-base64";
import { useDirectMessageById } from "hooks/useDirects";

function MessageItem({
    message,
}: {
    message: any;
}) {
    const messageReader = useMemo(
      () => <QuillReader text={message?.text} isEdited={message?.isEdited} />,
      [message]
    );
    const {value} = useUserById(message?.senderId);
    const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);
    const fileURL = getHref(message?.thumbnailURL) || getHref(message?.fileURL);
    const downloadRef = useRef<any>(null);
    const previewRef = useRef<any>(null);
    const d = new Date(message?.createdAt);
    d?.setHours(d?.getHours() + 8);
    const formattedTime = d?.toLocaleTimeString('zh-CN', {hour12: false});

    const [imageLoaded, setImageLoaded] = useState(false);

    const sizes = useMemo(() => {
      const ratio = message?.mediaWidth / message?.mediaHeight;
      if (ratio < 1) {
        return {
          height: "300px",
          width: `${Math.round(
            (300 * message.mediaWidth) / message.mediaHeight
          )}px`,
        };
      }
      return {
        height: `${Math.round(
          (200 * message.mediaHeight) / message.mediaWidth
        )}px`,
        width: "300px",
      };
    }, [message?.mediaHeight, message?.mediaWidth]);

    return (
        <div className="flex flex-1 group border-b py-1 th-border-selbg">
          <div className="flex flex-col items-start h-full pt-1 w-10">
            <div
              role="button"
              tabIndex={0}
              className="rounded h-10 w-10 bg-cover cursor-pointer focus:outline-none"
              style={{
                backgroundImage: `url(${
                  photoURL || `${process.env.PUBLIC_URL}/blank_user.png`
                })`,
              }}
            />
          </div>
          <div className="flex flex-col flex-1 pl-3 w-full">
            <div className="th-color-for flex items-center">
              <span
                role="button"
                tabIndex={0}
                className={classNames(
                  !value?.displayName ? "opacity-0" : "",
                  "font-bold text-sm align-top hover:underline cursor-pointer focus:outline-none max-w-sm truncate"
                )}
              >
                {value?.displayName || "undefined"}
              </span>
              <span className="font-light text-xs ml-2 align-bottom">
                {formattedTime}
              </span>
            </div>
            {message?.text && messageReader}
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
                      className="bg-cover max-w-sm max-h-sm rounded relative focus:outline-none cursor-pointer"
                      onLoad={() => setImageLoaded(true)}
                      alt={message?.fileName}
                      src={fileURL}
                    />
                  </div>
                  {!imageLoaded && (
                    <div
                      className="relative my-1 max-w-sm max-h-sm rounded bg-gray-100"
                      style={{
                        height: sizes?.height,
                        width: sizes?.width,
                      }}
                    />
                  )}
                </>
              )}

              {message?.fileType?.includes("video/") && (
                <div className="max-h-sm max-w-sm relative my-1">
                  <video
                    className="max-h-sm max-w-sm"
                    controls
                    disablePictureInPicture
                    controlsList="nodownload"
                    poster={getHref(message?.thumbnailURL)}
                  >
                    <source
                      src={getHref(message?.fileURL)}
                      type={message?.fileType}
                    />
                  </video>
                </div>
              )}

              {message?.fileType?.includes("audio/") && (
                <div className="relative my-1">
                  <audio controls controlsList="nodownload">
                    <source src={fileURL} type={message?.fileType} />
                  </audio>
                </div>
              )}

              {!message?.fileType?.includes("audio/") &&
                !message?.fileType?.includes("video/") &&
                !message?.fileType?.includes("image/") && (
                  <div className="relative my-1">
                    <div className="rounded h-16 w-80 relative group bg-gray-800 border border-gray-600 flex space-x-2 items-center p-1 overflow-hidden">
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

            {message?.sticker && (
              <img
                className="h-32 w-32 my-2 rounded-sm"
                alt={message?.sticker}
                src={`${process.env.PUBLIC_URL}/stickers/${message?.sticker}`}
              />
            )}
          </div>
          <div className="opacity-100 top-0 right-0 mx-5 flex flex-col items-center">
            <button
              type="button"
              className="th-bg-bg th-border-selbg th-color-for relative inline-flex items-center px-3 py-1 h-8 border text-sm font-medium focus:z-10 focus:outline-none"
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
                className="th-bg-bg th-border-selbg th-color-for relative inline-flex items-center px-3 py-1 h-8 border text-sm font-medium focus:z-10 focus:outline-none"
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
                className="th-bg-bg th-border-selbg th-color-for relative inline-flex items-center px-3 py-1 h-8 border text-sm font-medium focus:z-10 focus:outline-none"
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
          </div>
        </div>
    )

}

export default function FileSearchDialog() {
  const { themeColors } = useTheme();
  const cancelButtonRef = useRef(null);
  const { channelId, dmId, workspaceId } = useParams();
  
  const { value: channel } = useChannelById(channelId);
  const { value: directMessage } = useDirectMessageById(dmId);
  const { visibleFileSearch, setVisibleFileSearch } = useContext(ReactionsContext);
  const { user } = useUser();
  const otherUserId = directMessage?.members.find((m: string) => m !== user?.uid);
  const { value } = useUserById(otherUserId || user?.uid);
  const dialogTitle = channelId ? channel?.name : value?.displayName;
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");

  const { value: messages } = useMessagesByChat(
    channelId || dmId,
    1
  );

  const filteredMessages = useMemo(() => {
    const result = (section === "all") ? messages.filter((message: any) => message.fileURL).map((message: any, index: number) => (
      <MessageItem message={message} key={index} />
    )) : (section !== "others") ? messages.filter((message: any) => message.fileURL && message.fileType.includes(section) && message.fileName.toLowerCase().includes(search.toLowerCase())).map((message: any, index: number) => (
      <MessageItem message={message} key={index} />
    )) : messages.filter((message: any) => message.fileURL && !message?.fileType?.includes("audio/") && !message?.fileType?.includes("video/") && !message?.fileType?.includes("image/") && message.fileName.toLowerCase().includes(search.toLowerCase())).map((message: any, index: number) => (
      <MessageItem message={message} key={index} />
    ));
    return result;
  },
  [messages, section, search]);

  return (
    <Transition.Root show={visibleFileSearch} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={visibleFileSearch}
        onClose={setVisibleFileSearch}
      >
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
            <div
              style={{ backgroundColor: themeColors?.background }}
              className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full"
            >
              <div
                style={{ backgroundColor: themeColors?.background }}
                className="pl-8 p-6 pb-4 flex justify-between items-center"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold max-w-full truncate"
                >
                  {dialogTitle}
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setVisibleFileSearch(false)}
                >
                  <XIcon
                    className="h-5 w-5"
                    style={{ color: themeColors?.foreground }}
                  />
                </div>
              </div>
              <div style={{ color: themeColors?.background }}>
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
                <div className="px-8 pb-2 w-full">
                  <div className="flex items-center border w-full shadow-sm rounded px-2 th-color-for th-bg-bg th-border-selbg">
                    <SearchIcon className="h-5 w-5 th-color-for" />
                    <input
                      type="text"
                      name="searchFiles"
                      id="searchFiles"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Files..."
                      className="block text-base border-0 w-full focus:outline-none focus:ring-0 th-bg-bg"
                    />
                  </div>
                </div>
                <div className="space-y-6 pt-2 pb-8 border-t h-550 max-h-450 th-bg-bg th-border-selbg overflow-y-auto">
                  <div className="w-full flex flex-1 flex-col-reverse overflow-y-auto px-5 pt-1">
                    {filteredMessages}
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
