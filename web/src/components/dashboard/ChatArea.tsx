import { ChevronDownIcon, SearchIcon } from "@heroicons/react/outline";
import EditChannel from "components/dashboard/channels/EditChannel";
import Editor from "components/dashboard/chat/Editor";
import Messages from "components/dashboard/chat/Messages";
import { useTheme } from "contexts/ThemeContext";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useUser } from "contexts/UserContext";
import { useChannelById } from "hooks/useChannels";
import { useDetailByChat } from "hooks/useDetails";
import { useDirectMessageById } from "hooks/useDirects";
import { useUserById } from "hooks/useUsers";
import { KeyboardEvent, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { postData } from "utils/api-helpers";
import { getHref } from "utils/get-file-url";
import { useTranslation } from "react-i18next";
import initFindWin from "utils/find5";
import ForwardMessage from "./chat/ForwardMessage";
import ReplyMessage from "./chat/ReplyMessage";
import SelectHeader from "./chat/SelectHeader";
import SelectFooter from "./chat/SelectFooter";

const SelectChannel = styled.button`
  :hover {
    background-color: ${(props) => props.theme.selectionBackground};
  }
`;

function HeaderChannel() {
  const { themeColors } = useTheme();
  const [open, setOpen] = useState(false);
  const { channelId } = useParams();
  const { value } = useChannelById(channelId);
  const { visibleSearch, setVisibleSearch } = useContext(ReactionsContext);
  const { visibleFileSearch, setVisibleFileSearch } = useContext(ReactionsContext);

  return (
    <div className="w-full border-b flex items-center justify-between px-5 py-1 h-14 th-color-selbg th-border-selbg">
      <div className="flex items-center">
        <SelectChannel
          className="flex items-center cursor-pointer focus:outline-none py-1 pr-2 rounded"
          onClick={() => setOpen(true)}
          theme={themeColors}
        >
          <h5 className="font-bold mr-1 th-color-for max-w-sm truncate">
            {`#${value?.name || ""}`}
          </h5>
          <ChevronDownIcon className="h-4 w-4 th-color-for" />
        </SelectChannel>
        {value?.topic && (
          <span className="ml-3 w-full text-sm th-color-for opacity-70">
            {value?.topic}
          </span>
        )}
        <EditChannel
          open={open}
          setOpen={setOpen}
          name={value?.name}
          topic={value?.topic}
          details={value?.details}
          createdAt={new Date(value?.createdAt)?.toDateString()}
        />
      </div>
      <div>
        <button
          className="th-bg-bg th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleSearch(!visibleSearch)}
        >
          <SearchIcon
            className="h-5 w-5 th-color-for"
          />
        </button>
        <button
          className="th-bg-bg th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleFileSearch(!visibleFileSearch)}
        >
          <img className="h-5 w-5" alt="gallery" src={`${process.env.PUBLIC_URL}/gallery.png`} />
        </button>
      </div>
    </div>
  );
}

function HeaderDirectMessage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { themeColors } = useTheme();
  const { dmId } = useParams();
  const { value: dm } = useDirectMessageById(dmId);
  const { user } = useUser();
  const otherUserId = dm?.members.find((m: string) => m !== user?.uid);
  const { value } = useUserById(otherUserId || user?.uid);

  const photoURL = getHref(value?.thumbnailURL) || getHref(value?.photoURL);
  const { visibleSearch, setVisibleSearch } = useContext(ReactionsContext);
  const { visibleFileSearch, setVisibleFileSearch } = useContext(ReactionsContext);

  return (
    <div className="w-full border-b flex items-center justify-between px-5 py-1 h-14 th-color-selbg th-border-selbg">
      <SelectChannel
        className="flex items-center cursor-pointer focus:outline-none py-1 pr-2 rounded"
        onClick={() =>
          navigate(
            `${location.pathname.split("/user_profile")[0]}/user_profile/${
              value?.objectId
            }`
          )
        }
        theme={themeColors}
      >
        <img
          alt={value?.objectId}
          className="h-6 w-6 rounded mr-2"
          src={photoURL || `${process.env.PUBLIC_URL}/blank_user.png`}
        />
        <h5 className="font-bold mr-1 th-color-for max-w-sm truncate">
          {value?.displayName}
        </h5>
        <ChevronDownIcon className="h-4 w-4 th-color-for" />
      </SelectChannel>
      <div>
        <button
          className="th-bg-bg th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleSearch(!visibleSearch)}
        >
          <SearchIcon
            className="h-5 w-5 th-color-for"
          />
        </button>
        <button
          className="th-bg-bg th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded font-extrabold focus:z-10 focus:outline-none"
          onClick={() => setVisibleFileSearch(!visibleFileSearch)}
        >
          <img className="h-5 w-5" alt="gallery" src={`${process.env.PUBLIC_URL}/gallery.png`} />
        </button>
      </div>
    </div>
  );
}

export default function ChatArea() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { channelId, dmId } = useParams();
  const { value: channel } = useChannelById(channelId);
  const { value: directMessage } = useDirectMessageById(dmId);
  const { value: detail } = useDetailByChat(channelId || dmId);

  const [lastRead, setLastRead] = useState(null);

  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("");
  const {isSelecting, visibleSearch, setVisibleSearch, setVisibleFileSearch, visibleForward, originId, searchText, visibleReply} = useContext(ReactionsContext);

  useEffect(() => {
    if (!originId) {
      const el = document.getElementById("contentMain")!;
      el.scrollTo(el.scrollHeight, 0);
    }
    setLastRead(null);
    setHasNew(false);
    setInputValue("");
    setFilter("");
    setVisibleSearch(false);
    setVisibleFileSearch(false);
  }, [channelId, dmId]);

  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (channel && channel.lastMessageCounter !== detail?.lastRead) {
      postData(`/users/${user?.uid}/read`, {
        chatType: "Channel",
        chatId: channelId,
      });
      if (!hasNew) {
        setLastRead(detail?.lastRead || 0);
        setHasNew(true);
      }
    } else if (
      directMessage &&
      directMessage.lastMessageCounter !== detail?.lastRead
    ) {
      postData(`/users/${user?.uid}/read`, {
        chatType: "Direct",
        chatId: dmId,
      });
      if (!hasNew) {
        setLastRead(detail?.lastRead || 0);
        setHasNew(true);
      }
    }
  }, [channel?.lastMessageCounter, directMessage?.lastMessageCounter]);

  useEffect(() => {
    initFindWin(false, "contentMain");
  }, []);

  useEffect(() => {
    if (visibleSearch) {
      document.getElementById("fwtext").value = searchText;
      document.getElementById("fwtext").defaultValue = searchText;
      document.getElementById("btnDown")?.click();
    }
  }, [visibleSearch]);

  useEffect(() => {
    if (!visibleSearch) {
      document.getElementById("closeIcon")?.click();
    }
  }, [visibleSearch]);

  const openSearchBar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.code === "KeyF") {
      e.preventDefault();
      setVisibleSearch(!visibleSearch)
    }
  }

  return (
    <div className="row-span-2 flex flex-col overflow-hidden" onKeyDown={(e) => openSearchBar(e)} tabIndex={-1}>
      {channelId && <HeaderChannel />}
      {dmId && <HeaderDirectMessage />}
      <div className="min-h-0 flex-1 flex flex-col justify-end overflow-y-auto">
        {/* {visibleSearch && <SearchDialog />} */}
        {/* {visibleFileSearch && <FileSearchDialog />} */}
        {isSelecting && <SelectHeader />}
        <div className="border-b th-border-selbg" style={visibleSearch ? {} : {display: 'none'}}>
          <div id="findwindow" />
        </div>
        <Messages lastRead={lastRead} filter={filter}  />
        {isSelecting? <SelectFooter /> : <Editor />}
        {visibleForward && <ForwardMessage />}
        {visibleReply && <ReplyMessage />}
      </div>
    </div>
  );
}
