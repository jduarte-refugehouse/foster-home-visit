"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@refugehouse/shared-core/components/ui/select"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import {
  History,
  MessageSquare,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Calendar,
  User,
  Hash,
} from "lucide-react"

interface CommunicationLogEntry {
  id: string
  communication_type: string
  delivery_method: string
  recipient_email?: string
  recipient_phone?: string
  recipient_name?: string
  sender_name?: string
  subject?: string
  message_text: string
  sendgrid_message_id?: string
  twilio_message_sid?: string
  status: string
  error_message?: string
  sent_at?: string
  created_at: string
}

interface CommunicationStats {
  total: number
  byType: Record<string, number>
  byMethod: Record<string, number>
  byStatus: Record<string, number>
  last24Hours: number
  last7Days: number
}

interface ApiResponse {
  success: boolean
  data: CommunicationLogEntry[]
  stats: CommunicationStats
  filters: any
}

export default function CommunicationHistoryPage() {
  const [history, setHistory] = useState<CommunicationLogEntry[]>([])
  const [stats, setStats] = useState<CommunicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [filters, setFilters] = useState({
    type: "all",
    method: "all",
    status: "all",
    email: "",
    phone: "",
    date_from: "",
    date_to: "",
  })

  const fetchHistory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "all") params.append(key, value)
      })

      const response = await fetch(`/api/admin/communication-history?${params}`)
      const data: ApiResponse = await response.json()

      if (response.ok && data.success) {
        setHistory(data.data)
        setStats(data.stats)
      } else {
        setError(data.error || "Failed to fetch communication history")
      }
    } catch (err) {
      setError("Network error: Failed to fetch communication history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      type: "all",
      method: "all",
      status: "all",
      email: "",
      phone: "",
      date_from: "",
      date_to: "",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "default",
      delivered: "default",
      failed: "destructive",
      pending: "secondary",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "email":
        return <Mail className="w-4 h-4" />
      case "sms":
        return <Phone className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication History</h1>
          <p className="text-muted-foreground">View and track all sent communications</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Admin Tool
        </Badge>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 24 Hours</p>
                  <p className="text-2xl font-bold">{stats.last24Hours}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 7 Days</p>
                  <p className="text-2xl font-bold">{stats.last7Days}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.total > 0
                      ? Math.round((((stats.byStatus.sent || 0) + (stats.byStatus.delivered || 0)) / stats.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter communication history by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Communication Type</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="bulk_sms">Bulk SMS</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select value={filters.method} onValueChange={(value) => handleFilterChange("method", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Email or phone..."
                value={filters.email || filters.phone}
                onChange={(e) => {
                  const value = e.target.value
                  if (value.includes("@")) {
                    handleFilterChange("email", value)
                    handleFilterChange("phone", "")
                  } else {
                    handleFilterChange("phone", value)
                    handleFilterChange("email", "")
                  }
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchHistory} disabled={isLoading}>
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Communication History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication Log
          </CardTitle>
          <CardDescription>
            {history.length} communication{history.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
              <p>Loading communication history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No communications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getMethodIcon(entry.delivery_method)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {entry.delivery_method === "email" ? entry.recipient_email : entry.recipient_phone}
                          </span>
                          {entry.recipient_name && (
                            <span className="text-sm text-muted-foreground">({entry.recipient_name})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {entry.communication_type}
                          </Badge>
                          <span>{new Date(entry.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>

                  {entry.subject && (
                    <div>
                      <span className="text-sm font-medium">Subject: </span>
                      <span className="text-sm">{entry.subject}</span>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                    <div className="line-clamp-3">{entry.message_text}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {entry.sender_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.sender_name}
                        </div>
                      )}
                      {(entry.sendgrid_message_id || entry.twilio_message_sid) && (
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {entry.sendgrid_message_id || entry.twilio_message_sid}
                        </div>
                      )}
                    </div>
                    {entry.sent_at && (
                      <div className="flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        Sent: {new Date(entry.sent_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {entry.error_message && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{entry.error_message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
