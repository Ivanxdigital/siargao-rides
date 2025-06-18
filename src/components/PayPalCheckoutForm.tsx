"use client";

import { useState, useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PayPalCheckoutFormProps {
  rentalId: string;
  amount: number;
  vehicle: any;
  onPaymentSuccess: (orderData: any) => void;
  onPaymentError: (error: string) => void;
}

export default function PayPalCheckoutForm({
  rentalId,
  amount,
  vehicle,
  onPaymentSuccess,
  onPaymentError
}: PayPalCheckoutFormProps) {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when component mounts or rentalId changes
  useEffect(() => {
    setError(null);
  }, [rentalId]);

  const createOrder = async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating PayPal order for rental:', rentalId);

      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          amount,
          description: `Siargao Rides - ${vehicle?.name || 'Vehicle Rental'}`,
          metadata: {
            rental_id: rentalId,
            vehicle_name: vehicle?.name,
            vehicle_id: vehicle?.id
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }

      console.log('PayPal order created:', data.order.id);
      return data.order.id;
    } catch (error: any) {
      console.error('Error creating PayPal order:', error);
      setError(error.message || 'Failed to create payment order');
      onPaymentError(error.message || 'Failed to create payment order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: any, actions: any): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('PayPal order approved:', data.orderID);

      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to capture PayPal payment');
      }

      console.log('PayPal payment captured successfully:', result);
      onPaymentSuccess(result.order);
    } catch (error: any) {
      console.error('Error capturing PayPal payment:', error);
      setError(error.message || 'Failed to complete payment');
      onPaymentError(error.message || 'Failed to complete payment');
    } finally {
      setLoading(false);
    }
  };

  const onError = (error: any): void => {
    console.error('PayPal error:', error);
    setError('PayPal payment failed. Please try again.');
    onPaymentError('PayPal payment failed. Please try again.');
  };

  const onCancel = (data: any): void => {
    console.log('PayPal payment cancelled:', data);
    setError('Payment was cancelled. You can try again.');
  };

  // Show loading state while PayPal script is loading
  if (isPending) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-white">Loading PayPal...</span>
        </div>
      </div>
    );
  }

  // Show error if PayPal script failed to load
  if (isRejected) {
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-400 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-400 mb-1">PayPal Unavailable</h3>
            <p className="text-red-300 text-sm">
              PayPal payment service is currently unavailable. Please try again later or use a different payment method.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Payment Details */}
      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="text-white font-medium mb-3">Payment Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Vehicle:</span>
            <span className="text-white">{vehicle?.name || 'Vehicle Rental'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Amount:</span>
            <span className="text-white font-medium">₱{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-500/30 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-400 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-400 mb-1">Payment Error</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* PayPal Buttons */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-white text-sm">Processing payment...</span>
            </div>
          </div>
        )}
        
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 50
          }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
          disabled={loading}
        />
      </div>

      {/* Payment Info */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <p className="font-medium mb-1">Secure Payment with PayPal</p>
            <p>Pay with your PayPal account or any major credit/debit card. Your payment information is protected by PayPal's security.</p>
          </div>
        </div>
      </div>
    </div>
  );
}