import React, {createContext, useState} from 'react';

export const ModalContext = createContext({
  openPreferences: false,
  setOpenPreferences: () => {},

  openProfile: false,
  setOpenProfile: () => {},

  openSearch: false,
  setOpenSearch: () => {},

  openChannelDetails: false,
  setOpenChannelDetails: () => {},

  openDirectDetails: false,
  setOpenDirectDetails: () => {},

  openChannelBrowser: false,
  setOpenChannelBrowser: () => {},

  openMemberBrowser: false,
  setOpenMemberBrowser: () => {},

  openWorkspaceBrowser: false,
  setOpenWorkspaceBrowser: () => {},

  openStickers: false,
  setOpenStickers: () => {},

  openEditMessage: false,
  setOpenEditMessage: () => {},

  openReplyMessage: false,
  setOpenReplyMessage: () => {},

  openForwardMessage: false,
  setOpenForwardMessage: () => {},

  openSendMail: false,
  setOpenSendMail: () => {},

  initialUsers: false,
  setInitialUsers: () => {},

  openMultipleForwardMessage: false,
  setOpenMultipleForwardMessage: () => {},

  openFileGallery: false,
  setOpenFileGallery: () => {},

  openSearchMessage: false,
  setOpenSearchMessage: () => {},

  openAddChat: false,
  setOpenAddChat: () => {},

  openWebOffice: false,
  setOpenWebOffice: () => {},

  webOfficeSrc: '',
  setWebOfficeSrc: () => {},

  openFavorite: false,
  setOpenFavorite: () => {},
});

export function useModal() {
  return React.useContext(ModalContext);
}

export function ModalProvider({children}) {
  const [openPreferences, setOpenPreferences] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openChannelDetails, setOpenChannelDetails] = useState(false);
  const [openDirectDetails, setOpenDirectDetails] = useState(false);
  const [openChannelBrowser, setOpenChannelBrowser] = useState(false);
  const [openMemberBrowser, setOpenMemberBrowser] = useState(false);
  const [openWorkspaceBrowser, setOpenWorkspaceBrowser] = useState(false);
  const [openStickers, setOpenStickers] = useState(false);
  const [openEditMessage, setOpenEditMessage] = useState(false);
  const [openReplyMessage, setOpenReplyMessage] = useState(false);
  const [openForwardMessage, setOpenForwardMessage] = useState(false);
  const [openSendMail, setOpenSendMail] = useState(false);
  const [initialUsers, setInitialUsers] = useState([]);
  const [openMultipleForwardMessage, setOpenMultipleForwardMessage] = useState(false);
  const [openFileGallery, setOpenFileGallery] = useState(false);
  const [openSearchMessage, setOpenSearchMessage] = useState(false);
  const [openAddChat, setOpenAddChat] = useState(false);
  const [openWebOffice, setOpenWebOffice] = useState(false);
  const [webOfficeSrc, setWebOfficeSrc] = useState('');
  const [openFavorite, setOpenFavorite] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        openPreferences,
        setOpenPreferences,

        openProfile,
        setOpenProfile,

        openSearch,
        setOpenSearch,

        openChannelDetails,
        setOpenChannelDetails,

        openDirectDetails,
        setOpenDirectDetails,

        openChannelBrowser,
        setOpenChannelBrowser,

        openMemberBrowser,
        setOpenMemberBrowser,

        openWorkspaceBrowser,
        setOpenWorkspaceBrowser,

        openStickers,
        setOpenStickers,

        openEditMessage,
        setOpenEditMessage,

        openReplyMessage,
        setOpenReplyMessage,

        openForwardMessage,
        setOpenForwardMessage,

        openSendMail,
        setOpenSendMail,

        initialUsers,
        setInitialUsers,

        openMultipleForwardMessage,
        setOpenMultipleForwardMessage,

        openFileGallery,
        setOpenFileGallery,

        openSearchMessage,
        setOpenSearchMessage,

        openAddChat,
        setOpenAddChat,

        openWebOffice,
        setOpenWebOffice,

        webOfficeSrc,
        setWebOfficeSrc,

        openFavorite,
        setOpenFavorite,
      }}>
      {children}
    </ModalContext.Provider>
  );
}
