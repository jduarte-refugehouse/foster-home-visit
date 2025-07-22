import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Mail, Phone } from "lucide-react"

export default function NoPermissionsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Access Pending</h2>
        <Badge variant="destructive">No Permissions</Badge>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            Account Setup Required
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your account has been created but permissions have not been assigned yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="space-y-4">
            <p>
              Welcome to the Refuge House system! Your account is currently pending approval and permission assignment.
            </p>
            <div>
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Your account has been registered successfully</li>
                <li>• An administrator will review and assign appropriate permissions</li>
                <li>• You will receive an email notification when access is granted</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Contact our support team if you have questions about your account access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">support@refugehouse.org</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone Support</p>
                <p className="text-sm text-muted-foreground">(555) 123-4567</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
