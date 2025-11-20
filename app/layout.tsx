import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@refugehouse/shared-core/components/ui/toaster"
import { getMicroserviceCode } from "@/lib/microservice-config"

const inter = Inter({ subsets: ["latin"] })

// Get microservice-specific metadata
function getMicroserviceMetadata() {
  const microserviceCode = getMicroserviceCode()
  
  const metadataMap: Record<string, { title: string; description: string; shortTitle: string }> = {
    'home-visits': {
      title: 'Home Visits Application',
      description: 'Foster home visit management system',
      shortTitle: 'Home Visits',
    },
    'service-domain-admin': {
      title: 'Refuge House Microservice Domain Administration',
      description: 'User Administration and Service Configuration for the complete Microservice Domain Framework',
      shortTitle: 'Domain Admin',
    },
    'case-management': {
      title: 'Case Management System',
      description: 'Child welfare case management and tracking',
      shortTitle: 'Case Management',
    },
  }
  
  return metadataMap[microserviceCode] || metadataMap['home-visits']
}

const microserviceMetadata = getMicroserviceMetadata()

export const metadata: Metadata = {
  title: microserviceMetadata.title,
  description: microserviceMetadata.description,
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: microserviceMetadata.shortTitle,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="manifest" href="/app/manifest.json" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content={microserviceMetadata.shortTitle} />
        </head>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
