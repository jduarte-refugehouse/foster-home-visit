"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { DatePickerWithRange } from "@refugehouse/shared-core/components/ui/date-range-picker"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Download, FileText, BarChart3, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"

interface Report {
  id: string
  name: string
  description: string
  type: "visits" | "homes" | "users" | "compliance"
  lastGenerated?: string
  status: "available" | "generating" | "error"
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      // Mock data - replace with actual API call
      const mockReports: Report[] = [
        {
          id: "visits-summary",
          name: "Visits Summary Report",
          description: "Summary of all home visits within date range",
          type: "visits",
          lastGenerated: new Date().toISOString(),
          status: "available",
        },
        {
          id: "homes-status",
          name: "Homes Status Report",
          description: "Current status of all registered homes",
          type: "homes",
          lastGenerated: new Date(Date.now() - 86400000).toISOString(),
          status: "available",
        },
        {
          id: "user-activity",
          name: "User Activity Report",
          description: "User login and activity statistics",
          type: "users",
          status: "available",
        },
        {
          id: "compliance-check",
          name: "Compliance Report",
          description: "Compliance status and requirements tracking",
          type: "compliance",
          status: "generating",
        },
      ]
      setReports(mockReports)
    } catch (error) {
      console.error("Error fetching reports:", error)
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (reportId: string) => {
    setGenerating(reportId)
    try {
      // Mock API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Success",
        description: "Report generated successfully",
      })

      // Update report status
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? { ...report, status: "available" as const, lastGenerated: new Date().toISOString() }
            : report,
        ),
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setGenerating(null)
    }
  }

  const downloadReport = async (reportId: string) => {
    try {
      // Mock download - replace with actual implementation
      toast({
        title: "Download Started",
        description: "Report download has begun",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>
      case "generating":
        return <Badge className="bg-yellow-100 text-yellow-800">Generating</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "visits":
        return <Calendar className="h-4 w-4" />
      case "homes":
        return <FileText className="h-4 w-4" />
      case "users":
        return <BarChart3 className="h-4 w-4" />
      case "compliance":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and download system reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Configure report parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTypeIcon(report.type)}
                {report.name}
              </CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(report.status)}
              </div>

              {report.lastGenerated && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Generated</span>
                  <span className="text-sm">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => generateReport(report.id)}
                  disabled={generating === report.id || report.status === "generating"}
                  className="flex-1"
                >
                  {generating === report.id ? "Generating..." : "Generate"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadReport(report.id)}
                  disabled={report.status !== "available"}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
