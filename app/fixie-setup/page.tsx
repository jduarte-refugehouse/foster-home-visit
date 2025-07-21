"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

export default function FixieSetupPage() {
  const fixieUrlExample = "socks://fixie:YOUR_FIXIE_KEY@socks.fixie.ai:5183"
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(fixieUrlExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Fixie SOCKS Proxy Setup</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Step 1: Obtain Your Fixie SOCKS URL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            If you don't already have a Fixie account, sign up at{" "}
            <a
              href="https://www.fixie.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              fixie.ai
            </a>
            . Once you have your account, you will find your SOCKS proxy URL in your Fixie dashboard. It typically looks
            like this:
          </p>
          <div className="relative p-4 bg-gray-100 rounded-md font-mono text-sm break-all">
            {fixieUrlExample}
            <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy URL</span>
              {copied && <span className="ml-2 text-xs text-green-600">Copied!</span>}
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">Replace `YOUR_FIXIE_KEY` with your actual Fixie API key.</p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Step 2: Set as Environment Variable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Set the obtained Fixie SOCKS URL as an environment variable named `FIXIE_SOCKS_HOST`.
          </p>
          <h3 className="font-semibold text-lg mb-2">For Vercel Deployment:</h3>
          <p className="text-muted-foreground mb-4">
            Go to your Vercel Project Settings &gt; Environment Variables and add `FIXIE_SOCKS_HOST` with your Fixie
            URL. Ensure it's available for both "Development", "Preview", and "Production" environments.
          </p>
          <h3 className="font-semibold text-lg mb-2">For Local Development:</h3>
          <p className="text-muted-foreground mb-4">
            Create a `.env.local` file in the root of your project and add the variable:
          </p>
          <pre className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            <code>FIXIE_SOCKS_HOST="socks://fixie:YOUR_FIXIE_KEY@socks.fixie.ai:5183"</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Verify Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            After setting the environment variable, you can test your proxy connection using the{" "}
            <a href="/proxy-setup" className="text-blue-600 hover:underline">
              Proxy Setup & Test page
            </a>{" "}
            or the{" "}
            <a href="/diagnostics" className="text-blue-600 hover:underline">
              Diagnostics page
            </a>
            .
          </p>
          <p className="text-muted-foreground">
            Our application's database connection (`lib/db.ts`) is configured to automatically use the
            `FIXIE_SOCKS_HOST` environment variable if it's present.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
