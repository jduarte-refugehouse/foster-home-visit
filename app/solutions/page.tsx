import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Home, Briefcase, GraduationCap, Heart, ArrowLeft, Shield } from "lucide-react"
import Image from "next/image"

const LOGO_SRC = "/images/web logo with name.png"

export default function Solutions() {
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
            <span className="text-lg font-semibold text-gray-900">Solutions</span>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tailored Solutions for Every Need</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Family Visits Pro is designed to meet the unique requirements of various organizations involved in family
              support.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Solution Card 1: Social Work Agencies */}
            <Card>
              <CardHeader>
                <Briefcase className="w-8 h-8 text-refuge-purple mb-2" />
                <CardTitle>Social Work Agencies</CardTitle>
                <CardDescription>Streamline operations for case managers and social workers.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Efficient caseload management</li>
                  <li>Automated visit scheduling and reminders</li>
                  <li>Compliance reporting tools</li>
                  <li>Secure client data handling</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Solution Card 2: Foster Care Organizations */}
            <Card>
              <CardHeader>
                <Home className="w-8 h-8 text-refuge-green mb-2" />
                <CardTitle>Foster Care Organizations</CardTitle>
                <CardDescription>
                  Simplify coordination of visits between foster children and biological families.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Dedicated foster family profiles</li>
                  <li>Visit supervision tracking</li>
                  <li>Communication logs</li>
                  <li>Integration with existing case management systems</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Solution Card 3: Child Protective Services */}
            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-refuge-blue mb-2" />
                <CardTitle>Child Protective Services</CardTitle>
                <CardDescription>Enhance oversight and documentation for child welfare cases.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Detailed visit documentation</li>
                  <li>Incident reporting features</li>
                  <li>Court-ready reports generation</li>
                  <li>Secure, auditable records</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Solution Card 4: Educational Institutions */}
            <Card>
              <CardHeader>
                <GraduationCap className="w-8 h-8 text-refuge-yellow mb-2" />
                <CardTitle>Educational Institutions</CardTitle>
                <CardDescription>
                  Manage parent-teacher conferences and home visits for student support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Automated scheduling for conferences</li>
                  <li>Parent communication portal</li>
                  <li>Tracking student support visits</li>
                  <li>Integration with school management systems</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Solution Card 5: Non-Profit Organizations */}
            <Card>
              <CardHeader>
                <Heart className="w-8 h-8 text-refuge-red mb-2" />
                <CardTitle>Non-Profit Organizations</CardTitle>
                <CardDescription>Support community outreach and family support programs.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Volunteer visit coordination</li>
                  <li>Program impact reporting</li>
                  <li>Beneficiary tracking</li>
                  <li>Flexible scheduling for diverse programs</li>
                </ul>
                <Button variant="outline" className="mt-4 bg-transparent">
                  Learn More
                </Button>
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
