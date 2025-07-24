import { UserProfile } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserProfilePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 bg-transparent",
              navbar: "hidden",
              pageScrollBox: "p-0",
              profileSectionPrimaryButton: "bg-[#8B0000] hover:bg-[#660000] text-white",
              formButtonPrimary: "bg-[#8B0000] hover:bg-[#660000] text-white",
              footerActionLink: "text-[#8B0000] hover:text-[#660000]",
            },
            variables: {
              colorPrimary: "#8B0000",
              colorText: "var(--foreground)",
              colorTextSecondary: "var(--muted-foreground)",
              colorBackground: "var(--background)",
              colorInputBackground: "var(--background)",
              colorInputText: "var(--foreground)",
            },
          }}
        />
      </div>
    </div>
  )
}
