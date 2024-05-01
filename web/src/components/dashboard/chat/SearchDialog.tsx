import { Dialog, Transition } from "@headlessui/react";
import { ArrowLeftIcon, DocumentTextIcon, SearchIcon, XIcon } from "@heroicons/react/outline";
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
import { useDirectMessageById } from "hooks/useDirects";

function MessageItem({
    message,
    handleClick
}: {
    message: any;
    handleClick: (date: any) => void;
}) {
    const messageReader = useMemo(
      () => <QuillReader text={message?.text} isEdited={message?.isEdited} />,
      [message]
    );
    const {value} = useUserById(message?.senderId);
    const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);
    const fileURL = getHref(message?.thumbnailURL) || getHref(message?.fileURL);
    const d = new Date(message?.createdAt);
    d?.setHours(d?.getHours() + 8);
    const formattedTime = d?.toLocaleTimeString('zh-CN', {hour12: false});

    const [imageLoaded, setImageLoaded] = useState(false);

    const sizes = useMemo(() => {
      const ratio = message?.mediaWidth / message?.mediaHeight;
      if (ratio < 1) {
        return {
          height: "384px",
          width: `${Math.round(
            (384 * message.mediaWidth) / message.mediaHeight
          )}px`,
        };
      }
      return {
        height: `${Math.round(
          (384 * message.mediaHeight) / message.mediaWidth
        )}px`,
        width: "384px",
      };
    }, [message?.mediaHeight, message?.mediaWidth]);

    return (
        <div className="flex flex-1 group border-b py-1 th-border-selbg" onClick={() => handleClick(message?.createdAt)}>
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
        </div>
    )

}

export default function SearchDialog() {
  const { themeColors } = useTheme();
  const cancelButtonRef = useRef(null);
  const { channelId, dmId, workspaceId } = useParams();
  
  const { value: channel } = useChannelById(channelId);
  const { value: directMessage } = useDirectMessageById(dmId);
  const { visibleSearch, setVisibleSearch } = useContext(ReactionsContext);
  const { user } = useUser();
  const otherUserId = directMessage?.members.find((m: string) => m !== user?.uid);
  const { value } = useUserById(otherUserId || user?.uid);
  const dialogTitle = channelId ? channel?.name : value?.displayName;
  const [search, setSearch] = useState("");

  const [showResult, setShowResult] = useState(false);

  const [dateFilter, setDateFilter] = useState("");

  const handleFilteredMessageClick = (date: any) => {
    if (!showResult && search !== "") {
      setDateFilter(date);
      setShowResult(true);
    }
  }

  const goToFilteredResult = () => {
    setDateFilter("");
    setShowResult(false);
  }

  const { value: messages } = useMessagesByChat(
    channelId || dmId,
    1
  );

  const filteredMessages = useMemo(() => {
    return messages.filter((message: any) => message.text.replace(/(<([^>]+)>)/ig, '').toLowerCase().includes(search.toLowerCase())).reduce((result: any, message: any) => {
        const regex = new RegExp(search, "gi");
        const matchedText = message?.text.match(regex) === null ? "" : message?.text.match(regex)[0];
        console.log(matchedText);
        const newRegex = new RegExp(`<(?!${matchedText}).*?>`, "g");
        console.log(message?.text.match(newRegex));
        const text = matchedText === "" ? message?.text : message?.text.replace(newRegex, (match: string) => { console.log(match); return match.replace(regex, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedText}</span>`) });
        console.log(text);
        result.push({...message, text});
        return result;
      }, []).map((message: any, index: number) => (
      <MessageItem message={message} key={index} handleClick={handleFilteredMessageClick} />
    ));
  },
  [messages, search]);

  const resultMessages = useMemo(() => {
    const result = dateFilter === "" ? messages : messages.filter((message: any) => new Date(dateFilter).getTime() <= new Date(message?.createdAt).getTime());
    return result.reduce((result: any, message: any) => {
        const regex = new RegExp(search, "gi");
        const matchedText = message?.text.match(regex) === null ? "" : message?.text.match(regex)[0];
        const text = matchedText === "" ? message?.text : message?.text.replace(regex, `<span style="color: #008000;">${matchedText}</span>`);
        result.push({...message, text});
        return result;
      }, []).map((message: any, index: number) => (
        <MessageItem message={message} key={index} handleClick={handleFilteredMessageClick} />
      ));
  }, [messages, dateFilter]);

  return (
    <Transition.Root show={visibleSearch} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={visibleSearch}
        onClose={setVisibleSearch}
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
                  onClick={() => setVisibleSearch(false)}
                >
                  <XIcon
                    className="h-5 w-5"
                    style={{ color: themeColors?.foreground }}
                  />
                </div>
              </div>
              <div className="h-550 max-h-450" style={{ color: themeColors?.background }}>
                <div className="px-8 pb-2 w-full">
                  <div className="flex items-center border w-full shadow-sm rounded px-2 th-color-for th-bg-bg th-border-selbg">
                    <SearchIcon className="h-5 w-5 th-color-for" />
                    <input
                      type="text"
                      name="searchMessage"
                      id="searchMessage"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Message..."
                      className="block text-base border-0 w-full focus:outline-none focus:ring-0 th-bg-bg autofill:th-bg-bg"
                    />
                  </div>
                </div>
                {showResult && (
                  <div className="flex items-center py-2 px-5 border-t w-full th-color-for th-bg-bg th-border-selbg">
                    <ArrowLeftIcon className="h-5 w-5 th-color-for" onClick={goToFilteredResult} />
                  </div>
                )}
                <div className="space-y-6 pt-2 pb-8 border-t th-bg-bg th-border-selbg overflow-y-auto">
                  {!showResult ? (
                    <div className="w-full flex flex-1 flex-col-reverse overflow-y-auto px-5 pt-1">
                      {filteredMessages}
                    </div>
                  ) : (
                    <div className="w-full flex flex-1 flex-col-reverse overflow-y-auto px-5 pt-1">
                      {resultMessages}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
