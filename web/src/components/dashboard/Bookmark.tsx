import { Dialog, Menu, Transition } from "@headlessui/react";
import { DotsVerticalIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "@heroicons/react/outline";
import Spinner from "components/Spinner";
import React, { Fragment,  useEffect,  useRef, useState } from "react";
import { toast } from "react-toastify";
import classNames from "utils/classNames";
import AddBookmark from "./AddBookmark";
import RenameBookmark from "./RenameBookmark";
import RemoveBookmark from "./RemoveBookmark";
import { useTranslation } from "react-i18next";

function BookmarkItem({
  item,
  getData,
  index,
}: {
  item: any;
  getData: any;
  index: number;
}) {
  const { t } = useTranslation();
  const [openRename, setOpenRename] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);

  const removeItem = async (id: number) => {
    try {
      const response = await fetch('https://uteamwork.com/_api/user/delWebsite', {
        method: 'POST',
        body: JSON.stringify({
          id,
        }),
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        if (data.result === "success") {
          toast.success(t('The bookmark has been successfully removed.'), {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
          getData();
        }
      } else {
        toast.error(t('Removing the bookmark has been failed.'), {
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
    } catch (error: any) {
      toast.error(t('Removing the bookmark has been failed.'), {
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
    setOpenRemove(false);
  }

  return (
    <div className="w-32 relative rounded th-bg-bg hover:bg-gray-500 p-2 flex flex-col justify-center items-center">
      <a href={item?.url} target="_blank" className="rounded w-14 h-14 th-bg-white flex justify-center items-center p-2">
        <img className="w-full h-full" src={`${item.url}/favicon.ico`} alt={item.url} />
      </a>
      <div className="text-center th-color-for text-xs">{item.name}</div>
      <div className="absolute top-0 right-0">
        <Menu as="div" className="relative">
          {({ open }) => (
            <>
              <div>
                <Menu.Button
                  as="div"
                  className="relative mr-2 cursor-pointer appearance-none"
                >
                  <button className="th-color-bg hover:th-color-for w-8 h-8 flex justify-center items-center p-1">
                    <DotsVerticalIcon className="w-full h-full th-color-bg hover:th-color-for" />
                  </button>
                </Menu.Button>
              </div>
              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  static
                  className={classNames(
                    (index + 1) % 5 === 0 ? "right-0" : "left-0",
                    "th-bg-bg border th-border-for origin-top-right z-20 absolute mt-2 w-40 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none py-2"
                  )}
                >
                  <div className="w-full h-px th-bg-forbr" />
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        role="button"
                        tabIndex={0}
                        className={classNames(
                          active ? "th-bg-blue th-color-brwhite" : "th-bg-bg th-color-for", 
                          "px-5 py-1 text-sm cursor-pointer focus:outline-none flex items-center space-x-2"
                        )}
                        onClick={() => setOpenRename(true)}
                      >
                        <PencilIcon className="w-4 h-4 th-color-for" />
                        <div className="th-color-for text-sm">{t("Rename")}</div>
                      </div>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <div
                        role="button"
                        tabIndex={0}
                        className={classNames(
                          active ? "th-bg-blue th-color-brwhite" : "th-bg-bg th-color-for", 
                          "px-5 py-1 text-sm cursor-pointer focus:outline-none flex items-center space-x-2"
                        )}
                        onClick={() => setOpenRemove(true)}
                      >
                        <TrashIcon className="w-4 h-4 th-color-for" />
                        <div className="th-color-for text-sm">{t("Remove")}</div>
                      </div>
                    )}
                  </Menu.Item>
                  <div className="w-full h-px th-bg-forbr" />
                </Menu.Items>
              </Transition>
            </>
          )}
        </Menu>
      </div>
      {openRename && <RenameBookmark open={openRename} setOpen={setOpenRename} item={item} getData={getData} />}
      {openRemove && <RemoveBookmark open={openRemove} setOpen={setOpenRemove} item={item} getData={getData} handleDelete={removeItem} />}
    </div>
  )
}

export default function Bookmark({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const cancelButtonRef = useRef(null);
  const [data, setData] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);

  const getData = async () => {
    try {
      const response = await fetch('https://uteamwork.com/_api/user/getWebsites', {
        method: 'POST',
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setData(data.result);
      } else {
        setData([]);
      }
    } catch (error: any) {
      setData([]);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
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
              <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-2 sm:align-middle sm:max-w-3xl sm:w-full">
                <div className="th-bg-bg border-b th-border-for p-6 flex justify-between items-center">
                  <h5 className="font-bold th-color-for">{t("Bookmark")}</h5>
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none"
                    onClick={() => setOpen(false)}
                  >
                    <XIcon className="h-5 w-5 th-color-for" />
                  </div>
                </div>
                <div className="px-4 py-4 w-full max-h-450 h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-5 gap-4">
                    {data.map((d: any, index: number) => (
                      <BookmarkItem item={d} getData={getData} key={index} index={index} />
                    ))}
                    <div className="w-32 relative rounded th-bg-bg p-2 flex flex-col justify-center items-center">
                      <button onClick={() => setOpenAdd(true)} className="rounded-full w-14 h-14 th-color-bg th-bg-for hover:bg-gray-500 flex justify-center items-center p-2">
                        <PlusIcon className="w-full h-full th-color-bg" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {openAdd && <AddBookmark open={openAdd} setOpen={setOpenAdd} getData={getData} />}
    </>
  );
}
