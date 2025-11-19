import { type NextRequest, NextResponse } from "next/server"
import { query } from "@refugehouse/shared-core/db"
import { requireClerkAuth } from "@refugehouse/shared-core/auth"

export async function GET(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    try {
      requireClerkAuth(request)
    } catch (authError) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get("type") || "home_visit"

    const templatesQuery = `
      SELECT 
        template_id,
        template_name,
        template_type,
        form_version,
        template_data,
        created_at,
        updated_at
      FROM visit_form_templates 
      WHERE template_type = @templateType AND is_active = 1
      ORDER BY template_name
    `

    const templates = await query(templatesQuery, [templateType])

    const processedTemplates = templates.map((template) => ({
      id: template.template_id,
      name: template.template_name,
      type: template.template_type,
      version: template.form_version,
      data: template.template_data ? JSON.parse(template.template_data) : {},
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    }))

    return NextResponse.json(processedTemplates)
  } catch (error) {
    console.error("Error fetching form templates:", error)
    return NextResponse.json({ error: "Failed to fetch form templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // SAFE: Get Clerk user ID from headers (no middleware required)
    try {
      requireClerkAuth(request)
    } catch (authError) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        details: authError instanceof Error ? authError.message : "Missing authentication headers" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { templateName, templateType, templateData } = body

    if (!templateName || !templateType) {
      return NextResponse.json({ error: "Template name and type are required" }, { status: 400 })
    }

    const insertQuery = `
      INSERT INTO visit_form_templates (template_name, template_type, template_data)
      OUTPUT INSERTED.template_id
      VALUES (@templateName, @templateType, @templateData)
    `

    const result = await query(insertQuery, [templateName, templateType, JSON.stringify(templateData)])

    return NextResponse.json({
      success: true,
      templateId: result[0].template_id,
    })
  } catch (error) {
    console.error("Error creating form template:", error)
    return NextResponse.json({ error: "Failed to create form template" }, { status: 500 })
  }
}
