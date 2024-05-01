import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import CancelButton from "components/CancelButton";
import ModalButton from "components/dashboard/ModalButton";
import TextField from "components/TextField";
import { useModal } from "contexts/ModalContext";
import { Formik } from "formik";
import { updateUser } from "gqlite-lib/dist/client/auth";
import useAuth from "hooks/useAuth";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function RenameBookmark({
  open,
  setOpen,
  item,
  getData,
}: {
  open: boolean;
  setOpen: any;
  item: any;
  getData: any;
}) {
  const cancelButtonRef = useRef(null);
  const [id, setId] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    console.log(item);
    if (item?.id) {
      setId(item?.id);
    }
    if (item?.name) {
      setName(item?.name);
    }
  }, []);

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
            <div className="inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full th-bg-bg">
              <div className=" p-6 pb-4 flex justify-between items-center th-bg-bg border-b th-border-for">
                <h5 className="font-bold th-color-for">
                  Add Bookmark
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpen(false)}
                >
                  <XIcon className="h-5 w-5 th-color-for" />
                </div>
              </div>
              <Formik
                initialValues={{
                  id: item.id,
                  name: item.name,
                }}
                onSubmit={async (
                  { id, name },
                  { setSubmitting }
                ) => {
                  console.log('id: ', id, 'name: ', name);
                  setSubmitting(true);
                  try {
                    if (id === 0 || name === "") {
                      toast.error("Please enter the bookmark name.", {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                      });
                      return;
                    }
                    const response = await fetch('https://uteamwork.com/_api/user/renameWebsite', {
                      method: 'POST',
                      body: JSON.stringify({
                        id,
                        name,
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
                        toast.success('The bookmark has been successfully renamed.', {
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
                      toast.error('Renaming the bookmark has been failed.', {
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
                    setOpen(false);
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
                  setSubmitting(false);
                }}
              >
                {({ values, handleChange, isSubmitting, handleSubmit }) => (
                  <form noValidate onSubmit={handleSubmit}>
                    <div className="p-6 pt-0 pb-4 th-bg-bg">
                      <div className="space-y-6 pt-2">
                        <TextField
                          label="Name"
                          name="name"
                          focus
                          type="text"
                          value={values.name}
                          handleChange={handleChange}
                          placeholder=""
                        />
                      </div>
                    </div>
                    <div className="px-4 pb-2 pt-2 sm:px-6 sm:flex sm:flex-row-reverse border-t th-border-for">
                      <CancelButton setOpen={setOpen} />
                      <ModalButton isSubmitting={isSubmitting} text="Rename" />
                    </div>
                  </form>
                )}
              </Formik>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
