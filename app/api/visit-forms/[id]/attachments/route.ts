import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { randomUUID } from "crypto"

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

    // Convert file to base64 data URL for storage in database
    // This works in Vercel serverless environment where filesystem is read-only
    console.log(`📸 [ATTACHMENTS] Processing file upload: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)
    
    // Note: iOS devices may capture HEIC format, but browsers typically convert to JPEG
    // when using the camera API. The file.type will reflect what the browser provides.
    if (file.type === "" || !file.type.startsWith("image/")) {
      console.warn(`⚠️ [ATTACHMENTS] Unexpected file type: ${file.type || "unknown"}. File name: ${file.name}`)
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    
    // Normalize MIME type - if browser didn't detect it, try to infer from file extension
    let mimeType = file.type
    if (!mimeType || mimeType === "") {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension === 'heic' || extension === 'heif') {
        mimeType = 'image/heic'
        console.warn(`⚠️ [ATTACHMENTS] HEIC file detected, but browser may have converted it. Storing as: ${mimeType}`)
      } else {
        mimeType = 'image/jpeg' // Default fallback
      }
    }
    
    const dataUrl = `data:${mimeType};base64,${base64}`
    
    console.log(`📸 [ATTACHMENTS] Base64 conversion complete. MIME type: ${mimeType}, Data URL length: ${dataUrl.length} characters`)
    
    // Store as data URL in file_path column
    // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
    const relativePath = dataUrl

    // Get appointment_id from visit form
    console.log(`📸 [ATTACHMENTS] Looking up visit form: ${formId}`)
    const formDataQuery = await query(
      "SELECT appointment_id FROM dbo.visit_forms WHERE visit_form_id = @param0 AND is_deleted = 0",
      [formId]
    )

    if (formDataQuery.length === 0) {
      console.error(`❌ [ATTACHMENTS] Visit form not found: ${formId}`)
      return NextResponse.json(
        { success: false, error: "Visit form not found" },
        { status: 404 }
      )
    }

    const appointmentId = formDataQuery[0].appointment_id
    console.log(`📸 [ATTACHMENTS] Found appointment: ${appointmentId}`)

    // Insert attachment record
    // Store base64 data URL in file_data column (nvarchar(max)) for Vercel compatibility
    // file_path stores a reference identifier
    const attachmentId = randomUUID()
    const filePathReference = `attachment:${attachmentId}`
    
    console.log(`📸 [ATTACHMENTS] Attempting to insert attachment: ${attachmentId}`)
    
    // Try to insert with file_data column, fall back if column doesn't exist
    try {
      await query(
        `INSERT INTO dbo.visit_form_attachments (
          attachment_id, visit_form_id, file_name, file_path, file_size,
          mime_type, attachment_type, description, file_data, created_at, created_by_user_id, created_by_name
        ) VALUES (
          @param0, @param1, @param2, @param3, @param4,
          @param5, @param6, @param7, @param8, GETUTCDATE(), @param9, @param10
        )`,
        [
          attachmentId,
          formId,
          file.name,
          filePathReference, // Reference identifier instead of actual path
          file.size,
          mimeType, // Use normalized MIME type
          attachmentType,
          description,
          dataUrl, // Store actual base64 data URL in file_data column
          createdByUserId,
          createdByName,
        ]
      )
      console.log(`✅ [ATTACHMENTS] Successfully inserted attachment: ${attachmentId}`)
    } catch (insertError: any) {
      console.error(`❌ [ATTACHMENTS] Insert error:`, insertError)
      console.error(`❌ [ATTACHMENTS] Error message:`, insertError?.message)
      console.error(`❌ [ATTACHMENTS] Error stack:`, insertError?.stack)
      
      // If file_data column doesn't exist, insert without it
      // User will need to run the migration script
      if (insertError?.message?.includes("Invalid column name 'file_data'")) {
        console.warn("⚠️ [ATTACHMENTS] file_data column not found, inserting without it. Please run migration script.")
        try {
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
              filePathReference,
              file.size,
              mimeType, // Use normalized MIME type
              attachmentType,
              description,
              createdByUserId,
              createdByName,
            ]
          )
          console.log(`✅ [ATTACHMENTS] Inserted without file_data column: ${attachmentId}`)
          // Note: File data will be lost without file_data column
          console.warn("⚠️ [ATTACHMENTS] File uploaded but data not stored. Run scripts/add-file-data-to-attachments.sql to enable file storage.")
        } catch (fallbackError: any) {
          console.error(`❌ [ATTACHMENTS] Fallback insert also failed:`, fallbackError)
          throw fallbackError
        }
      } else {
        // Re-throw the error with more context
        console.error(`❌ [ATTACHMENTS] Non-column error, re-throwing:`, insertError)
        throw insertError
      }
    }

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
    console.error("❌ [ATTACHMENTS] Error uploading file:", error)
    console.error("❌ [ATTACHMENTS] Error type:", typeof error)
    console.error("❌ [ATTACHMENTS] Error message:", error?.message)
    console.error("❌ [ATTACHMENTS] Error stack:", error?.stack)
    console.error("❌ [ATTACHMENTS] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name || typeof error,
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
    const { searchParams } = new URL(request.url)
    const includeData = searchParams.get("includeData") === "true"
    
    console.log(`📸 [ATTACHMENTS] Fetching attachments for form: ${formId}, includeData: ${includeData}`)

    // Get attachments - optionally include file_data based on query parameter
    // Excluding file_data by default to avoid large response sizes
    // Handle case where file_data column might not exist yet
    let attachments
    try {
      // Try query with is_deleted first, fall back if column doesn't exist
      try {
        if (includeData) {
          // Include file_data when specifically requested (e.g., for displaying thumbnails)
          attachments = await query(
            `SELECT 
              attachment_id, file_name, file_path, file_size, mime_type,
              attachment_type, description, file_data, created_at, created_by_name
            FROM dbo.visit_form_attachments
            WHERE visit_form_id = @param0 AND (is_deleted = 0 OR is_deleted IS NULL)
            ORDER BY created_at DESC`,
            [formId]
          )
          console.log(`📸 [ATTACHMENTS] Found ${attachments.length} attachments with file_data`)
        } else {
          // Default: exclude file_data to avoid large response sizes
          attachments = await query(
            `SELECT 
              attachment_id, file_name, file_path, file_size, mime_type,
              attachment_type, description, created_at, created_by_name
            FROM dbo.visit_form_attachments
            WHERE visit_form_id = @param0 AND (is_deleted = 0 OR is_deleted IS NULL)
            ORDER BY created_at DESC`,
            [formId]
          )
          console.log(`📸 [ATTACHMENTS] Found ${attachments.length} attachments (without file_data)`)
          
          // Add null file_data for consistency
          attachments = attachments.map((att: any) => ({ ...att, file_data: null }))
        }
      } catch (queryError: any) {
        // If is_deleted column doesn't exist, query without it
        if (queryError?.message?.includes("Invalid column name 'is_deleted'")) {
          console.warn("⚠️ [ATTACHMENTS] is_deleted column not found, querying without it")
          if (includeData) {
            attachments = await query(
              `SELECT 
                attachment_id, file_name, file_path, file_size, mime_type,
                attachment_type, description, file_data, created_at, created_by_name
              FROM dbo.visit_form_attachments
              WHERE visit_form_id = @param0
              ORDER BY created_at DESC`,
              [formId]
            )
          } else {
            attachments = await query(
              `SELECT 
                attachment_id, file_name, file_path, file_size, mime_type,
                attachment_type, description, created_at, created_by_name
              FROM dbo.visit_form_attachments
              WHERE visit_form_id = @param0
              ORDER BY created_at DESC`,
              [formId]
            )
            attachments = attachments.map((att: any) => ({ ...att, file_data: null }))
          }
        } else {
          throw queryError
        }
      }
    } catch (error: any) {
      console.error(`❌ [ATTACHMENTS] Query error:`, error)
      console.error(`❌ [ATTACHMENTS] Error message:`, error?.message)
      
      // If file_data column doesn't exist, fall back to query without it
      if (error?.message?.includes("Invalid column name 'file_data'")) {
        console.warn("⚠️ [ATTACHMENTS] file_data column not found, using fallback query")
        attachments = await query(
          `SELECT 
            attachment_id, file_name, file_path, file_size, mime_type,
            attachment_type, description, created_at, created_by_name
          FROM dbo.visit_form_attachments
          WHERE visit_form_id = @param0 AND is_deleted = 0
          ORDER BY created_at DESC`,
          [formId]
        )
        // Add null file_data for backward compatibility
        attachments = attachments.map((att: any) => ({ ...att, file_data: null }))
        console.log(`📸 [ATTACHMENTS] Fallback query found ${attachments.length} attachments`)
      } else {
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      attachments: attachments,
    })
  } catch (error: any) {
    console.error("❌ [ATTACHMENTS] Error fetching attachments:", error)
    console.error("❌ [ATTACHMENTS] Error type:", typeof error)
    console.error("❌ [ATTACHMENTS] Error message:", error?.message)
    console.error("❌ [ATTACHMENTS] Error stack:", error?.stack)
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attachments",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name || typeof error,
      },
      { status: 500 }
    )
  }
}

