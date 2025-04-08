import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DatePicker from "react-datepicker"; 
import { format } from "date-fns";
import { X, Calendar as CalendarIcon, Loader, Info, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import "react-datepicker/dist/react-datepicker.css";

interface BlockDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    name: string;
  };
  onSuccess: () => void;
}

export default function BlockDatesModal({ isOpen, onClose, vehicle, onSuccess }: BlockDatesModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [existingBlockedDates, setExistingBlockedDates] = useState<Date[]>([]);
  const [reason, setReason] = useState("Walk-in booking");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const supabase = createClientComponentClient();

  // Fetch existing blocked dates for this vehicle when modal opens
  useEffect(() => {
    if (isOpen && vehicle?.id) {
      fetchBlockedDates();
    }
  }, [isOpen, vehicle?.id]);

  const fetchBlockedDates = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("vehicle_blocked_dates")
        .select("date")
        .eq("vehicle_id", vehicle.id);

      if (error) throw error;

      if (data) {
        // Convert string dates to Date objects
        const blockedDates = data.map(item => new Date(item.date));
        setExistingBlockedDates(blockedDates);
      }
    } catch (err) {
      console.error("Error fetching blocked dates:", err);
      setError("Failed to load existing blocked dates.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date) => {
    if (!date) return;
    
    // Check if the date is already selected
    const dateExists = selectedDates.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      // Remove the date if already selected
      setSelectedDates(selectedDates.filter(
        selectedDate => selectedDate.toDateString() !== date.toDateString()
      ));
    } else {
      // Add the date if not already selected
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      setError("Please select at least one date to block.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Format dates for database (YYYY-MM-DD)
      const formattedDates = selectedDates.map(date => {
        return {
          vehicle_id: vehicle.id,
          date: format(date, "yyyy-MM-dd"),
          reason: reason
        };
      });

      // Insert the dates
      const { error } = await supabase
        .from("vehicle_blocked_dates")
        .insert(formattedDates, { 
          onConflict: 'vehicle_id,date'
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error blocking dates:", err);
      setError("Failed to block the selected dates. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to check if a date is already blocked in the database
  const isDateBlocked = (date: Date) => {
    return existingBlockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    );
  };
  
  // Function to check if a date is selected in the current session
  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  // Custom day rendering for the date picker
  const renderDayContents = (day: number, date: Date) => {
    // Check if this date is already blocked
    const blocked = isDateBlocked(date);
    // Check if this date is selected in the current session
    const selected = isDateSelected(date);
    
    return (
      <div className="relative flex items-center justify-center">
        {day}
        {blocked && (
          <div 
            className="absolute -right-1 -top-1" 
            title="Already blocked"
          >
            <XCircle size={12} className="text-red-500" />
          </div>
        )}
        {selected && (
          <div 
            className="absolute -right-1 -bottom-1" 
            title="Selected to block"
          >
            <Check size={12} className="text-green-600" />
          </div>
        )}
      </div>
    );
  };

  // Don't render anything if the modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        {/* Modal title */}
        <div className="flex items-center mb-4">
          <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Block Dates for {vehicle.name}</h2>
        </div>

        {/* Info text */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
          <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Select dates when this vehicle will be unavailable. Blocked dates will prevent online bookings for these days.
          </p>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Selected dates display */}
            {selectedDates.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <p className="text-sm font-medium mb-2">Selected dates to block ({selectedDates.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date, index) => (
                    <div 
                      key={index} 
                      className="px-2 py-1 bg-white dark:bg-gray-600 text-xs rounded-md flex items-center gap-1 border border-gray-200 dark:border-gray-700"
                    >
                      {format(date, "MMM d, yyyy")}
                      <button
                        onClick={() => {
                          setSelectedDates(selectedDates.filter((_, i) => i !== index));
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar for selecting dates */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Select dates to block:</p>
              <DatePicker
                inline
                onChange={handleDateChange}
                minDate={new Date()}
                highlightDates={[
                  ...existingBlockedDates,
                  ...selectedDates
                ]}
                renderDayContents={renderDayContents}
                className="w-full border rounded-md"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Click dates to select/deselect them. Dates with red markers are already blocked.
              </p>
            </div>

            {/* Reason for blocking */}
            <div className="mb-5">
              <label htmlFor="reason" className="block text-sm font-medium mb-1">
                Reason (optional)
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700"
              >
                <option value="Walk-in booking">Walk-in booking</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Not available">Not available</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-md">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-4 p-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-md">
                Dates successfully blocked!
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedDates.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Block Selected Dates'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 