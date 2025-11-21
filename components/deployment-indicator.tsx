"use client"

import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { useEffect, useState } from "react"

interface DeploymentInfo {
  branch?: string
  environment: string
  deploymentEnvironment: string
  url?: string
}

export function DeploymentIndicator() {
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null)

  useEffect(() => {
    // Fetch deployment info from API (server-side has access to env vars)
    fetch("/api/deployment-info")
      .then(res => res.json())
      .then(data => {
        setDeploymentInfo(data)
      })
      .catch(() => {
        // Fallback: try to detect from window location
        const hostname = window.location.hostname
        const isTest = hostname.includes(".test.")
        const isProduction = hostname.includes(".refugehouse.app") && !hostname.includes(".test.")
        
        setDeploymentInfo({
          environment: isTest ? "test" : isProduction ? "production" : "unknown",
          deploymentEnvironment: isTest ? "test" : isProduction ? "production" : "unknown",
        })
      })
  }, [])

  if (!deploymentInfo) {
    return null // Don't show anything until we know the actual environment
  }

  // Format branch name for display
  const formatBranch = (branchName?: string) => {
    if (!branchName || branchName === "local") return null // Don't show "Local" if we don't have branch info
    // Show last part of branch name (after last /)
    const branchParts = branchName.split("/")
    const displayName = branchParts[branchParts.length - 1]
    return displayName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Get color based on deployment environment
  const getEnvColor = (env: string) => {
    switch (env) {
      case "production":
        return "bg-green-500 hover:bg-green-600"
      case "test":
        return "bg-blue-500 hover:bg-blue-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const branchDisplay = formatBranch(deploymentInfo.branch)
  const envDisplay = deploymentInfo.deploymentEnvironment || deploymentInfo.environment

  return (
    <div className="flex items-center gap-2 text-xs">
      {branchDisplay && (
      <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 border-refuge-purple/30">
          {branchDisplay}
      </Badge>
      )}
      <Badge className={`${getEnvColor(envDisplay)} text-white text-[10px] px-2 py-0.5 border-0`}>
        {envDisplay}
      </Badge>
    </div>
  )
}

