import { DocumentRemoveIcon, TrashIcon } from '@heroicons/react/outline'
import { ReactionsContext } from 'contexts/ReactionsContext';
import useAuth from 'hooks/useAuth';
import { useMessagesByChat } from 'hooks/useMessages';
import React, { useContext, useState } from 'react'
import { useParams } from 'react-router-dom';
import { deleteData } from 'utils/api-helpers';
import classNames from 'utils/classNames';
import DeleteConfirm from './DeleteConfirm';
import MultipleForwardMessage from './MultipleForwardMessage';
import { useModal } from 'contexts/ModalContext';
import { getHref } from 'utils/get-file-url';
import { useTranslation } from 'react-i18next';

export default function SelectFooter() {
  const { t } = useTranslation();
  const { channelId, dmId } = useParams();

  const { value: messages, loading } = useMessagesByChat(
    channelId || dmId,
    1
  );
  const { user } = useAuth();
  const {checkedMessages, setIsSelecting, setVisibleForwardMultiple} = useContext(ReactionsContext);
  const {setOpenMailSender, setEmailRecipient, setEmailBody} = useModal();
  const isDisabled = checkedMessages.length === 0 || checkedMessages.filter((m: any) => m.senderId !== user?.uid).length > 0;
  const isEmailDisabled = checkedMessages.length === 0 || checkedMessages.filter((m: any) => (!m.fileURL || m.fileURL === "")).length > 0;
  const [open, setOpen] = useState(false);

  const handleMultipleDelete = async () => {
    for (const m of checkedMessages) {
      await deleteData(`/messages/${m?.objectId}`);
    }
    setOpen(false);
    setIsSelecting(false);
  }

  const handleOpenEmail = () => {
    let html = '';
    for (const m of checkedMessages) {
      html += `<a href="${getHref(m?.fileURL + '&d=' + m?.fileName)}" target="_blank">${m?.fileName}</a><br />`;
    }
    setOpenMailSender(true);
    setEmailRecipient("");
    setEmailBody(html);
  }
  
  return (
    <>
      <div className="border-t th-border-for flex justify-end items-center px-5 py-3">
        <button className="flex flex-col items-center mr-4 disabled:opacity-50" disabled={isEmailDisabled} onClick={handleOpenEmail}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 th-color-for" fill="currentColor" height="512" viewBox="0 0 512 512" width="512">
            <path d="m222.287 278.4 116.154-116.155a8 8 0 0 1 11.313 11.315l-116.154 116.153 85.551 185.36 163.395-445.619-445.619 163.394z"/>
            <path d="m96 424a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
            <path d="m32 400a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 0 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
            <path d="m120 488a8 8 0 0 1 -5.657-13.657l96-96a8 8 0 1 1 11.314 11.314l-96 96a7.976 7.976 0 0 1 -5.657 2.343z"/>
          </svg>
          <div className="text-xs th-color-for">{t("E-mail")}</div>
        </button>
        <button className="flex flex-col items-center mr-4" onClick={() => setVisibleForwardMultiple(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 th-color-for" fill="currentColor" viewBox="0 0 323.125 323.125">
                <path d="M319.516,145.044l-152.87-92.766c-2.315-1.407-5.21-1.453-7.569-0.124  c-2.361,1.329-3.821,3.827-3.821,6.536v43.082c-15.843,2.401-41.1,7.818-66.708,19.82C31.676,148.247,1.115,193.889,0.171,253.585  l-0.17,10.733c-0.033,2.081,0.8,4.082,2.301,5.525c1.401,1.347,3.265,2.094,5.198,2.094c0.137,0,0.275-0.004,0.413-0.011L24.723,271  c2.628-0.145,4.989-1.657,6.219-3.985l2.643-5.002c21.067-39.875,82.997-55.747,121.67-59.499v41.708  c0,2.709,1.46,5.207,3.821,6.536c2.359,1.328,5.253,1.281,7.569-0.124l152.87-92.766c2.241-1.359,3.609-3.79,3.609-6.412  C323.125,148.834,321.757,146.403,319.516,145.044z M182.868,166.778l-9.856-0.147c-0.513-0.007-1.047-0.012-1.611-0.012  c-25.95,0-79.28,7.039-121.178,31.644c11.29-18.526,28.926-33.521,52.695-44.752c34.699-16.395,70.419-18.619,70.746-18.638  l9.481-0.493c3.985-0.207,7.111-3.499,7.111-7.49v-19.346l72.361,43.911l-72.361,43.911v-21.088  C190.255,170.179,186.965,166.839,182.868,166.778z"/>
              </svg>
          <div className="text-xs th-color-for">{t("Forward")}</div>
        </button>
        <button className="flex flex-col items-center disabled:opacity-50" disabled={isDisabled} onClick={() => setOpen(true)}>
        <TrashIcon className="h-6 w-6 th-color-for" />
          <div className="text-xs th-color-for">{t("Remove")}</div>
        </button>
      </div>
      <DeleteConfirm open={open} setOpen={setOpen} deleteMessage={handleMultipleDelete} />
      <MultipleForwardMessage />
    </>
  )
}
