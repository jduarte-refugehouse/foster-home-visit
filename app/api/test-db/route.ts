import { NextResponse } from "next/server"
import { testConnection } from "@refugehouse/shared-core/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  console.log("=== 🚀 Starting database connection test ===")

  try {
    const result = await testConnection()

    if (result.success) {
      console.log("✅ Database connection test passed")
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
        passwordSource: result.passwordSource,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.log("❌ Database connection test failed")
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          passwordSource: result.passwordSource,
          passwordError: result.passwordError,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("=== ❌ Database test failed ===", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
