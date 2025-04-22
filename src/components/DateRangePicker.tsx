"use client"

import { useState, useEffect } from "react";
import { format, isWithinInterval, addDays, isSameDay } from "date-fns";
import { CalendarIcon, AlertCircle, XCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Import the DateRange type
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  vehicleId?: string;
  showAvailabilityIndicator?: boolean;
}

interface BookedPeriod {
  startDate: Date;
  endDate: Date;
}

// Define day object type
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  isBooked?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  isInSelectedRange?: boolean;
  isSelectionStart?: boolean;
  isSelectionEnd?: boolean;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  vehicleId,
  showAvailabilityIndicator = true,
}: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [bookedPeriods, setBookedPeriods] = useState<BookedPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionInProgress, setSelectionInProgress] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  
  // Update selection in progress state when dates change
  useEffect(() => {
    if (startDate && !endDate) {
      setSelectionInProgress(true);
    } else {
      setSelectionInProgress(false);
    }
  }, [startDate, endDate]);

  // Fetch availability data when the component mounts or vehicleId changes
  useEffect(() => {
    const fetchAvailability = async () => {
      // Only fetch if a vehicleId is provided
      if (!vehicleId) return;
      
      try {
        setLoading(true);
        const supabase = createClientComponentClient();
        
        // Get today's date
        const today = new Date();
        
        // Get bookings for this vehicle
        let rentals: any[] = [];
        
        try {
          const { data: vehicleRentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('id, start_date, end_date')
            .eq('vehicle_id', vehicleId)
            .in('status', ['pending', 'confirmed'])
            .gte('end_date', today.toISOString().split('T')[0]);
            
          if (rentalsError) {
            console.error('Error fetching vehicle bookings:', rentalsError);
            setError('Could not load availability data for vehicle');
          } else {
            rentals = vehicleRentals || [];
          }
        } catch (err) {
          console.error('Exception fetching vehicle bookings:', err);
          setError('Could not load availability data for vehicle');
        }
        
        // Transform into booked periods
        const periods: BookedPeriod[] = rentals.map(rental => ({
          startDate: new Date(rental.start_date),
          endDate: new Date(rental.end_date)
        }));
        
        setBookedPeriods(periods);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setError('Failed to load availability data');
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [vehicleId]);
  
  // Function to check if a date is booked
  const isDateBooked = (date: Date) => {
    if (!vehicleId || bookedPeriods.length === 0) {
      return false;
    }
    
    return bookedPeriods.some(period => 
      isWithinInterval(date, { 
        start: period.startDate, 
        end: period.endDate 
      })
    );
  };

  // Function to clear the date selection
  const clearSelection = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onStartDateChange(null);
    onEndDateChange(null);
  };

  // Helper function to determine if a date is in the selected range
  const isInSelectedRange = (date: Date) => {
    if (!startDate) return false;
    if (!endDate && !hoveredDate) return isSameDay(date, startDate);
    
    const end = endDate || hoveredDate;
    
    if (!end) return isSameDay(date, startDate);
    
    // Handle when hovering before the start date
    if (hoveredDate && hoveredDate < startDate) {
      return isWithinInterval(date, { start: hoveredDate, end: startDate });
    }
    
    return isWithinInterval(date, { start: startDate, end });
  };

  // Generate calendar days for a given month
  const generateDaysForMonth = (year: number, month: number): CalendarDay[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Adjust for Monday as first day of week
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days: CalendarDay[] = [];
    
    // Add previous month days to fill the first week
    const lastDayPrevMonth = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, lastDayPrevMonth - i),
        isCurrentMonth: false,
        isDisabled: true,
      });
    }
    
    // Add current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const booked = isDateBooked(date);
      const isDisabled = isPast || booked;
      
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled,
        isBooked: booked,
        isToday: isSameDay(date, today),
        isSelected: startDate && endDate 
          ? isWithinInterval(date, { start: startDate, end: endDate })
          : startDate ? isSameDay(date, startDate) : undefined,
        isInSelectedRange: isInSelectedRange(date),
        isSelectionStart: startDate ? isSameDay(date, startDate) : undefined,
        isSelectionEnd: endDate ? isSameDay(date, endDate) : undefined,
      });
    }
    
    // Add next month days to complete the grid (always 6 rows of 7 days)
    const totalDaysNeeded = 42; // 6 rows of 7 days
    const nextMonthDays = totalDaysNeeded - days.length;
    
    for (let day = 1; day <= nextMonthDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isDisabled: true,
      });
    }
    
    return days;
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    if (!startDate) {
      // Select start date
      onStartDateChange(date);
    } else if (!endDate) {
      // If clicking on a day before start date, swap them
      if (date < startDate) {
        onEndDateChange(startDate);
        onStartDateChange(date);
      } else {
        // Select end date
        onEndDateChange(date);
      }
      
      // Close calendar after a short delay when both dates are selected
      setTimeout(() => {
        setIsCalendarOpen(false);
      }, 300);
    } else {
      // Reset and start new selection
      onStartDateChange(date);
      onEndDateChange(null);
    }
  };

  // Generate the days for the current month
  const currentYear = month.getFullYear();
  const currentMonth = month.getMonth();
  const currentMonthDays = generateDaysForMonth(currentYear, currentMonth);
  
  // Calculate next month
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthDays = generateDaysForMonth(nextMonth.getFullYear(), nextMonth.getMonth());

  // Day names starting from Monday
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  
  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentYear, currentMonth - 1, 1);
    setMonth(newMonth);
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(currentYear, currentMonth + 1, 1);
    setMonth(newMonth);
  };
  
  return (
    <div className="grid gap-2">
      <Popover 
        open={isCalendarOpen} 
        onOpenChange={(open) => {
          // If we're trying to close the calendar
          if (!open) {
            // Don't close the calendar if we're in the middle of selecting a date range
            if (startDate && !endDate) {
              setIsCalendarOpen(true);
              return;
            }
            
            // Otherwise, allow it to close
            setIsCalendarOpen(false);
          } else {
            // If we're opening, always allow it
            setIsCalendarOpen(open);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal focus-visible:ring-0 focus-visible:ring-offset-0 active:scale-100",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate && endDate ? (
              <>
                <span className="font-medium">{format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}</span>
                <XCircle 
                  className="ml-auto h-4 w-4 opacity-70 hover:opacity-100" 
                  onClick={clearSelection}
                />
              </>
            ) : startDate ? (
              <>
                <span className="font-medium">{format(startDate, "MMM d, yyyy")} - <span className="text-amber-300">Select end date</span></span>
                <XCircle 
                  className="ml-auto h-4 w-4 opacity-70 hover:opacity-100" 
                  onClick={clearSelection}
                />
              </>
            ) : (
              <span>Select rental dates</span>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-auto p-0 md:min-w-[700px] z-[100]" 
          align="start"
          side="bottom"
          avoidCollisions={false}
          sideOffset={5}
        >
          {error && (
            <Alert variant="destructive" className="mb-2 mx-2 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {selectionInProgress && (
            <div className="p-2 bg-amber-900/20 text-amber-300 text-sm flex items-center space-x-2 border-b border-amber-900/30">
              <AlertCircle className="h-4 w-4" />
              <span>Selection in progress - now pick the return date</span>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-md max-h-[400px] overflow-auto">
            {/* Current Month Calendar */}
            <div className="w-full md:w-1/2">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={goToPreviousMonth}
                  className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full flex items-center justify-center"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-medium">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <div className="h-7 w-7"></div> {/* Empty div for spacing */}
              </div>
              
              <div className="mb-1 grid grid-cols-7 gap-px">
                {dayNames.map((day, i) => (
                  <div key={i} className="text-muted-foreground text-center text-xs h-8 flex items-center justify-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-px">
                {currentMonthDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative h-9 w-full flex items-center justify-center",
                      day.isCurrentMonth ? "" : "opacity-30"
                    )}
                  >
                    <button
                      onClick={() => !day.isDisabled && handleDayClick(day.date)}
                      onMouseEnter={() => startDate && !endDate && setHoveredDate(day.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={day.isDisabled}
                      className={cn(
                        "text-sm w-9 h-9 rounded-md flex items-center justify-center",
                        day.isBooked && "bg-red-400/30 text-red-100 cursor-not-allowed",
                        day.isDisabled && !day.isBooked && "text-muted-foreground opacity-50 cursor-not-allowed",
                        !day.isDisabled && day.isSelected && "bg-primary text-white font-medium",
                        !day.isDisabled && day.isInSelectedRange && !day.isSelectionStart && !day.isSelectionEnd && "bg-primary/20",
                        !day.isDisabled && day.isSelectionStart && "bg-primary text-white font-medium rounded-l-md",
                        !day.isDisabled && day.isSelectionEnd && "bg-primary text-white font-medium rounded-r-md",
                        !day.isDisabled && !day.isSelected && !day.isInSelectedRange && day.isToday && "border border-primary",
                        !day.isDisabled && !day.isSelected && !day.isInSelectedRange && "hover:bg-primary/10"
                      )}
                    >
                      {day.date.getDate()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Next Month Calendar */}
            <div className="w-full md:w-1/2">
              <div className="flex justify-between items-center mb-2">
                <div className="h-7 w-7"></div> {/* Empty div for spacing */}
                <h2 className="text-sm font-medium">
                  {monthNames[nextMonth.getMonth()]} {nextMonth.getFullYear()}
                </h2>
                <button 
                  onClick={goToNextMonth}
                  className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full flex items-center justify-center"
                >
                  <CalendarIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mb-1 grid grid-cols-7 gap-px">
                {dayNames.map((day, i) => (
                  <div key={i} className="text-muted-foreground text-center text-xs h-8 flex items-center justify-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-px">
                {nextMonthDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative h-9 w-full flex items-center justify-center",
                      day.isCurrentMonth ? "" : "opacity-30"
                    )}
                  >
                    <button
                      onClick={() => !day.isDisabled && handleDayClick(day.date)}
                      onMouseEnter={() => startDate && !endDate && setHoveredDate(day.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={day.isDisabled}
                      className={cn(
                        "text-sm w-9 h-9 rounded-md flex items-center justify-center",
                        day.isBooked && "bg-red-400/30 text-red-100 cursor-not-allowed",
                        day.isDisabled && !day.isBooked && "text-muted-foreground opacity-50 cursor-not-allowed",
                        !day.isDisabled && day.isSelected && "bg-primary text-white font-medium",
                        !day.isDisabled && day.isInSelectedRange && !day.isSelectionStart && !day.isSelectionEnd && "bg-primary/20",
                        !day.isDisabled && day.isSelectionStart && "bg-primary text-white font-medium rounded-l-md",
                        !day.isDisabled && day.isSelectionEnd && "bg-primary text-white font-medium rounded-r-md",
                        !day.isDisabled && !day.isSelected && !day.isInSelectedRange && day.isToday && "border border-primary",
                        !day.isDisabled && !day.isSelected && !day.isInSelectedRange && "hover:bg-primary/10"
                      )}
                    >
                      {day.date.getDate()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-2 flex flex-wrap items-center justify-between text-sm border-t border-gray-700/30">
            {vehicleId && showAvailabilityIndicator && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                  <span className="text-white/70">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                  <span className="text-white/70">Booked</span>
                </div>
              </div>
            )}
            
            {(startDate || endDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearSelection()}
                className="ml-auto"
              >
                Clear
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 