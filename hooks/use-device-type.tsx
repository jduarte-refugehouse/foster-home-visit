import * as React from "react"

export type DeviceType = "mobile" | "tablet" | "desktop"

interface DeviceInfo {
  type: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasTouch: boolean
  userAgent: string
}

/**
 * Enhanced device detection hook that distinguishes between mobile phones, tablets, and desktops
 * Uses a combination of user agent detection and screen size for better accuracy
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => {
    if (typeof window === "undefined") {
      // Server-side: default to desktop
      return {
        type: "desktop",
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        userAgent: "",
      }
    }

    return detectDevice(window.navigator.userAgent, window.innerWidth, "ontouchstart" in window)
  })

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDevice(navigator.userAgent, window.innerWidth, "ontouchstart" in window))
    }

    // Update on resize (but debounce to avoid excessive updates)
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateDeviceInfo, 150)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return deviceInfo
}

/**
 * Detect device type based on user agent and screen size
 */
function detectDevice(userAgent: string, screenWidth: number, hasTouch: boolean): DeviceInfo {
  const ua = userAgent.toLowerCase()

  // Mobile phone detection (most specific)
  const isMobilePhone =
    /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|mobile|mobile safari|windows phone/i.test(ua) &&
    screenWidth < 768

  // Tablet detection
  const isTabletDevice =
    (/ipad|android(?!.*mobile)|tablet|playbook|silk/i.test(ua) && screenWidth >= 768) ||
    (screenWidth >= 768 && screenWidth < 1024 && hasTouch)

  // Desktop (default)
  const isDesktopDevice = !isMobilePhone && !isTabletDevice

  let type: DeviceType
  if (isMobilePhone) {
    type = "mobile"
  } else if (isTabletDevice) {
    type = "tablet"
  } else {
    type = "desktop"
  }

  return {
    type,
    isMobile: isMobilePhone,
    isTablet: isTabletDevice,
    isDesktop: isDesktopDevice,
    hasTouch,
    userAgent: userAgent,
  }
}

