export const CalendarGlobalStyles = () => (
    <style>{`
        /* --- General Reset & Fonts --- */
        .fc {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            --fc-border-color: #dadce0;
            --fc-now-indicator-color: #ea4335;
            --fc-today-bg-color: transparent;
        }

        /* --- Header / Toolbar --- */
        .fc-header-toolbar {
            margin-bottom: 16px !important;
            padding: 0 4px;
        }

        .fc-toolbar-title {
            font-size: 22px !important;
            font-weight: 500 !important;
            color: #3c4043;
        }

        .fc th {
            border: none !important;
            border-bottom: 1px solid #dadce0 !important;
            padding: 10px 0 !important;
        }
        
        .fc-col-header-cell-cushion {
            color: #70757a;
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.8px;
            text-decoration: none !important;
        }

        .fc .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
            color: #1a73e8;
            font-weight: 700;
        }

        /* --- Buttons (Prev/Next/Today/Views) --- */
        .fc-button {
            border: 1px solid #dadce0 !important;
            background-color: white !important;
            color: #3c4043 !important;
            font-weight: 500 !important;
            text-transform: none !important;
            box-shadow: none !important;
            border-radius: 4px !important;
            padding: 6px 16px !important;
            height: 36px !important;
            line-height: px !important;
            transition: background-color 0.1s, color 0.1s, box-shadow 0.1s !important;
        }
        
        .fc-button:hover {
            background-color: #f1f3f4 !important;
            color: #202124 !important;
        }
        
        .fc-button:active, .fc-button-active {
            background-color: #e8f0fe !important;
            color: #1967d2 !important;
            border-color: #dadce0 !important;
        }
        
        .fc-button-primary:not(:disabled):active, 
        .fc-button-primary:not(:disabled).fc-button-active {
            background-color: #e8f0fe !important;
            color: #1967d2 !important;
        }

        /* Remove icons from prev/next and use Chevron logic via FullCalendar api later if needed, but styling default icons: */
        .fc-icon {
            font-size: 20px !important;
            color: #5f6368;
        }

        /* --- Time Grid --- */
        .fc-timegrid-slot {
            height: 48px !important; /* Taller slots like GCal */
            border-bottom: 1px solid #dadce0 !important;
        }
        
        .fc-timegrid-slot-label-cushion {
            font-size: 11px;
            color: #70757a;
            top: -6px; /* Align time text */
            position: relative;
        }

        .fc-timegrid-axis-cushion {
            font-size: 11px;
            color: #70757a;
        }

        /* Hide the all-day slot if empty/unused or style it */
        .fc-timegrid-allday {
            display: none; /* Often hidden in simple week views */
        }
        
        /* --- Events --- */
        .fc-timegrid-event {
            border: none !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0,0,0,0.24) !important;
            margin: 1px 4px 0 1px !important; /* GCal has slight gap */
            padding: 2px 4px !important;
        }

        .fc-event-main {
            padding: 2px 4px !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
        }

        /* --- Now Indicator --- */
        .fc-timegrid-now-indicator-line {
            border-color: #ea4335 !important;
            border-width: 2px !important;
        }
        
        .fc-timegrid-now-indicator-arrow {
            border-color: #ea4335 !important;
            border-width: 5px 0 5px 6px !important;
            border-left-color: #ea4335 !important;
            margin-top: -5px !important;
        }

    `}</style>
);
