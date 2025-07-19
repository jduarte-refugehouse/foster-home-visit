import { getAllFamilies } from "@/lib/data/families"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import Link from "next/link"

export default async function Families() {
  const families = await getAllFamilies()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Families</h1>
          <p className="text-gray-600">Manage families and placements in your caseload</p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {families.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No families found</h3>
                <p className="text-gray-500 text-center mb-4">
                  Import family data from Radius or add families manually
                </p>
                <Link href="/upload">
                  <Button>Import Data</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          families.map((family) => (
            <Card key={family.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{family.familyName}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {family.placements.length} placement{family.placements.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Case: {family.caseNumber || "N/A"}</p>
                  <p className="text-sm text-gray-600">Visits: {family.visitCount}</p>
                  {family.placements.map((placement) => (
                    <div key={placement.id} className="bg-gray-50 p-2 rounded">
                      <p className="text-sm font-medium">{placement.childName}</p>
                      <p className="text-xs text-gray-500">
                        Age: {placement.childAge || "Unknown"} | {placement.placementType}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex space-x-2">
                  <Link href={`/visits/new?familyId=${family.id}`}>
                    <Button size="sm" variant="outline">
                      Schedule Visit
                    </Button>
                  </Link>
                  <Link href={`/families/${family.id}`}>
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
