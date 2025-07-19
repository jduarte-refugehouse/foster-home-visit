import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserByClerkId, createUser } from "@/lib/data/users"
import { getDashboardStats } from "@/lib/data/families"
import { getVisitStats } from "@/lib/data/visits"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AzureMonitoring } from "@/components/azure-monitoring"
import { KeyVaultMonitoring } from "@/components/keyvault-monitoring"
import { Calendar, Users, FileText, AlertTriangle } from "lucide-react"

export default async function Dashboard() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get or create user in database
  let user = await getUserByClerkId(userId)

  if (!user) {
    user = await createUser({
      clerkId: userId,
      email: "", // Will be updated via webhook
    })
  }

  const [dashboardData, visitStats] = await Promise.all([getDashboardStats(), getVisitStats(user.id)])

  const stats = [
    {
      title: "Active Families",
      value: dashboardData.totalFamilies,
      icon: Users,
      description: "Families currently in the system",
    },
    {
      title: "Total Visits",
      value: visitStats.totalVisits,
      icon: FileText,
      description: "Visits conducted by you",
    },
    {
      title: "Upcoming Visits",
      value: visitStats.upcomingVisits,
      icon: Calendar,
      description: "Scheduled visits this month",
    },
    {
      title: "Overdue Visits",
      value: visitStats.overdueVisits,
      icon: AlertTriangle,
      description: "Visits that need attention",
      alert: visitStats.overdueVisits > 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your case management dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest case management activities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity to display</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TAC Compliance Status</CardTitle>
            <CardDescription>Chapter 749 minimum standards compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Monthly Visits</span>
                <span className="text-sm text-green-600">Compliant</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Documentation</span>
                <span className="text-sm text-green-600">Up to Date</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Safety Assessments</span>
                <span className="text-sm text-yellow-600">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <AzureMonitoring />
        <KeyVaultMonitoring />
      </div>
    </div>
  )
}
