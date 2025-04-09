"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CreditCard, Smartphone } from 'lucide-react';

interface PayMongoFormProps {
  rentalId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export default function PayMongoForm({
  rentalId,
  amount,
  onPaymentSuccess,
  onPaymentError
}: PayMongoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'grab_pay' | 'paymaya'>('card');
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showAuthFrame, setShowAuthFrame] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  // Create payment intent when component mounts
  useEffect(() => {
    createPaymentIntent();
  }, []);

  // Listen for 3DS authentication completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === '3DS-authentication-complete' && paymentIntent) {
        checkPaymentStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [paymentIntent]);

  // Create a payment intent
  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          amount,
          description: `Payment for Rental #${rentalId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setPaymentIntent(data.payment);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating payment intent');
      onPaymentError(err.message || 'An error occurred while creating payment intent');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentIntent) {
      setError('Payment intent not created. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create payment method based on selected type
      let paymentMethodResponse;
      
      if (paymentMethod === 'card') {
        // Validate card details
        if (!cardDetails.cardNumber || !cardDetails.expMonth || !cardDetails.expYear || !cardDetails.cvc) {
          setError('Please fill in all card details');
          setLoading(false);
          return;
        }
        
        // Create card payment method
        paymentMethodResponse = await fetch('/api/payments/create-method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'card',
            details: {
              card_number: cardDetails.cardNumber.replace(/\s/g, ''),
              exp_month: parseInt(cardDetails.expMonth),
              exp_year: parseInt(cardDetails.expYear),
              cvc: cardDetails.cvc
            },
            billing: {
              name: billingDetails.name,
              email: billingDetails.email,
              phone: billingDetails.phone || undefined
            }
          }),
        });
      } else {
        // For e-wallets (GCash, GrabPay, PayMaya)
        paymentMethodResponse = await fetch('/api/payments/create-method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: paymentMethod,
            billing: {
              name: billingDetails.name,
              email: billingDetails.email,
              phone: billingDetails.phone || undefined
            }
          }),
        });
      }
      
      const paymentMethodData = await paymentMethodResponse.json();
      
      if (!paymentMethodResponse.ok) {
        throw new Error(paymentMethodData.error || 'Failed to create payment method');
      }
      
      // Attach payment method to payment intent
      const attachResponse = await fetch('/api/payments/attach-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.payment_intent_id,
          paymentMethodId: paymentMethodData.payment_method.id,
          clientKey: paymentIntent.client_key
        }),
      });
      
      const attachData = await attachResponse.json();
      
      if (!attachResponse.ok) {
        throw new Error(attachData.error || 'Failed to process payment');
      }
      
      // Handle different payment statuses
      if (attachData.payment.status === 'awaiting_next_action') {
        // 3D Secure authentication needed
        if (attachData.payment.next_action?.type === 'redirect') {
          setAuthUrl(attachData.payment.next_action.redirect.url);
          setShowAuthFrame(true);
        }
      } else if (attachData.payment.status === 'succeeded') {
        // Payment successful
        onPaymentSuccess();
      } else if (attachData.payment.status === 'processing') {
        // Payment is processing, check status after a delay
        setTimeout(() => checkPaymentStatus(), 2000);
      } else {
        // Payment failed or other status
        throw new Error(
          attachData.payment.last_payment_error?.message || 
          'Payment was not successful. Please try again.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing');
      onPaymentError(err.message || 'An error occurred during payment processing');
    } finally {
      setLoading(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/payments/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.payment_intent_id,
          clientKey: paymentIntent.client_key
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check payment status');
      }
      
      if (data.payment.status === 'succeeded') {
        // Payment successful
        setShowAuthFrame(false);
        onPaymentSuccess();
      } else if (data.payment.status === 'processing') {
        // Still processing, check again after a delay
        setTimeout(() => checkPaymentStatus(), 2000);
      } else {
        // Payment failed or other status
        setShowAuthFrame(false);
        throw new Error(
          data.payment.last_payment_error?.message || 
          'Payment was not successful. Please try again.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while checking payment status');
      onPaymentError(err.message || 'An error occurred while checking payment status');
    } finally {
      setLoading(false);
    }
  };

  // Handle card number input formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .replace(/(\d{4})/g, '$1 ')
      .trim();
    setCardDetails({ ...cardDetails, cardNumber: formattedValue });
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      
      {showAuthFrame ? (
        <div className="mb-4">
          <h3 className="font-medium mb-2">Complete Authentication</h3>
          <iframe 
            src={authUrl} 
            className="w-full h-[400px] border border-gray-300 rounded-md"
            title="Payment Authentication"
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                  paymentMethod === 'card' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-sm">Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                  paymentMethod === 'gcash' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1" />
                <span className="text-sm">GCash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('grab_pay')}
                className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                  paymentMethod === 'grab_pay' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1" />
                <span className="text-sm">GrabPay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('paymaya')}
                className={`p-3 border rounded-md flex flex-col items-center justify-center ${
                  paymentMethod === 'paymaya' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <Smartphone className="w-6 h-6 mb-1" />
                <span className="text-sm">Maya</span>
              </button>
            </div>
          </div>
          
          {/* Billing Information */}
          <div>
            <h3 className="font-medium mb-2">Billing Information</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={billingDetails.name}
                  onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={billingDetails.email}
                  onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm mb-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={billingDetails.phone}
                  onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          
          {/* Card Details (only shown if card payment method is selected) */}
          {paymentMethod === 'card' && (
            <div>
              <h3 className="font-medium mb-2">Card Details</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm mb-1">Card Number</label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="expMonth" className="block text-sm mb-1">Month</label>
                    <input
                      type="text"
                      id="expMonth"
                      value={cardDetails.expMonth}
                      onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="MM"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="expYear" className="block text-sm mb-1">Year</label>
                    <input
                      type="text"
                      id="expYear"
                      value={cardDetails.expYear}
                      onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="YY"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block text-sm mb-1">CVC</label>
                    <input
                      type="text"
                      id="cvc"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* E-wallet instructions */}
          {paymentMethod !== 'card' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
              <p className="text-sm text-blue-700">
                {paymentMethod === 'gcash' && 'You will be redirected to GCash to complete your payment.'}
                {paymentMethod === 'grab_pay' && 'You will be redirected to GrabPay to complete your payment.'}
                {paymentMethod === 'paymaya' && 'You will be redirected to Maya to complete your payment.'}
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !paymentIntent}
          >
            {loading ? 'Processing...' : `Pay ₱${amount.toFixed(2)}`}
          </Button>
        </form>
      )}
    </div>
  );
}
