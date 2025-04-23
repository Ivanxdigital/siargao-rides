"use client"

import { ReactNode } from "react"

interface ReCaptchaProviderProps {
  children: ReactNode
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  // Simply return the children without wrapping in GoogleReCaptchaProvider
  return children
}
