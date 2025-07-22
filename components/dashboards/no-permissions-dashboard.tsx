import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, Phone } from "lucide-react"

export default function NoPermissionsDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Access Pending</h1>
            <p className="text-gray-100">Your account is being reviewed</p>
          </div>
        </div>
        <p className="mt-4 text-sm italic">"A home is in the heart of every child."</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Account Under Review
          </CardTitle>
          <CardDescription>
            Your account has been created but is currently pending approval from our administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Thank you for your interest in Refuge House services. Our team is reviewing your account and will grant
            appropriate access permissions soon.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Our administrators will review your account details</li>
              <li>• You'll receive an email notification when access is granted</li>
              <li>• Your permissions will be set based on your role and needs</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Phone className="h-4 w-4" />
              Call Us
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Need immediate assistance? Call our 24/7 support line:</p>
            <p className="font-semibold">(555) 123-4567</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
