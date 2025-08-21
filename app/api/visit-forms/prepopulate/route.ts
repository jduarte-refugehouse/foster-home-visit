import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")
    let homeXref = searchParams.get("homeXref")

    if (!appointmentId && !homeXref) {
      return NextResponse.json({ error: "appointmentId or homeXref required" }, { status: 400 })
    }

    const prepopulatedData: any = {}

    // Get appointment data if appointmentId provided
    if (appointmentId) {
      const appointmentQuery = `
        SELECT 
          a.appointment_id,
          a.title,
          a.start_datetime,
          a.end_datetime,
          a.home_xref,
          a.home_name,
          a.location_address,
          a.assigned_to_name,
          a.assigned_to_role,
          a.preparation_notes,
          a.appointment_type
        FROM appointments a
        WHERE a.appointment_id = @appointmentId AND a.is_deleted = 0
      `

      const appointments = await query(appointmentQuery, [appointmentId])
      if (appointments.length > 0) {
        const appointment = appointments[0]
        prepopulatedData.appointmentInfo = appointment

        // Use home_xref from appointment if not provided directly
        if (!homeXref && appointment.home_xref) {
          homeXref = appointment.home_xref.toString()
        }
      }
    }

    // Get home/family data if homeXref available
    if (homeXref) {
      const homeQuery = `
        SELECT 
          Xref as id,
          HomeName as name,
          Street as address,
          City,
          State,
          Zip as zipCode,
          Unit,
          HomePhone as phoneNumber,
          CaseManager as contactPersonName,
          CaseManagerEmail as email,
          CaseManagerPhone as contactPhone,
          Latitude as latitude,
          Longitude as longitude,
          LastSync as lastSync
        FROM SyncActiveHomes 
        WHERE Xref = @homeXref
      `

      const homes = await query(homeQuery, [homeXref])
      if (homes.length > 0) {
        const home = homes[0]
        prepopulatedData.homeInfo = home

        // Structure family info for form
        prepopulatedData.familyInfo = {
          familyName: home.name,
          address: home.address,
          city: home.City,
          state: home.State,
          zipCode: home.zipCode,
          phoneNumber: home.phoneNumber,
          caseManager: home.contactPersonName,
          caseManagerEmail: home.email,
          caseManagerPhone: home.contactPhone,
        }
      }
    }

    // Get previous visit forms for this home to suggest patterns
    if (homeXref) {
      const previousVisitsQuery = `
        SELECT TOP 3
          vf.visit_form_id,
          vf.visit_date,
          vf.attendees,
          vf.visit_info,
          vf.status
        FROM visit_forms vf
        INNER JOIN appointments a ON vf.appointment_id = a.appointment_id
        WHERE a.home_xref = @homeXref 
          AND vf.is_deleted = 0 
          AND vf.status = 'completed'
        ORDER BY vf.visit_date DESC
      `

      const previousVisits = await query(previousVisitsQuery, [homeXref])
      if (previousVisits.length > 0) {
        prepopulatedData.previousVisits = previousVisits.map((visit) => ({
          id: visit.visit_form_id,
          date: visit.visit_date,
          attendees: visit.attendees ? JSON.parse(visit.attendees) : [],
          visitInfo: visit.visit_info ? JSON.parse(visit.visit_info) : {},
          status: visit.status,
        }))
      }
    }

    // Get lookup data for dropdowns
    const lookupQueries = await Promise.all([
      query("SELECT id, type_name as name FROM visit_types WHERE is_active = 1 ORDER BY type_name"),
      query("SELECT id, mode_name as name FROM visit_modes WHERE is_active = 1 ORDER BY mode_name"),
      query("SELECT id, role_name as name FROM attendee_roles WHERE is_active = 1 ORDER BY role_name"),
    ])

    prepopulatedData.lookupData = {
      visitTypes: lookupQueries[0],
      visitModes: lookupQueries[1],
      attendeeRoles: lookupQueries[2],
    }

    return NextResponse.json(prepopulatedData)
  } catch (error) {
    console.error("Error prepopulating form data:", error)
    return NextResponse.json({ error: "Failed to prepopulate form data" }, { status: 500 })
  }
}
