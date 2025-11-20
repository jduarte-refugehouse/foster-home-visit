"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Input } from "@refugehouse/shared-core/components/ui/input"
import { Label } from "@refugehouse/shared-core/components/ui/label"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@refugehouse/shared-core/components/ui/dialog"
import { Alert, AlertDescription } from "@refugehouse/shared-core/components/ui/alert"
import { Textarea } from "@refugehouse/shared-core/components/ui/textarea"
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Activity,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ApiKey {
  id: string
  microservice_code: string
  api_key_prefix: string
  api_key_display: string
  created_at: string
  expires_at: string | null
  is_active: boolean
  rate_limit_per_minute: number
  last_used_at: string | null
  usage_count: number
  description: string | null
}

export default function ApiKeysPage() {
  const { user, isLoaded: userLoaded } = useUser()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [microserviceCode, setMicroserviceCode] = useState("")
  const [description, setDescription] = useState("")
  const [rateLimit, setRateLimit] = useState("100")
  const [expiresAt, setExpiresAt] = useState("")

  // Get user headers for API calls
  const getUserHeaders = () => {
    if (!user) return {}
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/admin/api-keys", {
        headers: getUserHeaders(),
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setKeys(data.keys || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch API keys",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching API keys:", error)
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLoaded && user) {
      fetchKeys()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, user])

  const handleCreateKey = async () => {
    if (!microserviceCode.trim()) {
      toast({
        title: "Error",
        description: "Microservice code is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: getUserHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          microserviceCode: microserviceCode.trim(),
          description: description.trim() || null,
          rateLimitPerMinute: parseInt(rateLimit) || 100,
          expiresAt: expiresAt || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setNewKey(data.apiKey)
        toast({
          title: "Success",
          description: "API key created successfully",
        })
        fetchKeys()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating API key:", error)
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      })
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/api-keys?keyId=${keyId}`, {
        method: "DELETE",
        headers: getUserHeaders(),
        credentials: 'include',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "API key revoked successfully",
        })
        fetchKeys()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to revoke API key",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error revoking API key:", error)
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(null), 2000)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Key Management</h1>
          <p className="text-muted-foreground">
            Create and manage API keys for microservices to access the Radius API Hub
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {newKey && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">
                ⚠️ Important: Save this API key now. It will not be shown again!
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-2 rounded font-mono text-sm flex-1">
                  {newKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newKey, "new")}
                >
                  {copiedKey === "new" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys ({keys.length})</CardTitle>
          <CardDescription>
            API keys that are currently active and can be used to access the Radius API Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No API keys found. Create one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                        {key.api_key_display}
                      </code>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{key.microservice_code}</Badge>
                    </div>
                    {key.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {key.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {key.rate_limit_per_minute}/min
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </div>
                      {key.last_used_at && (
                        <div>
                          Last used: {new Date(key.last_used_at).toLocaleDateString()}
                        </div>
                      )}
                      {key.usage_count > 0 && (
                        <div>Used {key.usage_count} times</div>
                      )}
                      {key.expires_at && (
                        <div>
                          Expires: {new Date(key.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for a microservice to access the Radius API Hub
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="microserviceCode">Microservice Code *</Label>
              <Input
                id="microserviceCode"
                placeholder="e.g., serviceplan, training, my"
                value={microserviceCode}
                onChange={(e) => setMicroserviceCode(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this API key is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>
              <Key className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

