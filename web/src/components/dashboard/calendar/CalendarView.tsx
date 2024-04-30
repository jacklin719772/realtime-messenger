import React, { useEffect, useRef, useState } from 'react'
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
import ScheduleView from './ScheduleView';
import { useModal } from 'contexts/ModalContext';
import EditSchedule from './EditSchedule';
import PrivateFiles from './PrivateFiles';
import RecordingFiles from './RecordingFiles';
import EditMeeting from './EditMeeting';
import { useLocation } from 'react-router-dom';
import classNames from 'utils/classNames';
import DeleteConfirm from './DeleteConfirm';
import { toast } from 'react-toastify';
import { useTheme } from 'contexts/ThemeContext';

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

function CalendarView({
  isOwner,
  ownerData,
}: {
  isOwner: boolean;
  ownerData?: any;
}) {
  const location = useLocation();
  const teamcal = location.pathname?.includes("teamcal");
  
  const { themeColors } = useTheme();

  const [allMeeting, setAllMeeting] = useState<any[]>([]);
  const [events, setEvents] = useState<EventProps[]>([]);
  const [dateEvents, setDateEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString("zh-CN", {day: "numeric", month: "long"}));
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString("zh-CN", {weekday: "long"}));
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const {openEditSchedule, setOpenEditSchedule, openEditMeeting, setOpenEditMeeting, openPrivateFiles, openRecordingFiles, openDeleteEvent, setOpenDeleteEvent} = useModal();
  console.log(!teamcal || isOwner);

  const calendarRef = useRef<any>(null);

  const getAllMeeting =async () => {
    try {
      let response;
      if (!teamcal || isOwner) {
        response = await axios.post("https://www.uteamwork.com/_api/meeting/getAllMeeting", {}, {
          headers: {
            "Accept": "application/json, text/plain, */*",
            "Authorization": `Bearer ${localStorage.getItem("t")}`,
          },
        });
      } else {
        response = await axios.post("https://www.uteamwork.com/_api/meeting/getAllMeeting2", {
          id: ownerData.memberId,
          email: ownerData.email,
        }, {
          headers: {
            "Accept": "application/json, text/plain, */*",
          },
        });
      }
      console.log(response.data);
      const filteredResult = teamcal ? response.data.result.filter((m: any) => m.title.includes("--teamcal")) : response.data.result.filter((m: any) => !m.title.includes("--teamcal"));
      setAllMeeting(filteredResult);
      const todayEvents = filteredResult.filter((m: any) => new Date(m.start_time).toLocaleDateString() === new Date().toLocaleDateString());
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

  const handleEventClick = (id: any) => {
    setSelectedEvent(allMeeting.filter((m: any) => (m.meetingId ? m.meetingId.toString() === id.toString() : m.id.toString() === id.toString()))[0]);
    if (!teamcal || isOwner) {
      setOpen(true);
    }
  }

  const handleDelete = async (event: any) => {
    try {
      const response = await axios.post("https://www.uteamwork.com/_api/event/del", {
        id: event.id,
        is_all_repeat: event.is_all_repeat ? 1 : 0,
      }, {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Authorization": `Bearer ${localStorage.getItem("t")}`,
        },
      });
      if (response.statusText !== "OK") {
        toast.error('Deleting the event has been failed.', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      if (response.statusText === "OK") {
        toast.success('The event has been successfully deleted.', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      setOpenDeleteEvent(false);
    } catch (error: any) {
      toast.error(error.message, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }

  useEffect(() => {
    if (!openEditSchedule && !openEditMeeting) {
      getAllMeeting();
    }
  }, [openEditSchedule, openEditMeeting]);

  useEffect(() => {
    if (!openDeleteEvent) {
      getAllMeeting();
    }
  }, [openDeleteEvent]);

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
    <div className={classNames(teamcal ? "" : "col-span-2", "flex flex-col row-span-2 overflow-hidden m-2 ml-0 th-bg-bg rounded-xl border th-border-for")}>
      <Style css={`
        .fc .fc-view-harness {
          height: 360px !important;
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
        .fc-day-sun a, .fc-day-sat a {
          color: #ff4040 !important;
        }
        .fc .fc-daygrid-day.fc-day-today, .fc .fc-timegrid-col.fc-day-today {
          background-color: ${themeColors?.selectionBackground}
        }
        .fc .fc-multimonth-singlecol .fc-multimonth-header, .fc .fc-multimonth-daygrid {
          background-color: ${themeColors?.background}
        }
      `} />
      <HeaderCalendar />
      <div className="flex flex-col overflow-y-auto">
        <div className="w-full p-2 md:flex">
          <div className="overflow-y-auto w-full md:w-[70%] p-2 th-color-for">
            <FullCalendar
              firstDay={0}
              locale={locale}
              plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin, multiMonthPlugin]}
              initialView='dayGridMonth'
              weekends={true}
              events={events}
              eventContent={renderEventContent}
              headerToolbar={{
                left: 'prev,next todayButton',
                center: 'title',
                right: (!teamcal || isOwner) ? 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear myCustomButton' : 'dayGridMonth,timeGridWeek,timeGridDay,multiMonthYear'
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              eventDisplay=''
              customButtons={{
                myCustomButton: {
                  text: '+ Event',
                  click: () => {
                    setSelectedEvent(null);
                    setOpenEditSchedule(true);
                  }
                },
                myCustomButton2: {
                  text: '+ Meeting',
                  click: () => {
                    setSelectedEvent(null);
                    setOpenEditMeeting(true);
                  }
                },
                todayButton: {
                  text: 'Today',
                  click: () => {
                    if (calendarRef.current) {
                      console.log(calendarRef.current.getApi().view);
                      if (calendarRef.current.getApi().view.type === "multiMonthYear") {
                        calendarRef.current.getApi().changeView('dayGridMonth', new Date().toISOString().split("T")[0]);
                      } else {
                        calendarRef.current.getApi().today();
                      }
                    }
                  }
                }
              }}
              dateClick={(info: any) => handleDateClick(info)}
              eventClick={(info: any) => handleEventClick(info.event.id)}
              eventBackgroundColor='#378006'
              eventBorderColor='#378006'
              eventTextColor='#ffffff'
              selectable={true}
              dayMaxEvents={true}
              ref={calendarRef}
            />
          </div>
          <div className="w-full md:w-[30%] p-2">
            <div className="flex flex-col items-center h-full overflow-y-auto">
              <div className="w-full text-center text-xl pt-2 pb-6 th-color-for">
                {selectedDate} {selectedDay}
              </div>
              <div className="w-full pt-2 h-full border th-border-for rounded-xl">
                {
                  dateEvents.length > 0 ? (
                    <>
                    {dateEvents.map((de: any, index: number) => (
                      <div className="border-b px-2 py-1 cursor-pointer" onClick={() => handleEventClick(de.meetingId ? de.meetingId : de.id)}>
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
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center pt-10">
                      <img src={`${process.env.PUBLIC_URL}/no_event.png`} alt="no events" className="w-[40%] h-auto" />
                      <div className="text-sm th-color-for">No events for today</div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      {open && <ScheduleView open={open} setOpen={setOpen} event={selectedEvent} deleteEvent={handleDelete} />}
      {openEditSchedule && <EditSchedule event={selectedEvent} />}
      {openEditMeeting && <EditMeeting event={selectedEvent} />}
      {openPrivateFiles && <PrivateFiles />}
      {openRecordingFiles && <RecordingFiles />}
      {openDeleteEvent && <DeleteConfirm event={selectedEvent} deleteEvent={handleDelete} />}
    </div>
  )
}

export default CalendarView
