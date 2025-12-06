import { type NextRequest, NextResponse } from "next/server"
import { createUser, updateUserLastLogin } from "@refugehouse/shared-core/user-management"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    // Verify webhook signature (in production, use your webhook secret)
    // const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
    // const event = webhook.verify(payload, headers)

    // For now, parse the payload directly
    const event = JSON.parse(payload)

    switch (event.type) {
      case "user.created":
        await createUser({
          clerk_user_id: event.data.id,
          email: event.data.email_addresses[0]?.email_address,
          first_name: event.data.first_name,
          last_name: event.data.last_name,
        })
        break

      case "session.created":
        await updateUserLastLogin(event.data.user_id)
        break

      default:
        console.log(`Unhandled webhook event: ${event.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
