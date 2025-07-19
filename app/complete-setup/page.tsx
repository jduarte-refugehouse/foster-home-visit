"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, Copy, ExternalLink, Terminal, Database, Settings } from "lucide-react"
import Link from "next/link"

export default function CompleteSetup() {
  const [copied, setCopied] = useState("")
  const [step1Done, setStep1Done] = useState(false)
  const [step2Done, setStep2Done] = useState(false)
  const [step3Done, setStep3Done] = useState(false)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 2000)
  }

  const quotaguardUrl = "https://p3cu9fftx9jvrk:tmzi4oggwa47ryx3a7p8nqs012ek8s@us-east-shield-03.quotaguard.com:9294"
  const staticIPs = ["3.222.129.4", "54.205.35.75"]
  const testCommand =
    "curl -x https://p3cu9fftx9jvrk:tmzi4oggwa47ryx3a7p8nqs012ek8s@us-east-shield-03.quotaguard.com:9294 -L ip.quotaguard.com"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold text-gray-900">Complete QuotaGuard Setup</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Final Setup Steps</h1>
            <p className="text-gray-600">Complete these 3 steps to activate your QuotaGuard proxy connection</p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Setup Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`flex items-center ${step1Done ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle className={`w-4 h-4 mr-2 ${step1Done ? "text-green-500" : "text-gray-400"}`} />
                  <span>Add Static IPs to Azure SQL Firewall</span>
                </div>
                <div className={`flex items-center ${step2Done ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle className={`w-4 h-4 mr-2 ${step2Done ? "text-green-500" : "text-gray-400"}`} />
                  <span>Configure Vercel Environment Variable</span>
                </div>
                <div className={`flex items-center ${step3Done ? "text-green-600" : "text-gray-500"}`}>
                  <CheckCircle className={`w-4 h-4 mr-2 ${step3Done ? "text-green-500" : "text-gray-400"}`} />
                  <span>Deploy and Test Connection</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Azure SQL Firewall */}
          <Card className={`mb-6 ${step1Done ? "border-green-200 bg-green-50" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">1</span>
                  Add Static IPs to Azure SQL Firewall
                </CardTitle>
                <Button variant={step1Done ? "default" : "outline"} size="sm" onClick={() => setStep1Done(!step1Done)}>
                  {step1Done ? "✓ Done" : "Mark Done"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Add both IP addresses:</strong> {staticIPs.join(" and ")} to your Azure SQL Server firewall
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Quick Steps:</h4>
                  <ol className="text-sm space-y-1">
                    <li>1. Go to Azure Portal → SQL Server → refugehouse-bifrost-server → Networking</li>
                    <li>2. Add firewall rule: "QuotaGuard-IP-1" with IP {staticIPs[0]}</li>
                    <li>3. Add firewall rule: "QuotaGuard-IP-2" with IP {staticIPs[1]}</li>
                    <li>4. Click "Save" and wait 2-3 minutes</li>
                  </ol>
                </div>

                <Button asChild>
                  <a
                    href="https://portal.azure.com/#@/resource/subscriptions/your-subscription/resourceGroups/your-resource-group/providers/Microsoft.Sql/servers/refugehouse-bifrost-server/networking"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Azure SQL Networking
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Vercel Environment Variable */}
          <Card className={`mb-6 ${step2Done ? "border-green-200 bg-green-50" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">2</span>
                  Add Environment Variable to Vercel
                </CardTitle>
                <Button variant={step2Done ? "default" : "outline"} size="sm" onClick={() => setStep2Done(!step2Done)}>
                  {step2Done ? "✓ Done" : "Mark Done"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Environment Variable:</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm relative">
                    <div>
                      <strong>Name:</strong> QUOTAGUARD_URL
                      <br />
                      <strong>Value:</strong> {quotaguardUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => copyToClipboard(quotaguardUrl, "env")}
                    >
                      <Copy className="w-4 h-4" />
                      {copied === "env" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Vercel Steps:</h4>
                  <ol className="text-sm space-y-1">
                    <li>1. Go to your Vercel project dashboard</li>
                    <li>2. Click Settings → Environment Variables</li>
                    <li>3. Add new variable: QUOTAGUARD_URL</li>
                    <li>4. Paste the value above</li>
                    <li>5. Select all environments (Production, Preview, Development)</li>
                    <li>6. Click "Save"</li>
                  </ol>
                </div>

                <Button asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    Open Vercel Dashboard
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Deploy and Test */}
          <Card className={`mb-6 ${step3Done ? "border-green-200 bg-green-50" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">3</span>
                  Deploy and Test Connection
                </CardTitle>
                <Button variant={step3Done ? "default" : "outline"} size="sm" onClick={() => setStep3Done(!step3Done)}>
                  {step3Done ? "✓ Done" : "Mark Done"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    After adding the environment variable, Vercel will automatically redeploy your application.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Test Proxy (Optional):</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs relative">
                      <pre className="whitespace-pre-wrap break-all">{testCommand}</pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-1 right-1 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => copyToClipboard(testCommand, "test")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Should return one of your static IPs</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Test Database:</h4>
                    <div className="space-y-2">
                      <Link href="/test-db">
                        <Button className="w-full">
                          <Database className="w-4 h-4 mr-2" />
                          Test Database Connection
                        </Button>
                      </Link>
                      <Link href="/diagnostics">
                        <Button variant="outline" className="w-full bg-transparent">
                          <Terminal className="w-4 h-4 mr-2" />
                          Run Diagnostics
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          {step1Done && step2Done && step3Done && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Setup Complete! 🎉</h3>
                  <p className="text-green-700 mb-4">
                    Your application is now configured to use QuotaGuard's static IP proxy. All database connections
                    will route through your dedicated static IP addresses.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/test-db">
                      <Button>
                        <Database className="w-4 h-4 mr-2" />
                        Test Your Connection
                      </Button>
                    </Link>
                    <Link href="/homes">
                      <Button variant="outline" className="bg-transparent">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        View Homes Data
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
