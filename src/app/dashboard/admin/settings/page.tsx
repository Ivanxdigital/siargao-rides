'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    enable_temporary_cash_payment: false,
    enable_cash_with_deposit: true,
    require_deposit: true,
    enable_paymongo_card: true,
    enable_paymongo_gcash: true,
    enable_paypal: true
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  // Fetch payment settings
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchPaymentSettings();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchPaymentSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await fetch('/api/settings/payment');

      if (!response.ok) {
        throw new Error('Failed to fetch payment settings');
      }

      const data = await response.json();
      setPaymentSettings(data.settings);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);

      console.log('Saving payment settings:', paymentSettings);

      try {
        const response = await fetch('/api/settings/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentSettings),
        });

        const data = await response.json();
        console.log('Response from API:', data);

        if (!response.ok) {
          console.error('API error response:', data);
          throw new Error(data.error || data.details || 'Failed to update payment settings');
        }

        toast.success('Payment settings updated successfully');
        setStatusMessage({
          type: 'success',
          message: 'Payment settings updated successfully'
        });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);

        return data;
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      console.error('Error details:', error.stack || 'No stack trace available');
      const errorMessage = error.message || 'Failed to update payment settings';
      toast.error(errorMessage);
      setStatusMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="mb-6 text-white/70">You don't have permission to access the admin settings.</p>
        <Button asChild>
          <a href="/dashboard">Return to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="pt-2 md:pt-4 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">
              Admin Settings
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Configure global platform settings
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <Button
              onClick={fetchPaymentSettings}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              disabled={isLoadingSettings}
            >
              <RefreshCw size={16} className={isLoadingSettings ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          statusMessage.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {statusMessage.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mt-0.5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
          )}
          <div>
            <h3 className={`font-medium ${
              statusMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {statusMessage.type === 'success' ? 'Success' : 'Error'}
            </h3>
            <p className={statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}>
              {statusMessage.message}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Payment Settings Card */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-white/90">Payment Settings</h2>
          </div>

          {isLoadingSettings ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-6">
                {/* Cash Payment Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Cash Payment Options</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white/90">Enable Cash Payment with Deposit</h3>
                      <p className="text-sm text-white/60">
                        Allow customers to pay with cash at pickup with a deposit payment
                      </p>
                    </div>
                    <Switch
                      checked={paymentSettings.enable_cash_with_deposit}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          enable_cash_with_deposit: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white/90">Enable Temporary Cash Payment</h3>
                      <p className="text-sm text-white/60">
                        Allow customers to pay with cash at pickup or delivery without requiring a deposit
                      </p>
                    </div>
                    <Switch
                      checked={paymentSettings.enable_temporary_cash_payment}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          enable_temporary_cash_payment: checked
                        })
                      }
                    />
                  </div>

                  {paymentSettings.enable_temporary_cash_payment && (
                    <div className="flex items-center justify-between pl-6 border-l-2 border-primary/20">
                      <div>
                        <h3 className="text-base font-medium text-white/90">Require Deposit</h3>
                        <p className="text-sm text-white/60">
                          Require customers to pay a deposit for temporary cash payments
                        </p>
                      </div>
                      <Switch
                        checked={paymentSettings.require_deposit}
                        onCheckedChange={(checked) =>
                          setPaymentSettings({
                            ...paymentSettings,
                            require_deposit: checked
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* PayMongo Payment Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">PayMongo Payment Options</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white/90">Enable Card Payments</h3>
                      <p className="text-sm text-white/60">
                        Allow customers to pay with credit/debit cards through PayMongo
                      </p>
                    </div>
                    <Switch
                      checked={paymentSettings.enable_paymongo_card}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          enable_paymongo_card: checked
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white/90">Enable GCash Payments</h3>
                      <p className="text-sm text-white/60">
                        Allow customers to pay with GCash through PayMongo
                      </p>
                    </div>
                    <Switch
                      checked={paymentSettings.enable_paymongo_gcash}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          enable_paymongo_gcash: checked
                        })
                      }
                    />
                  </div>
                </div>

                {/* PayPal Payment Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">PayPal Payment Options</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white/90">Enable PayPal Payments</h3>
                      <p className="text-sm text-white/60">
                        Allow customers to pay with PayPal account or cards through PayPal
                      </p>
                    </div>
                    <Switch
                      checked={paymentSettings.enable_paypal}
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          enable_paypal: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
