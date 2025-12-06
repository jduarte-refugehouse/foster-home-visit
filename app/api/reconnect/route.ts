import { NextResponse } from "next/server"
import { getConnection, closeConnection } from "@refugehouse/shared-core/db"

export async function GET() {
  try {
    await closeConnection() // Close existing connection if any
    await getConnection() // Establish a new connection
    return NextResponse.json({ success: true, message: "Database reconnected successfully." })
  } catch (error: any) {
    console.error("Database reconnection failed:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
