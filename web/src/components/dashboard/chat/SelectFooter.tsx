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

export default function SelectFooter() {
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
          <div className="text-xs th-color-for">E-mail</div>
        </button>
        <button className="flex flex-col items-center mr-4" onClick={() => setVisibleForwardMultiple(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 th-color-for" fill="currentColor" height="384pt" viewBox="0 0 384 384" width="384pt">
            <path d="m192 0c-105.863281 0-192 86.128906-192 192 0 105.863281 86.136719 192 192 192s192-86.136719 192-192c0-105.871094-86.136719-192-192-192zm0 352c-88.222656 0-160-71.777344-160-160s71.777344-160 160-160 160 71.777344 160 160-71.777344 160-160 160zm0 0"/><path d="m276.847656 141.089844-28.28125 28.285156-33.941406-33.941406 28.277344-28.28125-22.621094-22.632813-28.28125 28.28125-28.28125-28.28125-22.621094 22.632813 28.277344 28.28125-33.941406 33.941406-28.28125-28.285156-22.625 22.628906 28.28125 28.28125-28.28125 28.28125 22.625 22.621094 28.28125-28.277344 33.941406 33.941406-28.277344 28.28125 22.621094 22.625 28.28125-28.28125 28.28125 28.28125 22.621094-22.625-28.277344-28.28125 33.941406-33.941406 28.28125 28.277344 22.625-22.621094-28.28125-28.28125 28.28125-28.28125zm-84.847656 84.855468-33.945312-33.945312 33.945312-33.945312 33.945312 33.945312zm0 0"/>
          </svg>
          <div className="text-xs th-color-for">Forward</div>
        </button>
        <button className="flex flex-col items-center disabled:opacity-50" disabled={isDisabled} onClick={() => setOpen(true)}>
        <TrashIcon className="h-6 w-6 th-color-for" />
          <div className="text-xs th-color-for">Remove</div>
        </button>
      </div>
      <DeleteConfirm open={open} setOpen={setOpen} deleteMessage={handleMultipleDelete} />
      <MultipleForwardMessage />
    </>
  )
}
