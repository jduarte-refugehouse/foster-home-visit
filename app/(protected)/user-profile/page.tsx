"use client"

import { UserProfile } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-refuge-light-purple/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
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

        {/* Profile Component Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent",
                navbar: "bg-gradient-to-r from-refuge-light-purple/5 to-refuge-magenta/5 border-b border-gray-200",
                navbarButton:
                  "text-gray-700 hover:text-refuge-purple hover:bg-refuge-light-purple/10 rounded-lg transition-all duration-200",
                navbarButtonActive: "bg-gradient-to-r from-refuge-purple to-refuge-magenta text-white shadow-sm",
                headerTitle: "text-xl font-semibold text-gray-900",
                headerSubtitle: "text-gray-600",
                formButtonPrimary:
                  "bg-gradient-to-r from-refuge-purple to-refuge-magenta hover:from-refuge-purple/90 hover:to-refuge-magenta/90 text-white border-0 shadow-sm transition-all duration-200",
                formFieldInput:
                  "border-gray-300 focus:border-refuge-purple focus:ring-refuge-purple/20 rounded-lg transition-all duration-200",
                formFieldLabel: "text-gray-700 font-medium",
                profileSectionTitle: "text-lg font-semibold text-gray-900",
                profileSectionContent: "space-y-4",
                badge: "bg-refuge-light-purple/10 text-refuge-purple border-refuge-light-purple/20",
                avatarBox: "ring-2 ring-refuge-light-purple/30",
                pageScrollBox: "bg-transparent",
                page: "bg-transparent",
              },
              variables: {
                colorPrimary: "#8B5CF6", // refuge-purple
                colorBackground: "#FFFFFF",
                colorInputBackground: "#FFFFFF",
                colorInputText: "#374151",
                colorText: "#374151",
                colorTextSecondary: "#6B7280",
                colorSuccess: "#10B981",
                colorDanger: "#EF4444",
                colorWarning: "#F59E0B",
                borderRadius: "0.75rem",
                fontFamily: "inherit",
              },
            }}
            routing="path"
            path="/user-profile"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Changes to your profile will be reflected across the application immediately.
          </p>
        </div>
      </div>
    </div>
  )
}
