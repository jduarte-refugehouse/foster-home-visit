import { UserProfile } from "@clerk/nextjs"

export default function UserProfilePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          <UserProfile
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-md border border-border bg-card",
                headerTitle: "text-2xl font-semibold text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton:
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                formFieldInput: "border border-input bg-background",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
