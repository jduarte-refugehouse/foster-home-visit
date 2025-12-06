"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useDeviceType } from "@/hooks/use-device-type"
import { AccessGuard } from "@refugehouse/shared-core/components/access-guard"

/**
 * Mobile Layout - Detects device type and provides mobile-optimized experience
 * This layout wraps all mobile routes and ensures proper device detection
 * Also includes AccessGuard to ensure routes are actually protected
 */
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { type, isMobile } = useDeviceType()
  const router = useRouter()
  const pathname = usePathname()

  // Optional: Redirect non-mobile devices away from mobile routes
  // Uncomment if you want to force mobile users to use mobile routes
  // useEffect(() => {
  //   if (!isMobile && pathname?.startsWith("/mobile")) {
  //     router.replace(pathname.replace("/mobile", ""))
  //   }
  // }, [isMobile, pathname, router])

  return (
    <AccessGuard>
      {children}
    </AccessGuard>
  )
}

