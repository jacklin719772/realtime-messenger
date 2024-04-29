import { StopIcon, XIcon } from '@heroicons/react/outline'
import { useModal } from 'contexts/ModalContext'
import React from 'react'

function MinimizedView() {
  const {setOpenEtherpad, setEtherpadMinimized, currentPadName} = useModal();
  const handleClose = () => {
    setOpenEtherpad(false);
    setEtherpadMinimized(false);
  }
  return (
    <div className="absolute w-30 h-8 flex items-center rounded border th-border-for th-color-for shadow top-40 right-10 space-x-2 p-2 th-bg-bg">
      <div className="w-1/2 flex items-center">
        <div className="text-sm font-bold truncate">{currentPadName}</div>
      </div>
      <div className="w-1/4 flex justify-center">
        <StopIcon className="w-6 h-6 cursor-pointer" onClick={() => setEtherpadMinimized(false)} />
      </div>
      <div className="w-1/4 flex justify-center">
        <XIcon className="w-6 h-6 cursor-pointer" onClick={handleClose} />
      </div>
    </div>
  )
}

export default MinimizedView
