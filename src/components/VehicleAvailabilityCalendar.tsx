"use client"

import { useState, useEffect } from "react";
import { format, isWithinInterval, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VehicleAvailabilityCalendarProps {
  vehicleId: string;
  numberOfMonths?: number;
  className?: string;
}

interface BookedPeriod {
  startDate: Date;
  endDate: Date;
}

export function VehicleAvailabilityCalendar({
  vehicleId,
  numberOfMonths = 2,
  className = "",
}: VehicleAvailabilityCalendarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedPeriods, setBookedPeriods] = useState<BookedPeriod[]>([]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const supabase = createClientComponentClient();

        // Get today and three months from now for our date range
        const today = new Date();
        const threeMonthsLater = addDays(today, 90);
        const todayFormatted = today.toISOString().split('T')[0];
        const threeMonthsLaterFormatted = threeMonthsLater.toISOString().split('T')[0];

        console.log('Fetching availability for vehicle:', vehicleId);

        // Get booking data for this vehicle
        const { data: rentals, error: rentalsError } = await supabase
          .from('rentals')
          .select('id, start_date, end_date')
          .eq('vehicle_id', vehicleId)
          .in('status', ['pending', 'confirmed'])
          .gte('end_date', todayFormatted)
          .lte('start_date', threeMonthsLaterFormatted);

        if (rentalsError) {
          console.error('Error fetching vehicle bookings:', rentalsError);
          setError('Could not load availability data');
          setLoading(false);
          return;
        }

        console.log('Found rentals:', rentals?.length || 0);

        // Get blocked dates for this vehicle
        const { data: blockedDates, error: blockedError } = await supabase
          .from('vehicle_blocked_dates')
          .select('date')
          .eq('vehicle_id', vehicleId)
          .gte('date', todayFormatted)
          .lte('date', threeMonthsLaterFormatted);

        if (blockedError) {
          console.error('Error fetching blocked dates:', blockedError);
          setError('Could not load availability data');
          setLoading(false);
          return;
        }

        console.log('Found blocked dates:', blockedDates?.length || 0);

        // Transform rentals into booked periods
        const periods: BookedPeriod[] = (rentals || []).map(rental => ({
          startDate: new Date(rental.start_date),
          endDate: new Date(rental.end_date)
        }));

        // Add single-day periods for blocked dates
        const blockedPeriods: BookedPeriod[] = (blockedDates || []).map(block => {
          const date = new Date(block.date);
          return {
            startDate: date,
            endDate: date
          };
        });

        // Combine both types of booked periods
        const allPeriods = [...periods, ...blockedPeriods];
        console.log('Total unavailable periods:', allPeriods.length);

        setBookedPeriods(allPeriods);
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
    return bookedPeriods.some(period =>
      isWithinInterval(date, {
        start: period.startDate,
        end: period.endDate
      })
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center">
        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
        <h3 className="text-lg font-medium">Availability Calendar</h3>
      </div>

      <div className="relative">
        <Calendar
          mode="single"
          selected={new Date()}
          numberOfMonths={numberOfMonths}
          disabled={(date) => {
            // Disable dates in the past and booked dates
            return date < new Date() || isDateBooked(date);
          }}
          modifiers={{
            booked: (date) => isDateBooked(date),
          }}
          modifiersClassNames={{
            booked: "bg-red-100 text-red-700 hover:bg-red-200",
          }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-md border border-white/10"
        />

        <div className="mt-4 flex items-center text-sm">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
            <span className="text-white/70">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
            <span className="text-white/70">Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
}