"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Send, AlertCircle, UserPlus, Mail } from "lucide-react"
import Link from "next/link"

interface Invitation {
  id: string
  email: string
  role: string
  status: "pending" | "accepted" | "expired"
  created_at: string
  expires_at: string
}

export default function AdminInvitationsPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("user")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isSignedIn) {
      fetchInvitations()
    }
  }, [isSignedIn])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/invitations")
      if (!response.ok) {
        throw new Error("Failed to fetch invitations")
      }
      const data = await response.json()
      setInvitations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      setSending(true)
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invitation")
      }

      setEmail("")
      setRole("user")
      fetchInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setSending(false)
    }
  }

  const deleteInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete invitation")
      }

      fetchInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invitation")
    }
  }

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>You need to be signed in to access admin functions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please sign in to manage user invitations.</p>
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <UserPlus className="h-8 w-8" />
          User Invitations
        </h1>
        <p className="text-gray-600">Send invitations and manage user access</p>
      </div>

      {/* Send Invitation Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Send New Invitation</CardTitle>
          <CardDescription>Invite new users to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendInvitation} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button onClick={() => setError(null)} variant="outline" className="mt-4">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage sent invitations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No invitations sent</h3>
              <p className="text-gray-600">Send your first invitation using the form above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge className={getStatusColor(invitation.status)}>{invitation.status}</Badge>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Sent: {new Date(invitation.created_at).toLocaleDateString()}
                      {invitation.expires_at && (
                        <span className="ml-4">Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
