import { type NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId parameter required" }, { status: 401 })
    }

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
        FROM dbo.appointments a
        WHERE a.appointment_id = @param0 AND a.is_deleted = 0
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
        WHERE Xref = @param0
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
        FROM dbo.visit_forms vf
        INNER JOIN dbo.appointments a ON vf.appointment_id = a.appointment_id
        WHERE a.home_xref = @param0 
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

    prepopulatedData.lookupData = {
      visitTypes: [
        { id: 1, name: "Initial Visit" },
        { id: 2, name: "Quarterly Visit" },
        { id: 3, name: "Follow-up Visit" },
        { id: 4, name: "Unannounced Visit" },
        { id: 5, name: "Emergency Visit" },
      ],
      visitModes: [
        { id: 1, name: "In-Person" },
        { id: 2, name: "Virtual" },
        { id: 3, name: "Hybrid" },
      ],
      attendeeRoles: [
        { id: 1, name: "Foster Parent" },
        { id: 2, name: "Case Manager" },
        { id: 3, name: "Liaison" },
        { id: 4, name: "Child" },
        { id: 5, name: "Other Family Member" },
        { id: 6, name: "Supervisor" },
      ],
    }

    return NextResponse.json(prepopulatedData)
  } catch (error) {
    console.error("Error prepopulating form data:", error)
    return NextResponse.json({ error: "Failed to prepopulate form data" }, { status: 500 })
  }
}
