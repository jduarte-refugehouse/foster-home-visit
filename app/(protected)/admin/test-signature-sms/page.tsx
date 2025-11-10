"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestSignatureSMSPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    phoneNumber: "+19723427857",
    signerName: "Test Signer",
  })

  const handleSend = async () => {
    if (!formData.phoneNumber || !formData.signerName) {
      setError("Phone Number and Name are required")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Create the signature token (no visit form required for testing)
      const tokenResponse = await fetch("/api/visit-forms/signature-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitFormId: null, // No visit form required for testing
          signerName: formData.signerName,
          signerRole: "foster_parent",
          signerType: "foster_parent_1",
          phoneNumber: formData.phoneNumber,
          emailAddress: null,
          description: "Test Signature Request",
          expiresInHours: 24,
        }),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || "Failed to create signature token")
      }

      const { token, signatureUrl } = tokenData

      // Build the SMS message
      const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
      const fullUrl = signatureUrl || `${baseUrl}/signature/${token}`

      // Send SMS
      const smsResponse = await fetch("/api/dev/twilio-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formData.phoneNumber,
          body: `Please sign the visit form: ${fullUrl}`,
        }),
      })

      const smsData = await smsResponse.json()

      if (!smsResponse.ok) {
        throw new Error(smsData.error || "Failed to send SMS")
      }

      setResult({
        token,
        signatureUrl: fullUrl,
        smsSid: smsData.sid,
        phoneNumber: formData.phoneNumber,
      })

      toast({
        title: "Success",
        description: "Signature request sent successfully",
      })
    } catch (err: any) {
      console.error("Error sending test signature SMS:", err)
      setError(err.message || "Failed to send test signature SMS")
      toast({
        title: "Error",
        description: err.message || "Failed to send test signature SMS",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Signature SMS</CardTitle>
          <CardDescription>
            Send a signature request via SMS for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+19723427857"
              required
            />
            <p className="text-xs text-muted-foreground">Include country code (e.g., +1)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signerName">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signerName"
              value={formData.signerName}
              onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
              placeholder="Test Signer"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-semibold text-green-800 mb-2">SMS Sent Successfully!</div>
                <div className="text-sm space-y-1">
                  <div><strong>Phone:</strong> {result.phoneNumber}</div>
                  <div><strong>SMS SID:</strong> <code className="text-xs">{result.smsSid}</code></div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSend} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Signature Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

