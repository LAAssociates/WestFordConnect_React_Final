import React from 'react';
import CalendarGrid from '../CalendarGrid';
import type { CalendarEvent } from '../types';

interface CalendarWeekViewProps {
    days: Date[];
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({ days, events, onEventClick }) => {
    return <CalendarGrid days={days} events={events} onEventClick={onEventClick} />;
};

export default CalendarWeekView;

