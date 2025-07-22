import { UserButton } from "@clerk/nextjs"
import { getAuth } from "@/lib/auth-utils"
import { Navigation } from "@/components/navigation"

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default async function TestPage() {
  const { userId } = await getAuth()

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="p-8 border rounded-lg bg-card text-card-foreground">
          <h1 className="text-3xl font-bold mb-4">Authentication Test Page</h1>
          <p className="mb-4 text-muted-foreground">
            This page is for testing authentication status within the current environment.
          </p>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Clerk Enabled:</span> {isClerkEnabled ? "Yes" : "No (v0 Dev Environment)"}
            </p>
            <p>
              <span className="font-semibold">User ID:</span>{" "}
              <code className="bg-muted px-2 py-1 rounded">{userId || "Not authenticated"}</code>
            </p>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-muted-foreground">User Controls:</span>
            {isClerkEnabled ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <span>(Mock User)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
