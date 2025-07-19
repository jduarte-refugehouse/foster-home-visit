import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { getUserByClerkId } from "@/lib/data/users"
import { createVisit } from "@/lib/data/visits"

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { familyId, placementId, visitType, visitDate, startTime, purpose, location, notes } = body

    // Combine date and time
    const visitDateTime = new Date(visitDate)
    const startDateTime = startTime ? new Date(`${visitDate}T${startTime}`) : undefined

    const visit = await createVisit({
      familyId,
      placementId: placementId || undefined,
      userId: user.id,
      visitType,
      visitDate: visitDateTime,
      startTime: startDateTime,
      purpose,
      location,
      notes,
      status: "scheduled",
      tacCompliant: false,
      rccCompliant: false,
    })

    return NextResponse.json(visit)
  } catch (error) {
    console.error("Error creating visit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
