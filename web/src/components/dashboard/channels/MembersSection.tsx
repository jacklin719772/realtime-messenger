import { SearchIcon, TrashIcon, UserAddIcon } from "@heroicons/react/outline";
import AddPeopleToChannelDialog from "components/dashboard/channels/AddPeopleToChannelDialog";
import Spinner from "components/Spinner";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { useUser } from "contexts/UserContext";
import { UsersContext } from "contexts/UsersContext";
import { useChannelById } from "hooks/useChannels";
import { useWorkspaceById } from "hooks/useWorkspaces";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { deleteData, postData } from "utils/api-helpers";
import classNames from "utils/classNames";
import { getHref } from "utils/get-file-url";
import ModalButton from "../ModalButton";
import AddMemberConfirm from "../chat/AddMemberConfirm";
import { toast } from "react-toastify";

function MemberItem({
  id,
  owner,
  member,
  isOwner,
}: {
  id: string;
  owner: boolean;
  member: any;
  isOwner: boolean;
}) {
  const { t } = useTranslation();
  const { channelId, workspaceId } = useParams();
  const { value: workspace } = useWorkspaceById(workspaceId);
  const defaultChannel = channelId === workspace?.channelId;
  const { user } = useUser();
  const navigate = useNavigate();
  const photoURL = getHref(member?.thumbnailURL) || getHref(member?.photoURL);

  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const newMessage = async () => {
    setLoading(true);
    try {
      const { directId } = await postData("/directs", {
        workspaceId,
        userId: member?.objectId,
      });
      navigate(`/dashboard/workspaces/${workspaceId}/dm/${directId}`);
      setOpenAdd(false);
    } catch (err: any) {
      toast.error(t("Creating direct message has been failed."), {
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

  console.log('isOwner: ', isOwner);  

  const deleteMember = async () => {
    setLoading(true);
    try {
      await deleteData(`/channels/${channelId}/members/${id}`);
      if (user?.uid === id) {
        navigate(`/dashboard/workspaces/${workspaceId}`);
      }
    } catch (err: any) {
      toast.error(t("Deleting member failed."));
    }
    setLoading(false);
  };

  const isMe = id === user?.uid;

  const { value: directs } = useContext(DirectMessagesContext);

  const [openDirect, setOpenDirect] = useState<any>(null);

  useEffect(() => {
    if (directs) {
      setOpenDirect(
        isMe
          ? directs.find(
              (direct: any) =>
                direct.active.includes(user?.uid) && direct.members.length === 1
            )
          : directs.find(
              (direct: any) =>
                direct.active.includes(user?.uid) && direct.members.includes(id)
            )
      );
    }
  }, [directs, user?.uid]);

  return (
    <li className="px-8 py-2 flex justify-between items-center cursor-pointer group">
      <div
        className={classNames(
          defaultChannel || owner ? "" : "group-hover:w-4/6",
          "flex items-center w-full"
        )}
      >
        <img
          className="rounded mr-4 h-6 w-6"
          src={photoURL || `${process.env.PUBLIC_URL}/blank_user.png`}
          alt={id}
        />
        <div className="text-sm truncate th-color-for">
          {member?.fullName}
          {isMe && (
            <span className="text-xs font-normal opacity-70 ml-1 th-color-for">
              ({t("me")})
            </span>
          )}
          {owner && (
            <span className="text-xs font-normal opacity-70 ml-1 th-color-for">
              {" "}
              - {t("creator")}
            </span>
          )}
        </div>
      </div>
      <ModalButton
        isSubmitting={loading}
        text={t("New_message")}
        onClick={
          openDirect
            ? () => {
                navigate(
                  `/dashboard/workspaces/${workspaceId}/dm/${openDirect.objectId}`
                );
              }
            : () => setOpenAdd(true)
        }
        className="w-full sm:ml-3 justify-center items-center py-1 px-4 border border-transparent text-sm font-bold rounded text-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto sm:text-sm disabled:opacity-50 hidden group-hover:inline-flex"
      />
      {(!defaultChannel && !owner && isOwner) && (
        <div className="opacity-0 group-hover:opacity-100">
          {loading ? (
            <Spinner className="th-color-for" />
          ) : (
            <TrashIcon
              className="h-6 w-6 th-color-red"
              onClick={deleteMember}
            />
          )}
        </div>
      )}
      <AddMemberConfirm open={openAdd} setOpen={setOpenAdd} addMember={newMessage} loading={loading} />
    </li>
  );
}

export default function MembersSection({
  isOwner
}: {
  isOwner: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { channelId } = useParams();
  const { value: channel } = useChannelById(channelId);

  const [search, setSearch] = useState("");
  const { value: members, loading } = useContext(UsersContext);

  const displayMembers = useMemo(
    () =>
      members
        .filter((mb: any) => channel?.members.includes(mb.objectId))
        .reduce((result: any, member: any) => {
          if (
            member?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            member?.displayName?.toLowerCase().includes(search.toLowerCase())
          )
            result.push(member);
          return result;
        }, []),
    [members, search, channel?.members]
  );

  if (loading) return null;

  return (
    <>
      <div className="px-8 w-full">
        <div className="flex items-center border w-full shadow shadow-gray-500 rounded px-2 th-color-for th-bg-bg th-border-for">
          <SearchIcon className="h-5 w-5 th-color-for" />
          <input
            type="text"
            name="findMembers"
            id="findMembers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Find_members")}
            className="block text-sm border-0 w-full focus:outline-none focus:ring-0 th-bg-bg autofill:th-bg-bg"
          />
        </div>
      </div>
      <ul className="w-full overflow-y-auto" style={{ height: 250, maxHeight: 250 }}>
        {isOwner && (
          <li
            className="px-8 py-2 flex items-center cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <div className="rounded p-1 mr-3">
              <UserAddIcon className="h-5 w-5 th-color-for" />
            </div>
            <span className="text-sm th-color-for">{t("Add_member")}</span>
          </li>
        )}
        {displayMembers.map((member: any) => (
          <MemberItem
            key={member.objectId}
            id={member.objectId}
            owner={channel?.createdBy === member.objectId}
            member={member}
            isOwner={isOwner}
          />
        ))}
      </ul>
      <AddPeopleToChannelDialog open={open} setOpen={setOpen} />
    </>
  );
}
