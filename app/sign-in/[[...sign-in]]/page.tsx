"use client"

import { SignIn } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"

export default function Page() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect_url")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignIn 
        routing="path"
        path="/sign-in"
        signInUrl="/sign-in"
        afterSignInUrl={redirectUrl || "/dashboard"}
        afterSignUpUrl={redirectUrl || "/dashboard"}
      />
    </div>
  )
}
