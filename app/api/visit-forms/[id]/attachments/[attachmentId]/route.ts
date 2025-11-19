import { NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"

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
    console.log(`🗑️ [ATTACHMENTS] Deleting attachment: ${attachmentId}, file_path: ${filePath?.substring(0, 50)}...`)

    // Soft delete in database - handle missing columns gracefully
    try {
      // Try with both is_deleted and updated_at columns
      await query(
        `UPDATE dbo.visit_form_attachments
        SET is_deleted = 1, updated_at = GETUTCDATE()
        WHERE attachment_id = @param0`,
        [attachmentId]
      )
      console.log(`✅ [ATTACHMENTS] Soft deleted attachment: ${attachmentId}`)
    } catch (updateError: any) {
      console.error(`❌ [ATTACHMENTS] Update error:`, updateError)
      
      // If is_deleted column doesn't exist, try just updating updated_at
      if (updateError?.message?.includes("Invalid column name 'is_deleted'")) {
        console.warn("⚠️ [ATTACHMENTS] is_deleted column missing, trying with updated_at only")
        try {
          await query(
            `UPDATE dbo.visit_form_attachments
            SET updated_at = GETUTCDATE()
            WHERE attachment_id = @param0`,
            [attachmentId]
          )
          console.log(`✅ [ATTACHMENTS] Updated attachment (is_deleted column missing): ${attachmentId}`)
        } catch (updateAtError: any) {
          // If updated_at also doesn't exist, do a hard delete
          if (updateAtError?.message?.includes("Invalid column name 'updated_at'")) {
            console.warn("⚠️ [ATTACHMENTS] Both is_deleted and updated_at missing, performing hard delete")
            await query(
              `DELETE FROM dbo.visit_form_attachments
              WHERE attachment_id = @param0`,
              [attachmentId]
            )
            console.log(`✅ [ATTACHMENTS] Hard deleted attachment: ${attachmentId}`)
          } else {
            throw updateAtError
          }
        }
      } else if (updateError?.message?.includes("Invalid column name 'updated_at'")) {
        // If only updated_at is missing, try with just is_deleted
        console.warn("⚠️ [ATTACHMENTS] updated_at column missing, trying with is_deleted only")
        try {
          await query(
            `UPDATE dbo.visit_form_attachments
            SET is_deleted = 1
            WHERE attachment_id = @param0`,
            [attachmentId]
          )
          console.log(`✅ [ATTACHMENTS] Soft deleted attachment (updated_at column missing): ${attachmentId}`)
        } catch (isDeletedError: any) {
          throw isDeletedError
        }
      } else {
        throw updateError
      }
    }

    // Note: Files are stored as base64 in database (file_data column), not on filesystem
    // So we don't need to delete from disk - the data is in the database
    // The file_path column stores a reference identifier, not an actual file path

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

