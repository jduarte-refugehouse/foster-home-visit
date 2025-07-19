"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Network, CheckCircle, Copy, Globe, Lock, ExternalLink, Settings } from "lucide-react"
import Link from "next/link"

export default function FixieSetup() {
  const [copied, setCopied] = useState("")

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 2000)
  }

  // Fixie example configuration (you'll get your actual values from Fixie)
  const fixieUrl = "http://fixie:your-password@velodrome.usefixie.com:80"
  const fixieStaticIPs = ["52.87.187.138", "52.87.187.139"] // Example IPs - you'll get actual ones from Fixie

  const envVarExample = `# Add this to your Vercel environment variables
FIXIE_URL=${fixieUrl}

# Alternative format (if needed)
PROXY_URL=${fixieUrl}`

  const curlTestCommand = `curl --proxy ${fixieUrl} http://ip.fixie.io`

  const azureCliCommands = fixieStaticIPs
    .map(
      (ip, index) => `# Add Fixie Static IP ${index + 1} to Azure SQL firewall
az sql server firewall-rule create \\
  --resource-group "your-resource-group" \\
  --server "refugehouse-bifrost-server" \\
  --name "Fixie-Static-IP-${index + 1}" \\
  --start-ip-address "${ip}" \\
  --end-ip-address "${ip}"`,
    )
    .join("\n\n")

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
                <Network className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Fixie Setup</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Fixie Static IP Proxy Setup</h1>
            <p className="text-gray-600">Configure Fixie for better SQL Server database connection support</p>
          </div>

          {/* Why Fixie */}
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                Why Fixie for SQL Server?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-blue-700">
                <p>
                  • <strong>Better SQL Server support:</strong> Fixie handles TDS protocol connections more reliably
                </p>
                <p>
                  • <strong>HTTP proxy:</strong> Works better with Node.js database libraries
                </p>
                <p>
                  • <strong>Proven track record:</strong> Widely used for database connections on Heroku/Vercel
                </p>
                <p>
                  • <strong>Simple setup:</strong> Straightforward HTTP proxy configuration
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Sign up for Fixie */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">1</span>
                Sign Up for Fixie
              </CardTitle>
              <CardDescription>Create your Fixie account and get your proxy credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Fixie Plans:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <strong>Starter ($39/month):</strong>
                        <br />• 2 static IP addresses
                        <br />• 500MB bandwidth
                        <br />• Perfect for database connections
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">What you'll get:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Fixie proxy URL</li>
                      <li>• 2 static IP addresses</li>
                      <li>• Username and password</li>
                      <li>• Dashboard for monitoring</li>
                    </ul>
                  </div>
                </div>

                <Button asChild>
                  <a href="https://usefixie.com" target="_blank" rel="noopener noreferrer">
                    Sign Up for Fixie
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Get Your Fixie Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">2</span>
                Get Your Fixie Configuration
              </CardTitle>
              <CardDescription>After signing up, you'll receive your Fixie proxy details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>After signing up:</strong> Check your Fixie dashboard for your specific proxy URL and static
                    IP addresses.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">You'll receive something like:</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <strong>Proxy URL:</strong> http://fixie:your-password@velodrome.usefixie.com:80
                    </div>
                    <div>
                      <strong>Static IPs:</strong> 52.87.187.138, 52.87.187.139 (example)
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Test your Fixie connection:</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative">
                    <pre>{curlTestCommand}</pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => copyToClipboard(curlTestCommand, "curl")}
                    >
                      <Copy className="w-4 h-4" />
                      {copied === "curl" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Replace with your actual Fixie URL. This should return one of your static IP addresses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Configure Vercel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">3</span>
                Configure Vercel Environment Variables
              </CardTitle>
              <CardDescription>Add your Fixie proxy URL to Vercel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative">
                  <pre>{envVarExample}</pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => copyToClipboard(envVarExample, "env")}
                  >
                    <Copy className="w-4 h-4" />
                    {copied === "env" ? "Copied!" : "Copy"}
                  </Button>
                </div>

                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Replace the example URL with your actual Fixie proxy URL from your
                    dashboard.
                  </AlertDescription>
                </Alert>

                <Button asChild>
                  <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                    Open Vercel Dashboard
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Azure SQL Firewall */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">4</span>
                Add Fixie IPs to Azure SQL Firewall
              </CardTitle>
              <CardDescription>Whitelist your Fixie static IP addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Use the actual static IP addresses provided by Fixie, not the examples
                    shown here.
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-2">Azure CLI Commands:</h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative">
                    <pre>{azureCliCommands}</pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => copyToClipboard(azureCliCommands, "cli")}
                    >
                      <Copy className="w-4 h-4" />
                      {copied === "cli" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Manual Steps (Azure Portal):</h4>
                  <ol className="text-sm space-y-1">
                    <li>1. Go to Azure Portal → SQL Server → refugehouse-bifrost-server → Networking</li>
                    <li>2. Add firewall rules for each Fixie static IP address</li>
                    <li>3. Use descriptive names like "Fixie-Static-IP-1", "Fixie-Static-IP-2"</li>
                    <li>4. Save and wait 2-3 minutes for changes to take effect</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">5</span>
                Deploy and Test
              </CardTitle>
              <CardDescription>Test your Fixie proxy connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">After Setup:</h4>
                    <ul className="text-sm space-y-1">
                      <li>1. Deploy your changes to Vercel</li>
                      <li>2. Wait for deployment to complete</li>
                      <li>3. Test the database connection</li>
                      <li>4. Verify you're using Fixie IPs</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Test Connection:</h4>
                    <div className="space-y-2">
                      <Link href="/test-db">
                        <Button className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Test Database Connection
                        </Button>
                      </Link>
                      <Link href="/diagnostics">
                        <Button variant="outline" className="w-full bg-transparent">
                          <Settings className="w-4 h-4 mr-2" />
                          Run Diagnostics
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success indicator:</strong> The diagnostics should show your current IP as one of the Fixie
                    static IP addresses.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
