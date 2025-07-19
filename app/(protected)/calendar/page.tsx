import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserByClerkId } from "@/lib/data/users"
import { getUpcomingVisitsByUserId } from "@/lib/data/visits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function Calendar() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await getUserByClerkId(userId)
  if (!user) {
    redirect("/sign-in")
  }

  const upcomingVisits = await getUpcomingVisitsByUserId(user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage your scheduled visits</p>
        </div>
        <Link href="/visits/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Visit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Calendar component will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingVisits.length === 0 ? (
                  <p className="text-sm text-gray-500">No upcoming visits scheduled</p>
                ) : (
                  upcomingVisits.map((visit) => (
                    <div key={visit.id} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">{visit.family.familyName}</h4>
                      <p className="text-sm text-gray-600">{new Date(visit.visitDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{visit.visitType} visit</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
