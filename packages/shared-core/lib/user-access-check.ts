import { query } from "@refugehouse/shared-core/db"
import sgMail from "@sendgrid/mail"
import { logCommunication } from "@refugehouse/shared-core/communication"

/**
 * Check if a user has access to the platform
 * - refugehouse.org users: always allowed
 * - External users: must have app_user record OR invitation
 * 
 * Returns: { hasAccess: boolean, requiresInvitation: boolean, isNewUser: boolean }
 */
export async function checkUserAccess(
  clerkUserId: string,
  email: string,
  firstName?: string,
  lastName?: string,
): Promise<{
  hasAccess: boolean
  requiresInvitation: boolean
  isNewUser: boolean
  userExists: boolean
  hasInvitation: boolean
}> {
  // Check if user exists in app_users
  const existingUser = await query<{ id: string }>(
    "SELECT id FROM app_users WHERE clerk_user_id = @param0 OR email = @param1",
    [clerkUserId, email],
  )

  const userExists = existingUser.length > 0

  // Check if user has an active invitation
  const invitation = await query<{ id: string }>(
    "SELECT id FROM invited_users WHERE email = @param0 AND is_active = 1",
    [email],
  )

  const hasInvitation = invitation.length > 0

  // refugehouse.org users always have access
  const isInternalUser = email.endsWith("@refugehouse.org")

  if (isInternalUser) {
    return {
      hasAccess: true,
      requiresInvitation: false,
      isNewUser: !userExists,
      userExists,
      hasInvitation: false, // Not relevant for internal users
    }
  }

  // External users: must have app_user record OR invitation
  if (userExists || hasInvitation) {
    return {
      hasAccess: true,
      requiresInvitation: false,
      isNewUser: !userExists,
      userExists,
      hasInvitation,
    }
  }

  // External user without app_user record or invitation - send notification
  await notifyNewUserAccessAttempt(email, firstName, lastName, clerkUserId)

  return {
    hasAccess: false,
      requiresInvitation: true,
      isNewUser: true,
      userExists: false,
      hasInvitation: false,
  }
}

/**
 * Send email notification when a new user (without app_user or invitation) tries to access
 * Includes deduplication to prevent sending multiple emails for the same user
 */
async function notifyNewUserAccessAttempt(
  email: string,
  firstName?: string,
  lastName?: string,
  clerkUserId?: string,
): Promise<void> {
  try {
    // Check if we've already sent a notification for this user in the last 24 hours
    // This prevents duplicate emails when multiple endpoints check access simultaneously
    // We check by looking for notifications sent to admin with subject containing the user's email
    const adminEmail = "jduarte@refugehouse.org"
    const recentNotification = await query<{ id: string; created_at: Date }>(
      `SELECT id, created_at 
       FROM communication_logs 
       WHERE recipient_email = @param0 
         AND communication_type = 'notification'
         AND subject LIKE @param1
         AND created_at >= DATEADD(hour, -24, GETDATE())
       ORDER BY created_at DESC`,
      [adminEmail, `%New User Access Request - ${email}%`],
    )

    if (recentNotification.length > 0) {
      console.log(
        `⏭️ [ACCESS CHECK] Skipping duplicate notification for ${email} - already sent ${new Date(recentNotification[0].created_at).toLocaleString()}`,
      )
      return
    }

    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@refugehouse.org"
    // adminEmail already defined above

    if (!apiKey) {
      console.error("❌ [ACCESS CHECK] SendGrid API key not configured - cannot send notification")
      return
    }

    sgMail.setApiKey(apiKey)

    const userName = [firstName, lastName].filter(Boolean).join(" ") || email
    const subject = `New User Access Request - ${email}`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #5E3989;">New User Access Request</h2>
        <p>A new user has attempted to access the Foster Home Visit platform but does not have an account or invitation.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">User Information:</h3>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Clerk User ID:</strong> ${clerkUserId || "N/A"}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <p style="color: #6b7280;">
          <strong>Action Required:</strong> Review this user and either:
          <ul>
            <li>Create an invitation for them via the Admin panel</li>
            <li>Manually create their app_user record if they should have access</li>
          </ul>
        </p>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          This is an automated notification from the Foster Home Visit platform.
        </p>
      </div>
    `

    const textContent = `
New User Access Request

A new user has attempted to access the Foster Home Visit platform but does not have an account or invitation.

User Information:
- Name: ${userName}
- Email: ${email}
- Clerk User ID: ${clerkUserId || "N/A"}
- Timestamp: ${new Date().toLocaleString()}

Action Required: Review this user and either:
1. Create an invitation for them via the Admin panel
2. Manually create their app_user record if they should have access

This is an automated notification from the Foster Home Visit platform.
    `

    const msg = {
      to: adminEmail,
      from: {
        email: fromEmail,
        name: "Foster Home Visit System",
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    const response = await sgMail.send(msg)
    const messageId = response[0]?.headers?.["x-message-id"] || null

    // Log the notification to communication_logs table
    try {
      await logCommunication({
        source_application: "home-visit-app",
        source_feature: "access-control",
        communication_type: "notification",
        delivery_method: "email",
        recipient_email: adminEmail,
        recipient_name: "Admin",
        email_sent_from: fromEmail,
        email_sent_from_name: "Foster Home Visit System",
        subject: subject,
        message_text: textContent,
        message_html: htmlContent,
        sendgrid_message_id: messageId || undefined,
        status: "sent",
        sent_at: new Date(),
      })
    } catch (logError) {
      // Don't fail if logging fails - email was already sent
      console.error("⚠️ [ACCESS CHECK] Failed to log notification:", logError)
    }

    console.log(`✅ [ACCESS CHECK] Notification sent to ${adminEmail} for new user access attempt: ${email}`)
  } catch (error) {
    console.error("❌ [ACCESS CHECK] Failed to send notification email:", error)
    // Don't throw - we don't want email failures to block the access check
  }
}

