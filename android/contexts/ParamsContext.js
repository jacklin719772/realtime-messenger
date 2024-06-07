import {createContext, useContext, useState} from 'react';

export const ParamsContext = createContext({
  workspaceId: '',
  setWorkspaceId: () => {},
  chatId: '',
  setChatId: () => {},
  chatType: '',
  setChatType: () => {},
  messageId: '',
  setMessageId: () => {},
});

export function ParamsProvider({children}) {
  const [workspaceId, setWorkspaceId] = useState('');
  const [chatId, setChatId] = useState('');
  const [chatType, setChatType] = useState('');
  const [messageId, setMessageId] = useState('');

  return (
    <ParamsContext.Provider
      value={{
        workspaceId,
        setWorkspaceId,
        chatId,
        setChatId,
        chatType,
        setChatType,
        messageId,
        setMessageId,
      }}>
      {children}
    </ParamsContext.Provider>
  );
}
export function useParams() {
  return useContext(ParamsContext);
}
