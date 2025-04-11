'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface GCashPaymentFormProps {
  rentalId: string;
  amount: number;
  isDeposit?: boolean;
  vehicleName?: string;
  vehicleImage?: string;
  onSuccess?: (sourceId: string, checkoutUrl: string) => void;
  onError?: (error: string) => void;
}

export default function GCashPaymentForm({
  rentalId,
  amount,
  isDeposit = false,
  vehicleName = 'Vehicle',
  vehicleImage,
  onSuccess,
  onError
}: GCashPaymentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Get the current URL for success and failure redirects
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = `${baseUrl}/booking/confirmation/${rentalId}?source=gcash`;
  const failureUrl = `${baseUrl}/booking/payment-failed?id=${rentalId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!name || !email) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create GCash source
      const response = await fetch('/api/payments/create-gcash-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          amount,
          description: `${isDeposit ? 'Deposit' : 'Full payment'} for ${vehicleName}`,
          successUrl,
          failureUrl,
          billingInfo: {
            name,
            email,
            phone: phone || undefined
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create GCash payment');
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data.source.source_id, data.source.checkout_url);
      }

      console.log('GCash source created successfully:', data);

      // Redirect to GCash checkout URL
      window.location.href = data.source.checkout_url;
    } catch (err: any) {
      console.error('GCash payment error:', err);
      setError(err.message || 'An error occurred while processing your payment');

      if (onError) {
        onError(err.message || 'Payment processing failed');
      }

      toast.error('Payment processing failed', {
        description: err.message || 'Please try again or use a different payment method',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-blue-950 to-indigo-950 rounded-xl shadow-xl overflow-hidden">
      <div className="p-5">
        {/* PayMongo Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center">
            <img
              src="/images/paymongo-logo.png"
              alt="PayMongo"
              className="h-12 sm:h-14"
            />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">GCash Payment</h2>
          <p className="text-sm text-white/70 text-center">
            {isDeposit
              ? 'Pay ₱300 deposit to secure your booking'
              : 'Complete your payment with GCash'}
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-900/30 border border-red-500/30 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-400 w-5 h-5 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-red-400 mb-1">Payment Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Vehicle Info */}
        {vehicleName && (
          <div className="mb-5 p-4 bg-white/5 rounded-lg border border-white/10 flex items-center">
            {vehicleImage && (
              <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                <img
                  src={vehicleImage}
                  alt={vehicleName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-medium text-white">{vehicleName}</h3>
              <p className="text-white/70 text-sm">
                {isDeposit
                  ? `₱300 deposit (from total ₱${amount})`
                  : `₱${amount} total payment`}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Juan Dela Cruz"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="juan@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="09123456789"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-[#00A1E4] hover:bg-[#0091CE] text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A1E4]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Processing...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-5 w-5" />
                Pay with GCash
              </>
            )}
          </button>

          {/* Security and Trust Indicators */}
          <div className="mt-8 space-y-6">
            {/* PayMongo Badge and Security Info */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-900/30 to-blue-950/30 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center justify-center mb-3">
                <img
                  src="/images/paymongo-badge-transparent.png"
                  alt="Secured by PayMongo"
                  className="h-14 sm:h-16"
                />
              </div>
              <p className="text-sm text-white/80 text-center font-medium mb-2">
                Secure Payment Processing
              </p>
              <p className="text-xs text-white/60 text-center">
                Your payment information is securely processed by PayMongo, a PCI-DSS Level 1 compliant payment processor licensed by the Bangko Sentral ng Pilipinas.
              </p>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-lg border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-white/70 text-center">End-to-End Encryption</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-lg border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs text-white/70 text-center">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-lg border border-white/10 col-span-2 sm:col-span-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-white/70 text-center">Verified by PayMongo</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="flex justify-center pt-2">
              <img
                src="https://assets-global.website-files.com/60d79037bf79a69621881af0/60d7b9f2a2121d0d7fc7d36f_GCash.svg"
                alt="GCash"
                className="h-8"
              />
            </div>

            {/* Deposit Information */}
            {isDeposit && (
              <div className="p-4 bg-amber-900/30 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-300 font-medium mb-1">Deposit Information</p>
                <p className="text-xs text-amber-200/80">
                  This ₱300 deposit secures your booking and will be deducted from the total amount due at pickup. If you don't show up, the deposit will be kept by the shop owner as compensation.
                </p>
              </div>
            )}

            {/* Legal Text */}
            <p className="text-[10px] text-white/40 text-center pt-2">
              By proceeding with this payment, you agree to PayMongo's <a href="https://www.paymongo.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">Terms of Service</a> and <a href="https://www.paymongo.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">Privacy Policy</a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
