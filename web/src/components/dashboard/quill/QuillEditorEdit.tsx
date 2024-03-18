import { Popover } from "@headlessui/react";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import { useTheme } from "contexts/ThemeContext";
import data from "@emoji-mart/data/sets/14/apple.json";
import Picker from "@emoji-mart/react";
import { useMemo } from "react";
import ReactQuill, { Quill } from "react-quill";
import { v4 as uuidv4 } from "uuid";
import "react-quill/dist/quill.snow.css";
import { getGQLServerUrl } from "config";
import { uploadFile } from "gqlite-lib/dist/client/storage";
// #1 import quill-image-uploader
// import ImageUploader from "quill-image-uploader";
// import ImageResize from 'quill-image-resize-module-react';

// #2 register module
// Quill.register("modules/imageUploader", ImageUploader);
// Quill.register('modules/imageResize', ImageResize);

interface EditorProps {
  placeholder: string;
  setFieldValue: any;
  text: string;
  handleSubmit: any;
  editorRef: any;
  forceUpdate: any;
}

function EmojiDropdown({ onEmojiClick }: { onEmojiClick: any }) {
  const { themeColors } = useTheme();
  return (
    <Popover as="div" className="z-10 relative">
      {({ open }) => (
        <>
          <Popover.Button
            as="button"
            className="flex items-center focus:outline-none"
          >
            <EmojiHappyIcon
              style={{ color: themeColors?.foreground }}
              className="h-5 w-5 "
            />
          </Popover.Button>

          {open && (
            <div>
              <Popover.Panel
                static
                className="origin-top-left absolute bottom-0 right-0"
              >
                <Picker
                  data={data}
                  onEmojiSelect={onEmojiClick}
                  locale="zh"
                  title="Emojis"
                  showPreview={false}
                  native
                  set="apple"
                />
              </Popover.Panel>
            </div>
          )}
        </>
      )}
    </Popover>
  );
}

function CustomToolbar({ 
  editorRef, 
  text 
}: { 
  editorRef: any; 
  text: string;
}) {
  const onEmojiClick = (emojiObject: any) => {
    const editor = editorRef?.current?.getEditor();
    const range = editor?.getLength() - 1;
    editor?.insertText(range, emojiObject.native);
  };

  return (
    <div id="toolbar" className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <button className="ql-bold" />
        <button className="ql-italic" />
        <button className="ql-strike" />
        <button className="ql-blockquote" />
        <button className="ql-code" />
        <button className="ql-list" value="ordered" />
        <button className="ql-list" value="bullet" />
        <button className="ql-code-block" />
        <button className="ql-link" />
        <button className="ql-image" />
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <EmojiDropdown onEmojiClick={onEmojiClick} />
      </div>
    </div>
  );
}

export default function EditorEdit({
  placeholder,
  setFieldValue,
  text,
  handleSubmit,
  editorRef,
  forceUpdate,
}: EditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: {
        container: "#toolbar",
      },
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {
          tab: false,
          custom: {
            key: 13,
            shiftKey: true,
            handler: () => {
              handleSubmit();
            },
          },
        },
      },
      // # 4 Add module and upload function
      // imageUploader: {
      //   upload: file => {
      //     return new Promise(async (resolve, reject) => {
      //       const messageId = uuidv4();
      //       // const formData = new FormData();
      //       // formData.append("image", file);
      //       try {
      //         const filePath = await uploadFile(
      //           "messenger",
      //           `Message/${messageId}/${Date.now()}_file`,
      //           file
      //         );
      //         console.log(filePath);
      //         resolve(`${getGQLServerUrl()}${filePath}`);
      //       } catch (error) {
      //         reject("Upload failed");
      //         console.error("Error:", error);
      //       }
  
      //       // fetch(
      //       //   "https://api.imgbb.com/1/upload?key=d36eb6591370ae7f9089d85875e56b22",
      //       //   {
      //       //     method: "POST",
      //       //     body: formData
      //       //   }
      //       // )
      //       //   .then(response => response.json())
      //       //   .then(result => {
      //       //     console.log(result);
      //       //     resolve(result.data.url);
      //       //   })
      //       //   .catch(error => {
      //       //     reject("Upload failed");
      //       //     console.error("Error:", error);
      //       //   });
      //     });
      //   }
      // },
      // imageResize: {
      //   parchment: Quill.import('parchment'),
      //   modules: ['Resize', 'DisplaySize', 'Toolbar']
      // }
    }),
    []
  );

  return (
    <div className="flex flex-col w-full">
      <ReactQuill
        onChange={(e) => {
          setFieldValue("text", e);
          forceUpdate();
        }}
        value={text}
        placeholder={placeholder}
        modules={modules}
        formats={[
          "bold",
          "italic",
          "strike",
          "list",
          "code",
          "link",
          "blockquote",
          "code-block",
          "image",
        ]}
        theme="snow"
        ref={editorRef}
        className="editor"
      />
      <CustomToolbar editorRef={editorRef} text={text} />
    </div>
  );
}
