"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { SignaturePad } from "@/components/ui/signature-pad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

/**
 * PUBLIC SIGNATURE PAGE - No authentication required
 * Token-based signature collection for external users
 * Accessible via: /signature/[token]
 */
export default function SignaturePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string>("")
  const [signerName, setSignerName] = useState<string>("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      validateToken()
    }
  }, [token])

  const validateToken = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/public/signature-tokens/${token}`)

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 404) {
          setError("Invalid signature link. Please check the link and try again.")
        } else if (response.status === 410) {
          setError(data.error || "This signature link has expired or already been used.")
        } else {
          setError(data.error || "Failed to load signature request.")
        }
        return
      }

      const data = await response.json()
      setTokenInfo(data)
      setSignerName(data.signerName || "")
    } catch (err: any) {
      console.error("Error validating token:", err)
      setError("Failed to load signature request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signature) {
      setError("Please provide your signature before submitting.")
      return
    }

    if (!signerName.trim()) {
      setError("Please enter your name.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

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

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 410) {
          setError(data.error || "This signature link has expired or already been used.")
        } else {
          setError(data.error || "Failed to submit signature. Please try again.")
        }
        return
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error submitting signature:", err)
      setError("Failed to submit signature. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading signature request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Signature Submitted</h2>
              <p className="text-gray-600">
                Thank you! Your signature has been successfully submitted.
              </p>
              {tokenInfo?.visitDate && (
                <p className="text-sm text-gray-500">
                  Visit Date: {new Date(tokenInfo.visitDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Digital Signature Request</CardTitle>
          <CardDescription>
            {tokenInfo?.description || "Please sign below to complete this request."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {tokenInfo?.visitDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Visit Date:</strong> {new Date(tokenInfo.visitDate).toLocaleDateString()}
                </p>
                {tokenInfo?.formType && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>Form Type:</strong> {tokenInfo.formType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signerName">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder={tokenInfo?.signerName || "Enter your full name"}
                required
                disabled={submitting}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Signature <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <SignaturePad
                  value={signature}
                  onChange={setSignature}
                  label=""
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-gray-500">
                Please sign using your mouse, touchpad, or touchscreen
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting || !signature || !signerName.trim()}
                className="flex-1"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Signature"
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By submitting, you confirm that this is your electronic signature and you agree to the terms.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

