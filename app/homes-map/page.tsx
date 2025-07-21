"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const HomesMapComponent = dynamic(() => import("@/components/homes-map"), {
  ssr: false,
})

export default function HomesMapPage() {
  // The actual data fetching logic is now inside components/homes-map.tsx
  // This page component primarily acts as a wrapper for the dynamic import.
  // The refresh button will trigger the fetch inside HomesMapComponent.

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full h-[700px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Homes Map</CardTitle>
          {/* The refresh button here will trigger a re-render of HomesMapComponent,
              which will then re-fetch its data. */}
          <Button onClick={() => window.location.reload()} size="sm">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh Map</span>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <HomesMapComponent />
        </CardContent>
      </Card>
    </div>
  )
}
