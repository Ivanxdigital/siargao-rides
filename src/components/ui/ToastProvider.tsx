"use client"

import { Toaster as SonnerToaster } from 'sonner'

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.5rem',
        },
        className: 'toast-custom-class',
        duration: 5000,
      }}
      closeButton
    />
  )
} 