'use client'

import { useState } from 'react'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SyncDocumentsButtonProps {
  userId: string
}

export function SyncDocumentsButton({ userId }: SyncDocumentsButtonProps) {
  const [syncing, setSyncing] = useState(false)
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
      window.location.reload()
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

  return (
    <Button onClick={handleSync} disabled={syncing} variant="outline">
      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing...' : 'Sync from Repository'}
    </Button>
  )
}

