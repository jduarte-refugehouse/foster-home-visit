import { NextResponse } from "next/server"

/**
 * Public API route to serve manifest.json
 * This ensures the manifest is accessible without authentication
 */
export async function GET() {
  const manifest = {
    name: "Refuge House Home Visits",
    short_name: "Home Visits",
    description: "Mobile-optimized home visit management for field staff",
    start_url: "/mobile",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5E3989",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    categories: ["productivity", "business"],
    shortcuts: [
      {
        name: "Today's Appointments",
        short_name: "Today",
        description: "View today's appointments",
        url: "/mobile/appointments?filter=today",
        icons: [{ src: "/favicon.ico", sizes: "any" }],
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

