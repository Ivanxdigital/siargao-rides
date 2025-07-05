"use client"

import { useState, useEffect, useCallback } from 'react'
import { getRandomSocialProofItem, SocialProofData } from '@/data/socialProofData'
import { useReducedMotion } from './useScrollAnimation'

interface SocialProofNotification extends SocialProofData {
  id: string
  isVisible: boolean
}

export function useSocialProofNotifications(isEnabled: boolean = true) {
  const [notifications, setNotifications] = useState<SocialProofNotification[]>([])
  const [shownNotificationIds, setShownNotificationIds] = useState<string[]>([])
  const shouldReduceMotion = useReducedMotion()

  // Get or create session storage for tracking shown notifications
  const getSessionData = useCallback(() => {
    if (typeof window === 'undefined') return { shownIds: [], lastShown: 0 }
    
    try {
      const data = sessionStorage.getItem('socialProofNotifications')
      return data ? JSON.parse(data) : { shownIds: [], lastShown: 0 }
    } catch {
      return { shownIds: [], lastShown: 0 }
    }
  }, [])

  const updateSessionData = useCallback((data: { shownIds: string[], lastShown: number }) => {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem('socialProofNotifications', JSON.stringify(data))
    } catch {
      // Silently fail if sessionStorage is not available
    }
  }, [])

  const showNotification = useCallback(() => {
    if (!isEnabled || shouldReduceMotion) return

    const sessionData = getSessionData()
    const now = Date.now()
    
    // Don't show if last notification was less than 5 minutes ago
    if (now - sessionData.lastShown < 5 * 60 * 1000) return

    // 60% chance of showing a notification to make it feel natural
    if (Math.random() > 0.6) return

    const randomItem = getRandomSocialProofItem(sessionData.shownIds)
    if (!randomItem) return

    const notificationId = `notification-${now}-${Math.random()}`
    const notification: SocialProofNotification = {
      ...randomItem,
      id: notificationId,
      isVisible: true
    }

    setNotifications(prev => [...prev, notification])
    
    const updatedShownIds = [...sessionData.shownIds, randomItem.id]
    setShownNotificationIds(updatedShownIds)
    
    updateSessionData({
      shownIds: updatedShownIds,
      lastShown: now
    })

    // Auto-hide notification after 4.5 seconds
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isVisible: false }
            : n
        )
      )
      
      // Remove from state after animation completes
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }, 500)
    }, 4500)
  }, [isEnabled, shouldReduceMotion, getSessionData, updateSessionData])

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, isVisible: false }
          : n
      )
    )
    
    // Remove from state after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }, 300)
  }, [])

  useEffect(() => {
    if (!isEnabled || shouldReduceMotion) return

    // Initial delay before first notification (30-45 seconds)
    const initialDelay = 30000 + Math.random() * 15000
    
    const initialTimer = setTimeout(() => {
      showNotification()
    }, initialDelay)

    // Set up interval for subsequent notifications (5-10 minutes)
    const interval = setInterval(() => {
      showNotification()
    }, 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [isEnabled, shouldReduceMotion, showNotification])

  // Initialize shown IDs from session storage
  useEffect(() => {
    const sessionData = getSessionData()
    setShownNotificationIds(sessionData.shownIds)
  }, [getSessionData])

  return {
    notifications,
    dismissNotification,
    shownCount: shownNotificationIds.length
  }
}