"use client"

import { UserProfile } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@refugehouse/shared-core/components/ui/button"

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-refuge-light-purple/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="mb-4 text-refuge-purple hover:text-refuge-magenta hover:bg-refuge-light-purple/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>
        </div>

        {/* Profile Component */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                navbar: "bg-gradient-to-r from-refuge-light-purple/5 to-refuge-magenta/5 border-b border-gray-200",
                navbarButton: "text-gray-700 hover:text-refuge-purple hover:bg-refuge-light-purple/10",
                navbarButtonActive: "text-refuge-purple bg-refuge-light-purple/20 border-refuge-purple/30",
                headerTitle: "text-gray-900 font-semibold",
                headerSubtitle: "text-gray-600",
                formButtonPrimary:
                  "bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white border-0 shadow-sm",
                formFieldInput: "border-gray-300 focus:border-refuge-purple focus:ring-refuge-purple/20",
                formFieldLabel: "text-gray-700 font-medium",
                identityPreviewText: "text-gray-900",
                identityPreviewEditButton: "text-refuge-purple hover:text-refuge-magenta",
                profileSectionTitle: "text-gray-900 font-semibold",
                profileSectionContent: "text-gray-700",
                accordionTriggerButton: "text-gray-700 hover:text-refuge-purple",
                badge: "bg-refuge-light-purple/20 text-refuge-purple",
                alert: "border-refuge-light-purple/30 bg-refuge-light-purple/10",
                alertText: "text-gray-700",
              },
              variables: {
                colorPrimary: "#8B5CF6", // refuge-purple
                colorSuccess: "#10B981",
                colorWarning: "#F59E0B",
                colorDanger: "#EF4444",
                colorNeutral: "#6B7280",
                fontFamily: "inherit",
                borderRadius: "0.5rem",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
