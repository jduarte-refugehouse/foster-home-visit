"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, User, AlertCircle } from "lucide-react"

export default function ExternalUserDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <Badge variant="secondary">
              <User className="h-3 w-3 mr-1" />
              External User
            </Badge>
          </div>
          <p className="text-muted-foreground">Limited access - contact administrator for additional permissions</p>
        </div>
      </div>

      {/* Limited Access Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            Limited Access Account
          </CardTitle>
          <CardDescription className="text-orange-700">
            Your account has limited permissions. Contact your administrator to request additional access to home visit
            features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-orange-800 mb-2">Available Actions:</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• View your profile information</li>
                <li>• Update your contact details</li>
                <li>• Access basic system information</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-orange-800 mb-2">To Request Access:</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Contact your system administrator</li>
                <li>• Provide your business justification</li>
                <li>• Specify which features you need access to</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact information for system support</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Email Support</p>
              <p className="text-sm text-muted-foreground">jduarte@refugehouse.org</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Phone Support</p>
              <p className="text-sm text-muted-foreground">Contact your administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>Manage your profile and account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <User className="mr-2 h-4 w-4" />
              View Profile
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Mail className="mr-2 h-4 w-4" />
              Update Contact Information
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
