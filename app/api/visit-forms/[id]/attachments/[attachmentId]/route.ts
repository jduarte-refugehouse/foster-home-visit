import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const dynamic = "force-dynamic"

// DELETE - Delete attachment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const formId = params.id
    const attachmentId = params.attachmentId

    // Get attachment info - handle missing is_deleted column
    let attachments
    try {
      attachments = await query(
        `SELECT file_path FROM dbo.visit_form_attachments
        WHERE attachment_id = @param0 AND visit_form_id = @param1 AND (is_deleted = 0 OR is_deleted IS NULL)`,
        [attachmentId, formId]
      )
    } catch (error: any) {
      // If is_deleted column doesn't exist, query without it
      if (error?.message?.includes("Invalid column name 'is_deleted'")) {
        attachments = await query(
          `SELECT file_path FROM dbo.visit_form_attachments
          WHERE attachment_id = @param0 AND visit_form_id = @param1`,
          [attachmentId, formId]
        )
      } else {
        throw error
      }
    }

    if (attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      )
    }

    const filePath = attachments[0].file_path

    // Soft delete in database - handle missing is_deleted column
    try {
      await query(
        `UPDATE dbo.visit_form_attachments
        SET is_deleted = 1, updated_at = GETUTCDATE()
        WHERE attachment_id = @param0`,
        [attachmentId]
      )
    } catch (updateError: any) {
      // If is_deleted column doesn't exist, try to add it or just update updated_at
      if (updateError?.message?.includes("Invalid column name 'is_deleted'")) {
        // For now, just log - in production you'd want to add the column
        console.warn("⚠️ [ATTACHMENTS] Cannot soft delete - is_deleted column missing. Consider running migration script.")
        // Could do a hard delete here, but better to add the column first
        // await query(`DELETE FROM dbo.visit_form_attachments WHERE attachment_id = @param0`, [attachmentId])
        throw new Error("Cannot delete attachment - database migration required. Please run scripts/add-file-data-to-attachments.sql")
      } else {
        throw updateError
      }
    }

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

