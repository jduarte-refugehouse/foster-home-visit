"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { SignaturePad } from "@refugehouse/shared-core/components/ui/signature-pad"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SignaturePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenData, setTokenData] = useState<any>(null)
  const [signature, setSignature] = useState("")
  const [signerName, setSignerName] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (token) {
      fetchTokenData()
    }
  }, [token])

  const fetchTokenData = async () => {
    try {
      const response = await fetch(`/api/public/signature-tokens/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid or expired signature link")
        setLoading(false)
        return
      }

      // Public route returns different structure
      if (data.success && data.token) {
        // Check expiration and usage from token data
        if (data.token.expires_at && new Date(data.token.expires_at) < new Date()) {
          setError("This signature link has expired")
          setLoading(false)
          return
        }
        
        if (data.token.is_used || data.token.used_at) {
          setError("This signature link has already been used")
          setLoading(false)
          return
        }
        
        setTokenData(data.token)
        setSignerName(data.signerName || data.token.signer_name || "")
      } else {
        setError(data.error || "Invalid signature link")
        setLoading(false)
        return
      }
    } catch (error) {
      console.error("Error fetching token data:", error)
      setError("Failed to load signature page")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!signature) {
      setError("Please provide your signature")
      return
    }

    if (!signerName.trim()) {
      setError("Please enter your name")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/public/signature-tokens/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
          signerName: signerName.trim(),
        }),
      })

      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        setError("Failed to parse server response")
        setSubmitting(false)
        return
      }

      if (!response.ok) {
        console.error("Signature submission failed:", data)
        console.error("Full error object:", JSON.stringify(data, null, 2))
        const errorMsg = data.error || data.details || data.message || "Failed to submit signature"
        if (data.sqlError) {
          console.error("SQL Error:", data.sqlError)
        }
        setError(errorMsg)
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch (error) {
      console.error("Error submitting signature:", error)
      setError("Failed to submit signature. Please try again.")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-refuge-purple mb-4" />
          <p className="text-muted-foreground">Loading signature page...</p>
        </div>
      </div>
    )
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Signature Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Thank you! Your signature has been successfully submitted and added to the visit form.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground">
              <p><strong>Signed by:</strong> {signerName}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Sign Foster Home Visit Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {tokenData && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Signature Request</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Requested for:</strong> {tokenData.signer_name || tokenData.recipient_name || "Unknown"}
                  </p>
                  {tokenData.description && (
                    <p className="text-sm text-muted-foreground mt-2">{tokenData.description}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="signer-name">Your Name *</Label>
              <Input
                id="signer-name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Signature *</Label>
              <div className="mt-1">
                <SignaturePad
                  label=""
                  value={signature}
                  onChange={setSignature}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !signature || !signerName.trim()}
                className="flex-1 bg-refuge-purple hover:bg-refuge-magenta"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Signature"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

