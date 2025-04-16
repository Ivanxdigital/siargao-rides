'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { Toaster } from 'react-hot-toast';
import ReCaptchaProvider from '@/components/ReCaptchaProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
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
    </QueryClientProvider>
  );
}