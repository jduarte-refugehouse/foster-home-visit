import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { existsSync } from "fs"

export const dynamic = "force-dynamic"

// POST - Upload file attachment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id
    const formData = await request.formData()
    const file = formData.get("file") as File
    const description = formData.get("description") as string || ""
    const attachmentType = formData.get("attachmentType") as string || "other"
    const createdByUserId = formData.get("createdByUserId") as string || "system"
    const createdByName = formData.get("createdByName") as string || "System"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || ""
    const fileName = `${randomUUID()}.${fileExtension}`
    
    // Determine upload directory (use public/uploads for now, or configure storage)
    const uploadDir = join(process.cwd(), "public", "uploads", "visit-forms", formId)
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = join(uploadDir, fileName)
    const relativePath = `/uploads/visit-forms/${formId}/${fileName}`

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get appointment_id from visit form
    const formDataQuery = await query(
      "SELECT appointment_id FROM dbo.visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
      [formId]
    )

    if (formDataQuery.length === 0) {
      return NextResponse.json(
        { success: false, error: "Visit form not found" },
        { status: 404 }
      )
    }

    const appointmentId = formDataQuery[0].appointment_id

    // Insert attachment record
    const attachmentId = randomUUID()
    await query(
      `INSERT INTO dbo.visit_form_attachments (
        attachment_id, visit_form_id, file_name, file_path, file_size,
        mime_type, attachment_type, description, created_at, created_by_user_id, created_by_name
      ) VALUES (
        @param0, @param1, @param2, @param3, @param4,
        @param5, @param6, @param7, GETUTCDATE(), @param8, @param9
      )`,
      [
        attachmentId,
        formId,
        file.name,
        relativePath,
        file.size,
        file.type,
        attachmentType,
        description,
        createdByUserId,
        createdByName,
      ]
    )

    return NextResponse.json({
      success: true,
      attachment: {
        attachmentId,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type,
        attachmentType,
        description,
      },
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET - List attachments for a form
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formId = params.id

    const attachments = await query(
      `SELECT 
        attachment_id, file_name, file_path, file_size, mime_type,
        attachment_type, description, created_at, created_by_name
      FROM dbo.visit_form_attachments
      WHERE visit_form_id = @param0 AND is_deleted = 0
      ORDER BY created_at DESC`,
      [formId]
    )

    return NextResponse.json({
      success: true,
      attachments: attachments,
    })
  } catch (error: any) {
    console.error("Error fetching attachments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attachments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

