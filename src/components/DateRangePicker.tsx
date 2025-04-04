"use client"

import { useState, useEffect } from "react";
import { format, isWithinInterval } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Button } from "@/components/ui/Button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/Alert";

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

export function DateRangePicker({
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
  
  return (
    <div>
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
          {error && (
            <Alert variant="destructive" className="mb-2 mx-2 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
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
              // Disable past dates and booked dates if vehicleId is provided
              if (date < new Date()) return true;
              if (vehicleId && isDateBooked(date)) return true;
              return false;
            }}
            modifiers={vehicleId ? {
              booked: (date) => isDateBooked(date),
            } : undefined}
            modifiersClassNames={{
              booked: "bg-red-100 text-red-700 hover:bg-red-200",
            }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-md"
          />
          
          {vehicleId && showAvailabilityIndicator && (
            <div className="p-2 flex items-center text-sm">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                <span className="text-white/70">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                <span className="text-white/70">Booked</span>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
} 