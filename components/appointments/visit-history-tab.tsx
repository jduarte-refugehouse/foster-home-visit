"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Navigation, MapPin, Clock, User, Home, Play, Square } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface ContinuumEntry {
  entry_id: string
  appointment_id: string | null
  activity_type: string
  activity_status: string
  timestamp: string
  duration_minutes: number | null
  staff_user_id: string | null
  staff_name: string | null
  home_guid: string | null
  home_xref: number | null
  home_name: string | null
  entity_guids: string[] | null
  activity_description: string | null
  metadata: any
  location_latitude: number | null
  location_longitude: number | null
  location_address: string | null
  context_notes: string | null
  outcome: string | null
  triggered_by_entry_id: string | null
  created_at: string
}

interface VisitHistoryTabProps {
  appointmentId: string
}

export function VisitHistoryTab({ appointmentId }: VisitHistoryTabProps) {
  const [entries, setEntries] = useState<ContinuumEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (appointmentId) {
      fetchHistory()
    }
  }, [appointmentId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/continuum/entries?appointmentId=${appointmentId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch visit history")
      }

      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err: any) {
      console.error("Error fetching visit history:", err)
      setError(err.message || "Failed to load visit history")
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "drive_start":
        return <Navigation className="h-4 w-4 text-blue-500" />
      case "drive_end":
        return <Navigation className="h-4 w-4 text-blue-400" />
      case "visit_start":
        return <Play className="h-4 w-4 text-green-500" />
      case "visit_end":
        return <Square className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityLabel = (activityType: string) => {
    switch (activityType) {
      case "drive_start":
        return "Drive Started"
      case "drive_end":
        return "Drive Ended"
      case "visit_start":
        return "Visit Started"
      case "visit_end":
        return "Visit Ended"
      default:
        return activityType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "drive_start":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "drive_end":
        return "bg-blue-50 text-blue-600 border-blue-200"
      case "visit_start":
        return "bg-green-50 text-green-700 border-green-200"
      case "visit_end":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Visit History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-refuge-purple mx-auto mb-4"></div>
            <p>Loading visit history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Visit History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-red-600 py-8">
            <p>Error: {error}</p>
            <button
              onClick={fetchHistory}
              className="mt-4 text-sm text-refuge-purple hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Visit History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <History className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No visit history recorded yet.</p>
            <p className="text-sm mt-2">Activities will appear here as the visit progresses.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Visit History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.entry_id}
              className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getActivityIcon(entry.activity_type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getActivityColor(entry.activity_type)}>
                        {getActivityLabel(entry.activity_type)}
                      </Badge>
                      {entry.activity_status !== 'complete' && (
                        <Badge variant="outline" className="text-xs">
                          {entry.activity_status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(entry.timestamp), "MMM d, yyyy h:mm a")}</span>
                        <span className="ml-2">({formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })})</span>
                      </div>
                      {entry.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <span>Duration: {entry.duration_minutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(entry.staff_name || entry.home_name) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground ml-7">
                  {entry.staff_name && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{entry.staff_name}</span>
                    </div>
                  )}
                  {entry.home_name && (
                    <div className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      <span>{entry.home_name}</span>
                    </div>
                  )}
                </div>
              )}

              {entry.location_address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground ml-7">
                  <MapPin className="h-3 w-3" />
                  <span>{entry.location_address}</span>
                </div>
              )}

              {entry.activity_description && (
                <div className="text-sm text-foreground ml-7 mt-2">
                  {entry.activity_description}
                </div>
              )}

              {entry.context_notes && (
                <div className="text-sm text-muted-foreground ml-7 italic">
                  {entry.context_notes}
                </div>
              )}

              {entry.outcome && (
                <div className="text-sm text-foreground ml-7 mt-2 p-2 bg-muted rounded">
                  <strong>Outcome:</strong> {entry.outcome}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

