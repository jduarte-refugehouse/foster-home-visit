import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <SignIn path="/sign-in" />
    </div>
  )
}
