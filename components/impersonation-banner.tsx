"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImpersonationStatus {
  isImpersonating: boolean
  impersonatedUser?: {
    id: string
    email: string
    name: string
  }
  adminUser?: {
    id: string
    email: string
    name: string
  }
}

export function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImpersonationStatus()
  }, [])

  const fetchImpersonationStatus = async () => {
    try {
      const response = await fetch("/api/impersonate")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching impersonation status:", error)
    } finally {
      setLoading(false)
    }
  }

  const stopImpersonation = async () => {
    try {
      const response = await fetch("/api/impersonate", {
        method: "DELETE",
      })

      if (response.ok) {
        // Reload the page to refresh all data
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to stop impersonation")
      }
    } catch (error) {
      console.error("Error stopping impersonation:", error)
      alert("Failed to stop impersonation")
    }
  }

  if (loading || !status?.isImpersonating) {
    return null
  }

  return (
    <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-none border-x-0 border-t-0">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
        Impersonating User
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p>
              You are viewing the application as{" "}
              <strong>{status.impersonatedUser?.name || status.impersonatedUser?.email}</strong>
              {status.adminUser && (
                <span className="text-sm">
                  {" "}
                  (Admin: {status.adminUser.name || status.adminUser.email})
                </span>
              )}
            </p>
            <p className="text-xs mt-1 opacity-75">
              All actions and data are shown from this user's perspective
            </p>
          </div>
          <Button
            onClick={stopImpersonation}
            variant="outline"
            size="sm"
            className="border-amber-400 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/30"
          >
            <X className="h-4 w-4 mr-2" />
            Stop Impersonating
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

