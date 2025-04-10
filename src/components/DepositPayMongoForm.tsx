"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CreditCard, Smartphone } from 'lucide-react';

interface DepositPayMongoFormProps {
  rentalId: string;
  amount: number;
  vehicle?: any; // Vehicle data including image_url
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export default function DepositPayMongoForm({
  rentalId,
  amount,
  vehicle,
  onPaymentSuccess,
  onPaymentError
}: DepositPayMongoFormProps) {
  const router = useRouter();
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
    createDepositPaymentIntent();
  }, []);

  // Check payment status when auth frame is shown
  useEffect(() => {
    if (showAuthFrame) {
      const checkInterval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);

      return () => clearInterval(checkInterval);
    }
  }, [showAuthFrame]);

  // Create a deposit payment intent
  const createDepositPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/create-deposit-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          amount,
          description: `Deposit Payment for Rental #${rentalId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deposit payment intent');
      }

      setPaymentIntent(data.payment);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating deposit payment intent');
      onPaymentError(err.message || 'An error occurred while creating deposit payment intent');
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
        // Create e-wallet payment method
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

      if (!paymentMethodResponse.ok) {
        const paymentMethodError = await paymentMethodResponse.json();
        throw new Error(paymentMethodError.error || 'Failed to create payment method');
      }

      const paymentMethodData = await paymentMethodResponse.json();

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
        await updateDepositPaidStatus();
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
      const errorMessage = err.message || 'An error occurred during payment processing';
      setError(errorMessage);
      onPaymentError(errorMessage);

      // After showing the error briefly, redirect to the payment failed page
      setTimeout(() => {
        router.push(`/booking/payment-failed/${rentalId}`);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async () => {
    if (!paymentIntent) return;

    try {
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
        await updateDepositPaidStatus();
        onPaymentSuccess();
      } else if (data.payment.status === 'awaiting_payment_method' || data.payment.status === 'failed') {
        // Payment failed
        throw new Error(
          data.payment.last_payment_error?.message ||
          'Payment was not successful. Please try again.'
        );
      }
      // For other statuses, we continue waiting
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while checking payment status';
      setError(errorMessage);
      onPaymentError(errorMessage);

      // After showing the error briefly, redirect to the payment failed page
      setTimeout(() => {
        router.push(`/booking/payment-failed/${rentalId}`);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Update the deposit_paid status in the database
  const updateDepositPaidStatus = async () => {
    try {
      const response = await fetch('/api/payments/update-deposit-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error updating deposit status:', data.error);
      }
    } catch (error) {
      console.error('Error updating deposit status:', error);
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
    <div className="p-5">
      {error && (
        <div className="mb-5 bg-red-900/30 border border-red-500/30 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-400 w-5 h-5 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-red-400 mb-1">Payment Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {showAuthFrame ? (
        <div className="mb-5">
          <h3 className="font-semibold text-white text-lg mb-3">Complete Authentication</h3>
          <iframe
            src={authUrl}
            className="w-full h-[400px] sm:h-[450px] border border-white/10 rounded-lg shadow-md"
            title="Payment Authentication"
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-base font-medium text-white mb-3">Payment Method</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 sm:p-4 border rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/20 shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'card' ? 'text-primary' : 'text-white/70'}`} />
                <span className={`text-sm ${paymentMethod === 'card' ? 'text-primary' : 'text-white/70'}`}>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`p-3 sm:p-4 border rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                  paymentMethod === 'gcash'
                    ? 'border-primary bg-primary/20 shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'gcash' ? 'text-primary' : 'text-white/70'}`} />
                <span className={`text-sm ${paymentMethod === 'gcash' ? 'text-primary' : 'text-white/70'}`}>GCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('grab_pay')}
                className={`p-3 sm:p-4 border rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                  paymentMethod === 'grab_pay'
                    ? 'border-primary bg-primary/20 shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'grab_pay' ? 'text-primary' : 'text-white/70'}`} />
                <span className={`text-sm ${paymentMethod === 'grab_pay' ? 'text-primary' : 'text-white/70'}`}>GrabPay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paymaya')}
                className={`p-3 sm:p-4 border rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                  paymentMethod === 'paymaya'
                    ? 'border-primary bg-primary/20 shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Smartphone className={`w-6 h-6 mb-2 ${paymentMethod === 'paymaya' ? 'text-primary' : 'text-white/70'}`} />
                <span className={`text-sm ${paymentMethod === 'paymaya' ? 'text-primary' : 'text-white/70'}`}>Maya</span>
              </button>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white/5 p-4 sm:p-5 rounded-lg border border-white/10">
            <h3 className="font-semibold text-white text-lg mb-4">Billing Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={billingDetails.name}
                  onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
                  className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={billingDetails.email}
                  onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
                  className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="juan@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  id="phone"
                  value={billingDetails.phone}
                  onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
                  className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="+63 XXX XXX XXXX"
                />
              </div>
            </div>
          </div>

          {/* Card Details (only shown if card payment method is selected) */}
          {paymentMethod === 'card' && (
            <div className="bg-white/5 p-4 sm:p-5 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white text-lg mb-4">Card Details</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-white mb-1">Card Number</label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                    autoComplete="cc-number"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="expMonth" className="block text-sm font-medium text-white mb-1">Exp. Month</label>
                    <input
                      type="text"
                      id="expMonth"
                      value={cardDetails.expMonth}
                      onChange={(e) => setCardDetails({ ...cardDetails, expMonth: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="MM"
                      maxLength={2}
                      required
                      autoComplete="cc-exp-month"
                    />
                  </div>
                  <div>
                    <label htmlFor="expYear" className="block text-sm font-medium text-white mb-1">Exp. Year</label>
                    <input
                      type="text"
                      id="expYear"
                      value={cardDetails.expYear}
                      onChange={(e) => setCardDetails({ ...cardDetails, expYear: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="YY"
                      maxLength={2}
                      required
                      autoComplete="cc-exp-year"
                    />
                  </div>
                  <div>
                    <label htmlFor="cvc" className="block text-sm font-medium text-white mb-1">CVC</label>
                    <input
                      type="text"
                      id="cvc"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-3 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="123"
                      maxLength={4}
                      required
                      autoComplete="cc-csc"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-3 text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            disabled={loading || !paymentIntent}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Pay Deposit ₱${amount.toFixed(2)}`
            )}
          </Button>

          {/* PayMongo Badge */}
          <div className="mt-8 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-2">
              <img
                src="/images/paymongo-badge-transparent.png"
                alt="Secured by PayMongo"
                className="h-12 sm:h-14"
              />
            </div>
            <p className="text-xs text-white/50 text-center">
              Payments are securely processed by PayMongo, a PCI-DSS Level 1 compliant payment processor.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
