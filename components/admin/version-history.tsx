'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Badge } from '@refugehouse/shared-core/components/ui/badge'
import { Loader2, GitBranch, Plus, FileEdit, Archive, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface DocumentVersion {
  version_id: string
  version_number: string | null
  git_sha: string
  git_path: string
  action: 'add' | 'replace' | 'archive'
  effective_date: string | null
  revision_notes: string | null
  created_at: string
  created_by_user_id: string | null
}

interface VersionHistoryProps {
  documentId: string
}

export function VersionHistory({ documentId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [documentId])

  const loadVersions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/policies/documents/${documentId}/versions`)
      if (!response.ok) {
        throw new Error('Failed to fetch versions')
      }
      const data = await response.json()
      setVersions(data.versions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add':
        return <Plus className="w-4 h-4" />
      case 'replace':
        return <FileEdit className="w-4 h-4" />
      case 'archive':
        return <Archive className="w-4 h-4" />
      default:
        return <GitBranch className="w-4 h-4" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'add': { variant: 'default', label: 'Added' },
      'replace': { variant: 'secondary', label: 'Replaced' },
      'archive': { variant: 'destructive', label: 'Archived' },
    }
    const config = variants[action] || { variant: 'secondary' as const, label: action }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Loading version history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error loading version history</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No version history available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Version History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div key={version.version_id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {getActionIcon(version.action)}
                </div>
                {index < versions.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-2" />
                )}
              </div>

              {/* Version details */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {getActionBadge(version.action)}
                  {version.version_number && (
                    <Badge variant="outline">{version.version_number}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                {version.effective_date && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Effective: {format(new Date(version.effective_date), 'MMM d, yyyy')}
                  </div>
                )}
                {version.revision_notes && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {version.revision_notes}
                  </div>
                )}
                <div className="text-xs text-muted-foreground font-mono">
                  SHA: {version.git_sha.substring(0, 7)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

