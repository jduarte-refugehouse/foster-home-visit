import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * DELETE - Soft delete a continuum entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  try {
    const { entryId } = params

    if (!entryId) {
      return NextResponse.json(
        { success: false, error: "entryId is required" },
        { status: 400 }
      )
    }

    console.log(`🗑️ [CONTINUUM] Deleting entry: ${entryId}`)

    await query(
      `
      UPDATE continuum_entries
      SET is_deleted = 1
      WHERE entry_id = @param0
      `,
      [entryId]
    )

    console.log(`✅ [CONTINUUM] Deleted entry: ${entryId}`)

    return NextResponse.json({
      success: true,
      message: "Entry deleted successfully",
    })

  } catch (error: any) {
    console.error("❌ [CONTINUUM] Error deleting entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete continuum entry",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

