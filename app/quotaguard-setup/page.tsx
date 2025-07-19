"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Network, CheckCircle, Copy, Globe, Lock, ExternalLink, Settings } from "lucide-react"
import Link from "next/link"

export default function QuotaGuardSetup() {
  const [copied, setCopied] = useState("")

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 2000)
  }

  const staticIPs = ["3.222.129.4", "54.205.35.75"]
  const proxyServer = "us-east-shield-03.quotaguard.com"
  const username = "p3cu9fftx9jvrk"
  const password = "tmzi4oggwa47ryx3a7p8nqs012ek8s"
  const proxyPort = "9294"

  // Updated environment variable example with real credentials
  const envVarExample = `# Add this to your Vercel environment variables
QUOTAGUARD_URL=https://${username}:${password}@${proxyServer}:${proxyPort}

# Alternative format (if needed)
PROXY_URL=https://${username}:${password}@${proxyServer}:${proxyPort}`

  // Add the curl test command
  const curlTestCommand = `curl -x https://${username}:${password}@${proxyServer}:${proxyPort} -L ip.quotaguard.com`

  // You'll need to get your password from QuotaGuard dashboard
  // const envVarExample = `# Add this to your Vercel environment variables
  // QUOTAGUARD_URL=http://${username}:YOUR_PASSWORD@${proxyServer}:1080

  // # Alternative format (if needed)
  // PROXY_URL=http://${username}:YOUR_PASSWORD@${proxyServer}:1080`

  const azureCliCommands = staticIPs
    .map(
      (ip, index) => `# Add Static IP ${index + 1} to Azure SQL firewall
az sql server firewall-rule create \\
  --resource-group "your-resource-group" \\
  --server "refugehouse-bifrost-server" \\
  --name "QuotaGuard-Static-IP-${index + 1}" \\
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
                <span className="text-lg font-semibold text-gray-900">QuotaGuard Configuration</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Your QuotaGuard Setup</h1>
            <p className="text-gray-600">Configure your specific QuotaGuard settings for Azure SQL connection</p>
          </div>

          {/* QuotaGuard Details */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                Your QuotaGuard Configuration
              </CardTitle>
              <CardDescription className="text-green-700">
                Successfully configured with QuotaGuard Shield Micro plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Static IP Addresses</p>
                    <div className="space-y-1">
                      {staticIPs.map((ip, index) => (
                        <div key={ip} className="flex items-center justify-between bg-white p-2 rounded border">
                          <code className="text-sm font-mono">{ip}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(ip, `ip-${index}`)}>
                            <Copy className="w-3 h-3" />
                            {copied === `ip-${index}` ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Proxy Server</p>
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <code className="text-sm font-mono">{proxyServer}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(proxyServer, "proxy")}>
                        <Copy className="w-3 h-3" />
                        {copied === "proxy" ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Username</p>
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <code className="text-sm font-mono">{username}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(username, "username")}>
                        <Copy className="w-3 h-3" />
                        {copied === "username" ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 0: Test Proxy Connection */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded-full mr-3">0</span>
                Test Your Proxy Connection (Optional)
              </CardTitle>
              <CardDescription className="text-green-700">
                Verify your QuotaGuard proxy is working before configuring Azure SQL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-green-800">
                  Run this command in your terminal to test the proxy connection:
                </p>
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
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Expected result:</strong> This should return one of your static IP addresses (3.222.129.4 or
                    54.205.35.75)
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Azure SQL Firewall */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">1</span>
                Add Static IPs to Azure SQL Firewall
              </CardTitle>
              <CardDescription>
                Add both QuotaGuard static IP addresses to your Azure SQL Server firewall
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> You must add both IP addresses ({staticIPs.join(" and ")}) to your Azure
                    SQL firewall rules.
                  </AlertDescription>
                </Alert>

                {/* Manual Steps */}
                <div>
                  <h4 className="font-semibold mb-2">Option 1: Azure Portal (Recommended)</h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        1
                      </span>
                      Go to Azure Portal → SQL Server → refugehouse-bifrost-server → Networking
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        2
                      </span>
                      Click "Add firewall rule" and add:
                      <div className="ml-8 mt-1 space-y-1">
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <strong>Rule 1:</strong> QuotaGuard-Static-IP-1
                          <br />
                          Start IP: {staticIPs[0]}
                          <br />
                          End IP: {staticIPs[0]}
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <strong>Rule 2:</strong> QuotaGuard-Static-IP-2
                          <br />
                          Start IP: {staticIPs[1]}
                          <br />
                          End IP: {staticIPs[1]}
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        3
                      </span>
                      Click "Save" and wait 2-3 minutes for changes to take effect
                    </li>
                  </ol>
                </div>

                {/* Azure CLI */}
                <div>
                  <h4 className="font-semibold mb-2">Option 2: Azure CLI</h4>
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
                  <Alert className="mt-2">
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      Replace "your-resource-group" with your actual Azure resource group name.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Environment Variables */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">2</span>
                Configure Vercel Environment Variables
              </CardTitle>
              <CardDescription>Add your QuotaGuard proxy URL to Vercel environment variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Get your password:</strong> You'll need to get your QuotaGuard password from your QuotaGuard
                    dashboard.
                  </AlertDescription>
                </Alert>

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

                <div className="space-y-2">
                  <h4 className="font-semibold">Steps to add to Vercel:</h4>
                  <ol className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        1
                      </span>
                      Go to your Vercel project dashboard
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        2
                      </span>
                      Click Settings → Environment Variables
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        3
                      </span>
                      Add <code className="bg-gray-100 px-1 rounded">QUOTAGUARD_URL</code> with your complete proxy URL
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5">
                        4
                      </span>
                      Make sure to select all environments (Production, Preview, Development)
                    </li>
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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mr-3">3</span>
                Deploy and Test Connection
              </CardTitle>
              <CardDescription>Deploy your changes and test the database connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Deploy Steps:</h4>
                    <ol className="space-y-1 text-sm">
                      <li>1. Push your code changes to Git</li>
                      <li>2. Vercel will auto-deploy</li>
                      <li>3. Wait for deployment to complete</li>
                      <li>4. Test the database connection</li>
                    </ol>
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
                          Run Full Diagnostics
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Expected Result:</strong> Once configured, your database connections will route through
                    QuotaGuard's static IPs, solving the rotating IP address issue permanently.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Common issues and solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-800">Connection still failing?</h4>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    <li>• Double-check both IP addresses are added to Azure SQL firewall</li>
                    <li>• Verify the QUOTAGUARD_URL includes the correct password</li>
                    <li>• Wait 2-3 minutes after adding firewall rules</li>
                    <li>• Check that the environment variable is set in all Vercel environments</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800">Need your QuotaGuard password?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Log into your QuotaGuard dashboard and look for "Connection Information" or "Credentials" section.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-800">Connection working?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Great! Your app will now consistently connect to Azure SQL through the static IP proxy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
