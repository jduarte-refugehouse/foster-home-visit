"use client"

import { useState } from "react"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function TestSignatureSMSPage() {
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [description, setDescription] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      })
      return
    }

    if (!recipientName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recipient name",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-signature-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          recipientName: recipientName.trim(),
          description: description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send SMS")
      }

      setResult(data)
      toast({
        title: "SMS Sent",
        description: `Signature link sent to ${phoneNumber}`,
      })
    } catch (error: any) {
      console.error("Error sending SMS:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send SMS",
        variant: "destructive",
      })
      setResult({ success: false, error: error.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Signature Request via SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              This page allows you to test the SMS signature request functionality. Enter a phone number and name,
              then send an SMS with a signature link. The recipient can click the link from their phone to sign.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: +1 followed by 10 digits (e.g., +1234567890)
              </p>
            </div>

            <div>
              <Label htmlFor="name">Recipient Name *</Label>
              <Input
                id="name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Request Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please sign the foster home visit form for the visit on..."
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This description will be shown to the recipient when they open the signature link.
              </p>
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || !phoneNumber.trim() || !recipientName.trim()}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending SMS...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Signature Link via SMS
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className="mt-6">
              {result.success ? (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="space-y-2">
                      <p><strong>SMS sent successfully!</strong></p>
                      <p className="text-sm">Message SID: {result.sid}</p>
                      <p className="text-sm">Signature URL: {result.signatureUrl}</p>
                      <p className="text-xs mt-2">
                        The recipient should receive an SMS with a link to sign. You can test by clicking the link
                        above or having the recipient open it on their phone.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p><strong>Error:</strong> {result.error || "Unknown error"}</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

