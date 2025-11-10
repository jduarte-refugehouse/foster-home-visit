import { NextResponse } from "next/server"

/**
 * PUBLIC TEST ENDPOINT - No authentication required
 * This endpoint helps verify that public routes are accessible without authentication
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Public route is accessible without authentication",
    timestamp: new Date().toISOString(),
    note: "If you can see this, public routes are working correctly",
  })
}

