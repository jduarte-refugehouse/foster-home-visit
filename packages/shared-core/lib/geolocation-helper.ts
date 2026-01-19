/**
 * @shared-core
 * Geolocation helper utilities for capturing GPS coordinates
 * Works in both browser and mobile environments
 */

export interface LocationResult {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface LocationError {
  code: number
  message: string
  userFriendlyMessage?: string
}

/**
 * Capture current GPS location using browser geolocation API
 * @param action - Optional action description for logging (e.g., "start_drive", "arrived")
 * @returns Promise with latitude and longitude
 */
export function captureLocation(action?: string): Promise<LocationResult> {
  return new Promise<LocationResult>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: "Geolocation is not supported by your browser",
        userFriendlyMessage: "Your browser doesn't support location services. Please use a different device or browser.",
      })
      return
    }

    if (action) {
      console.log(`📍 [LOCATION] Starting location capture for: ${action}`)
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result: LocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }

        if (action) {
          console.log(`✅ [LOCATION] Location captured:`, {
            lat: result.latitude,
            lng: result.longitude,
            accuracy: result.accuracy,
            action,
          })
        }

        resolve(result)
      },
      (error) => {
        // Provide more descriptive error messages with device-specific guidance
        let errorMessage = error.message
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isAndroid = /Android/.test(navigator.userAgent)
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
        const isHTTPS = typeof window !== "undefined" && window.location.protocol === "https:"

        let userFriendlyMessage: string | undefined

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied"
            if (isIOS && isSafari) {
              userFriendlyMessage = "Location permission denied.\n\nTo enable:\n1. Tap the 'aA' icon in the address bar\n2. Select 'Website Settings'\n3. Enable 'Location'\n4. Refresh the page and try again"
            } else if (isIOS) {
              userFriendlyMessage = "Location permission denied.\n\nTo enable:\n1. Go to Settings > Privacy & Security > Location Services\n2. Enable location services for your browser\n3. Refresh the page and try again"
            } else if (isAndroid) {
              userFriendlyMessage = "Location permission denied.\n\nTo enable:\n1. Tap the lock icon in the address bar\n2. Select 'Site settings'\n3. Enable 'Location'\n4. Refresh the page and try again"
            } else {
              userFriendlyMessage = "Location permission denied. Please enable location access in your browser settings and refresh the page."
            }
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            if (!isHTTPS) {
              userFriendlyMessage = "Location services require HTTPS. Please access this page over a secure connection."
            } else {
              userFriendlyMessage = "Unable to determine your location.\n\nPlease:\n1. Check that location services are enabled on your device\n2. Ensure you're in an area with GPS signal\n3. Try again"
            }
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            userFriendlyMessage = "Location request took too long.\n\nPlease:\n1. Move to an area with better GPS signal\n2. Ensure location services are enabled\n3. Try again"
            break
          default:
            errorMessage = error.message || "Unknown location error"
            if (!isHTTPS) {
              userFriendlyMessage = "Location services require HTTPS. Please access this page over a secure connection."
            } else {
              userFriendlyMessage = "An error occurred while getting your location.\n\nPlease:\n1. Check that location services are enabled\n2. Refresh the page\n3. Try again"
            }
        }

        const locationError: LocationError = {
          code: error.code,
          message: errorMessage,
          userFriendlyMessage,
        }

        if (action) {
          console.error(`❌ [LOCATION] Location capture failed for ${action}:`, locationError)
        }

        reject(locationError)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // Don't use cached location
      },
    )
  })
}

/**
 * Check if geolocation is supported in the current environment
 * @returns true if geolocation API is available
 */
export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation
}

/**
 * Request location permission (triggers browser permission prompt)
 * @returns Promise that resolves if permission is granted, rejects if denied
 */
export function requestLocationPermission(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("Geolocation is not supported"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location permission denied"))
        } else {
          // Other errors (timeout, unavailable) still mean permission was granted
          resolve()
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: Infinity, // Use cached location if available
      },
    )
  })
}

