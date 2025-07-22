import { SignUp } from "@clerk/nextjs"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <SignUp />
    </div>
  )
}
