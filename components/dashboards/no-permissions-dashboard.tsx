"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, AlertTriangle, User, Lock } from "lucide-react"

export default function NoPermissionsDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Access Required</h1>
            <Badge variant="outline">
              <Lock className="h-3 w-3 mr-1" />
              No Permissions
            </Badge>
          </div>
          <p className="text-muted-foreground">You currently have no assigned tasks or permissions</p>
        </div>
      </div>

      {/* No Access Notice */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            No Tasks Available
          </CardTitle>
          <CardDescription className="text-red-700">
            Your account does not currently have any permissions or assigned tasks in the Home Visits system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-red-800 mb-2">Possible Reasons:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your account is newly created and pending approval</li>
                <li>• You may need an invitation to access specific features</li>
                <li>• Your role has not been assigned by an administrator</li>
                <li>• You may be accessing the wrong system</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-red-800 mb-2">Next Steps:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Contact your system administrator</li>
                <li>• Verify you're using the correct login credentials</li>
                <li>• Request appropriate permissions for your role</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Administrator */}
      <Card>
        <CardHeader>
          <CardTitle>Request Access</CardTitle>
          <CardDescription>Contact the system administrator to request permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">System Administrator</p>
              <p className="text-sm text-muted-foreground">jduarte@refugehouse.org</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">When contacting the administrator, please include:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your full name and email address</li>
              <li>• Your role or department</li>
              <li>• What features you need access to</li>
              <li>• Business justification for access</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Basic Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Basic account details</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
