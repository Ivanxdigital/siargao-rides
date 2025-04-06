"use client"

import { useState, useEffect } from "react";
import { format, isWithinInterval, addDays } from "date-fns";
import { CalendarIcon, AlertCircle, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

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
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    startDate && endDate 
      ? { from: startDate, to: endDate } 
      : startDate 
        ? { from: startDate, to: undefined } 
        : undefined
  );

  // Update selectedRange when the parent component changes startDate or endDate
  useEffect(() => {
    if (startDate && endDate) {
      setSelectedRange({ from: startDate, to: endDate });
    } else if (startDate) {
      setSelectedRange({ from: startDate, to: undefined });
    } else {
      setSelectedRange(undefined);
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
            // Continue with empty rentals but don't return early
          } else {
            rentals = vehicleRentals || [];
          }
        } catch (err) {
          console.error('Exception fetching vehicle bookings:', err);
          setError('Could not load availability data for vehicle');
          // Continue with empty rentals
        }
        
        // Combine both results (now just vehicle rentals)
        const allRentals = [...rentals];
        
        // Transform into booked periods
        const periods: BookedPeriod[] = allRentals.map(rental => ({
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

  // Update selection in progress state when dates change
  useEffect(() => {
    if (startDate && !endDate) {
      setSelectionInProgress(true);
    } else {
      setSelectionInProgress(false);
    }
  }, [startDate, endDate]);
  
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
    setSelectedRange(undefined);
  };
  
  return (
    <div className="grid gap-2">
      <Popover 
        open={isCalendarOpen} 
        onOpenChange={(open) => {
          // Don't close the calendar if we're in the middle of selecting a date range
          if (!open && startDate && !endDate) {
            // If trying to close while selection in progress, keep it open
            console.log("Preventing calendar from closing during selection");
            setIsCalendarOpen(true);
            return;
          }
          setIsCalendarOpen(open);
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
          className="w-auto p-0" 
          align="start"
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
          
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={startDate || new Date()}
            selected={selectedRange}
            onSelect={(range) => {
              console.log("Calendar selection changed:", range);
              setSelectedRange(range);
              
              if (range?.from) {
                // Update start date
                onStartDateChange(range.from);
                
                if (range.to) {
                  // If both dates are selected, update end date and close after a delay
                  onEndDateChange(range.to);
                  setTimeout(() => {
                    console.log("Both dates selected, closing calendar");
                    setIsCalendarOpen(false);
                  }, 300);
                } else {
                  // If only start date is selected, clear end date but keep calendar open
                  onEndDateChange(null);
                  // Ensure calendar stays open for second date selection
                  setIsCalendarOpen(true);
                }
              } else {
                // If selection is cleared, clear both dates
                onStartDateChange(null);
                onEndDateChange(null);
              }
            }}
            numberOfMonths={2}
            disabled={(date) => {
              // Disable past dates and booked dates if vehicleId is provided
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (date < today) return true;
              if (vehicleId && isDateBooked(date)) return true;
              return false;
            }}
            modifiers={{
              booked: (date) => vehicleId ? isDateBooked(date) : false,
              // Ensure range highlighting works properly
              range_start: selectedRange?.from,
              range_end: selectedRange?.to,
              range_middle: selectedRange?.from && selectedRange?.to 
                ? { from: selectedRange.from, to: selectedRange.to }
                : undefined,
            }}
            modifiersClassNames={{
              booked: "bg-red-100 text-red-700 hover:bg-red-200",
              range_start: "bg-primary text-white hover:bg-primary hover:text-white",
              range_end: "bg-primary text-white hover:bg-primary hover:text-white",
              range_middle: "bg-primary/20 text-primary-foreground",
              selected: "bg-primary text-white",
              today: "bg-white/10 text-white font-bold",
            }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-md"
            fromMonth={new Date()}
            toMonth={addDays(new Date(), 365)}
          />
          
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
            
            {(selectedRange?.from || selectedRange?.to) && (
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