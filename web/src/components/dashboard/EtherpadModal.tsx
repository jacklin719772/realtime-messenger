import { Dialog, Transition } from "@headlessui/react";
import { EyeIcon, MinusIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from "@heroicons/react/outline";
import axios from "axios";
import Spinner from "components/Spinner";
import TextField from "components/TextField";
import { useModal } from "contexts/ModalContext";
import React, { Fragment,  useEffect,  useRef, useState } from "react";
import { toast } from "react-toastify";
import DeleteConfirm from "./DeleteConfirm";
import { useUser } from "contexts/UserContext";
import AddPadModal from "./AddPadModal";

function CheckItem ({
  data, 
  handleSelect,
  handleOpen,
} : {
  data: any;
  handleSelect: any;
  handleOpen: any;
}) {
  const {setCheckedPads, setOpenDeletePad} = useModal();
  const [checked, setChecked] = useState(false);
  const checkRef = useRef(null);
  const openDeleteModal = () => {
    setCheckedPads([data]);
    setOpenDeletePad(true);
  }
  useEffect(() => {
    handleSelect(checked, data);
  }, [checked]);

  return (
    <div className="w-full p-2 flex items-center justify-between text-sm border-b th-border-for th-color-for">
      <div className="flex items-center space-x-2 w-[20%]">
        <EyeIcon className="w-6 h-6 cursor-pointer" onClick={() => handleOpen(data.padName)} />
        <TrashIcon className="w-6 h-6 cursor-pointer th-color-brred" onClick={openDeleteModal} />
        <input type="checkbox" ref={checkRef} className="w-5 h-5 rounded th-bg-blue" value={checked} checked={checked} onChange={(e) => setChecked(!checked)} />
      </div>
      <div className="flex items-center space-x-2 w-[20%]">
        {data.padName}
      </div>
      <div className="text-xs w-[30%]">{data.lastEdited}</div>
      <div className="text-xs w-[10%]">{data.userCount}</div>
      <div className="text-xs w-[10%]">{data.revisions}</div>
      <div className="text-xs w-[10%]">{data.padSize}</div>
    </div>
  )
}

export default function EtherpadModal() {
  const { userdata } = useUser();
  const {openEtherpad, setOpenEtherpad, etherpadMinimized, setEtherpadMinimized, openDeletePad, setOpenDeletePad, checkedPads, setCheckedPads, currentPadName, setCurrentPadName} = useModal();
  const cancelButtonRef = useRef(null);
  const [epads, setEpads] = useState<any[]>([]);
  const [authorId, setAuthorId] = useState("");
  const [key, setKey] = useState("");
  const [listHidden, setListHidden] = useState(false);
  const [iframeHidden, setIframeHidden] = useState(true);
  const [iframeSrc, setIframeSrc] = useState("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const handleClose = () => {
    setEtherpadMinimized(false);
    setOpenEtherpad(false);
  }

  const getEtherpadList = async (key: string) => {
    try {
      const response = await axios.post("https://uteamwork.com/_api/etherpad/all", {
        key,
        lang: "simplified_chinese",
      }, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        }
      });
      if (response.statusText === "OK") {
        console.log(response.data);
        const result = response.data.result;
        result.sort((a: any, b: any) => {return new Date(b.lastEdited.toString()).getTime() - new Date(a.lastEdited.toString()).getTime()});
        setAuthorId(response.data.authorID);
        setEpads(result);
      }
    } catch (error) {
      setAuthorId("");
      setEpads([]);
    }
  }

  const handleReset = () => {
    setKey("");
    getEtherpadList("");
  }

  const handleDelete = async (checkedPads: any[]) => {
    try {
      const response = await axios.post("https://uteamwork.com/_api/etherpad/delete", {
        pads: checkedPads,
      }, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        }
      });
      if (response.statusText !== "OK") {
        toast.error('Deleting the pad has been failed.', {
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
      if (response.statusText === "OK") {
        setCheckedPads([]);
        getEtherpadList("");
        setOpenDeletePad(false);
        toast.success('The pad has been successfully deleted.', {
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
      toast.error(error.message, {
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
  }

  const closeIframe = () => {
    setIframeSrc("");
    setIframeHidden(true);
    setListHidden(false);
    setCurrentPadName("");
  }

  const handleSelect = (checked: boolean, data : any) => {
    if (checked) {
      console.log('1');
      setCheckedPads([...checkedPads, data]);
    } else {
      console.log('2');
      setCheckedPads(checkedPads.filter((i: any) => i !== data));
    }
  }

  const handleOpen = (padName: any) => {
    window.parent.postMessage({
      padName: padName,
      name: userdata.displayName,
    }, "*");
    // setIframeSrc(`https://pad.uteamwork.com:9002/p/${padName}?showChat=false&userName=${userdata.displayName}&lang=zh-hans`);
    // setListHidden(true);
    // setIframeHidden(false);
    // setCurrentPadName(padName);
  }

  useEffect(() => {
    getEtherpadList("");
  }, []);

  return (
    <>
    <Transition.Root show={openEtherpad && !etherpadMinimized} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openEtherpad && !etherpadMinimized}
        onClose={() => {}}
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
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="th-bg-bg px-4 pt-2 pb-4 sm:p-2 sm:px-4 flex justify-between items-center border-b th-border-for">
                <div className="flex items-center">
                  <button className="p-1" hidden={iframeHidden} onClick={closeIframe}>
                    <img src={`${process.env.PUBLIC_URL}/back.png`} className="w-6 h-6" /> 
                  </button>
                  <div className="p-1" hidden={!iframeHidden}>
                    <img src={`${process.env.PUBLIC_URL}/etherpad.png`} className="w-6 h-6" /> 
                  </div>
                  <h5 className="font-bold th-color-for pl-2">
                    {iframeHidden ? "E-Pad" : currentPadName}
                  </h5>
                </div>
                <div className="flex items-center">
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none"
                    onClick={() => setEtherpadMinimized(true)}
                  >
                    <MinusIcon className="h-5 w-5 th-color-for" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer focus:outline-none"
                    onClick={handleClose}
                  >
                    <XIcon className="h-5 w-5 th-color-for" />
                  </div>
                </div>
              </div>
              <div className="px-4 pb-5 pt-1 w-full h-[500px] max-h-450 overflow-y-auto">
                <div className="w-full h-full relative" hidden={iframeHidden}>
                  <iframe src={iframeSrc} allow="microphone *; camera *; display-capture *" className="w-full h-full" />
                </div>
                <div className="w-full" hidden={listHidden}>
                  <div className="w-full flex items-center space-x-2">
                    <TextField
                      value={key}
                      handleChange={(e: any) => setKey(e.target.value)}
                      type="text"
                      label=""
                      name="key"
                      autoComplete="key"
                      placeholder="Please input the epad name"
                    />
                    <div className="w-auto flex items-center space-x-2">
                      <button className="rounded w-10 h-10 th-color-for text-sm flex items-center justify-center border-2 th-border-for" onClick={() => getEtherpadList(key)}>
                        <SearchIcon className="w-5 h-5" />
                      </button>
                      <button className="rounded w-10 h-10 th-color-for text-sm flex items-center justify-center border-2 th-border-for" onClick={handleReset}>
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="w-auto flex items-center space-x-2">
                      <button className="rounded w-10 h-10 th-color-cyan text-sm flex items-center justify-center border-2 th-border-cyan" onClick={() => setOpenAddModal(true)}>
                        <PlusIcon className="w-5 h-5" />
                      </button>
                      <button className="rounded w-10 h-10 th-color-brred text-sm flex items-center justify-center border-2 th-border-brred" onClick={() => setOpenDeletePad(true)}>
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full p-2 flex flex-col items-center justify-between text-sm border-b th-border-for h-80 overflow-y-auto">
                    <div className="w-full p-2 flex items-center justify-between text-sm th-color-for border-b th-border-for">
                      <div className="font-bold w-[20%]">Operation</div>
                      <div className="font-bold w-[20%]">Name</div>
                      <div className="font-bold w-[30%]">Updated At</div>
                      <div className="font-bold w-[10%]">User Count</div>
                      <div className="font-bold w-[10%]">Revisions</div>
                      <div className="font-bold w-[10%]">Size</div>
                    </div>
                    {epads.length === 0 && <div className="w-full text-center text-sm th-color-for">No Epad Files</div>}
                    {epads.length > 0 && (
                      epads.map((p: any, index: number) => (
                        <CheckItem key={index} data={p} handleOpen={handleOpen} handleSelect={handleSelect} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
    {openDeletePad && <DeleteConfirm handleDelete={handleDelete} />}
    {openAddModal && <AddPadModal open={openAddModal} setOpen={setOpenAddModal} handleOpen={handleOpen} getEtherpadList={getEtherpadList} />}
    </>
  );
}
