import { XIcon } from '@heroicons/react/outline';
import React from 'react'
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

function HeaderCalendar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const teamcal = location.pathname.includes("/teamcal");

  return (
    <div className="w-full border-b flex items-center justify-between px-5 py-1 h-14 th-color-selbg th-border-for">
      <div className="flex items-center">
        <div className="flex items-center focus:outline-none py-1 pr-2 rounded space-x-2">
          <img src={`${process.env.PUBLIC_URL}/calendar.png`} className="w-4 h-4" alt="calendar" />
          <h5 className="font-bold mr-1 th-color-for max-w-sm truncate">
            {!teamcal ? t("My_calendar") : t("Channel_Calendar")}
          </h5>
        </div>
      </div>
      <div>
        {teamcal && (
          <button
            className="th-bg-bg th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded font-extrabold focus:z-10 focus:outline-none"
            onClick={() => navigate(location.pathname.split("/teamcal")[0])}
          >
            <XIcon
              className="h-5 w-5 th-color-for"
            />
          </button>
        )}
        {!teamcal && (
          <button
            className="th-bg-bg th-color-for inline-flex justify-center items-center text-sm w-10 h-10 rounded font-extrabold focus:z-10 focus:outline-none"
            onClick={() => navigate(-1)}
          >
            <XIcon
              className="h-5 w-5 th-color-for"
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default HeaderCalendar
