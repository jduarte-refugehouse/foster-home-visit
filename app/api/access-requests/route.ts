/**
 * @shared-core
 * This API route should be moved to packages/shared-core/app/api/access-requests/route.ts
 * Handles access requests for microservices
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions-middleware"
import { query } from "@/lib/db"
import { getMicroserviceCode, MICROSERVICE_CONFIG } from "@/lib/microservice-config"
import sgMail from "@sendgrid/mail"

/**
 * POST /api/access-requests
 * Creates a new access request for the current microservice
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    const microserviceCode = getMicroserviceCode()

    // Get microservice ID using exact field names from schema
    // microservice_apps table: id, app_code, app_name
    const microservices = await query<{ id: string; app_name: string }>(
      "SELECT id, app_name FROM microservice_apps WHERE app_code = @param0",
      [microserviceCode]
    )

    if (microservices.length === 0) {
      return NextResponse.json({ error: "Microservice not found" }, { status: 404 })
    }

    const microserviceId = microservices[0].id
    const microserviceName = microservices[0].app_name

    // Check if user already has a pending request using exact field names
    // access_requests table: id, user_id, microservice_id, status, requested_at
    const existingRequest = await query<{ id: string }>(
      `SELECT id FROM access_requests 
       WHERE user_id = @param0 AND microservice_id = @param1 AND status = 'pending'`,
      [user.id, microserviceId]
    )

    if (existingRequest.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: "You already have a pending access request" 
      }, { status: 400 })
    }

    // Create access request using exact field names
    // access_requests: id, user_id, microservice_id, requested_at, status, reviewed_by, reviewed_at, notes
    await query(
      `INSERT INTO access_requests (id, user_id, microservice_id, requested_at, status)
       VALUES (NEWID(), @param0, @param1, GETDATE(), 'pending')`,
      [user.id, microserviceId]
    )

    // Notify system admin (you) using SendGrid
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"
    const adminEmail = "jduarte@refugehouse.org"

    if (apiKey) {
      sgMail.setApiKey(apiKey)
      
      const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
      const subject = `Access Request: ${microserviceName}`

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5E3989;">Access Request Submitted</h2>
          <p><strong>${userName}</strong> (${user.email}) has requested access to <strong>${microserviceName}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Request Details:</h3>
            <p><strong>User:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Microservice:</strong> ${microserviceName}</p>
            <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p style="color: #6b7280;">
            <strong>Action Required:</strong> Review this request in the admin portal and grant appropriate permissions.
          </p>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
            This is an automated notification from the Refuge House platform.
          </p>
        </div>
      `

      try {
        await sgMail.send({
          to: adminEmail,
          from: fromEmail,
          subject,
          html: htmlContent,
        })
        console.log(`✅ [ACCESS REQUEST] Notification sent to ${adminEmail}`)
      } catch (emailError) {
        console.error("❌ [ACCESS REQUEST] Failed to send notification email:", emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.warn("⚠️ [ACCESS REQUEST] SendGrid API key not configured - notification not sent")
    }

    return NextResponse.json({ 
      success: true, 
      message: "Access request submitted. An administrator will review your request." 
    })
  } catch (error) {
    console.error("Error creating access request:", error)
    return NextResponse.json(
      { error: "Failed to create access request" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/access-requests
 * Gets access request status for the current user and microservice
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    const microserviceCode = getMicroserviceCode()

    // Get microservice ID using exact field names
    const microservices = await query<{ id: string }>(
      "SELECT id FROM microservice_apps WHERE app_code = @param0",
      [microserviceCode]
    )

    if (microservices.length === 0) {
      return NextResponse.json({ error: "Microservice not found" }, { status: 404 })
    }

    const microserviceId = microservices[0].id

    // Check if user has pending request using exact field names
    // access_requests: id, user_id, microservice_id, status, requested_at, reviewed_at
    const requests = await query<{ id: string; status: string; requested_at: Date; reviewed_at: Date | null }>(
      `SELECT id, status, requested_at, reviewed_at 
       FROM access_requests 
       WHERE user_id = @param0 AND microservice_id = @param1
       ORDER BY requested_at DESC`,
      [user.id, microserviceId]
    )

    return NextResponse.json({ 
      hasPendingRequest: requests.some(r => r.status === 'pending'),
      requests: requests.map(r => ({
        id: r.id,
        status: r.status,
        requestedAt: r.requested_at,
        reviewedAt: r.reviewed_at,
      }))
    })
  } catch (error) {
    console.error("Error fetching access requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch access requests" },
      { status: 500 }
    )
  }
}

