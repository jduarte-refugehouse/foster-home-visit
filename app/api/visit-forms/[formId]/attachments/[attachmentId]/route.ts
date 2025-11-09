import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const dynamic = "force-dynamic"

// DELETE - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string; attachmentId: string } }
) {
  try {
    const { formId, attachmentId } = params

    // Get attachment info
    const attachments = await query(
      `SELECT file_path FROM dbo.visit_form_attachments
      WHERE attachment_id = @param0 AND visit_form_id = @param1 AND is_deleted = 0`,
      [attachmentId, formId]
    )

    if (attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      )
    }

    const filePath = attachments[0].file_path

    // Soft delete in database
    await query(
      `UPDATE dbo.visit_form_attachments
      SET is_deleted = 1, updated_at = GETUTCDATE()
      WHERE attachment_id = @param0`,
      [attachmentId]
    )

    // Delete file from disk (optional - you may want to keep files for audit)
    try {
      const fullPath = join(process.cwd(), "public", filePath)
      if (existsSync(fullPath)) {
        await unlink(fullPath)
      }
    } catch (fileError) {
      console.warn("Failed to delete file from disk:", fileError)
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete attachment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

