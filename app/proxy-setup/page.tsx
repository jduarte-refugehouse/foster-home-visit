"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Network, CheckCircle, ExternalLink, Copy, Globe, Lock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ProxySetup() {
  const [copied, setCopied] = useState(false)

  const proxyServices = [
    {
      name: "QuotaGuard Static",
      url: "https://www.quotaguard.com/static-ip",
      price: "$39/month",
      staticIPs: "2 dedicated IPs",
      bandwidth: "1GB included",
      setup: "5 minutes",
      recommended: true,
      description: "Most popular choice for Heroku/Vercel apps needing static IPs",
    },
    {
      name: "Fixie",
      url: "https://usefixie.com",
      price: "$39/month",
      staticIPs: "2 dedicated IPs",
      bandwidth: "500MB included",
      setup: "5 minutes",
      description: "Simple HTTP/HTTPS proxy with static IP addresses",
    },
    {
      name: "ProxyMesh",
      url: "https://proxymesh.com",
      price: "$10/month",
      staticIPs: "Rotating + Static options",
      bandwidth: "Unlimited",
      setup: "10 minutes",
      description: "Flexible proxy service with both rotating and static IP options",
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const envVarExample = `# Add to your Vercel environment variables
QUOTAGUARD_URL=http://username:password@proxy.quotaguard.com:9293

# Or use generic proxy URL
PROXY_URL=http://username:password@your-proxy-service.com:port`

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
                <span className="text-lg font-semibold text-gray-900">Static IP Proxy Setup</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Static IP Proxy for Azure SQL</h1>
            <p className="text-gray-600">Use a static IP proxy service to solve Vercel's rotating IP address issue</p>
          </div>

          {/* How it Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                How Static IP Proxy Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Vercel Function</h3>
                  <p className="text-sm text-gray-600">Your app runs on Vercel with rotating IP addresses</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Static IP Proxy</h3>
                  <p className="text-sm text-gray-600">Routes traffic through fixed IP addresses</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Azure SQL</h3>
                  <p className="text-sm text-gray-600">Sees consistent IP addresses in firewall rules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proxy Services */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Proxy Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {proxyServices.map((service) => (
                <Card key={service.name} className={service.recommended ? "ring-2 ring-blue-500 ring-opacity-50" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.recommended && <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>}
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="font-semibold">{service.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Static IPs</span>
                        <span className="font-semibold">{service.staticIPs}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bandwidth</span>
                        <span className="font-semibold">{service.bandwidth}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Setup Time</span>
                        <span className="font-semibold">{service.setup}</span>
                      </div>
                      <Button asChild className="w-full mt-4">
                        <a href={service.url} target="_blank" rel="noopener noreferrer">
                          Get Started
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Setup Instructions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to configure your static IP proxy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 1: Choose a Proxy Service</h3>
                  <p className="text-sm text-gray-600">
                    Sign up for QuotaGuard Static (recommended) or another proxy service from the list above.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 2: Get Your Proxy URL</h3>
                  <p className="text-sm text-gray-600 mb-2">After signup, you'll receive a proxy URL in this format:</p>
                  <code className="bg-gray-100 p-2 rounded text-sm block">
                    http://username:password@proxy.quotaguard.com:9293
                  </code>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 3: Add Environment Variable</h3>
                  <p className="text-sm text-gray-600 mb-2">Add the proxy URL to your Vercel environment variables:</p>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm relative">
                    <pre>{envVarExample}</pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => copyToClipboard(envVarExample)}
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 4: Update Azure SQL Firewall</h3>
                  <p className="text-sm text-gray-600">
                    Add your proxy service's static IP addresses to your Azure SQL Server firewall rules. The proxy
                    service will provide you with these IP addresses.
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Step 5: Deploy and Test</h3>
                  <p className="text-sm text-gray-600">
                    Deploy your application to Vercel and test the database connection. The proxy will route all traffic
                    through the static IP addresses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Benefits of Static IP Proxy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ Advantages</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Keep your existing Azure SQL database</li>
                    <li>• Maintain HIPAA compliance</li>
                    <li>• No data migration required</li>
                    <li>• Works with all existing integrations</li>
                    <li>• Predictable static IP addresses</li>
                    <li>• Easy to set up and maintain</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-700 mb-2">⚠️ Considerations</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Additional monthly cost ($39+/month)</li>
                    <li>• Slight latency increase</li>
                    <li>• Dependency on proxy service</li>
                    <li>• Bandwidth limitations on some plans</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <Alert className="mb-8">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>HIPAA Compliance:</strong> Static IP proxy services like QuotaGuard are commonly used in
              healthcare applications and maintain security standards. All traffic is encrypted end-to-end, and the
              proxy services don't store or inspect your data.
            </AlertDescription>
          </Alert>

          {/* Test Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Test Your Setup</CardTitle>
              <CardDescription>After configuring the proxy, test your database connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/test-db">
                  <Button>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Test Database Connection
                  </Button>
                </Link>
                <Link href="/diagnostics">
                  <Button variant="outline">
                    <Network className="w-4 h-4 mr-2" />
                    Run Full Diagnostics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
