import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"

export default function TestLoggingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communication Logging Test</h1>
        <p className="text-muted-foreground mt-2">
          Test your communication logging system to ensure all messages are being tracked properly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              SMS Logging Test
            </CardTitle>
            <CardDescription>Send a test SMS and verify it appears in communication history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Steps to test:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Feature Development page</li>
                <li>Send a test SMS to your phone</li>
                <li>Check Communication History for the logged entry</li>
                <li>Verify all details are captured correctly</li>
              </ol>
            </div>
            <Button asChild>
              <a href="/admin/feature-development">Go to Feature Development</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Email Logging Test
            </CardTitle>
            <CardDescription>Send a test email and verify it appears in communication history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Steps to test:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Feature Development page</li>
                <li>Send a test email to yourself</li>
                <li>Check Communication History for the logged entry</li>
                <li>Verify all details are captured correctly</li>
              </ol>
            </div>
            <Button asChild>
              <a href="/admin/feature-development">Go to Feature Development</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Bulk SMS Logging Test
            </CardTitle>
            <CardDescription>Send bulk SMS and verify all messages are logged individually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Steps to test:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Bulk SMS page</li>
                <li>Send messages to multiple numbers</li>
                <li>Check Communication History</li>
                <li>Verify each recipient has a separate log entry</li>
              </ol>
            </div>
            <Button asChild>
              <a href="/admin/bulk-sms">Go to Bulk SMS</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit">
                History
              </Badge>
              View Communication History
            </CardTitle>
            <CardDescription>Check all logged communications and verify data integrity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">What to verify:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All sent messages appear in history</li>
                <li>Delivery status is correctly tracked</li>
                <li>Provider IDs are captured (Twilio SID, SendGrid ID)</li>
                <li>Timestamps are accurate</li>
                <li>Filtering and search work properly</li>
              </ul>
            </div>
            <Button asChild>
              <a href="/admin/communication-history">View Communication History</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Testing Complete?</CardTitle>
          <CardDescription className="text-green-700">
            Once you've verified all the above tests work correctly, your communication logging system is fully
            operational.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            Your system will now automatically log all SMS and email communications, allowing you to track message
            history and tie communications back to specific phone numbers and email addresses.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
