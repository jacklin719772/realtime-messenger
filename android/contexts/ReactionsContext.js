import * as queries from '@/graphql/queries';
import * as subscriptions from '@/graphql/subscriptions';
import {useQuery, useSubscription} from '@apollo/client';
import {createContext, useContext, useEffect, useState} from 'react';

export const ReactionsContext = createContext({
  reactions: [],
  setChatId: (() => {}),
});

export const ReactionsProvider = ({ children }) => {
  const [reactions, setReactions] = useState([]);
  const [chatId, setChatId] = useState("");

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
      }}
    >
      {children}
    </ReactionsContext.Provider>
  );
};

export function useReactions(chatId, messageId) {
  const { setChatId, reactions } = useContext(ReactionsContext);

  useEffect(() => {
    if (chatId) setChatId(chatId);
  }, [chatId]);

  return {
    reactions: reactions.filter((item) => item.messageId === messageId),
  };
}
