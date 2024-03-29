import { XIcon } from '@heroicons/react/outline'
import { ReactionsContext } from 'contexts/ReactionsContext'
import React, { useContext } from 'react'

export default function SelectHeader() {
  const {checkedMessages, setCheckedMessages, setIsSelecting} = useContext(ReactionsContext);

  const handleSelectCancel = () => {
    setIsSelecting(false);
    setCheckedMessages([]);
  }

  return (
    <div className="border-b th-border-selbg flex justify-between items-center px-5">
      <div className="p-2">
        <div className="font-bold text-base">
          {checkedMessages.length > 1 ? `${checkedMessages.length} messages selected` : `${checkedMessages.length} message selected`}
        </div>
        <div className="text-xs th-color-brwhite"></div>
      </div>
      <button className="th-bg-bg" onClick={handleSelectCancel}>
        <XIcon className="p-2 h-10 w-10" />
      </button>
    </div>
  )
}
