import { query } from "./db"

// Communication logging service for tracking SMS and email messages
// Uses the locked database connection safely

export interface CommunicationLogEntry {
  id?: string
  microservice_id: string
  user_id?: string
  communication_type: "appointment_reminder" | "invitation" | "notification" | "direct" | "bulk_sms" | "test"
  delivery_method: "email" | "sms" | "both"

  // Recipient info
  recipient_email?: string
  recipient_phone?: string
  recipient_name?: string

  // Sender info
  sender_email?: string
  sender_phone?: string
  sender_name?: string

  // Content
  subject?: string // For email
  message_text: string
  message_html?: string // For email

  // Template info
  template_used?: string
  template_variables?: Record<string, any>

  // Provider tracking
  sendgrid_message_id?: string
  twilio_message_sid?: string

  // Status tracking
  status: "pending" | "sent" | "delivered" | "failed"
  error_message?: string

  // Timing
  scheduled_for?: Date
  sent_at?: Date
  delivered_at?: Date
  created_at?: Date
  updated_at?: Date
}

export interface CommunicationLogFilters {
  communication_type?: string
  delivery_method?: string
  status?: string
  recipient_email?: string
  recipient_phone?: string
  date_from?: Date
  date_to?: Date
  limit?: number
  offset?: number
}

/**
 * Log a communication attempt to the database
 */
export async function logCommunication(
  entry: Omit<CommunicationLogEntry, "id" | "created_at" | "updated_at">,
): Promise<string> {
  console.log("📝 [Communication] Logging communication to database...")

  const queryText = `
    INSERT INTO communication_logs (
      microservice_id, user_id, communication_type, delivery_method,
      recipient_email, recipient_phone, recipient_name,
      sender_email, sender_phone, sender_name,
      subject, message_text, message_html,
      template_used, template_variables,
      sendgrid_message_id, twilio_message_sid,
      status, error_message,
      scheduled_for, sent_at, delivered_at
    )
    OUTPUT INSERTED.id
    VALUES (
      @param0, @param1, @param2, @param3,
      @param4, @param5, @param6,
      @param7, @param8, @param9,
      @param10, @param11, @param12,
      @param13, @param14,
      @param15, @param16,
      @param17, @param18,
      @param19, @param20, @param21
    )
  `

  const params = [
    entry.microservice_id,
    entry.user_id || null,
    entry.communication_type,
    entry.delivery_method,
    entry.recipient_email || null,
    entry.recipient_phone || null,
    entry.recipient_name || null,
    entry.sender_email || null,
    entry.sender_phone || null,
    entry.sender_name || null,
    entry.subject || null,
    entry.message_text,
    entry.message_html || null,
    entry.template_used || null,
    entry.template_variables ? JSON.stringify(entry.template_variables) : null,
    entry.sendgrid_message_id || null,
    entry.twilio_message_sid || null,
    entry.status,
    entry.error_message || null,
    entry.scheduled_for || null,
    entry.sent_at || null,
    entry.delivered_at || null,
  ]

  try {
    const result = await query<{ id: string }>(queryText, params)
    const logId = result[0]?.id
    console.log(`✅ [Communication] Logged communication with ID: ${logId}`)
    return logId
  } catch (error) {
    console.error("❌ [Communication] Error logging communication:", error)
    throw error
  }
}

/**
 * Update communication status (e.g., when delivery confirmation is received)
 */
export async function updateCommunicationStatus(
  logId: string,
  status: "sent" | "delivered" | "failed",
  errorMessage?: string,
  providerId?: string,
  providerType?: "sendgrid" | "twilio",
): Promise<void> {
  console.log(`📝 [Communication] Updating status for log ID ${logId} to ${status}`)

  let queryText = `
    UPDATE communication_logs 
    SET status = @param0, updated_at = GETDATE()
  `
  const params: any[] = [status]
  let paramIndex = 1

  if (errorMessage) {
    queryText += `, error_message = @param${paramIndex}`
    params.push(errorMessage)
    paramIndex++
  }

  if (providerId && providerType === "sendgrid") {
    queryText += `, sendgrid_message_id = @param${paramIndex}`
    params.push(providerId)
    paramIndex++
  }

  if (providerId && providerType === "twilio") {
    queryText += `, twilio_message_sid = @param${paramIndex}`
    params.push(providerId)
    paramIndex++
  }

  if (status === "sent") {
    queryText += `, sent_at = GETDATE()`
  } else if (status === "delivered") {
    queryText += `, delivered_at = GETDATE()`
  }

  queryText += ` WHERE id = @param${paramIndex}`
  params.push(logId)

  try {
    await query(queryText, params)
    console.log(`✅ [Communication] Updated status for log ID ${logId}`)
  } catch (error) {
    console.error(`❌ [Communication] Error updating status for log ID ${logId}:`, error)
    throw error
  }
}

/**
 * Get communication history with filtering and pagination
 */
export async function getCommunicationHistory(filters: CommunicationLogFilters = {}): Promise<CommunicationLogEntry[]> {
  console.log("📋 [Communication] Fetching communication history...")

  let whereClause = "WHERE 1=1"
  const params: any[] = []
  let paramIndex = 0

  if (filters.communication_type) {
    whereClause += ` AND communication_type = @param${paramIndex}`
    params.push(filters.communication_type)
    paramIndex++
  }

  if (filters.delivery_method) {
    whereClause += ` AND delivery_method = @param${paramIndex}`
    params.push(filters.delivery_method)
    paramIndex++
  }

  if (filters.status) {
    whereClause += ` AND status = @param${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }

  if (filters.recipient_email) {
    whereClause += ` AND recipient_email LIKE @param${paramIndex}`
    params.push(`%${filters.recipient_email}%`)
    paramIndex++
  }

  if (filters.recipient_phone) {
    whereClause += ` AND recipient_phone LIKE @param${paramIndex}`
    params.push(`%${filters.recipient_phone}%`)
    paramIndex++
  }

  if (filters.date_from) {
    whereClause += ` AND created_at >= @param${paramIndex}`
    params.push(filters.date_from)
    paramIndex++
  }

  if (filters.date_to) {
    whereClause += ` AND created_at <= @param${paramIndex}`
    params.push(filters.date_to)
    paramIndex++
  }

  const limit = filters.limit || 100
  const offset = filters.offset || 0

  const queryText = `
    SELECT 
      id, microservice_id, user_id, communication_type, delivery_method,
      recipient_email, recipient_phone, recipient_name,
      sender_email, sender_phone, sender_name,
      subject, message_text, message_html,
      template_used, template_variables,
      sendgrid_message_id, twilio_message_sid,
      status, error_message,
      scheduled_for, sent_at, delivered_at, created_at, updated_at
    FROM communication_logs 
    ${whereClause}
    ORDER BY created_at DESC
    OFFSET @param${paramIndex} ROWS
    FETCH NEXT @param${paramIndex + 1} ROWS ONLY
  `

  params.push(offset, limit)

  try {
    const results = await query<any>(queryText, params)
    console.log(`✅ [Communication] Retrieved ${results.length} communication log entries`)

    return results.map(
      (row): CommunicationLogEntry => ({
        id: row.id,
        microservice_id: row.microservice_id,
        user_id: row.user_id,
        communication_type: row.communication_type,
        delivery_method: row.delivery_method,
        recipient_email: row.recipient_email,
        recipient_phone: row.recipient_phone,
        recipient_name: row.recipient_name,
        sender_email: row.sender_email,
        sender_phone: row.sender_phone,
        sender_name: row.sender_name,
        subject: row.subject,
        message_text: row.message_text,
        message_html: row.message_html,
        template_used: row.template_used,
        template_variables: row.template_variables ? JSON.parse(row.template_variables) : undefined,
        sendgrid_message_id: row.sendgrid_message_id,
        twilio_message_sid: row.twilio_message_sid,
        status: row.status,
        error_message: row.error_message,
        scheduled_for: row.scheduled_for,
        sent_at: row.sent_at,
        delivered_at: row.delivered_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    )
  } catch (error) {
    console.error("❌ [Communication] Error fetching communication history:", error)
    throw error
  }
}

/**
 * Get communication statistics
 */
export async function getCommunicationStats(): Promise<{
  total: number
  byType: Record<string, number>
  byMethod: Record<string, number>
  byStatus: Record<string, number>
  last24Hours: number
  last7Days: number
}> {
  console.log("📊 [Communication] Calculating communication statistics...")

  const queryText = `
    SELECT 
      COUNT(*) as total,
      communication_type,
      delivery_method,
      status,
      CASE 
        WHEN created_at >= DATEADD(hour, -24, GETDATE()) THEN 1 
        ELSE 0 
      END as is_last_24h,
      CASE 
        WHEN created_at >= DATEADD(day, -7, GETDATE()) THEN 1 
        ELSE 0 
      END as is_last_7d
    FROM communication_logs
    GROUP BY communication_type, delivery_method, status, 
             CASE WHEN created_at >= DATEADD(hour, -24, GETDATE()) THEN 1 ELSE 0 END,
             CASE WHEN created_at >= DATEADD(day, -7, GETDATE()) THEN 1 ELSE 0 END
  `

  try {
    const results = await query<any>(queryText)

    const stats = {
      total: 0,
      byType: {} as Record<string, number>,
      byMethod: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      last24Hours: 0,
      last7Days: 0,
    }

    results.forEach((row) => {
      stats.total += row.total
      stats.byType[row.communication_type] = (stats.byType[row.communication_type] || 0) + row.total
      stats.byMethod[row.delivery_method] = (stats.byMethod[row.delivery_method] || 0) + row.total
      stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + row.total

      if (row.is_last_24h) {
        stats.last24Hours += row.total
      }
      if (row.is_last_7d) {
        stats.last7Days += row.total
      }
    })

    console.log("✅ [Communication] Statistics calculated:", stats)
    return stats
  } catch (error) {
    console.error("❌ [Communication] Error calculating statistics:", error)
    throw error
  }
}

/**
 * Helper function to get microservice ID (you may need to adjust this based on your app structure)
 */
export async function getMicroserviceId(): Promise<string> {
  const queryText = `
    SELECT TOP 1 id 
    FROM microservice_apps 
    WHERE app_name = 'Foster Home Visit System' OR app_name LIKE '%Foster%'
    ORDER BY created_at DESC
  `

  try {
    const result = await query<{ id: string }>(queryText)
    if (result.length > 0) {
      return result[0].id
    }

    // If no specific microservice found, get the first one
    const fallbackQuery = "SELECT TOP 1 id FROM microservice_apps ORDER BY created_at ASC"
    const fallbackResult = await query<{ id: string }>(fallbackQuery)

    if (fallbackResult.length > 0) {
      return fallbackResult[0].id
    }

    throw new Error("No microservice found in database")
  } catch (error) {
    console.error("❌ [Communication] Error getting microservice ID:", error)
    throw error
  }
}
