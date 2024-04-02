import React from 'react'

function HeaderCalendar() {
  return (
    <div className="w-full border-b flex items-center justify-between px-5 py-1 h-14 th-color-selbg th-border-selbg">
      <div className="flex items-center">
        <div className="flex items-center focus:outline-none py-1 pr-2 rounded space-x-2">
          <img src={`${process.env.PUBLIC_URL}/calendar.png`} className="w-4 h-4" alt="calendar" />
          <h5 className="font-bold mr-1 th-color-for max-w-sm truncate">
            My Schedule
          </h5>
        </div>
      </div>
      <div>
      </div>
    </div>
  );
}

export default HeaderCalendar
