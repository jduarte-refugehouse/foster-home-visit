import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getAllFamilies } from "@/lib/data/families"

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const families = await getAllFamilies()
    return NextResponse.json(families)
  } catch (error) {
    console.error("Error fetching families:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
