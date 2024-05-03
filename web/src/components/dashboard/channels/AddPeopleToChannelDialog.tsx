import { Dialog, Transition } from "@headlessui/react";
import { SearchIcon, TrashIcon, UserAddIcon, XIcon } from "@heroicons/react/outline";
import ModalButton from "components/dashboard/ModalButton";
import TextField from "components/TextField";
import { UsersContext } from "contexts/UsersContext";
import { Formik } from "formik";
import { useChannelById } from "hooks/useChannels";
import React, { Fragment,  useContext, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import { getHref } from "utils/get-file-url";
import * as Yup from "yup";

export default function AddPeopleToChannelDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const cancelButtonRef = useRef(null);
  const { channelId } = useParams();
  const { value: channel } = useChannelById(channelId);

  const [search, setSearch] = useState("");
  const { value: members, loading } = useContext(UsersContext);

  const waitingMembers = useMemo(
    () =>
      members
        .filter((mb: any) => !channel?.members.includes(mb.objectId))
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

  const addMember = async (email: string) => {
    try {
      await postData(`/channels/${channelId}/members`, {
        email,
      });
      toast.success("Member added.");
    } catch (err: any) {
      toast.error("Adding member failed.");
    }
  }

  if (loading) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={open}
        onClose={setOpen}
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="th-bg-bg px-4 py-3 sm:p-6 sm:py-3 flex justify-between items-center">
                <div>
                  <h5 className="font-bold th-color-for">
                    Add member
                  </h5>
                  <span className="opacity-70 text-sm th-color-for">{`#${channel?.name}`}</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpen(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <div className="p-6 pt-0 pb-6 th-bg-bg border-t th-border-for">
                <div className="space-y-6">
                  <TextField
                    name="searchMembers"
                    type="text"
                    focus
                    value={search}
                    handleChange={(e: any) => setSearch(e.target.value)}
                    placeholder="Search members"
                  />
                </div>
              </div>
              {waitingMembers.map((member: any) => (
                <li className="px-8 py-2 flex justify-between items-center cursor-pointer group">
                  <div
                    className="group-hover:w-5/6 flex items-center w-full"
                  >
                    <img
                      className="rounded mr-4 h-10 w-10"
                      src={getHref(member?.thumbnailURL) || getHref(member?.photoURL) || `${process.env.PUBLIC_URL}/blank_user.png`}
                      alt={member?.objectId}
                    />
                    <div className="font-bold truncate th-color-for">
                      {member?.fullName}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100">
                    <UserAddIcon
                      className="h-6 w-6 th-color-red"
                      onClick={() => addMember(member?.email)}
                    />
                  </div>
                </li>
              ))}
              <div className="px-4 pb-3 pt-2 sm:px-6 sm:flex sm:flex-row-reverse border-t th-border-for">
                <ModalButton onClick={() => setOpen(false)} text="Done" />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
