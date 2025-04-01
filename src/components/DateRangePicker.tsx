"use client"

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal bg-black/50 border-white/20"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <>
              {format(startDate, "PPP")} - {format(endDate, "PPP")}
            </>
          ) : (
            <span>Select rental dates</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: startDate || undefined,
            to: endDate || undefined,
          }}
          onSelect={(range) => {
            onStartDateChange(range?.from || null);
            onEndDateChange(range?.to || null);
            if (range?.from && range?.to) {
              setIsCalendarOpen(false);
            }
          }}
          numberOfMonths={2}
          disabled={(date) => {
            // Disable past dates
            return date < new Date();
          }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-md"
        />
      </PopoverContent>
    </Popover>
  );
} 