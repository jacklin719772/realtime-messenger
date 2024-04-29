import { Dialog, Transition } from '@headlessui/react'
import { CalendarIcon, ClockIcon, SearchIcon, XIcon } from '@heroicons/react/outline';
import axios from 'axios';
import TextField from 'components/TextField';
import { useModal } from 'contexts/ModalContext'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import DatePicker from "react-datepicker";

function CheckItem ({
  data, 
  handleSelect} : {
  data: any;
  handleSelect: any;
}) {
  const [checked, setChecked] = useState(false);
  const checkRef = useRef(null);
  useEffect(() => {
    handleSelect(checked, data);
  }, [checked]);

  return (
    <div className="w-full p-2 flex items-center justify-between text-sm border-b">
      <div className="flex items-center space-x-2">
        <input type="checkbox" ref={checkRef} className="w-5 h-5 rounded th-bg-blue" value={data?.document_id} checked={checked} onChange={(e) => setChecked(!checked)} />
        <div className="font-bold">{data.file_real_name}</div>
      </div>
      <div className="text-xs">{data.size}</div>
    </div>
  )
}

function PrivateFiles() {
  const {openPrivateFiles, setOpenPrivateFiles, checkedPrivateFiles, setCheckedPrivateFiles} = useModal();
  const cancelButtonRef = useRef(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [privateFiles, setPrivateFiles] = useState<any[]>([]);

  const handleSelect = (checked: boolean, data : any) => {
    if (checked) {
      console.log('1');
      setCheckedPrivateFiles([...checkedPrivateFiles, {
        ref_id: data.id,
        file_name: data.file_real_name,
        file_path: data.path,
        size: data.size,
      }]);
    } else {
      console.log('2');
      setCheckedPrivateFiles(checkedPrivateFiles.filter((i: any) => i.ref_id !== data?.id));
    }
  }

  const resetSearch = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setSearch("");
  }

  const handleCancelClick = () => {
    setCheckedPrivateFiles([]);
    setOpenPrivateFiles(false);
  }

  const handleSearch = async () => {
    try {
      const response = await axios.post("https://uteamwork.com/_api/km/getAllMyDoc", {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        search,
      }, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        },
      });
      setPrivateFiles(response.data.result);
    } catch (error: any) {
      console.log(error.message);
      setPrivateFiles([]);
    }
  }

  useEffect(() => {
    handleSearch();
  }, []);
  
  return (
    <Transition.Root show={openPrivateFiles} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={openPrivateFiles}
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
            <div className="th-bg-bg inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="th-bg-bg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center border-b th-border-for">
                <div>
                  <h5 className="font-bold th-color-for">
                    Select Private Files
                  </h5>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={handleCancelClick}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <div className="w-full px-4 py-2 th-color-for">
                <div className="w-full flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2" />
                  <div className="w-auto pr-1">
                    <DatePicker
                      className="text-sm rounded th-color-for border th-border-for th-bg-bg"
                      selected={startDate}
                      name="start_time"
                      placeholderText="2024-04-02"
                      onChange={(date: any) => setStartDate(date)} //only when value has changed
                      dateFormat="yyyy-MM-dd"
                      isClearable={true}
                    />
                  </div>
                  <div className="text-sm pr-1">
                    ~
                  </div>
                  <div className="w-auto pr-1">
                    <DatePicker
                      className="text-sm rounded th-color-for border th-border-for th-bg-bg"
                      selected={endDate}
                      name="end_time"
                      placeholderText="2024-04-02"
                      onChange={(date: any) => setEndDate(date)} //only when value has changed
                      dateFormat="yyyy-MM-dd"
                      isClearable={true}
                    />
                  </div>
                  <div className="w-[40%] pr-1">
                    <TextField
                      value={search}
                      handleChange={(e: any) => setSearch(e.target.value)}
                      type="text"
                      label=""
                      name="search"
                      autoComplete="search"
                      placeholder="Please input text for searching"
                    />
                  </div>
                  <div className="w-auto flex items-center space-x-1">
                    <button className="rounded w-10 h-10 th-border-for text-sm flex items-center justify-center border th-border-for" onClick={handleSearch}>
                      <SearchIcon className="w-5 h-5" />
                    </button>
                    <button className="rounded w-10 h-10 th-border-for text-sm flex items-center justify-center border th-border-for" onClick={resetSearch}>
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full px-4 pb-2 h-60 overflow-y-auto flex flex-col items-center th-color-for">
                {privateFiles.length === 0 && <div className="w-full text-center text-sm">No Private Files</div>}
                {privateFiles.length > 0 && (
                  privateFiles.map((p: any, index: number) => (
                    <CheckItem data={p} handleSelect={handleSelect} />
                  ))
                )}
              </div>
              <div className="px-4 pb-3 pt-2 border-t th-border-for sm:px-6 sm:flex sm:flex-row-reverse sm:justify-start">
                <button onClick={handleCancelClick} className="th-bg-bg th-color-for th-border-for border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none ml-2">
                  Cancel
                </button>
                <button onClick={() => setOpenPrivateFiles(false)} className="th-bg-bg th-color-cyan th-border-cyan border-2 text-sm w-20 h-10 rounded font-bold focus:z-10 focus:outline-none">
                  Select
                </button>
                {/* <ModalButton onClick={deleteMessage} text="Delete" />
                <ModalButton onClick={() => setOpen(false)} text="Cancel" /> */}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default PrivateFiles
