import { useQuery, useSubscription } from "@apollo/client";
import * as queries from "graphql/queries";
import * as subscriptions from "graphql/subscriptions";
import { createContext, useContext, useEffect, useState } from "react";

export const ReactionsContext = createContext({
  reactions: [] as any[],
  setChatId: (() => {}) as any,
  visibleSearch: false,
  setVisibleSearch: (() => {}) as any,
  visibleFileSearch: false,
  setVisibleFileSearch: (() => {}) as any,
  visibleForward: false,
  setVisibleForward: (() => {}) as any,
  forwardMessage: null as any,
  setForwardMessage: (() => {}) as any,
  originId: null as any,
  setOriginId: (() => {}) as any,
  visibleGlobalSearch: false,
  setVisibleGlobalSearch: (() => {}) as any,
  searchText: "",
  setSearchText: (() => {}) as any,
  visibleReply: false,
  setVisibleReply: (() => {}) as any,
  isSelecting: false,
  setIsSelecting: (() => {}) as any,
  checkedMessages: [] as any[],
  setCheckedMessages: (() => {}) as any,
  visibleForwardMultiple: false,
  setVisibleForwardMultiple: (() => {}) as any,
  visibleAudioRecorder: false,
  setVisibleAudioRecorder: (() => {}) as any,
  voiceBlob: null as any,
  setVoiceBlob: (() => {}) as any,
  videoBlob: null as any,
  setVideoBlob: (() => {}) as any,
  visibleVideoRecorder: null as any,
  setVisibleVideoRecorder: (() => {}) as any,
});

export const ReactionsProvider = ({ children }: any) => {
  const [reactions, setReactions] = useState<any[]>([]);
  const [chatId, setChatId] = useState("");
  const [visibleSearch, setVisibleSearch] = useState(false);
  const [visibleFileSearch, setVisibleFileSearch] = useState(false);
  const [visibleForward, setVisibleForward] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [originId, setOriginId] = useState(null);
  const [visibleGlobalSearch, setVisibleGlobalSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [visibleReply, setVisibleReply] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [checkedMessages, setCheckedMessages] = useState<any[]>([]);
  const [visibleForwardMultiple, setVisibleForwardMultiple] = useState(false);
  const [visibleAudioRecorder, setVisibleAudioRecorder] = useState(false);
  const [visibleVideoRecorder, setVisibleVideoRecorder] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<any>(null);
  const [videoBlob, setVideoBlob] = useState<any>(null);

  const { data } = useQuery(queries.LIST_REACTIONS, {
    variables: {
      chatId,
    },
    skip: !chatId,
    fetchPolicy: "cache-and-network",
  });
  const { data: dataPush } = useSubscription(subscriptions.REACTION, {
    variables: {
      chatId,
    },
    skip: !chatId,
  });

  useEffect(() => {
    if (data) setReactions(data.listReactions);
  }, [data]);

  useEffect(() => {
    if (dataPush) {
      setReactions([
        ...reactions.filter(
          (item) => item.objectId !== dataPush.onUpdateReaction.objectId
        ),
        dataPush.onUpdateReaction,
      ]);
    }
  }, [dataPush]);

  return (
    <ReactionsContext.Provider
      value={{
        reactions,
        setChatId,
        visibleSearch,
        setVisibleSearch,
        visibleFileSearch,
        setVisibleFileSearch,
        visibleForward,
        setVisibleForward,
        forwardMessage,
        setForwardMessage,
        originId,
        setOriginId,
        visibleGlobalSearch,
        setVisibleGlobalSearch,
        searchText,
        setSearchText,
        visibleReply,
        setVisibleReply,
        isSelecting,
        setIsSelecting,
        checkedMessages,
        setCheckedMessages,
        visibleForwardMultiple,
        setVisibleForwardMultiple,
        visibleAudioRecorder,
        setVisibleAudioRecorder,
        visibleVideoRecorder,
        setVisibleVideoRecorder,
        voiceBlob,
        setVoiceBlob,
        videoBlob,
        setVideoBlob,
      }}
    >
      {children}
    </ReactionsContext.Provider>
  );
};

export function useReactions(chatId?: string, messageId?: string) {
  const { setChatId, reactions } = useContext(ReactionsContext);

  useEffect(() => {
    if (chatId) setChatId(chatId);
  }, [chatId]);

  return {
    reactions: reactions.filter((item) => item.messageId === messageId),
  };
}
