"use client"

import { ReactNode } from "react"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

interface ReCaptchaProviderProps {
  children: ReactNode
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  // Your reCAPTCHA site key
  const siteKey = "6Ler8w8rAAAAALNtKPmv_Y0tGtWX2hUP0IX-nfLC"
  
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}
