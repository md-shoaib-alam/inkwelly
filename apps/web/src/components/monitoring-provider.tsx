'use client'

import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { PostHogProvider } from 'posthog-js/react'
import posthog, { identifyInPostHog, resetPostHog } from "@/lib/monitoring/posthog"
import { identifyUser, clearUser } from "@/lib/monitoring/sentry"
import { useAppStore } from "@/store/app-store/store"

/**
 * Tracks page views automatically as the user navigates.
 */
function PageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams])

  return null
}

/**
 * Unified Monitoring Provider for Sentry and PostHog.
 * Handles user identification and session tracking.
 */
export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoggedIn } = useAppStore()

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // 🆔 Sync Identity across platforms
      identifyUser({ 
        id: currentUser.id, 
        email: currentUser.email, 
        name: currentUser.name,
        role: currentUser.role
      })

      identifyInPostHog({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        tenantId: currentUser.tenantId
      })
    } else {
      // 🚪 Clear identity on logout
      clearUser()
      resetPostHog()
    }
  }, [currentUser, isLoggedIn])

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
