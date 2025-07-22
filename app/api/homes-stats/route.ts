import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDbConnection } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pool = await getDbConnection()

    // Get basic stats
    const statsResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total_homes,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_homes,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_homes,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_homes,
        SUM(capacity) as total_capacity,
        SUM(current_residents) as total_residents
      FROM foster_homes
    `)

    // Get visit stats
    const visitResult = await pool.request().query(`
      SELECT 
        COUNT(*) as total_visits,
        SUM(CASE WHEN next_visit < GETDATE() THEN 1 ELSE 0 END) as overdue_visits,
        SUM(CASE WHEN next_visit BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE()) THEN 1 ELSE 0 END) as upcoming_visits
      FROM foster_homes 
      WHERE next_visit IS NOT NULL
    `)

    const stats = {
      homes: {
        total: statsResult.recordset[0].total_homes,
        active: statsResult.recordset[0].active_homes,
        pending: statsResult.recordset[0].pending_homes,
        inactive: statsResult.recordset[0].inactive_homes,
      },
      capacity: {
        total: statsResult.recordset[0].total_capacity,
        occupied: statsResult.recordset[0].total_residents,
        available: statsResult.recordset[0].total_capacity - statsResult.recordset[0].total_residents,
      },
      visits: {
        total: visitResult.recordset[0].total_visits,
        overdue: visitResult.recordset[0].overdue_visits,
        upcoming: visitResult.recordset[0].upcoming_visits,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching homes stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
