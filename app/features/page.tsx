import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Calendar, Users, MapPin, Bell, BarChart, ShieldCheck, ArrowLeft } from "lucide-react"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

export default function Features() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Image
              src={LOGO_SRC || "/placeholder.svg"}
              alt="Family Visits Pro Logo"
              width={180}
              height={36}
              className="h-auto"
            />
            <span className="text-lg font-semibold text-gray-900">Features</span>
          </div>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/solutions">
            Solutions
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/contact">
            Contact
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 text-gray-600" href="/admin">
            Admin
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Seamless Management</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Family Visits Pro offers a comprehensive suite of tools designed to simplify every aspect of family visit
              coordination.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature Card 1: Intuitive Scheduling */}
            <Card>
              <CardHeader>
                <Calendar className="w-8 h-8 text-refuge-purple mb-2" />
                <CardTitle>Intuitive Scheduling</CardTitle>
                <CardDescription>Effortlessly plan and manage all your family visits.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Drag-and-drop calendar interface</li>
                  <li>Automated conflict detection</li>
                  <li>Recurring visit setup</li>
                  <li>Flexible time slot management</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 2: Client & Family Management */}
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-refuge-green mb-2" />
                <CardTitle>Client & Family Management</CardTitle>
                <CardDescription>Keep all client and family information organized and accessible.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Centralized client profiles</li>
                  <li>Family member linking</li>
                  <li>Contact information and notes</li>
                  <li>Secure data storage</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 3: Location Tracking & Mapping */}
            <Card>
              <CardHeader>
                <MapPin className="w-8 h-8 text-refuge-blue mb-2" />
                <CardTitle>Location Tracking & Mapping</CardTitle>
                <CardDescription>Optimize routes and manage visit locations efficiently.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Integrated mapping for visit addresses</li>
                  <li>Route optimization suggestions</li>
                  <li>Geofencing capabilities (coming soon)</li>
                  <li>Real-time location updates for staff</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 4: Automated Reminders & Notifications */}
            <Card>
              <CardHeader>
                <Bell className="w-8 h-8 text-refuge-yellow mb-2" />
                <CardTitle>Automated Reminders & Notifications</CardTitle>
                <CardDescription>Ensure everyone is informed and prepared for visits.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>SMS and email reminders for families</li>
                  <li>Staff assignment notifications</li>
                  <li>Alerts for missed or delayed visits</li>
                  <li>Customizable notification settings</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 5: Reporting & Analytics */}
            <Card>
              <CardHeader>
                <BarChart className="w-8 h-8 text-refuge-red mb-2" />
                <CardTitle>Reporting & Analytics</CardTitle>
                <CardDescription>Gain insights into visit patterns and operational efficiency.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Comprehensive visit history reports</li>
                  <li>Staff performance metrics</li>
                  <li>Client engagement analytics</li>
                  <li>Exportable data for compliance</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 6: Secure & Compliant */}
            <Card>
              <CardHeader>
                <ShieldCheck className="w-8 h-8 text-refuge-gray mb-2" />
                <CardTitle>Secure & Compliant</CardTitle>
                <CardDescription>Your data is protected with industry-leading security measures.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>HIPAA-compliant infrastructure</li>
                  <li>End-to-end data encryption</li>
                  <li>Role-based access control</li>
                  <li>Regular security audits</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 lg:px-6 h-14 flex items-center justify-center bg-white border-t border-gray-200 text-sm text-gray-600">
        <p>&copy; 2024 Family Visits Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
