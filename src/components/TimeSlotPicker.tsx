"use client"

import { useState, useEffect } from "react";
import { format, addMinutes, parse, isAfter, isBefore, isEqual, set } from "date-fns";
import { Clock } from "lucide-react";

interface TimeSlotPickerProps {
  value: string | null;
  onChange: (time: string) => void;
  date: Date | null;
  shopHours?: {
    open: string;
    close: string;
  } | null;
  interval?: number; // in minutes
  minTime?: string; // HH:mm format
  maxTime?: string; // HH:mm format
  disabled?: boolean;
}

export default function TimeSlotPicker({
  value,
  onChange,
  date,
  shopHours = { open: "08:00", close: "18:00" },
  interval = 30,
  minTime,
  maxTime,
  disabled = false
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(value);

  // Generate time slots based on shop hours and interval
  useEffect(() => {
    if (!shopHours) return;

    const slots: string[] = [];
    const today = new Date();
    const isToday = date && 
      today.getDate() === date.getDate() && 
      today.getMonth() === date.getMonth() && 
      today.getFullYear() === date.getFullYear();

    // Parse shop hours
    let startTime = parse(shopHours.open, "HH:mm", new Date());
    const endTime = parse(shopHours.close, "HH:mm", new Date());

    // If the date is today, don't show past times
    if (isToday) {
      const currentTime = new Date();
      // Round up to the nearest interval
      const minutes = currentTime.getMinutes();
      const roundedMinutes = Math.ceil(minutes / interval) * interval;
      const roundedTime = set(currentTime, { 
        minutes: roundedMinutes, 
        seconds: 0, 
        milliseconds: 0 
      });
      
      // If rounded time is after start time, use rounded time as start
      if (isAfter(roundedTime, startTime)) {
        startTime = roundedTime;
      }
    }

    // Apply minTime if provided and it's after startTime
    if (minTime) {
      const minTimeDate = parse(minTime, "HH:mm", new Date());
      if (isAfter(minTimeDate, startTime)) {
        startTime = minTimeDate;
      }
    }

    // Apply maxTime if provided and it's before endTime
    let actualEndTime = endTime;
    if (maxTime) {
      const maxTimeDate = parse(maxTime, "HH:mm", new Date());
      if (isBefore(maxTimeDate, endTime)) {
        actualEndTime = maxTimeDate;
      }
    }

    // Generate time slots
    let currentTime = startTime;
    while (isBefore(currentTime, actualEndTime) || isEqual(currentTime, actualEndTime)) {
      slots.push(format(currentTime, "HH:mm"));
      currentTime = addMinutes(currentTime, interval);
    }

    setTimeSlots(slots);
  }, [shopHours, interval, date, minTime, maxTime]);

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onChange(time);
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-2">
        <Clock className="mr-2 h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Select Pickup Time</span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {timeSlots.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => handleTimeSelect(time)}
            disabled={disabled}
            className={`
              py-2 px-3 text-sm rounded-md transition-colors
              ${selectedTime === time 
                ? 'bg-primary text-white' 
                : 'bg-white/5 hover:bg-white/10 text-white/80'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {time}
          </button>
        ))}
      </div>
      
      {timeSlots.length === 0 && (
        <p className="text-sm text-white/60 mt-2">
          No available time slots for the selected date.
        </p>
      )}
      
      <p className="text-xs text-white/60 mt-3">
        Please arrive on time. Your booking will be automatically cancelled if you're more than 30 minutes late.
      </p>
    </div>
  );
}
