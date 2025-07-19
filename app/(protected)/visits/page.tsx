import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserByClerkId } from "@/lib/data/users"
import { getVisitsByUserId } from "@/lib/data/visits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, FileText } from "lucide-react"
import Link from "next/link"

export default async function VisitHistory() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await getUserByClerkId(userId)
  if (!user) {
    redirect("/sign-in")
  }

  const visits = await getVisitsByUserId(user.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no_show":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
          <p className="text-gray-600">View and manage your completed and scheduled visits</p>
        </div>
        <Link href="/visits/new">
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule New Visit
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {visits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
              <p className="text-gray-500 text-center mb-4">Schedule your first visit to get started</p>
              <Link href="/visits/new">
                <Button>Schedule Visit</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          visits.map((visit) => (
            <Card key={visit.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{visit.family.familyName}</span>
                      <Badge className={getStatusColor(visit.status)}>{visit.status.replace("_", " ")}</Badge>
                    </CardTitle>
                    {visit.placement && (
                      <p className="text-sm text-gray-600 mt-1">Child: {visit.placement.childName}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(visit.visitDate).toLocaleDateString()}
                    </div>
                    {visit.startTime && (
                      <div className="flex items-center mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(visit.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Type:</span>
                    <span className="capitalize">{visit.visitType.replace("_", " ")}</span>
                  </div>
                  {visit.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{visit.location}</span>
                    </div>
                  )}
                  {visit.purpose && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Purpose:</span> {visit.purpose}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-xs">
                    <span
                      className={`px-2 py-1 rounded ${
                        visit.tacCompliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      TAC {visit.tacCompliant ? "Compliant" : "Non-Compliant"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded ${
                        visit.rccCompliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      RCC {visit.rccCompliant ? "Compliant" : "Non-Compliant"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  {visit.status === "scheduled" && (
                    <Link href={`/visits/${visit.id}/complete`}>
                      <Button size="sm">Complete Visit</Button>
                    </Link>
                  )}
                  <Link href={`/visits/${visit.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                  {visit.status === "completed" && (
                    <Button size="sm" variant="ghost">
                      Export PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
