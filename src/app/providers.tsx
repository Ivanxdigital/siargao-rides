'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toastprovider';
import { Toaster } from 'react-hot-toast';
import ReCaptchaProvider from '@/components/ReCaptchaProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const queryClient = new QueryClient();

// PayPal configuration
const paypalOptions = {
  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: "PHP",
  intent: "capture",
  "enable-funding": "venmo,paylater",
  "disable-funding": "",
  "data-sdk-integration-source": "react-paypal-js"
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <PayPalScriptProvider options={paypalOptions}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
          <ReCaptchaProvider>
            <ToastProvider />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#181818',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                success: {
                  icon: '✅',
                },
                error: {
                  icon: '❌',
                }
              }}
            />
            {children}
          </ReCaptchaProvider>
        </ThemeProvider>
      </PayPalScriptProvider>
    </QueryClientProvider>
  );
}