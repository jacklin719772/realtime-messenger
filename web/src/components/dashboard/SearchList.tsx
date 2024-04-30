import { SearchIcon, XIcon } from '@heroicons/react/outline'
import Spinner from 'components/Spinner'
import { DirectMessagesContext } from 'contexts/DirectMessagesContext'
import { useModal } from 'contexts/ModalContext'
import { ReactionsContext } from 'contexts/ReactionsContext'
import { useTheme } from 'contexts/ThemeContext'
import { useUser } from 'contexts/UserContext'
import { UsersContext } from 'contexts/UsersContext'
import { useChannels } from 'hooks/useChannels'
import { useMessages } from 'hooks/useMessages'
import { useWorkspaceById } from 'hooks/useWorkspaces'
import { useContext, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHref } from 'utils/get-file-url'

function UserItem({
  data,
}: {
  data: any;
}) {
  return (
    <div className="flex items-center p-2 th-bg-selbg th-color-brblue cursor-pointer hover:bg-gray-500" id={data?.objectId} onClick={() => {}}>
      <div className="flex justify-center items-center w-10 pr-2">
        <img src={getHref(data?.thumbnailURL) || getHref(data?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} alt={data?.displayName} className="w-full rounded-full" />
      </div>
      <div className="w-60">
        <div className="font-bold text-sm" dangerouslySetInnerHTML={{__html: data?.displayName}} />
        <div className="font-medium">
          <div className="text-sm mr-1" dangerouslySetInnerHTML={{__html: data?.fullName}} />
        </div>
      </div>
    </div>
  )
}

function Contact() {
  const { themeColors } = useTheme()
  const { workspaceId } = useParams()
  const { value } = useWorkspaceById(workspaceId)
  const [section, setSection] = useState("mine");
  const [search, setSearch] = useState("");
  const { value: dms } = useContext(DirectMessagesContext);
  const { value: members } = useContext(UsersContext);
  const { user } = useUser();
  const { visibleContact, setVisibleContact } = useModal();

  const allUsers = useMemo(() => 
    members.filter((m: any) => (m?.fullName.toLowerCase().includes(search.toLowerCase()) || m?.displayName.toLowerCase().includes(search.toLowerCase()))), 
  [search, members]);

  const mineUsers = useMemo(() => 
    dms.map((dm: any) => members.filter((member: any) => (
      (dm.members.length === 1 && dm.members[0] === member.objectId) || 
      (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === member.objectId)))[0]
    ).filter((dm : any) => (dm?.displayName.toLowerCase().includes(search.toLowerCase()) || dm?.fullName.toLowerCase().includes(search.toLowerCase()))), 
  [search, dms, members]);

  return (
    <div className="col-span-2 row-span-2 p-0 my-2 ml-2 overflow-hidden flex flex-col border th-border-for rounded-xl th-bg-selbg">
      <div className="flex items-center justify-between w-full px-4 py-4 h-14 th-color-brblue th-bg-selbg border-b th-border-for">
        <h5 className="font-bold th-color-brblue max-w-sm truncate">Contacts</h5>
        {visibleContact && <XIcon className="h-4 w-4 button" style={{cursor: "pointer"}} onClick={() => setVisibleContact(false)} />}
      </div>
      <div className="flex items-center border-y w-full pl-2 pr-4 text-gray-500 bg-white th-border-selbg mt-2">
        <SearchIcon className="h-4 w-4 text-gray-500" />
        <input
          type="text"
          name="searchFiles"
          id="searchFiles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for users..."
          className="bg-white block text-sm border-0 w-full focus:outline-none focus:ring-0"
        />
        <XIcon className="h-4 w-4 text-gray-500" style={{cursor: 'pointer'}} onClick={() => setSearch("")} />
      </div>
      <div className="pt-2 px-2">
        <select
          className="block appearance-none w-full th-bg-bg th-color-brblue border th-border-for bg-color-for py-2 px-4 pr-8 mr-2 text-sm rounded leading-tight"
          onChange={() => {}}
        >
          <option value={1}>My Contacts</option>
          <option value={2}>All Contacts</option>
          <option value={3}>Online Only</option>
        </select>
      </div>
      <div className="border-r th-border-selbg overflow-y-auto mt-1">
        {(section === "mine") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            My Contacts
          </div>
          {mineUsers.length > 0 ? 
          <>
            {mineUsers.map((item: any, index: number) => (
              <UserItem data={item} key={index} />
            ))}
          </> : 
          <div className="p-2 text-center text-sm th-color-brblue">No Results</div>}
        </div>)}
        {(section === "all") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            All Contacts
          </div>
          {allUsers.length > 0 ? 
          <>
            {allUsers.map((item: any, index: number) => (
              <UserItem data={item} key={index} />
            ))}
          </> : 
          <div className="p-2 text-center text-sm th-color-brblue">No Results</div>}
        </div>)}
        {(section === "online") && (<div>
          <div className="px-4 py-2 th-color-brblue th-bg-bgdark text-xs border-b th-border-for">
            Online Users
          </div>
          {allUsers.length > 0 ? 
          <>
            {allUsers.map((item: any, index: number) => (
              <UserItem data={item} key={index} />
            ))}
          </> : 
          <div className="p-2 text-center text-sm th-color-for">No Results</div>}
        </div>)}
      </div>
    </div>
  )
}

export default Contact
