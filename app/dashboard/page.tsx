import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, FileText, AlertTriangle, Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const stats = [
    {
      title: "Active Families",
      value: "24",
      icon: Users,
      description: "Families currently in the system",
    },
    {
      title: "Total Visits",
      value: "156",
      icon: FileText,
      description: "Visits conducted this month",
    },
    {
      title: "Upcoming Visits",
      value: "8",
      icon: Calendar,
      description: "Scheduled visits this week",
    },
    {
      title: "Overdue Visits",
      value: "2",
      icon: AlertTriangle,
      description: "Visits that need attention",
      alert: true,
    },
  ]

  const recentVisits = [
    {
      family: "Johnson Family",
      date: "2024-01-15",
      status: "completed",
      compliance: true,
    },
    {
      family: "Martinez Family",
      date: "2024-01-14",
      status: "completed",
      compliance: true,
    },
    {
      family: "Williams Family",
      date: "2024-01-13",
      status: "scheduled",
      compliance: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Family Visits Pro</span>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Demo Mode</Badge>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your case management dashboard</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className={stat.alert ? "border-red-200" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.alert ? "text-red-500" : "text-muted-foreground"}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stat.alert ? "text-red-600" : ""}`}>{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Visits</CardTitle>
                <CardDescription>Your latest family visit activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentVisits.map((visit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{visit.family}</p>
                        <p className="text-sm text-gray-600">{visit.date}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={visit.status === "completed" ? "default" : "secondary"}>{visit.status}</Badge>
                        <Badge variant={visit.compliance ? "default" : "destructive"}>
                          {visit.compliance ? "Compliant" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>TAC Compliance Status</CardTitle>
                <CardDescription>Chapter 749 minimum standards compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Visits</span>
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documentation</span>
                    <Badge className="bg-green-100 text-green-800">Up to Date</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Safety Assessments</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Supervisor Reviews</span>
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Notice */}
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">This is a Demo Dashboard</h3>
                <p className="text-blue-700 mb-4">
                  You're viewing a sample of what your Family Visits Pro dashboard would look like with real data.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                    >
                      Back to Home
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button className="bg-blue-600 hover:bg-blue-700">Explore All Features</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
