import React from 'react';
import { Components, EventProps, EventWrapperProps, DateHeaderProps, ToolbarProps } from 'react-big-calendar';

// Type for event in our application
interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  isBlocked?: boolean;
  resource: any;
}

// Custom event component with tooltip
export const CustomEventComponent: React.FC<EventProps<BookingEvent>> = ({ 
  event 
}) => {
  return (
    <div title={`${event.title}${event.isBlocked ? ' (Blocked)' : ''}`} className="custom-event">
      {event.title}
    </div>
  );
};

// Custom event wrapper to handle overlapping events
export const CustomEventWrapperComponent: React.FC<EventWrapperProps<BookingEvent>> = ({ 
  event,
  children
}) => {
  // Add custom class based on event type
  const classNames = ['custom-event-wrapper'];
  
  if (event.isBlocked) {
    classNames.push('blocked-event');
  } else if (event.status) {
    classNames.push(`status-${event.status}`);
  }
  
  return (
    <div className={classNames.join(' ')} title={event.title}>
      {children}
    </div>
  );
};

// Custom date cell component with proper typings
export const CustomDateCellComponent: React.FC<{ value: Date; children: React.ReactNode }> = ({ 
  value, 
  children 
}) => {
  // Format the date to display just the day
  const day = value.getDate();
  
  return (
    <div className="custom-date-cell">
      <div className="date-header">{day}</div>
      <div className="events-container">{children}</div>
    </div>
  );
};

// Custom month header
export const CustomMonthHeader: React.FC<DateHeaderProps> = ({ 
  date, 
  label 
}) => {
  return (
    <div className="custom-month-header">
      {label}
    </div>
  );
};

// Helper to get number of events for a specific date
export const getDayEventCount = (date: Date, events: BookingEvent[]) => {
  return events.filter(event => 
    event.start.getDate() === date.getDate() && 
    event.start.getMonth() === date.getMonth() && 
    event.start.getFullYear() === date.getFullYear()
  ).length;
};

// Custom toolbar for better mobile experience
export const CustomToolbar: React.FC<ToolbarProps<BookingEvent>> = (props) => {
  const goToBack = () => {
    props.onNavigate('PREV');
  };

  const goToNext = () => {
    props.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    props.onNavigate('TODAY');
  };

  return (
    <div className="custom-toolbar">
      <div className="toolbar-section">
        <button type="button" onClick={goToCurrent} className="today-button">
          Today
        </button>
        <div className="navigate-buttons">
          <button type="button" onClick={goToBack}>
            <span>←</span>
          </button>
          <button type="button" onClick={goToNext}>
            <span>→</span>
          </button>
        </div>
      </div>
      <div className="toolbar-date">
        <span>{props.label}</span>
      </div>
      <div className="view-buttons">
        {props.views.map((view: string) => (
          <button
            key={view}
            type="button"
            onClick={() => props.onView(view)}
            className={view === props.view ? 'active' : ''}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}; 