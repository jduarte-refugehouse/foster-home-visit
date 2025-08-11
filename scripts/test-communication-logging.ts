// Test script to verify communication logging integration
// Run this script to test that all logging functionality works correctly

import {
  logCommunication,
  updateCommunicationStatus,
  getCommunicationHistory,
  getCommunicationStats,
  getMicroserviceId,
} from "../lib/communication-logging"

async function testCommunicationLogging() {
  console.log("🧪 Testing Communication Logging Integration...")
  console.log("=".repeat(50))

  try {
    // Test 1: Get microservice ID
    console.log("\n1. Testing getMicroserviceId()...")
    const microserviceId = await getMicroserviceId()
    console.log(`✅ Microservice ID: ${microserviceId}`)

    // Test 2: Log a test SMS communication
    console.log("\n2. Testing SMS communication logging...")
    const smsLogId = await logCommunication({
      microservice_id: microserviceId,
      communication_type: "test",
      delivery_method: "sms",
      recipient_phone: "+1234567890",
      recipient_name: "Test User",
      message_text: "This is a test SMS message for logging verification",
      sender_name: "Test Script",
      status: "pending",
    })
    console.log(`✅ SMS logged with ID: ${smsLogId}`)

    // Test 3: Update SMS status to sent
    console.log("\n3. Testing SMS status update...")
    await updateCommunicationStatus(smsLogId, "sent", undefined, "test_twilio_sid_123", "twilio")
    console.log(`✅ SMS status updated to 'sent'`)

    // Test 4: Log a test email communication
    console.log("\n4. Testing email communication logging...")
    const emailLogId = await logCommunication({
      microservice_id: microserviceId,
      communication_type: "test",
      delivery_method: "email",
      recipient_email: "test@example.com",
      recipient_name: "Test User",
      subject: "Test Email Subject",
      message_text: "This is a test email message for logging verification",
      message_html: "<p>This is a test email message for logging verification</p>",
      sender_email: "noreply@refugehouse.org",
      sender_name: "Test Script",
      status: "pending",
    })
    console.log(`✅ Email logged with ID: ${emailLogId}`)

    // Test 5: Update email status to delivered
    console.log("\n5. Testing email status update...")
    await updateCommunicationStatus(emailLogId, "delivered", undefined, "test_sendgrid_id_456", "sendgrid")
    console.log(`✅ Email status updated to 'delivered'`)

    // Test 6: Log a failed communication
    console.log("\n6. Testing failed communication logging...")
    const failedLogId = await logCommunication({
      microservice_id: microserviceId,
      communication_type: "test",
      delivery_method: "sms",
      recipient_phone: "+9999999999",
      message_text: "This message will fail for testing purposes",
      sender_name: "Test Script",
      status: "pending",
    })
    await updateCommunicationStatus(failedLogId, "failed", "Invalid phone number format")
    console.log(`✅ Failed communication logged with ID: ${failedLogId}`)

    // Test 7: Retrieve communication history
    console.log("\n7. Testing communication history retrieval...")
    const history = await getCommunicationHistory({
      communication_type: "test",
      limit: 10,
    })
    console.log(`✅ Retrieved ${history.length} test communications`)

    // Display the test communications
    history.forEach((entry, index) => {
      console.log(
        `   ${index + 1}. ${entry.delivery_method.toUpperCase()} to ${entry.recipient_email || entry.recipient_phone} - Status: ${entry.status}`,
      )
    })

    // Test 8: Get communication statistics
    console.log("\n8. Testing communication statistics...")
    const stats = await getCommunicationStats()
    console.log(`✅ Statistics retrieved:`)
    console.log(`   Total communications: ${stats.total}`)
    console.log(`   Last 24 hours: ${stats.last24Hours}`)
    console.log(`   Last 7 days: ${stats.last7Days}`)
    console.log(`   By method:`, stats.byMethod)
    console.log(`   By status:`, stats.byStatus)

    // Test 9: Test filtering
    console.log("\n9. Testing filtered history retrieval...")
    const smsHistory = await getCommunicationHistory({
      delivery_method: "sms",
      limit: 5,
    })
    console.log(`✅ Retrieved ${smsHistory.length} SMS communications`)

    const emailHistory = await getCommunicationHistory({
      delivery_method: "email",
      limit: 5,
    })
    console.log(`✅ Retrieved ${emailHistory.length} email communications`)

    console.log("\n" + "=".repeat(50))
    console.log("🎉 All communication logging tests passed!")
    console.log("✅ The logging integration is working correctly.")
    console.log("\nNext steps:")
    console.log("1. Run the SQL scripts to add navigation items")
    console.log("2. Test the admin pages in your browser")
    console.log("3. Send actual SMS/emails to verify end-to-end logging")
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    console.log("\nTroubleshooting:")
    console.log("1. Ensure the communication_logs table exists in your database")
    console.log("2. Check that your database connection is working")
    console.log("3. Verify the microservice_apps table has entries")
    throw error
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCommunicationLogging()
    .then(() => {
      console.log("\n✅ Test completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error)
      process.exit(1)
    })
}

export { testCommunicationLogging }
