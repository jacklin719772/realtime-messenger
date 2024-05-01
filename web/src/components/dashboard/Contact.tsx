import { SearchIcon, XIcon } from '@heroicons/react/outline'
import AlphabetList from "react-alphabet-list";
import Spinner from 'components/Spinner'
import { DirectMessagesContext } from 'contexts/DirectMessagesContext'
import { useModal } from 'contexts/ModalContext'
import { ReactionsContext } from 'contexts/ReactionsContext'
import { useTheme } from 'contexts/ThemeContext'
import { useUser } from 'contexts/UserContext'
import { UsersContext } from 'contexts/UsersContext'
import { useChannels } from 'hooks/useChannels'
import { useMessages } from 'hooks/useMessages'
import { usePresenceByUserId } from 'hooks/usePresence'
import { useWorkspaceById } from 'hooks/useWorkspaces'
import { useContext, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { postData } from 'utils/api-helpers'
import { getHref } from 'utils/get-file-url'
import AddMemberConfirm from './chat/AddMemberConfirm'
import classNames from 'utils/classNames'

function UserItem({
  data,
  type,
}: {
  data: any;
  type: string;
}) {
  const { user } = useUser();
  const { isPresent } = usePresenceByUserId(data?.objectId);
  const { value: dms } = useContext(DirectMessagesContext);
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const userDm = dms.filter((dm: any) => ((dm.members.length === 1 && dm.members[0] === data?.objectId) || (dm.members.length > 1 && dm.members.filter((member: any) => member !== user?.uid)[0] === data?.objectId)));
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const newMessage = async () => {
    setLoading(true);
    try {
      const { directId } = await postData("/directs", {
        workspaceId,
        userId: data?.objectId,
      });
      navigate(`/dashboard/workspaces/${workspaceId}/dm/${directId}`);
      setOpenAdd(false);
    } catch (err: any) {
      toast.error(err.message, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
    setLoading(false);
  };

  const handleClick = () => {
    if (userDm.length > 0) {
      console.log("userDm", userDm);
      navigate(`/dashboard/workspaces/${userDm[0]?.workspaceId}/dm/${userDm[0]?.objectId}`);
    } else {
      setOpenAdd(true);
    }
  }

  return (
    <>
      {(type !== "online" || (type === "online" && isPresent)) ? (
      <div className="flex items-center py-2 pr-2 th-bg-selbg th-color-brblue cursor-pointer hover:bg-gray-500" id={data?.objectId} onClick={handleClick}>
        <div className="flex justify-center items-center w-8 mr-2 relative">
          <img src={getHref(data?.thumbnailURL) || getHref(data?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`} alt={data?.displayName} className="w-full rounded-full" />
          <div className="th-bg-selbg rounded-full h-3 w-3 absolute bottom-0 right-0 transform translate-x-1 translate-y-1 flex items-center justify-center">
            <div className={classNames(
                isPresent ? "" : "border th-border-brblue",
                "rounded-full h-2 w-2"
              )} style={{ backgroundColor: isPresent ? "#94e864" : "transparent" }} />
            </div>
        </div>
        <div className="w-60">
          <div className="font-bold text-sm" dangerouslySetInnerHTML={{__html: data?.displayName}} />
          <div className="font-medium">
            <div className="text-sm mr-1" dangerouslySetInnerHTML={{__html: data?.fullName}} />
          </div>
        </div>
      </div>
      ) : <></>}
      <AddMemberConfirm open={openAdd} setOpen={setOpenAdd} addMember={newMessage} loading={loading} />
    </>
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
      <div className="px-2">
        <div className="flex items-center border-y w-full pl-2 pr-4 text-gray-500 bg-white th-border-selbg mt-2 rounded-full">
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
      </div>
      <div className="pt-2 px-2">
        <select
          className="block appearance-none w-2/3 th-bg-bg th-color-brblue border th-border-for bg-color-for py-2 px-4 pr-8 mr-2 text-sm rounded leading-tight"
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="mine">My Contacts</option>
          <option value="all">All Contacts</option>
          <option value="online">Online Only</option>
        </select>
      </div>
      <div className="border-r th-color-brblue th-border-selbg overflow-y-auto mt-1">
        {(section === "mine") && (<div>
          {mineUsers.length > 0 ? 
          <AlphabetList
            className="th-color-for text-sm font-bold relative pl-2"
            data={mineUsers}
            nameKey="displayName"
            generateFn={(item: any, index: number) => (
              <UserItem data={item} type={section} key={index} />
            )}
          /> : 
          <div className="p-2 text-center text-sm th-color-brblue">No Results</div>}
        </div>)}
        {(section === "all") && (<div>
          {allUsers.length > 0 ? 
          <AlphabetList
            className="th-color-for text-sm font-bold relative pl-2"
            data={allUsers}
            nameKey="displayName"
            generateFn={(item: any, index: number) => (
              <UserItem data={item} type={section} key={index} />
            )}
          /> : 
          <div className="p-2 text-center text-sm th-color-brblue">No Results</div>}
        </div>)}
        {(section === "online") && (<div>
          {allUsers.length > 0 ? 
          <AlphabetList
            className="th-color-for text-sm font-bold relative pl-2"
            data={allUsers}
            nameKey="displayName"
            generateFn={(item: any, index: number) => (
              <UserItem data={item} type={section} key={index} />
            )}
          /> : 
          <div className="p-2 text-center text-sm th-color-brblue">No Results</div>}
        </div>)}
      </div>
    </div>
  )
}

export default Contact
