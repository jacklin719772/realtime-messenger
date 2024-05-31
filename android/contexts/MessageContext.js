import React, { createContext, useState } from "react";

export const MessageContext = createContext({
    messageToEdit: null,
    setMessageToEdit: () => {},

    messageToReply: null,
    setMessageToReply: () => {},

    messageToForward: null,
    setMessageToForward: () => {},

    messageToSendMail: null,
    setMessageToSendMail: () => {},

    checkedMessages: [],
    setCheckedMessages: () => {},

    isSelecting: false,
    setIsSelecting: () => {},

    messageSent: false,
    setMessageSent: () => {},

    isSearching: false,
    setIsSearching: () => {},

    searchText: "",
    setSearchText: () => {},

    messageToFavorite: null,
    setMessageToFavorite: () => {},
});

export function useMessageFeature() {
  return React.useContext(MessageContext);
}

export function MessageProvider({children}) {
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [messageToReply, setMessageToReply] = useState(null);
  const [messageToForward, setMessageToForward] = useState(null);
  const [messageToSendMail, setMessageToSendMail] = useState(null);
  const [checkedMessages, setCheckedMessages] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState(false);
  const [messageToFavorite, setMessageToFavorite] = useState(false);

  return (
    <MessageContext.Provider
      value={{
        messageToEdit,
        setMessageToEdit,

        messageToReply,
        setMessageToReply,

        messageToForward,
        setMessageToForward,

        messageToSendMail,
        setMessageToSendMail,

        checkedMessages,
        setCheckedMessages,

        isSelecting,
        setIsSelecting,

        messageSent,
        setMessageSent,

        isSearching,
        setIsSearching,

        searchText,
        setSearchText,

        messageToFavorite,
        setMessageToFavorite,
      }}>
      {children}
    </MessageContext.Provider>
  );
}