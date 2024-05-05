import QuillEditorEdit from "components/dashboard/quill/QuillEditorEdit";
import Spinner from "components/Spinner";
import { MESSAGE_MAX_CHARACTERS } from "config";
import { useTheme } from "contexts/ThemeContext";
import { Formik } from "formik";
import { useForceUpdate } from "lib/hooks";
import React, { useRef } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { postData } from "utils/api-helpers";

function EditMessageFooter({
  setEdit,
  isSubmitting,
  errors,
  dirty,
  editorRef,
  text,
}: {
  setEdit: any;
  isSubmitting: any;
  errors: any;
  dirty: any;
  editorRef: any;
  text: string;
}) {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const editor = editorRef?.current?.getEditor();
  const realText = editor?.getText() as string | null | undefined;
  const isText = realText?.trim();

  return (
    <div className="flex items-center space-x-2 mt-1">
      <button
        type="button"
        className="border border-gray-500 font-medium th-bg-brwhite text-sm px-2 py-px rounded"
        onClick={() => setEdit(false)}
      >
        {t("Cancel")}
      </button>
      <button
        className="border border-gray-500 font-medium flex items-center text-sm th-color-brwhite px-3 py-px rounded disabled:opacity-50"
        disabled={isSubmitting || (!isText && !text.includes("src=\"http")) || !dirty}
        style={{
          backgroundColor:
            errors.text && isText ? themeColors?.red : themeColors?.blue,
        }}
      >
        {isSubmitting && <Spinner className="th-color-brwhite mr-2 h-3 w-3" />}
        {!isSubmitting && (
          <>
            {errors.text && isText ? (
              <span className="th-color-brwhite">
                {MESSAGE_MAX_CHARACTERS - isText.length}
              </span>
            ) : (
              t("Save")
            )}
          </>
        )}
      </button>
    </div>
  );
}

export default function EditMessage({
  message,
  setEdit,
}: {
  message: any;
  setEdit: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { t } = useTranslation();
  const forceUpdate = useForceUpdate();

  const editorRef = useRef<any>(null);

  const validate = () => {
    const errors: any = {};

    const editor = editorRef?.current?.getEditor();
    const realText = editor?.getText() as string | null | undefined;

    if (realText && realText.trim().length > MESSAGE_MAX_CHARACTERS)
      errors.text = `Message is too long. Max ${MESSAGE_MAX_CHARACTERS} characters.`;

    return errors;
  };

  return (
    <Formik
      initialValues={{
        text: message?.text,
      }}
      validate={validate}
      enableReinitialize
      onSubmit={async ({ text }, { setSubmitting }) => {
        setSubmitting(true);
        try {
          const editor = editorRef?.current?.getEditor();
          const realText = editor?.getText() as string | null | undefined;
          if (!realText?.trim() && !text.includes("src=\"http")) return;
          await postData(`/messages/${message?.objectId}`, {
            text,
          });
          setEdit("");
        } catch (err: any) {
          toast.error(t("Editing message failed."));
        }
        setSubmitting(false);
      }}
    >
      {({
        values,
        setFieldValue,
        handleSubmit,
        isSubmitting,
        dirty,
        errors,
      }) => (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="w-full h-full flex flex-col"
        >
          <div className="w-full h-full border border-gray-500 rounded flex flex-col items-center bg-white">
            <QuillEditorEdit
              editorRef={editorRef}
              text={values.text}
              setFieldValue={setFieldValue}
              placeholder={t("Send a message")}
              handleSubmit={handleSubmit}
              forceUpdate={forceUpdate}
            />
          </div>
          <EditMessageFooter
            setEdit={setEdit}
            editorRef={editorRef}
            isSubmitting={isSubmitting}
            dirty={dirty}
            errors={errors}
            text={values.text}
          />
        </form>
      )}
    </Formik>
  );
}
