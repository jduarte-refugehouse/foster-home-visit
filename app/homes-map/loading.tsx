import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading Filters...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map and List Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Loading Map...</CardTitle>
            </CardHeader>
            <CardContent className="p-2 h-[520px]">
              <div className="w-full h-full bg-gray-200 rounded animate-pulse flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Loading Homes...</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2 h-[520px] overflow-y-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
