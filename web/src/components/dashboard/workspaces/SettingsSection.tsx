import CancelButton from "components/CancelButton";
import ConfirmationModal from "components/ConfirmationModal";
import ModalButton from "components/dashboard/ModalButton";
import TextField from "components/TextField";
import { useModal } from "contexts/ModalContext";
import { useUser } from "contexts/UserContext";
import { Formik } from "formik";
import { uploadFile } from "gqlite-lib/dist/client/storage";
import { useMyWorkspaces } from "hooks/useWorkspaces";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { deleteData, postData } from "utils/api-helpers";
import { getHref } from "utils/get-file-url";
import now from "utils/now";

export default function SettingsSection({ workspace }: { workspace: any }) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const fileRef = useRef<any>(null);
  const { openWorkspaceSettings: open, setOpenWorkspaceSettings: setOpen } =
    useModal();
  const { value: workpspaces } = useMyWorkspaces();
  const workspacePhotoURL = getHref(workspace?.photoURL);
  const { user } = useUser();
  const navigate = useNavigate();
  const owner = user?.uid === workspace?.ownerId;

  const [openDeleteWorkspaceModal, setOpenDeleteWorkspaceModal] =
    useState(false);

  useEffect(() => {
    if (photo) setPhotoUrl(URL.createObjectURL(photo));
    else setPhotoUrl("");
  }, [photo]);

  useEffect(() => {
    if (open) {
      setPhoto(null);
      setPhotoUrl("");
    }
  }, [open]);

  const handleSavePicture = async () => {
    try {
      const path = await uploadFile(
        "messenger",
        `Workspace/${workspace.objectId}/${now()}_photo`,
        photo!
      );
      return path;
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const handleDeletePicture = async () => {
    try {
      await postData(`/workspaces/${workspace?.objectId}`, {
        photoPath: "",
      });
      setPhoto(null);
      setPhotoUrl("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      if (workpspaces?.length === 1) {
        await deleteData(`/workspaces/${workspace.objectId}`);
      } else {
        deleteData(`/workspaces/${workspace.objectId}`);
        navigate("/");
      }
      toast.success(t("Workspace deleted."));
      setOpen(false);
    } catch (err: any) {
      toast.error(t("Deleting workspace failed."));
    }
  };

  return (
    <>
      <Formik
        initialValues={{
          name: workspace?.name || "",
          details: workspace?.details || "",
        }}
        enableReinitialize
        onSubmit={async ({ name, details }, { setSubmitting }) => {
          setSubmitting(true);
          try {
            await postData(`/workspaces/${workspace.objectId}`, {
              ...(name !== workspace?.name && {
                name,
              }),
              ...(details !== workspace?.details && {
                details,
              }),
              ...(photoUrl && { photoPath: await handleSavePicture() }),
            });
            setOpen(false);
          } catch (err: any) {
            toast.error(t("Updating workspace failed."));
          }
          setSubmitting(false);
        }}
      >
        {({ values, handleChange, isSubmitting, handleSubmit }) => (
          <form
            className="flex flex-col h-full pb-6"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="p-6 pt-0 pb-6 grid grid-cols-3 th-bg-bg">
              <div className="col-span-2 space-y-6">
                <TextField
                  label={t("Workspace_name")}
                  name="name"
                  value={values.name}
                  handleChange={handleChange}
                  placeholder={t("Workspace_name")}
                  disabled={!owner}
                />
                <TextField
                  label={t("Description")}
                  name="details"
                  value={values.details}
                  handleChange={handleChange}
                  placeholder={t("Description")}
                />
              </div>
              <div className="col-span-1 flex flex-col items-center pl-7">
                <h4 className="block text-sm font-bold th-color-for">
                  {t("Workspace_icon")}
                </h4>
                <input
                  ref={fileRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.item(0))}
                />
                <div
                  className="rounded bg-cover h-32 w-32 mt-2 mb-2"
                  style={{
                    backgroundImage: `url(${
                      photoUrl ||
                      workspacePhotoURL ||
                      `${process.env.PUBLIC_URL}/blank_workspace.png`
                    })`,
                  }}
                />
                <button
                  type="button"
                  className="th-bg-cyan th-color-brwhite w-44 inline-flex justify-center py-2 px-4 text-base font-bold rounded focus:outline-none focus:ring-4 focus:ring-blue-200 mt-6 sm:w-auto sm:text-sm"
                  onClick={() => fileRef?.current?.click()}
                >
                  {t("Upload_an_Image")}
                </button>
                {workspacePhotoURL && (
                  <button
                    type="button"
                    className="w-44 text-center text-sm mt-3 th-color-blue"
                    onClick={handleDeletePicture}
                  >
                    {t("Remove photo")}
                  </button>
                )}
              </div>
            </div>
            <div className="pt-5 px-6 flex flex-row-reverse border-t mt-auto th-border-for">
              <ModalButton text={t("Save")} isSubmitting={isSubmitting} />
              <CancelButton setOpen={setOpen} />
            </div>
          </form>
        )}
      </Formik>
    </>
  );
}
