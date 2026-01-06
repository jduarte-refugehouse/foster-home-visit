'use client'

import { useState } from 'react'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SyncDocumentsButtonProps {
  userId: string
  onSyncComplete?: () => void
}

export function SyncDocumentsButton({ userId, onSyncComplete }: SyncDocumentsButtonProps) {
  const [syncing, setSyncing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/policies/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync documents')
      }

      toast({
        title: 'Sync Complete',
        description: `${data.results.created} created, ${data.results.updated} updated, ${data.results.errors.length} errors`,
        variant: 'default',
      })

      // Reload the page to show updated documents
      if (onSyncComplete) {
        onSyncComplete()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all documents? This will remove all documents, versions, and approvals from the database. You can re-sync from the repository afterward. This action cannot be undone.')) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch('/api/policies/clear', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear documents')
      }

      toast({
        title: 'Documents Cleared',
        description: 'All documents have been removed from the database',
        variant: 'default',
      })

      if (onSyncComplete) {
        onSyncComplete()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      toast({
        title: 'Clear Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleClear} variant="outline" disabled={clearing}>
        <Trash2 className={`w-4 h-4 mr-2 ${clearing ? 'animate-spin' : ''}`} />
        {clearing ? 'Clearing...' : 'Clear All'}
      </Button>
      
      <Button onClick={handleSync} disabled={syncing} variant="outline">
        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync from Repository'}
      </Button>
    </div>
  )
}

