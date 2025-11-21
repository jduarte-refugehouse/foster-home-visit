import { Badge } from "@refugehouse/shared-core/components/ui/badge"

export function DeploymentIndicator() {
  // These are set by Vercel at runtime (server-side only)
  const branch = process.env.VERCEL_GIT_COMMIT_REF || "local"
  const env = process.env.VERCEL_ENV || "development"
  const url = process.env.VERCEL_URL || null

  // Format branch name for display
  const formatBranch = (branchName: string) => {
    if (branchName === "local" || !branchName) return "Local"
    // Show last part of branch name (after last /)
    const branchParts = branchName.split("/")
    const displayName = branchParts[branchParts.length - 1]
    return displayName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Get color based on environment
  const getEnvColor = (env: string) => {
    switch (env) {
      case "production":
        return "bg-green-500 hover:bg-green-600"
      case "preview":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 border-refuge-purple/30">
        {formatBranch(branch)}
      </Badge>
      <Badge className={`${getEnvColor(env)} text-white text-[10px] px-2 py-0.5 border-0`}>
        {env}
      </Badge>
    </div>
  )
}

