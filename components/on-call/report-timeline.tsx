"use client"

import { format, differenceInHours } from "date-fns"
import { Clock, User, Phone, AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"

interface TimelineEvent {
  type: "assignment" | "gap"
  start: Date
  end: Date
  data: any
}

interface ReportTimelineProps {
  schedules?: any[]
  gaps?: any[]
  startDate?: Date
  endDate?: Date
}

export function ReportTimeline({ schedules = [], gaps = [], startDate, endDate }: ReportTimelineProps) {
  // Combine schedules and gaps into a single timeline
  const events: TimelineEvent[] = [
    ...schedules.map(s => ({
      type: "assignment" as const,
      start: new Date(s.start_datetime),
      end: new Date(s.end_datetime),
      data: s,
    })),
    ...gaps.map(g => ({
      type: "gap" as const,
      start: new Date(g.gap_start),
      end: new Date(g.gap_end),
      data: g,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime())

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No events to display</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Timeline events */}
      <div className="space-y-6">
        {events.map((event, index) => {
          const duration = differenceInHours(event.end, event.start)
          const isAssignment = event.type === "assignment"
          
          return (
            <div key={index} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10">
                <div 
                  className={`h-[60px] w-[60px] rounded-full flex items-center justify-center ${
                    isAssignment 
                      ? "bg-purple-100 border-4 border-purple-400" 
                      : "bg-red-100 border-4 border-red-400"
                  }`}
                >
                  {isAssignment ? (
                    <User className="h-6 w-6 text-purple-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>

              {/* Event content */}
              <div className="flex-1 pb-8">
                {isAssignment ? (
                  <div className="bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">
                          {event.data.user_name}
                        </h4>
                        {event.data.user_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Phone className="h-3 w-3" />
                            {event.data.user_phone}
                          </div>
                        )}
                      </div>
                      {event.data.priority_level === "high" && (
                        <Badge variant="destructive">High Priority</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {format(event.start, "EEE, MMM d")} at {format(event.start, "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 ml-6">
                        <span>to {format(event.end, "EEE, MMM d")} at {format(event.end, "h:mm a")}</span>
                      </div>
                      <div className="ml-6 mt-2">
                        <Badge variant="outline" className="bg-purple-50">
                          {duration} hours
                        </Badge>
                      </div>
                    </div>

                    {event.data.notes && (
                      <p className="mt-3 text-sm text-gray-600 border-t pt-2">
                        {event.data.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Coverage Gap
                      </h4>
                      <Badge variant="destructive" className="capitalize">
                        {event.data.severity}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {format(event.start, "EEE, MMM d")} at {format(event.start, "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 ml-6">
                        <span>to {format(event.end, "EEE, MMM d")} at {format(event.end, "h:mm a")}</span>
                      </div>
                      <div className="ml-6 mt-2">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                          {event.data.gap_hours.toFixed(1)} hours uncovered
                        </Badge>
                      </div>
                    </div>

                    {event.data.message && (
                      <p className="mt-3 text-sm text-red-600 border-t border-red-200 pt-2">
                        {event.data.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Timeline end marker */}
      <div className="relative flex gap-4 mt-4">
        <div className="relative z-10">
          <div className="h-[40px] w-[40px] rounded-full bg-green-100 border-4 border-green-400 flex items-center justify-center ml-[10px]">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="flex-1 flex items-center">
          <p className="text-sm text-gray-500 font-medium">End of 30-day period</p>
        </div>
      </div>
    </div>
  )
}

