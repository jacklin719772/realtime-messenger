import React, { useEffect, useState } from 'react'
import locale from '@fullcalendar/core/locales/zh-cn';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import multiMonthPlugin from '@fullcalendar/multimonth'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import HeaderCalendar from './HeaderCalendar';
import axios from 'axios';
import { StandardEvent } from '@fullcalendar/core/internal';
import Style from 'components/Style';

const renderEventContent = (eventInfo: any) => {
  return (
    <>
      <span className="text-xs">{eventInfo.timeText}&nbsp;</span>
      <span className="text-xs">{eventInfo.event.title}</span>
    </>
  )
}

interface EventProps {
  id: string;
  start: Date;
  title: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

function CalendarView() {

  const [allMeeting, setAllMeeting] = useState<any[]>([]);
  const [events, setEvents] = useState<EventProps[]>([]);
  const [dateEvents, setDateEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("zh-CN", {day: "numeric", month: "long"}));
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString("zh-CN", {weekday: "long"}));

  const getAllMeeting =async () => {
    try {
      const response = await axios.post("https://www.uteamwork.com/_api/meeting/getAllMeeting", {}, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        },
      });
      console.log(response.data);
      setAllMeeting(response.data.result);
      const todayEvents = response.data.result.filter((m: any) => new Date(m.start_time).toLocaleDateString() === new Date().toLocaleDateString());
      setDateEvents(todayEvents);
    } catch (error) {
      setAllMeeting([]);
    }
  }

  const handleDateClick = (info: any) => {
    const eventsOfDay = allMeeting.filter((m: any) => new Date(m.start_time).toLocaleDateString() === new Date(info.dateStr).toLocaleDateString());
    setDateEvents(eventsOfDay);
    setSelectedDate(info.date.toLocaleDateString("zh-CN", {day: "numeric", month: "long"}));
    setSelectedDay(info.date.toLocaleDateString("zh-CN", {weekday: "long"}));
  }

  const handleEventClick = (info: any) => {
    console.log(info);
  }

  useEffect(() => {
    getAllMeeting();
  }, []);

  useEffect(() => {
    if (allMeeting.length > 0) {
      const formattedData = allMeeting.map((item: any) => ({
        id: item.meetingId ? item.meetingId : item.id,
        start: new Date(item.start_time),
        end: new Date(item.end_time),
        title: item.title,
        backgroundColor: item.meetingId ? '#00acac' : '#0078d4',
        borderColor: item.meetingId ? '#00acac' : '#0078d4',
        textColor: '#ffffff',
      }));
      setEvents(formattedData);
    }
  }, [allMeeting])

  return (
    <div className="col-span-2 flex flex-col row-span-2 overflow-hidden">
      <Style css={`
        .fc .fc-view-harness {
          height: 430px !important;
          overflow-y: auto;
        }
        .fc .fc-view-harness > .fc-dayGridMonth-view.fc-view.fc-daygrid {
          height: 600px !important;
          overflow-y: auto;
        }
        .fc table {
          font-size: 0.875rem !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.5rem !important;
        }
        .fc .fc-button {
          font-size: 0.875rem !important;
        }
        .fc .fc-button-primary {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        .fc .fc-button-primary:hover {
          color: #fff;
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active {
          color: #fff;
          background-color: rgb(86, 139, 253);
          border-color: rgb(86, 139, 253);
        }
        .fc-day-sun a {
          color: #ff4040 !important;
        }
      `} />
      <HeaderCalendar />
      <div className="flex flex-col overflow-y-auto">
        <div className="w-full p-2 flex">
          <div className="overflow-y-auto w-[70%] p-2">
            <FullCalendar
              firstDay={0}
              locale={locale}
              plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin, multiMonthPlugin]}
              initialView='dayGridMonth'
              weekends={true}
              events={events}
              eventContent={renderEventContent}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear myCustomButton'
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventDisplay=''
              customButtons={{
                myCustomButton: {
                  text: 'New',
                  click: () => {
                    console.log('clicked the new button');
                  }
                }
              }}
              dateClick={(info: any) => handleDateClick(info)}
              eventClick={(info: any) => handleEventClick(info)}
              eventBackgroundColor='#378006'
              eventBorderColor='#378006'
              eventTextColor='#ffffff'
              selectable={true}
            />
          </div>
          <div className="w-[30%] p-2">
            <div className="flex flex-col items-center h-full overflow-y-auto">
              <div className="w-full text-center text-xl pt-2 pb-6">
                {selectedDate} {selectedDay}
              </div>
              <div className="w-full pt-2 h-full border">
                {dateEvents.map((de: any, index: number) => (
                  <div className="border-b px-2 py-1">
                    <div className="border-l-4 th-border-blue flex items-center">
                      <div className="px-2 w-20 text-sm">
                        <div>
                          {new Date(de?.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </div>
                        <div>
                          {new Date(de?.end_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </div>
                      </div>
                      <div className="px-2 w-auto text-sm">{de?.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarView
