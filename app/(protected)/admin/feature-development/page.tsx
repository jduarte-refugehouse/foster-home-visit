"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Mail, Send, CheckCircle, XCircle, Code, Rocket, MessageSquare, Phone } from "lucide-react"

export default function FeatureDevelopmentPage() {
  const [sandboxMode, setSandboxMode] = useState(false)

  // Email form state
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    body: "",
  })
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)

  // SMS form state
  const [smsForm, setSmsForm] = useState({
    to: "",
    body: "",
  })
  const [smsStatus, setSmsStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const [isLoadingSms, setIsLoadingSms] = useState(false)

  const handleSendEmail = async () => {
    if (!sandboxMode) {
      setEmailStatus({
        type: "error",
        message: "Please enable sandbox mode before testing features",
      })
      return
    }

    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      setEmailStatus({
        type: "error",
        message: "Please fill in all fields (To, Subject, Body)",
      })
      return
    }

    setIsLoadingEmail(true)
    setEmailStatus({ type: null, message: "" })

    try {
      const response = await fetch("/api/dev/sendgrid-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailForm),
      })

      const result = await response.json()

      if (response.ok) {
        setEmailStatus({
          type: "success",
          message: `Email sent successfully! Message ID: ${result.messageId}`,
        })
        // Clear form on success
        setEmailForm({ to: "", subject: "", body: "" })
      } else {
        setEmailStatus({
          type: "error",
          message: result.error || "Failed to send email",
        })
      }
    } catch (error) {
      setEmailStatus({
        type: "error",
        message: "Network error: Failed to send email",
      })
    } finally {
      setIsLoadingEmail(false)
    }
  }

  const handleSendSms = async () => {
    if (!sandboxMode) {
      setSmsStatus({
        type: "error",
        message: "Please enable sandbox mode before testing features",
      })
      return
    }

    if (!smsForm.to || !smsForm.body) {
      setSmsStatus({
        type: "error",
        message: "Please fill in all fields (To, Message)",
      })
      return
    }

    setIsLoadingSms(true)
    setSmsStatus({ type: null, message: "" })

    try {
      // Parse phone numbers - handle both single and multiple numbers
      const phoneNumbers = smsForm.to
        .split(/[\n,;]/) // Split by newlines, commas, or semicolons
        .map((num) => num.trim())
        .filter((num) => num.length > 0)

      if (phoneNumbers.length === 1) {
        // Single SMS - use the existing dev endpoint
        const response = await fetch("/api/dev/twilio-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: phoneNumbers[0],
            body: smsForm.body,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          setSmsStatus({
            type: "success",
            message: `SMS sent successfully! Message SID: ${result.sid}`,
          })
          // Clear form on success
          setSmsForm({ to: "", body: "" })
        } else {
          setSmsStatus({
            type: "error",
            message: result.error || "Failed to send SMS",
          })
        }
      } else {
        // Multiple SMS - use the bulk endpoint
        const response = await fetch("/api/admin/bulk-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumbers: phoneNumbers,
            message: smsForm.body,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          setSmsStatus({
            type: "success",
            message: `Bulk SMS sent! ${result.totalSent} successful, ${result.totalFailed} failed out of ${result.totalProcessed} total.`,
          })
          // Clear form on success
          setSmsForm({ to: "", body: "" })
        } else {
          setSmsStatus({
            type: "error",
            message: result.error || "Failed to send bulk SMS",
          })
        }
      }
    } catch (error) {
      setSmsStatus({
        type: "error",
        message: "Network error: Failed to send SMS",
      })
    } finally {
      setIsLoadingSms(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Development</h1>
          <p className="text-muted-foreground">Safe environment for developing and testing new features</p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="sandbox-mode">Sandbox Mode</Label>
          <Switch id="sandbox-mode" checked={sandboxMode} onCheckedChange={setSandboxMode} />
          <Badge variant={sandboxMode ? "default" : "secondary"}>{sandboxMode ? "ENABLED" : "DISABLED"}</Badge>
        </div>
      </div>

      {!sandboxMode && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Safety First:</strong> Enable sandbox mode to test features safely. This prevents any unintended
            effects on the production system.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="sendgrid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sendgrid">
            <Mail className="w-4 h-4 mr-2" />
            SendGrid Email
          </TabsTrigger>
          <TabsTrigger value="twilio">
            <MessageSquare className="w-4 h-4 mr-2" />
            Twilio SMS
          </TabsTrigger>
          <TabsTrigger value="guidelines">
            <Code className="w-4 h-4 mr-2" />
            Guidelines
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Rocket className="w-4 h-4 mr-2" />
            Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sendgrid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                SendGrid Email Testing
              </CardTitle>
              <CardDescription>
                Test SendGrid email functionality in a safe environment. All test emails will be prefixed with [DEV
                TEST] in the subject line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-to">To (Recipient Email)</Label>
                  <Input
                    id="email-to"
                    type="email"
                    placeholder="recipient@example.com"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                    disabled={!sandboxMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Test email subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                    disabled={!sandboxMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Body</Label>
                  <Textarea
                    id="email-body"
                    placeholder="Enter your email message here..."
                    rows={6}
                    value={emailForm.body}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
                    disabled={!sandboxMode}
                  />
                </div>

                <Button onClick={handleSendEmail} disabled={!sandboxMode || isLoadingEmail} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {isLoadingEmail ? "Sending..." : "Send Test Email"}
                </Button>

                {emailStatus.type && (
                  <Alert variant={emailStatus.type === "error" ? "destructive" : "default"}>
                    {emailStatus.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{emailStatus.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Environment Variables Required:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <code>SENDGRID_API_KEY</code> - Your SendGrid API key
                  </li>
                  <li>
                    • <code>SENDGRID_FROM_EMAIL</code> - Verified sender email (optional)
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twilio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Twilio SMS Testing
              </CardTitle>
              <CardDescription>
                Test Twilio SMS functionality in a safe environment. All test messages will be prefixed with [DEV TEST].
                Supports both single and multiple phone numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-to">To (Recipient Phone Number(s))</Label>
                  <Textarea
                    id="sms-to"
                    placeholder="Single number: +1234567890\n\nMultiple numbers (one per line or comma-separated):\n+1234567890\n+1987654321\n+1555123456"
                    rows={4}
                    value={smsForm.to}
                    onChange={(e) => setSmsForm((prev) => ({ ...prev, to: e.target.value }))}
                    disabled={!sandboxMode}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US). For multiple numbers, separate with new lines, commas, or
                    semicolons. Trial accounts can only send to verified numbers.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms-body">Message</Label>
                  <Textarea
                    id="sms-body"
                    placeholder="Enter your SMS message here..."
                    rows={4}
                    maxLength={1600}
                    value={smsForm.body}
                    onChange={(e) => setSmsForm((prev) => ({ ...prev, body: e.target.value }))}
                    disabled={!sandboxMode}
                  />
                  <p className="text-xs text-muted-foreground">{smsForm.body.length}/1600 characters</p>
                </div>

                <Button onClick={handleSendSms} disabled={!sandboxMode || isLoadingSms} className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  {isLoadingSms ? "Sending..." : "Send Test SMS"}
                </Button>

                {smsStatus.type && (
                  <Alert variant={smsStatus.type === "error" ? "destructive" : "default"}>
                    {smsStatus.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{smsStatus.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Environment Variables Required:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <code>TWILIO_ACCOUNT_SID</code> - Your Twilio Account SID
                  </li>
                  <li>
                    • <code>TWILIO_AUTH_TOKEN</code> - Your Twilio Auth Token
                  </li>
                  <li>
                    • <code>TWILIO_PHONE_NUMBER</code> - Your Twilio phone number
                  </li>
                  <li>
                    • <code>TWILIO_MESSAGING_SERVICE_SID</code> - Your Messaging Service SID (optional)
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Trial Account Notes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You can only send SMS to phone numbers verified in your Twilio console</li>
                  <li>• Messages will include "Sent from your Twilio trial account" prefix</li>
                  <li>• Upgrade to a paid account to remove these restrictions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Development Guidelines</CardTitle>
              <CardDescription>Best practices for safe feature development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✅ DO:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      • Create features in <code>/app/api/dev/</code> or <code>/components/dev/</code>
                    </li>
                    <li>• Use sandbox mode for all testing</li>
                    <li>
                      • Prefix test data with <code>_dev</code> or <code>_test</code>
                    </li>
                    <li>• Test thoroughly before moving to production</li>
                    <li>• Document your changes</li>
                    <li>• Use verified phone numbers for SMS testing</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-2">❌ DON'T:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Modify core application files during testing</li>
                    <li>• Test with production data</li>
                    <li>• Skip sandbox mode</li>
                    <li>• Deploy untested features</li>
                    <li>• Use production API endpoints for testing</li>
                    <li>• Send SMS to unverified numbers on trial accounts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Development Workflow</CardTitle>
              <CardDescription>Step-by-step process for safe feature development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge variant="outline">1</Badge>
                  <div>
                    <h4 className="font-semibold">Plan & Design</h4>
                    <p className="text-sm text-muted-foreground">
                      Define requirements, API structure, and database changes
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="outline">2</Badge>
                  <div>
                    <h4 className="font-semibold">Create Development Files</h4>
                    <p className="text-sm text-muted-foreground">
                      Build in <code>/api/dev/</code> or <code>/components/dev/</code> folders
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="outline">3</Badge>
                  <div>
                    <h4 className="font-semibold">Test in Sandbox</h4>
                    <p className="text-sm text-muted-foreground">Use this page to test functionality safely</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="outline">4</Badge>
                  <div>
                    <h4 className="font-semibold">Integration Testing</h4>
                    <p className="text-sm text-muted-foreground">Test with other system components</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Badge variant="outline">5</Badge>
                  <div>
                    <h4 className="font-semibold">Production Deployment</h4>
                    <p className="text-sm text-muted-foreground">Move to production paths and update navigation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
