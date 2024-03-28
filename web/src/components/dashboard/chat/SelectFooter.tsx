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
      <div className="border-t th-border-selbg flex justify-end items-center px-5 py-3">
        <button className="flex flex-col items-center mr-4 disabled:opacity-50" disabled={isEmailDisabled} onClick={handleOpenEmail}>
          <img className="h-6 w-6" alt="forward" src="/send_email.png" />
          <div className="text-xs">E-mail</div>
        </button>
        <button className="flex flex-col items-center mr-4" onClick={() => setVisibleForwardMultiple(true)}>
          <img className="h-6 w-6" alt="forward" src="/forward.png" />
          <div className="text-xs">Forward</div>
        </button>
        <button className="flex flex-col items-center disabled:opacity-50" disabled={isDisabled} onClick={() => setOpen(true)}>
        <TrashIcon className="h-6 w-6" />
          <div className="text-xs">Remove</div>
        </button>
      </div>
      <DeleteConfirm open={open} setOpen={setOpen} deleteMessage={handleMultipleDelete} />
      <MultipleForwardMessage />
    </>
  )
}
