import { RadioGroup } from '@headlessui/react'
import { SearchIcon, XIcon } from '@heroicons/react/outline'
import { match } from 'assert'
import Spinner from 'components/Spinner'
import { DirectMessagesContext } from 'contexts/DirectMessagesContext'
import { ReactionsContext } from 'contexts/ReactionsContext'
import { useTheme } from 'contexts/ThemeContext'
import { useUser } from 'contexts/UserContext'
import { UsersContext } from 'contexts/UsersContext'
import { useChannels } from 'hooks/useChannels'
import { useMessages } from 'hooks/useMessages'
import { useWorkspaceById } from 'hooks/useWorkspaces'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import Scrollbars from 'react-custom-scrollbars-2'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import classNames from 'utils/classNames'
import { getHref } from 'utils/get-file-url'

function SearchList() {
  const { t } = useTranslation();
  const { themeColors } = useTheme()
  const navigate = useNavigate()
  const { workspaceId } = useParams()
  const { value } = useWorkspaceById(workspaceId)
  const [section, setSection] = useState("all");
  const [search, setSearch] = useState("");
  const { value: channels } = useChannels();
  const { value: dms } = useContext(DirectMessagesContext);
  const { value: members } = useContext(UsersContext);
  const { user } = useUser();
  const { value: messages, loading } = useMessages(workspaceId);
  const { originId, setOriginId, setSearchText, setVisibleSearch, visibleGlobalSearch, setVisibleGlobalSearch } = useContext(ReactionsContext);

  const getFormattedTime = (date: any) => {
    const d = new Date(date);
    d?.setHours(d?.getHours() + 8);
    const today = new Date(new Date().toDateString());
    const dDate = new Date(d.toDateString());
    if (Math.floor((today - dDate) / 86400000) === 0) {
      return t('Today') + ' at ' + d.toLocaleTimeString("zh-CN", { hour:"2-digit", minute:"2-digit"});
    }
    if (Math.floor((today - dDate) / 86400000) === 1) {
      return t('Yesterday') + ' at ' + d.toLocaleTimeString("zh-CN", { hour:"2-digit", minute:"2-digit"});
    }
    return d?.toLocaleString("zh-CN", { day:"numeric", month:"short"});
  }
  
  const channelList = useMemo(() => {
    const filteredChannels = channels.filter((channel: any) => channel.name.toLowerCase().includes(search.toLowerCase()));
    return filteredChannels
    // .reduce((result: any, channel: any) => {
    //   const regex = new RegExp(search, "gi");
    //   const matchedText = channel?.name.match(regex) === null ? "" : channel?.name.match(regex)[0];
    //   console.log(matchedText);
    //   const text = matchedText === "" ? channel?.name : channel?.name.replaceAll(matchedText, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedText}</span>`);
    //   console.log(text);
    //   result.push({...channel, name: text});
    //   return result;
    // }, [])
    .map((channel: any, index: number) => (
      <div className="flex items-center p-2 th-bg-selbg th-color-brblue cursor-pointer hover:bg-gray-500" key={index} id={channel?.objectId} onClick={() => navigate(`/dashboard/workspaces/${channel?.workspaceId}/channels/${channel?.objectId}`)}>
        <div className="flex justify-center items-center w-10 pr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-auto th-color-brblue" fill="currentColor" height="384pt" viewBox="0 0 384 384" width="384pt">
            <path d="m192 0c-105.863281 0-192 86.128906-192 192 0 105.863281 86.136719 192 192 192s192-86.136719 192-192c0-105.871094-86.136719-192-192-192zm0 352c-88.222656 0-160-71.777344-160-160s71.777344-160 160-160 160 71.777344 160 160-71.777344 160-160 160zm0 0"/><path d="m276.847656 141.089844-28.28125 28.285156-33.941406-33.941406 28.277344-28.28125-22.621094-22.632813-28.28125 28.28125-28.28125-28.28125-22.621094 22.632813 28.277344 28.28125-33.941406 33.941406-28.28125-28.285156-22.625 22.628906 28.28125 28.28125-28.28125 28.28125 22.625 22.621094 28.28125-28.277344 33.941406 33.941406-28.277344 28.28125 22.621094 22.625 28.28125-28.28125 28.28125 28.28125 22.621094-22.625-28.277344-28.28125 33.941406-33.941406 28.28125 28.277344 22.625-22.621094-28.28125-28.28125 28.28125-28.28125zm-84.847656 84.855468-33.945312-33.945312 33.945312-33.945312 33.945312 33.945312zm0 0"/>
          </svg>
        </div>
        <div className="w-60">
          <div className="font-bold text-sm" dangerouslySetInnerHTML={{__html: channel?.name}} />
          <div className="font-medium text-xs truncate">{channel?.topic ? channel?.topic : "No topic"}</div>
        </div>
      </div>
    ));
  }, [search, channels]);

  const dmList = useMemo(() => {
    const filteredDms =  dms.map((dm: any) => ({
      ...dm,
      displayName: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].displayName,
      fullName: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].fullName,
      email: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].email,
      thumbnailURL: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].thumbnailURL,
      photoURL: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].photoURL,
      phoneNumber: members.filter((member: any) => ((dm.members.length === 1 && dm.members[0] === member.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].phoneNumber,
    })).filter((dm: any) => (dm.displayName.toLowerCase().includes(search.toLowerCase()) || dm.fullName.toLowerCase().includes(search.toLowerCase())));
    return filteredDms
    // .reduce((result: any, dm: any) => {
    //   const regex = new RegExp(search, "gi");
    //   const matchedFullName = dm?.fullName.match(regex) === null ? "" : dm?.fullName.match(regex)[0];
    //   const matchedDisplayName = dm?.displayName.match(regex) === null ? "" : dm?.displayName.match(regex)[0];
    //   const matchedEmail = dm?.email.match(regex) === null ? "" : dm?.email.match(regex)[0];
    //   console.log(matchedDisplayName, matchedFullName, matchedEmail);
    //   const fullName = matchedFullName === "" ? dm?.fullName : dm?.fullName.replaceAll(matchedFullName, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedFullName}</span>`);
    //   const displayName = matchedDisplayName === "" ? dm?.displayName : dm?.displayName.replaceAll(matchedDisplayName, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedDisplayName}</span>`);
    //   const email = matchedEmail === "" ? dm?.email : dm?.email.replaceAll(matchedEmail, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedEmail}</span>`);
    //   result.push({...dm, fullName, displayName, email});
    //   return result;
    // }, [])
    .map((dm: any, index: number) => (
      <div className="flex items-center p-2 th-bg-selbg th-color-brblue cursor-pointer hover:bg-gray-500" key={index} id={dm?.objectId} onClick={() => navigate(`/dashboard/workspaces/${dm?.workspaceId}/dm/${dm?.objectId}`)}>
        <div className="flex justify-center items-center w-10 pr-2">
          <img src={getHref(dm?.thumbnailURL) || getHref(dm?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} alt={dm?.displayName} className="w-full rounded-full" />
        </div>
        <div className="w-60">
          <div className="font-bold text-sm" dangerouslySetInnerHTML={{__html: dm?.displayName}} />
          <div className="font-medium">
            <div className="text-sm mr-1" dangerouslySetInnerHTML={{__html: dm?.fullName}} />
          </div>
        </div>
      </div>
    ));
  }, [search, dms]);

  const messageList = useMemo(() => {
    const channelMsg = channels.map((c: any) => (messages.filter((m: any) => m.chatId === c.objectId && m?.text && m?.text !== "")[0])).filter((m: any) => m);
    const directMsg = dms.map((d: any) => (messages.filter((m: any) => m.chatId === d.objectId && m?.text && m?.text !== "")[0])).filter((m: any) => m);
    const chatIds = channels.map((c: any) => c.objectId).concat(dms.map((d: any) => d.objectId));
    const filteredMessages = search === "" ? channelMsg.concat(directMsg).filter((message: any) => (message?.text && message?.text.replace(/(<([^>]+)>)/ig, ''))) : messages.map((message: any) => ({
      ...message,
      text: message?.text.replace(/(<([^>]+)>)/ig, '')
    })).filter((message: any) => (message?.text && message?.text !== "" && message?.text.toLowerCase().includes(search.toLowerCase()) && message?.workspaceId === workspaceId && chatIds.includes(message?.chatId)));
    return filteredMessages
    .reduce((result: any, message: any) => {
      // const regex = new RegExp(search, "gi");
      // const matchedText = message?.text.match(regex) === null ? "" : message?.text.match(regex)[0];
      // console.log(matchedText);
      // console.log(message?.text.search(matchedText));
      // const text = matchedText === "" ? message?.text : message?.text.substring(message?.text.search(matchedText)).replaceAll(matchedText, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedText}</span>`);
      // console.log(text);
      let chat = "";
      if (message?.chatType === "Direct") {
        const direct = dms?.filter((d: any) => d.objectId === message?.chatId)[0].members;
        chat = members.filter((member: any) => ((direct.length === 1 && direct[0] === member.objectId) || (direct.length > 1 && direct.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].displayName;
      } else {
        chat = channels.filter((c: any) => c.objectId === message.chatId)[0].name;
      }
      result.push({...message, chat});
      return result;
    }, [])
    .map((message: any, index: number) => (
      <div className="flex items-center p-2 th-bg-selbg th-color-brblue cursor-pointer hover:bg-gray-500 w-full" key={index} id={message?.objectId} onClick={() => goOriginal(message)}>
        <div className="flex justify-center items-center w-10 pr-2">
          {message?.chatType === "Channel" ?
          <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-auto th-color-brblue" fill="currentColor" height="384pt" viewBox="0 0 384 384" width="384pt">
            <path d="m192 0c-105.863281 0-192 86.128906-192 192 0 105.863281 86.136719 192 192 192s192-86.136719 192-192c0-105.871094-86.136719-192-192-192zm0 352c-88.222656 0-160-71.777344-160-160s71.777344-160 160-160 160 71.777344 160 160-71.777344 160-160 160zm0 0"/><path d="m276.847656 141.089844-28.28125 28.285156-33.941406-33.941406 28.277344-28.28125-22.621094-22.632813-28.28125 28.28125-28.28125-28.28125-22.621094 22.632813 28.277344 28.28125-33.941406 33.941406-28.28125-28.285156-22.625 22.628906 28.28125 28.28125-28.28125 28.28125 22.625 22.621094 28.28125-28.277344 33.941406 33.941406-28.277344 28.28125 22.621094 22.625 28.28125-28.28125 28.28125 28.28125 22.621094-22.625-28.277344-28.28125 33.941406-33.941406 28.28125 28.277344 22.625-22.621094-28.28125-28.28125 28.28125-28.28125zm-84.847656 84.855468-33.945312-33.945312 33.945312-33.945312 33.945312 33.945312zm0 0"/>
          </svg> :
          <img src={getHref(members.filter((m: any) => m?.objectId === message?.senderId)[0].thumbnailURL) || 
            getHref(members.filter((m: any) => m?.objectId === message?.senderId)[0].photoURL) || 
            `${process.env.PUBLIC_URL}/blank_user.png`} alt={message?.chat} className="w-full rounded-full" />}
        </div>
        <div className="w-60">
          <div className="font-bold text-sm">{message?.chat}</div>
          <div className="font-medium text-xs">{getFormattedTime(message?.createdAt)}</div>
          <div className="flex">
            <div className="font-medium text-xs">{user?.uid === message?.senderId ? "You" : members.filter((m: any) => m.objectId === message?.senderId)[0].displayName}: </div>
            <div className="font-medium text-xs truncate" dangerouslySetInnerHTML={{__html: message?.text}} />
          </div>
        </div>
      </div>
    ));
  }, [search, messages, channels, dms, loading]);

  const fileList = useMemo(() => {
    const channelMsg = channels.map((c: any) => (messages.filter((m: any) => m.chatId === c.objectId && m?.fileURL)[0])).filter((m: any) => m);
    const directMsg = dms.map((d: any) => (messages.filter((m: any) => m.chatId === d.objectId && m?.fileURL)[0])).filter((m: any) => m);
    const chatIds = channels.map((c: any) => c.objectId).concat(dms.map((d: any) => d.objectId));
    const filteredFiles = search === "" ? channelMsg.concat(directMsg).filter((message: any) => message?.fileURL) : messages.map((message: any) => ({
      ...message,
      text: message?.text.replace(/(<([^>]+)>)/ig, '')
    })).filter((message: any) => (message?.fileURL && message?.fileName.toLowerCase().includes(search.toLowerCase()) && message?.workspaceId === workspaceId && chatIds.includes(message?.chatId)));
    return filteredFiles
    .reduce((result: any, message: any) => {
      // const regex = new RegExp(search, "gi");
      // const matchedText = message?.fileName.match(regex) === null ? "" : message?.fileName.match(regex)[0];
      // console.log(matchedText);
      // console.log(message?.fileName.search(matchedText));
      // const text = matchedText === "" ? message?.fileName : message?.fileName.substring(message?.fileName.search(matchedText)).replaceAll(matchedText, `<span style="border-radius: 0.25rem; color: white; background-color: #373a41; color: #daf0ff;">${matchedText}</span>`);
      // console.log(text);
      let chat = "";
      if (message?.chatType === "Direct") {
        const direct = dms?.filter((d: any) => d.objectId === message?.chatId)[0].members;
        chat = members.filter((member: any) => ((direct.length === 1 && direct[0] === member.objectId) || (direct.length > 1 && direct.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0].displayName;
      } else {
        chat = channels.filter((c: any) => c.objectId === message.chatId)[0].name;
      }
      result.push({...message, chat});
      return result;
    }, [])
    .map((message: any, index: number) => (
      <div className="flex items-center p-2 th-bg-selbg th-color-brblue cursor-pointer hover:bg-gray-500 w-full" key={index} id={message?.objectId} onClick={() => goOriginal(message)}>
        <div className="flex justify-center items-center w-10 pr-2">
          {message?.chatType === "Channel" ?
          <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-auto th-color-brblue" fill="currentColor" height="384pt" viewBox="0 0 384 384" width="384pt">
            <path d="m192 0c-105.863281 0-192 86.128906-192 192 0 105.863281 86.136719 192 192 192s192-86.136719 192-192c0-105.871094-86.136719-192-192-192zm0 352c-88.222656 0-160-71.777344-160-160s71.777344-160 160-160 160 71.777344 160 160-71.777344 160-160 160zm0 0"/><path d="m276.847656 141.089844-28.28125 28.285156-33.941406-33.941406 28.277344-28.28125-22.621094-22.632813-28.28125 28.28125-28.28125-28.28125-22.621094 22.632813 28.277344 28.28125-33.941406 33.941406-28.28125-28.285156-22.625 22.628906 28.28125 28.28125-28.28125 28.28125 22.625 22.621094 28.28125-28.277344 33.941406 33.941406-28.277344 28.28125 22.621094 22.625 28.28125-28.28125 28.28125 28.28125 22.621094-22.625-28.277344-28.28125 33.941406-33.941406 28.28125 28.277344 22.625-22.621094-28.28125-28.28125 28.28125-28.28125zm-84.847656 84.855468-33.945312-33.945312 33.945312-33.945312 33.945312 33.945312zm0 0"/>
          </svg> :
          <img src={getHref(members.filter((m: any) => m?.objectId === message?.senderId)[0].thumbnailURL) || 
            getHref(members.filter((m: any) => m?.objectId === message?.senderId)[0].photoURL) || 
            `${process.env.PUBLIC_URL}/blank_user.png`} alt={message?.chat} className="w-full rounded-full" />}
        </div>
        <div className="w-60">
          <div className="font-bold text-sm">{message?.chat}</div>
          <div className="font-medium text-sm">{getFormattedTime(message?.createdAt)}</div>
          <div className="flex">
            <div className="font-medium text-xs">{user?.uid === message?.senderId ? "You" : members.filter((m: any) => m.objectId === message?.senderId)[0].displayName}: </div>
            <div className="font-medium text-xs truncate" dangerouslySetInnerHTML={{__html: message?.fileName}} />
          </div>
        </div>
      </div>
    ));
  }, [search, messages, channels, dms, loading]);

  const goOriginal = (forward: any) => {
    setSearchText(search);
    if (search !== "" && originId !== forward?.objectId) {
      setVisibleSearch(true);
    } else {
      setVisibleSearch(false);
    }
    if (forward?.chatType === "Channel") {
      navigate(`/dashboard/workspaces/${forward?.workspaceId}/channels/${forward?.chatId}`);
    } else {
      navigate(`/dashboard/workspaces/${forward?.workspaceId}/dm/${forward?.chatId}`);
    }
    if (!forward?.isDeleted) {
      setOriginId(forward?.objectId);
      // setVisibleSearch(true);
    }
  }

  return (
    <div className="col-span-2 row-span-2 p-0 my-2 ml-2 overflow-hidden flex flex-col border th-border-for rounded-xl th-bg-selbg">
      <div className="flex items-center justify-between w-full px-4 py-4 h-14 th-color-brblue th-bg-selbg border-b th-border-for">
        <h5 className="font-bold th-color-brblue max-w-sm truncate">{value?.name}</h5>
        {visibleGlobalSearch && <XIcon className="h-4 w-4 button" style={{cursor: "pointer"}} onClick={() => setVisibleGlobalSearch(!visibleGlobalSearch)} />}
      </div>
      <div className="flex items-center border-y w-full pl-2 pr-4 text-gray-500 bg-white th-border-selbg mt-2">
        <SearchIcon className="h-4 w-4 text-gray-500" />
        <input
          type="text"
          name="searchFiles"
          id="searchFiles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search_for_Workspace")}
          className="bg-white block text-sm border-0 w-full focus:outline-none focus:ring-0 autofill:bg-white"
        />
        <XIcon className="h-4 w-4 text-gray-500" style={{cursor: 'pointer'}} onClick={() => setSearch("")} />
      </div>
      <div className="pt-2">
        <RadioGroup
          as="div"
          value={section}
          onChange={setSection}
          className="flex justify-center space-x-3 text-sm font-normal"
          style={{ color: themeColors?.foreground }}
        >
          <RadioGroup.Option
            value="all"
            className="focus:outline-none th-color-brblue"
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
                <span>{t("All")}</span>
              </div>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option
            value="dm"
            className="focus:outline-none th-color-brblue"
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
                <span>{t("Contact")}</span>
              </div>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option
            value="channel"
            className="focus:outline-none th-color-brblue"
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
                <span>{t("Channel")}</span>
              </div>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option
            value="message"
            className="focus:outline-none th-color-brblue"
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
                <span>{t("Message")}</span>
              </div>
            )}
          </RadioGroup.Option>
          <RadioGroup.Option
            value="file"
            className="focus:outline-none th-color-brblue"
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
                <span>{t("File")}</span>
              </div>
            )}
          </RadioGroup.Option>
        </RadioGroup>
      </div>
      <div className="border-r th-border-selbg overflow-y-auto mt-1">
        {(section === "all" || section === "dm") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            {t("Contacts")}
          </div>
          {dmList.length > 0 ? dmList : <div className="p-2 text-center text-sm th-color-brblue">{t("No_Results")}</div>}
        </div>)}
        {(section === "all" || section === "channel") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            {t("Channels")}
          </div>
          {channelList.length > 0 ? channelList : <div className="p-2 text-center text-sm th-color-brblue">{t("No_Results")}</div>}
        </div>)}
        {(section === "all" || section === "message") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            {t("Messages")}
          </div>
          {messageList.length > 0 ? messageList : loading? <div className="flex justify-center items-center th-bg-bg h-16"><Spinner className="h-4 w-4 th-color-brblue" /></div> : <div className="p-2 text-center text-sm th-color-brblue">{t("No_Results")}</div>}
        </div>)}
        {(section === "all" || section === "file") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            {t("Files")}
          </div>
          {fileList.length > 0 ? fileList : loading? <div className="flex justify-center items-center th-bg-bg h-16"><Spinner className="h-4 w-4 th-color-brblue" /></div> : <div className="p-2 text-center text-sm th-color-brblue">{t("No_Results")}</div>}
        </div>)}
      </div>
    </div>
  )
}

export default SearchList
