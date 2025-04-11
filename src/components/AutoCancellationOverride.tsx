"use client"

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format, addMinutes, isPast } from "date-fns";

interface AutoCancellationOverrideProps {
  bookingId: string;
  pickupTime: string;
  gracePeriodMinutes: number;
  isOverridden: boolean;
  onOverride: () => void;
}

export default function AutoCancellationOverride({
  bookingId,
  pickupTime,
  gracePeriodMinutes = 30,
  isOverridden = false,
  onOverride
}: AutoCancellationOverrideProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate auto-cancellation time
  const pickupDateTime = new Date(pickupTime);
  const autoCancelTime = addMinutes(pickupDateTime, gracePeriodMinutes);
  const isAutoCancelTimePassed = isPast(autoCancelTime);

  const handleOverride = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bookings/override-auto-cancellation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to override auto-cancellation');
      }

      setSuccess(true);
      onOverride();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isOverridden) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-start">
        <CheckCircle className="text-green-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-green-400 mb-1">Auto-Cancellation Overridden</h3>
          <p className="text-white/80 text-sm">
            You have overridden the auto-cancellation for this booking. The customer can arrive at any time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
      <div className="flex items-start mb-3">
        <Clock className="text-amber-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-amber-400 mb-1">Auto-Cancellation {isAutoCancelTimePassed ? 'Time Passed' : 'Scheduled'}</h3>
          <p className="text-white/80 text-sm">
            {isAutoCancelTimePassed ? (
              <>This booking should have been auto-cancelled at {format(autoCancelTime, 'h:mm a')} if the customer didn't show up.</>
            ) : (
              <>This booking will be auto-cancelled at {format(autoCancelTime, 'h:mm a')} if the customer doesn't show up.</>
            )}
          </p>
          <p className="text-white/80 text-sm mt-2">
            Pickup time: {format(pickupDateTime, 'h:mm a, EEEE, MMMM d')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex items-start">
          <AlertCircle className="text-red-400 w-4 h-4 mt-0.5 mr-2" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-3 bg-green-900/30 border border-green-500/30 rounded-lg p-3 flex items-start">
          <CheckCircle className="text-green-400 w-4 h-4 mt-0.5 mr-2" />
          <p className="text-green-300 text-sm">Auto-cancellation successfully overridden.</p>
        </div>
      )}

      <Button
        onClick={handleOverride}
        disabled={loading || success}
        className="w-full"
        variant="outline"
      >
        {loading ? "Processing..." : "Override Auto-Cancellation"}
      </Button>
      <p className="text-xs text-white/60 mt-2 text-center">
        Override will allow the customer to arrive at any time without cancellation.
      </p>
    </div>
  );
}
