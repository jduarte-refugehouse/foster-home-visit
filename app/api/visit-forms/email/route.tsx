export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import sgMail from "@sendgrid/mail"
import { logCommunication, updateCommunicationStatus, getMicroserviceId } from "@refugehouse/shared-core/communication"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  let logId: string | null = null

  try {
    const { visitFormId, recipientEmail, recipientName, formData, appointmentId } = await request.json()

    // Validate required fields
    if (!visitFormId || !recipientEmail || !formData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: visitFormId, recipientEmail, formData",
        },
        { status: 400 },
      )
    }

    // Validate environment variables
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SendGrid API key not configured. Please contact system administrator.",
        },
        { status: 500 },
      )
    }

    // Set SendGrid API key
    sgMail.setApiKey(apiKey)

    // Generate email content
    const visitDate = format(new Date(formData.visitInfo.date), "MMMM d, yyyy")
    const familyName = formData.family.familyName || "Foster Family"

    const subject = `Foster Home Visit Report - ${familyName} - ${visitDate}`

    const htmlContent = generateEmailHTML(formData, appointmentId, visitDate, familyName)
    const textContent = generateEmailText(formData, appointmentId, visitDate, familyName)

    // Prepare email
    const msg = {
      to: recipientEmail,
      from: {
        email: fromEmail,
        name: "Foster Home Visit System",
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    try {
      const microserviceId = await getMicroserviceId()
      logId = await logCommunication({
        microservice_id: microserviceId,
        communication_type: "visit_form",
        delivery_method: "email",
        recipient_email: recipientEmail,
        recipient_name: recipientName || recipientEmail,
        subject: subject,
        message_text: textContent,
        message_html: htmlContent,
        sender_email: fromEmail,
        sender_name: "Foster Home Visit System",
        status: "pending",
        metadata: JSON.stringify({
          visit_form_id: visitFormId,
          appointment_id: appointmentId,
          family_name: familyName,
          visit_date: visitDate,
        }),
      })
    } catch (logError) {
      console.error("Failed to log communication:", logError)
    }

    // Send the email
    const response = await sgMail.send(msg)

    if (logId) {
      try {
        await updateCommunicationStatus(logId, "sent", undefined, response[0].headers["x-message-id"], "sendgrid")
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json({
      success: true,
      messageId: response[0].headers["x-message-id"],
      message: "Visit form emailed successfully",
    })
  } catch (error: any) {
    console.error("Email Error:", error)

    // Handle SendGrid specific errors
    if (error.response) {
      const { message, code } = error.response.body.errors?.[0] || {}
      const errorMessage = `SendGrid Error: ${message || error.message}`

      if (logId) {
        try {
          await updateCommunicationStatus(logId, "failed", errorMessage)
        } catch (updateError) {
          console.error("Failed to update log status:", updateError)
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: code,
        },
        { status: error.code || 500 },
      )
    }

    if (logId) {
      try {
        await updateCommunicationStatus(logId, "failed", error.message)
      } catch (updateError) {
        console.error("Failed to update log status:", updateError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email: " + error.message,
      },
      { status: 500 },
    )
  }
}

function generateEmailHTML(formData: any, appointmentId: string, visitDate: string, familyName: string): string {
  const getVariantDescription = (visitNumber: number) => {
    const variant = ((visitNumber - 1) % 3) + 1
    const descriptions = {
      1: "Comprehensive, baseline, relationships",
      2: "Education, behavior, social",
      3: "Health, development, planning",
    }
    return descriptions[variant as keyof typeof descriptions] || "Standard visit"
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; text-align: center;">
        <h1 style="color: #1e40af; margin: 0; font-size: 24px; font-weight: bold;">FOSTER HOME VISIT REPORT</h1>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; text-align: left;">
          <div>
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 5px 0;"><strong>Visit Date:</strong> ${visitDate}</p>
            <p style="margin: 5px 0;"><strong>Visit Time:</strong> ${formData.visitInfo.time}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Quarter:</strong> ${formData.visitInfo.quarter}</p>
            <p style="margin: 5px 0;"><strong>Visit Number:</strong> ${formData.visitInfo.visitNumber}</p>
            <p style="margin: 5px 0;"><strong>Focus:</strong> ${getVariantDescription(formData.visitInfo.visitNumber)}</p>
          </div>
        </div>
      </div>

      <!-- Family Information -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Family & Home Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Family Name:</strong> ${formData.family.familyName}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${formData.family.address}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${formData.family.phone}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${formData.family.email}</p>
          </div>
        </div>
      </div>

      <!-- Visit Details -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Visit Details</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Visit Type:</strong> ${formData.visitInfo.type}</p>
            <p style="margin: 5px 0;"><strong>Visit Mode:</strong> ${formData.visitInfo.mode}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Conducted By:</strong> ${formData.visitInfo.conductedBy}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${formData.visitInfo.role === "liaison" ? "Home Visit Liaison" : "Case Manager"}</p>
          </div>
        </div>
      </div>

      ${
        formData.attendees && formData.attendees.length > 0
          ? `
      <!-- Attendees -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Attendees</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${formData.attendees
            .map(
              (attendee: any) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <span>${attendee.name}</span>
              <span>${attendee.role} - ${attendee.present ? "Present" : "Absent"}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
      `
          : ""
      }

      ${
        formData.observations
          ? `
      <!-- Observations -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Observations</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          ${
            formData.observations.homeAtmosphere
              ? `
            <div style="margin-bottom: 15px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Home Atmosphere:</p>
              <p style="margin-left: 15px; white-space: pre-wrap;">${formData.observations.homeAtmosphere}</p>
            </div>
          `
              : ""
          }
          ${
            formData.observations.positiveObservations
              ? `
            <div style="margin-bottom: 15px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Positive Observations:</p>
              <p style="margin-left: 15px; white-space: pre-wrap;">${formData.observations.positiveObservations}</p>
            </div>
          `
              : ""
          }
          ${
            formData.observations.behaviorObservations
              ? `
            <div style="margin-bottom: 15px;">
              <p style="font-weight: bold; margin-bottom: 5px;">Behavior Observations:</p>
              <p style="margin-left: 15px; white-space: pre-wrap;">${formData.observations.behaviorObservations}</p>
            </div>
          `
              : ""
          }
        </div>
      </div>
      `
          : ""
      }

      ${
        formData.recommendations
          ? `
      <!-- Recommendations -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #374151; border-bottom: 2px solid #d1d5db; padding-bottom: 8px; margin-bottom: 15px;">Recommendations & Next Steps</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <p style="white-space: pre-wrap;">${formData.recommendations}</p>
        </div>
      </div>
      `
          : ""
      }

      <!-- Footer -->
      <div style="border-top: 3px solid #2563eb; padding-top: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        <p style="margin: 5px 0;">This document contains confidential information and should be handled according to agency policies.</p>
      </div>
    </div>
  `
}

function generateEmailText(formData: any, appointmentId: string, visitDate: string, familyName: string): string {
  const getVariantDescription = (visitNumber: number) => {
    const variant = ((visitNumber - 1) % 3) + 1
    const descriptions = {
      1: "Comprehensive, baseline, relationships",
      2: "Education, behavior, social",
      3: "Health, development, planning",
    }
    return descriptions[variant as keyof typeof descriptions] || "Standard visit"
  }

  let content = `FOSTER HOME VISIT REPORT\n\n`
  content += `Appointment ID: ${appointmentId}\n`
  content += `Visit Date: ${visitDate}\n`
  content += `Visit Time: ${formData.visitInfo.time}\n`
  content += `Quarter: ${formData.visitInfo.quarter}\n`
  content += `Visit Number: ${formData.visitInfo.visitNumber}\n`
  content += `Focus: ${getVariantDescription(formData.visitInfo.visitNumber)}\n\n`

  content += `FAMILY & HOME INFORMATION\n`
  content += `Family Name: ${formData.family.familyName}\n`
  content += `Address: ${formData.family.address}\n`
  content += `Phone: ${formData.family.phone}\n`
  content += `Email: ${formData.family.email}\n\n`

  content += `VISIT DETAILS\n`
  content += `Visit Type: ${formData.visitInfo.type}\n`
  content += `Visit Mode: ${formData.visitInfo.mode}\n`
  content += `Conducted By: ${formData.visitInfo.conductedBy}\n`
  content += `Role: ${formData.visitInfo.role === "liaison" ? "Home Visit Liaison" : "Case Manager"}\n\n`

  if (formData.attendees && formData.attendees.length > 0) {
    content += `ATTENDEES\n`
    formData.attendees.forEach((attendee: any) => {
      content += `${attendee.name} - ${attendee.role} - ${attendee.present ? "Present" : "Absent"}\n`
    })
    content += `\n`
  }

  if (formData.observations) {
    content += `OBSERVATIONS\n`
    if (formData.observations.homeAtmosphere) {
      content += `Home Atmosphere: ${formData.observations.homeAtmosphere}\n\n`
    }
    if (formData.observations.positiveObservations) {
      content += `Positive Observations: ${formData.observations.positiveObservations}\n\n`
    }
    if (formData.observations.behaviorObservations) {
      content += `Behavior Observations: ${formData.observations.behaviorObservations}\n\n`
    }
  }

  if (formData.recommendations) {
    content += `RECOMMENDATIONS & NEXT STEPS\n`
    content += `${formData.recommendations}\n\n`
  }

  content += `---\n`
  content += `Foster Home Visit Report - Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n`
  content += `This document contains confidential information and should be handled according to agency policies.`

  return content
}
