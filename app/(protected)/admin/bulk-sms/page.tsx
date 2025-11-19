"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Separator } from "@refugehouse/shared-core/components/ui/separator"
import { Progress } from "@refugehouse/shared-core/components/ui/progress"
import { AlertTriangle, MessageSquare, Send, CheckCircle, XCircle, Phone, Users, Clock } from "lucide-react"

interface SMSResult {
  to: string
  success: boolean
  sid?: string
  error?: string
}

interface BulkSMSResponse {
  success: boolean
  totalSent: number
  totalFailed: number
  totalProcessed: number
  results: SMSResult[]
}

export default function BulkSMSPage() {
  const [phoneNumbers, setPhoneNumbers] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<BulkSMSResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Parse phone numbers from textarea
  const parsePhoneNumbers = (input: string): string[] => {
    return input
      .split(/[\n,;]/) // Split by newlines, commas, or semicolons
      .map((num) => num.trim())
      .filter((num) => num.length > 0)
  }

  const phoneNumberList = parsePhoneNumbers(phoneNumbers)
  const validPhoneCount = phoneNumberList.length

  const handleSendBulkSMS = async () => {
    if (validPhoneCount === 0) {
      setError("Please enter at least one phone number")
      return
    }

    if (!message.trim()) {
      setError("Please enter a message")
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/admin/bulk-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumbers: phoneNumberList,
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        // Clear form on success
        setPhoneNumbers("")
        setMessage("")
      } else {
        setError(data.error || "Failed to send bulk SMS")
      }
    } catch (err) {
      setError("Network error: Failed to send bulk SMS")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk SMS Messaging</h1>
          <p className="text-muted-foreground">Send text messages to multiple phone numbers</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Admin Tool
        </Badge>
      </div>

      {/* Safety Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This tool sends real SMS messages. All messages will be prefixed with [ADMIN] to
          identify them as administrative communications. Ensure you have permission to contact all recipients.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Compose Bulk SMS
            </CardTitle>
            <CardDescription>
              Enter phone numbers and your message. Numbers should include country code (e.g., +1234567890).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-numbers">Phone Numbers</Label>
              <Textarea
                id="phone-numbers"
                placeholder="Enter phone numbers (one per line, or separated by commas):&#10;+1234567890&#10;+1987654321&#10;+1555123456"
                rows={8}
                value={phoneNumbers}
                onChange={(e) => setPhoneNumbers(e.target.value)}
                disabled={isLoading}
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Separate numbers with new lines, commas, or semicolons</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {validPhoneCount} numbers
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                rows={4}
                maxLength={1500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/1500 characters (will be prefixed with [ADMIN])
              </p>
            </div>

            <Button
              onClick={handleSendBulkSMS}
              disabled={isLoading || validPhoneCount === 0 || !message.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Sending to {validPhoneCount} numbers...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {validPhoneCount} Numbers
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Delivery Results
            </CardTitle>
            <CardDescription>Status of your bulk SMS delivery</CardDescription>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Results will appear here after sending</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.totalSent}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.totalFailed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.totalProcessed}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{Math.round((results.totalSent / results.totalProcessed) * 100)}%</span>
                  </div>
                  <Progress value={(results.totalSent / results.totalProcessed) * 100} className="h-2" />
                </div>

                <Separator />

                {/* Detailed Results */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-sm">Detailed Results:</h4>
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-mono">{result.to}</span>
                      </div>
                      <div className="text-right">
                        {result.success ? (
                          <Badge variant="outline" className="text-xs">
                            {result.sid?.substring(0, 8)}...
                          </Badge>
                        ) : (
                          <span className="text-xs text-red-600">{result.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Environment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p>
              <strong>Required Environment Variables:</strong>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>
                • <code>TWILIO_ACCOUNT_SID</code> - Your Twilio Account SID
              </li>
              <li>
                • <code>TWILIO_AUTH_TOKEN</code> - Your Twilio Auth Token
              </li>
              <li>
                • <code>TWILIO_MESSAGING_SERVICE_SID</code> - Your Messaging Service SID
              </li>
            </ul>
          </div>
          <Separator />
          <div className="text-sm space-y-1">
            <p>
              <strong>Trial Account Notes:</strong>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• You can only send SMS to phone numbers verified in your Twilio console</li>
              <li>• Messages will include "Sent from your Twilio trial account" prefix</li>
              <li>• Upgrade to a paid account to remove these restrictions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
