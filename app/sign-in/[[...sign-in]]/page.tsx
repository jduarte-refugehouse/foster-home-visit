import { SignIn } from "@clerk/nextjs"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <SignIn />
    </div>
  )
}
