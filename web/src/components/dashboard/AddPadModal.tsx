import { Dialog, Transition } from "@headlessui/react";
import { XIcon } from "@heroicons/react/outline";
import ModalButton from "components/dashboard/ModalButton";
import TextField from "components/TextField";
import { useModal } from "contexts/ModalContext";
import { useTheme } from "contexts/ThemeContext";
import { Formik } from "formik";
import { Fragment, useRef } from "react";
import { useParams } from "react-router-dom";
import { postData } from "utils/api-helpers";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "react-toastify";

export default function AddPadModal({
  open,
  setOpen,
  handleOpen,
  getEtherpadList,
}: {
  open: boolean;
  setOpen: any;
  handleOpen: any;
  getEtherpadList: any;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const cancelButtonRef = useRef(null);
  const { workspaceId } = useParams();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={open}
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
            <div
              style={{ backgroundColor: themeColors?.background }}
              className="inline-block align-bottom rounded-xl border th-border-for text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <div
                style={{ backgroundColor: themeColors?.background }}
                className=" p-6 pb-4 flex justify-between items-center border-b th-border-for"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold"
                >
                  {t("Add_New_Pad")}
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setOpen(false)}
                >
                  <XIcon
                    style={{ color: themeColors?.foreground }}
                    className="h-5 w-5"
                  />
                </div>
              </div>
              <Formik
                initialValues={{
                  padName: "",
                }}
                enableReinitialize
                validationSchema={Yup.object().shape({
                  padName: Yup.string().max(255).required(),
                })}
                onSubmit={async ({ padName }, { setSubmitting, resetForm }) => {
                  setSubmitting(true);
                  try {
                    const response = await axios.post("https://uteamwork.com/_api/etherpad/create", {
                      padName
                    }, {
                      headers: {
                        "Accept": "application/json, text/plain, */*",
                        "Authorization": `Bearer ${localStorage.getItem("t")}`,
                      }
                    });
                    if (response.statusText !== "OK") {
                      toast.error(t('Creating the pad has been failed.'), {
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
                      toast.success(t('The pad has been successfully created.'), {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                      });
                      getEtherpadList("");
                      setOpen(false);
                      resetForm();
                      handleOpen(padName);
                    }
                  } catch (err: any) {
                    toast.error(t('Creating the pad has been failed.'), {
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
                    <div
                      style={{ backgroundColor: themeColors?.background }}
                      className="p-6 pt-0 pb-4"
                    >
                      <div className="space-y-6 pt-2">
                        <TextField
                          label={t("Pad_name")}
                          name="padName"
                          focus
                          value={values.padName}
                          handleChange={handleChange}
                          placeholder={t("Please_input_pad_name")}
                        />
                      </div>
                    </div>
                    <div className="px-4 pb-5 pt-1 sm:px-6 sm:flex sm:flex-row-reverse">
                      <ModalButton isSubmitting={isSubmitting} text={t("Create")} />
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
