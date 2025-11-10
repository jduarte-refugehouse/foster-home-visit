"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send, CheckCircle2, XCircle, AlertCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TestSignatureSMSPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    visitFormId: "",
    phoneNumber: "+19723427857",
    signerName: "Test Signer",
    signerRole: "foster_parent",
    signerType: "foster_parent_1",
    description: "Test Signature Request",
    expiresInHours: "24",
    message: "",
  })

  const handleSend = async () => {
    if (!formData.visitFormId || !formData.phoneNumber) {
      setError("Visit Form ID and Phone Number are required")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // First, create the signature token
      const tokenResponse = await fetch("/api/visit-forms/signature-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitFormId: formData.visitFormId,
          signerName: formData.signerName,
          signerRole: formData.signerRole,
          signerType: formData.signerType,
          phoneNumber: formData.phoneNumber,
          emailAddress: null,
          description: formData.description,
          expiresInHours: parseInt(formData.expiresInHours) || 24,
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
      const smsMessage = formData.message || `Please sign the visit form: ${fullUrl}`

      // Send SMS
      const smsResponse = await fetch("/api/dev/twilio-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formData.phoneNumber,
          body: smsMessage,
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
        description: "Signature token created and SMS sent successfully",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Signature SMS</CardTitle>
          <CardDescription>
            Create a signature token and send it via SMS for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitFormId">
                Visit Form ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitFormId"
                value={formData.visitFormId}
                onChange={(e) => setFormData({ ...formData, visitFormId: e.target.value })}
                placeholder="Enter visit form ID"
                required
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Signer Name</Label>
              <Input
                id="signerName"
                value={formData.signerName}
                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                placeholder="Test Signer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerRole">Signer Role</Label>
              <Select
                value={formData.signerRole}
                onValueChange={(value) => setFormData({ ...formData, signerRole: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foster_parent">Foster Parent</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signerType">Signer Type</Label>
              <Select
                value={formData.signerType}
                onValueChange={(value) => setFormData({ ...formData, signerType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foster_parent_1">Foster Parent 1</SelectItem>
                  <SelectItem value="foster_parent_2">Foster Parent 2</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresInHours">Expires In (Hours)</Label>
              <Input
                id="expiresInHours"
                type="number"
                value={formData.expiresInHours}
                onChange={(e) => setFormData({ ...formData, expiresInHours: e.target.value })}
                placeholder="24"
                min="1"
                max="168"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Test Signature Request"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">SMS Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Leave empty to use default message with signature link"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              If left empty, a default message with the signature link will be used
            </p>
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
              <AlertDescription className="space-y-2">
                <div className="font-semibold text-green-800">Success!</div>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Token:</strong> <code className="text-xs">{result.token}</code>
                  </div>
                  <div>
                    <strong>SMS SID:</strong> <code className="text-xs">{result.smsSid}</code>
                  </div>
                  <div>
                    <strong>Phone:</strong> {result.phoneNumber}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <strong>Signature URL:</strong>
                    <code className="text-xs flex-1 bg-white p-1 rounded border">{result.signatureUrl}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.signatureUrl)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSend} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Token & Sending SMS...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Token & Send SMS
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

