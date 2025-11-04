"use client"

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, differenceInHours, startOfDay, addHours } from "date-fns"
import { User, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TimelineEvent {
  type: "assignment" | "gap"
  start: Date
  end: Date
  data: any
}

interface CoverageTimelineProps {
  schedules?: any[]
  gaps?: any[]
  startDate: Date
  endDate: Date
}

// Time periods for weekdays
const WEEKDAY_PERIODS = [
  { name: "AM", start: 0, end: 9, label: "12am-9am" },
  { name: "Office", start: 9, end: 16, label: "9am-4pm" },
  { name: "PM", start: 16, end: 24, label: "4pm-12am" },
]

// Time periods for weekends
const WEEKEND_PERIODS = [
  { name: "AM", start: 0, end: 10, label: "12am-10am" },
  { name: "Daytime", start: 10, end: 18, label: "10am-6pm" },
  { name: "PM", start: 18, end: 24, label: "6pm-12am" },
]

export function CoverageTimeline({ schedules = [], gaps = [], startDate, endDate }: CoverageTimelineProps) {
  // Combine schedules and gaps
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
  ]

  // Get all days in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Group days by month
  const daysByMonth: { [key: string]: Date[] } = {}
  days.forEach(day => {
    const monthKey = format(day, "yyyy-MM")
    if (!daysByMonth[monthKey]) {
      daysByMonth[monthKey] = []
    }
    daysByMonth[monthKey].push(day)
  })

  // Helper to check if a time period has coverage
  const getPeriodCoverage = (day: Date, periodStart: number, periodEnd: number) => {
    const dayStart = startOfDay(day)
    const periodStartTime = addHours(dayStart, periodStart)
    const periodEndTime = addHours(dayStart, periodEnd)

    const assignments = events.filter(e => {
      if (e.type !== "assignment") return false
      // Check if assignment overlaps with this period
      return e.start < periodEndTime && e.end > periodStartTime
    })

    const periodGaps = events.filter(e => {
      if (e.type !== "gap") return false
      // Check if gap overlaps with this period
      return e.start < periodEndTime && e.end > periodStartTime
    })

    return {
      assignments,
      gaps: periodGaps,
      hasCoverage: assignments.length > 0,
      hasGaps: periodGaps.length > 0,
    }
  }

  return (
    <div className="space-y-8">
      {Object.keys(daysByMonth).sort().map(monthKey => {
        const monthDays = daysByMonth[monthKey]
        const monthDate = monthDays[0]

        return (
          <div key={monthKey} className="border rounded-lg overflow-hidden">
            {/* Month Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3">
              <h3 className="text-lg font-bold">{format(monthDate, "MMMM yyyy")}</h3>
            </div>

            {/* Days Grid */}
            <div className="divide-y divide-gray-200">
              {monthDays.map(day => {
                const isWeekendDay = isWeekend(day)
                const periods = isWeekendDay ? WEEKEND_PERIODS : WEEKDAY_PERIODS
                const dayOfWeek = format(day, "EEEE")
                const isSatOrSun = dayOfWeek === "Saturday" || dayOfWeek === "Sunday"

                return (
                  <div key={day.toISOString()} className="bg-white">
                    {/* Day Header */}
                    <div className={`px-4 py-2 flex items-center justify-between ${
                      isSatOrSun ? "bg-blue-50 border-l-4 border-blue-500" : "bg-gray-50"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {format(day, "EEE, MMM d")}
                        </div>
                        {isSatOrSun && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                            {dayOfWeek === "Saturday" ? "SATURDAY" : "SUNDAY"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Time Periods */}
                    <div className="grid grid-cols-3 divide-x divide-gray-200">
                      {periods.map(period => {
                        const coverage = getPeriodCoverage(day, period.start, period.end)
                        
                        return (
                          <div key={period.name} className="p-3 min-h-[80px]">
                            {/* Period Header */}
                            <div className="text-xs font-medium text-gray-500 mb-2">
                              {period.name}
                              <div className="text-[10px] text-gray-400">{period.label}</div>
                            </div>

                            {/* Coverage Display */}
                            <div className="space-y-1">
                              {coverage.assignments.map((assignment, idx) => (
                                <div 
                                  key={`a-${idx}`} 
                                  className="bg-purple-100 border border-purple-300 rounded px-2 py-1 text-xs"
                                >
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 text-purple-600" />
                                    <span className="font-medium text-purple-900 truncate">
                                      {assignment.data.user_name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-purple-700 mt-0.5">
                                    {format(assignment.start, "h:mm a")} - {format(assignment.end, "h:mm a")}
                                  </div>
                                </div>
                              ))}

                              {coverage.gaps.map((gap, idx) => (
                                <div 
                                  key={`g-${idx}`} 
                                  className="bg-red-100 border border-red-300 rounded px-2 py-1 text-xs"
                                >
                                  <div className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-red-600" />
                                    <span className="font-medium text-red-900">GAP</span>
                                  </div>
                                  <div className="text-[10px] text-red-700 mt-0.5">
                                    {gap.data.gap_hours.toFixed(1)}h uncovered
                                  </div>
                                </div>
                              ))}

                              {!coverage.hasCoverage && !coverage.hasGaps && (
                                <div className="text-xs text-gray-400 italic">No events</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-100 border border-purple-300 rounded px-2 py-1 flex items-center gap-1">
                <User className="h-3 w-3 text-purple-600" />
                <span className="text-purple-900">Scheduled Coverage</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-red-100 border border-red-300 rounded px-2 py-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-600" />
                <span className="text-red-900">Coverage Gap</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1"><strong>Weekdays:</strong> AM (12am-9am), Office (9am-4pm), PM (4pm-12am)</p>
            <p className="text-gray-600"><strong>Weekends:</strong> AM (12am-10am), Daytime (10am-6pm), PM (6pm-12am)</p>
            <p className="text-blue-600 mt-2"><strong>Blue border</strong> = Saturday/Sunday</p>
          </div>
        </div>
      </div>
    </div>
  )
}

