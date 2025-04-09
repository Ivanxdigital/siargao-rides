"use client"

import { useEffect, useCallback } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"

interface ReCaptchaVerifierProps {
  onVerify: (token: string | null) => void
  action: string
}

export default function ReCaptchaVerifier({ onVerify, action }: ReCaptchaVerifierProps) {
  const { executeRecaptcha } = useGoogleReCaptcha()

  // Handle reCAPTCHA verification
  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      console.log("reCAPTCHA not yet available")
      return
    }

    try {
      const token = await executeRecaptcha(action)
      onVerify(token)
    } catch (error) {
      console.error("reCAPTCHA verification failed:", error)
      onVerify(null)
    }
  }, [executeRecaptcha, action, onVerify])

  // Execute verification when the component mounts and when dependencies change
  useEffect(() => {
    handleReCaptchaVerify()
  }, [handleReCaptchaVerify])

  return null // This component doesn't render anything
}
