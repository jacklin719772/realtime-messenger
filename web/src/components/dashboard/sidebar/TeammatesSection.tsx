import { SearchIcon, UserAddIcon } from "@heroicons/react/outline";
import ModalButton from "components/dashboard/ModalButton";
import { DirectMessagesContext } from "contexts/DirectMessagesContext";
import { useModal } from "contexts/ModalContext";
import { useTheme } from "contexts/ThemeContext";
import { useUser } from "contexts/UserContext";
import { UsersContext } from "contexts/UsersContext";
import { useWorkspaceById } from "hooks/useWorkspaces";
import { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import { getHref } from "utils/get-file-url";
import { useTranslation } from "react-i18next";

function MemberItem({
  id,
  owner,
  member,
}: {
  id: string;
  owner: boolean;
  member: any;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const { user } = useUser();
  const { workspaceId } = useParams();
  const { setOpenCreateMessage, setCreateMessageSection: setSection } =
    useModal();
  const photoURL = getHref(member?.thumbnailURL) || getHref(member?.photoURL);

  const isMe = user?.uid === id;

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

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const newMessage = async () => {
    setLoading(true);
    try {
      const { directId } = await postData("/directs", {
        workspaceId,
        userId: id,
      });
      navigate(`/dashboard/workspaces/${workspaceId}/dm/${directId}`);
      setOpenCreateMessage(false);
      setSection("members");
    } catch (err: any) {
      toast.error(t("Creating direct message has been failed."));
    }
    setLoading(false);
  };

  return (
    <li className="px-8 py-2 flex justify-between items-center cursor-pointer group">
      <div className="flex items-center group-hover:w-4/6 w-full">
        <img
          className="rounded mr-4 h-6 w-6"
          src={photoURL || `${process.env.PUBLIC_URL}/blank_user.png`}
          alt={id}
        />
        <div
          className="text-sm truncate"
          style={{ color: themeColors?.foreground }}
        >
          {member?.fullName}
          {id === user?.uid && (
            <span
              className="font-normal opacity-70 ml-1"
              style={{ color: themeColors?.foreground }}
            >
              (me)
            </span>
          )}
          {owner && (
            <span
              className="font-normal opacity-70 ml-1"
              style={{ color: themeColors?.foreground }}
            >
              {" "}
              - owner
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
                setOpenCreateMessage(false);
              }
            : () => newMessage()
        }
        className="w-full sm:ml-3 justify-center items-center py-1 px-4 border border-transparent text-sm font-bold rounded text-white focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto sm:text-sm disabled:opacity-50 hidden group-hover:inline-flex"
      />
    </li>
  );
}

export default function TeammatesSection() {
  const { t } = useTranslation();
  const { setOpenInviteTeammates } = useModal();
  const { setOpenCreateMessage } = useModal();

  const { workspaceId } = useParams();
  const { value } = useWorkspaceById(workspaceId);

  const [search, setSearch] = useState("");
  const { value: members, loading } = useContext(UsersContext);

  const displayMembers = useMemo(
    () =>
      members.reduce((result: any, member: any) => {
        if (
          member?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          member?.displayName?.toLowerCase().includes(search.toLowerCase())
        )
          result.push(member);
        return result;
      }, []),
    [members, search]
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
      <ul className="w-full mt-6 overflow-y-auto" style={{ height: 250, maxHeight: 250 }}>
        <li
          className="px-8 py-2 flex items-center cursor-pointer"
          onClick={() => {
            setOpenCreateMessage(false);
            setOpenInviteTeammates(true);
          }}
        >
          <div className="rounded p-1 mr-3">
            <UserAddIcon className="h-5 w-5 th-color-for" />
          </div>
          <span className="text-sm th-color-for">{t("Invite_member")}</span>
        </li>
        {displayMembers.map((member: any) => (
          <MemberItem
            key={member.objectId}
            id={member.objectId}
            owner={value?.ownerId === member.objectId}
            member={member}
          />
        ))}
      </ul>
    </>
  );
}
