"use client"

/**
 * Checks if the application is running in the v0 preview environment
 * by looking for a specific hostname in the browser's URL.
 * This is the most reliable way to create a "dev mode" for the v0 preview.
 * @returns {boolean} - True if in v0 preview, false otherwise.
 */
export function isV0Preview(): boolean {
  if (typeof window === "undefined") {
    // During server-side rendering, we can't know the hostname.
    // We default to assuming it's NOT the preview to be safe.
    return false
  }
  return window.location.hostname.includes("vusercontent.net")
}
