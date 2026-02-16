import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { CalendarGlobalStyles } from './CalendarStyles';

export interface ResourceCalendarProps {
    events: EventInput[];
    initialDate?: Date;
    onSlotSelect?: (info: DateSelectArg) => void;
    onEventClick?: (info: EventClickArg) => void;
    onEventDrop?: (info: EventDropArg) => void;
    onEventResize?: (info: EventResizeDoneArg) => void;
    readOnly?: boolean;
    height?: string | number;
    headerToolbar?: false | Record<string, string>;
    initialView?: string;
}

export default function ResourceCalendar({
    events,
    initialDate,
    onSlotSelect,
    onEventClick,
    onEventDrop,
    onEventResize,
    readOnly = false,
    height = '100%',
    headerToolbar,
    initialView = 'timeGridWeek',
}: ResourceCalendarProps) {
    const calendarRef = useRef<FullCalendar>(null);

    useEffect(() => {
        if (initialDate && calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(initialDate);
        }
    }, [initialDate]);

    return (
        <div className="h-full relative font-sans">
            <CalendarGlobalStyles />
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={initialView}
                initialDate={initialDate}
                headerToolbar={headerToolbar !== undefined ? headerToolbar : {
                    left: 'title',
                    center: 'prev,today,next',
                    right: 'timeGridWeek,timeGridDay'
                }}
                events={events}
                editable={!readOnly}
                selectable={!readOnly}
                selectMirror={true}
                dayMaxEvents={true}
                allDaySlot={false}
                slotMinTime="07:00:00"
                slotMaxTime="22:00:00"
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                height={height}
                nowIndicator={true}
                eventDisplay="block"
                select={onSlotSelect}
                eventClick={onEventClick}
                eventDrop={onEventDrop}
                eventResize={onEventResize}
                selectOverlap={false}
                eventOverlap={false}
                unselectAuto={true}
                slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                    omitZeroMinute: false, // Force 9:00 AM format if needed, but GCal omits :00 sometimes. FC default is ok.
                }}
                eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                }}
                views={{
                    timeGridWeek: {
                        titleFormat: { year: 'numeric', month: 'long', day: '2-digit' }, // "February 15, 2026"
                        dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true }, // "Sun 15"
                    }
                }}
            />
        </div>
    );
}
