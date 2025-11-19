/**
 * Generate ICS (iCalendar) file content for on-call schedules
 * Compatible with Outlook, Google Calendar, Apple Calendar, etc.
 */

import { format } from "date-fns"

interface ICSEvent {
  start: Date
  end: Date
  summary: string
  description?: string
  location?: string
  organizer?: {
    name: string
    email: string
  }
}

/**
 * Format date for ICS file (UTC format: YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'")
}

/**
 * Escape special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

/**
 * Generate a unique ID for an ICS event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@refugehouse.org`
}

/**
 * Generate ICS file content for a single event
 */
export function generateICSEvent(event: ICSEvent): string {
  const now = new Date()
  const uid = generateUID()
  
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Refuge House//Foster Home On-Call System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(event.start)}`,
    `DTEND:${formatICSDate(event.end)}`,
    `SUMMARY:${escapeICSText(event.summary)}`,
  ]

  if (event.description) {
    ics.push(`DESCRIPTION:${escapeICSText(event.description)}`)
  }

  if (event.location) {
    ics.push(`LOCATION:${escapeICSText(event.location)}`)
  }

  if (event.organizer) {
    ics.push(`ORGANIZER;CN=${escapeICSText(event.organizer.name)}:MAILTO:${event.organizer.email}`)
  }

  ics.push(
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "DESCRIPTION:On-Call Shift Reminder",
    "ACTION:DISPLAY",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  )

  return ics.join("\r\n")
}

/**
 * Generate ICS file content for multiple events
 */
export function generateICSFile(events: ICSEvent[]): string {
  const now = new Date()
  
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Refuge House//Foster Home On-Call System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
  ]

  events.forEach(event => {
    const uid = generateUID()
    
    ics.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(event.start)}`,
      `DTEND:${formatICSDate(event.end)}`,
      `SUMMARY:${escapeICSText(event.summary)}`,
    )

    if (event.description) {
      ics.push(`DESCRIPTION:${escapeICSText(event.description)}`)
    }

    if (event.location) {
      ics.push(`LOCATION:${escapeICSText(event.location)}`)
    }

    if (event.organizer) {
      ics.push(`ORGANIZER;CN=${escapeICSText(event.organizer.name)}:MAILTO:${event.organizer.email}`)
    }

    ics.push(
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "DESCRIPTION:On-Call Shift Reminder",
      "ACTION:DISPLAY",
      "END:VALARM",
      "END:VEVENT",
    )
  })

  ics.push("END:VCALENDAR")
  
  return ics.join("\r\n")
}

/**
 * Generate ICS file for on-call schedules
 */
export function generateOnCallICS(schedules: any[], assigneeName: string, onCallType: string): string {
  const events: ICSEvent[] = schedules.map(schedule => ({
    start: new Date(schedule.start_datetime),
    end: new Date(schedule.end_datetime),
    summary: `On-Call: ${onCallType}`,
    description: `You are on-call for ${onCallType}.${schedule.notes ? `\\n\\nNotes: ${schedule.notes}` : ''}\\n\\nIf you need to make changes, please contact your supervisor.`,
    location: "Remote - On-Call",
    organizer: {
      name: "Foster Home On-Call System",
      email: process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org",
    },
  }))

  return generateICSFile(events)
}

