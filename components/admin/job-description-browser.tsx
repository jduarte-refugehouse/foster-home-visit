'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Input } from '@refugehouse/shared-core/components/ui/input'
import { Textarea } from '@refugehouse/shared-core/components/ui/textarea'
import { Badge } from '@refugehouse/shared-core/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@refugehouse/shared-core/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@refugehouse/shared-core/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@refugehouse/shared-core/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  Archive, 
  ArchiveRestore, 
  Search, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react'
import { cn } from '@refugehouse/shared-core/utils'
import { FileViewer } from './file-viewer'

interface JobDescription {
  name: string
  path: string
  sha: string
  size: number
  status: 'active' | 'archived'
}

interface JobDescriptionBrowserProps {
  owner: string
  repo: string
}

export function JobDescriptionBrowser({ owner, repo }: JobDescriptionBrowserProps) {
  const [activeJobs, setActiveJobs] = useState<JobDescription[]>([])
  const [archivedJobs, setArchivedJobs] = useState<JobDescription[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  
  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newJobTitle, setNewJobTitle] = useState('')
  const [newJobContent, setNewJobContent] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Archive/unarchive state
  const [archiveTarget, setArchiveTarget] = useState<JobDescription | null>(null)
  const [archiveAction, setArchiveAction] = useState<'archive' | 'unarchive'>('archive')
  const [archiving, setArchiving] = useState(false)

  const loadJobDescriptions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/job-descriptions')
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Failed to load job descriptions')
        return
      }
      
      setActiveJobs(data.active || [])
      setArchivedJobs(data.archived || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load job descriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobDescriptions()
  }, [])

  const handleCreate = async () => {
    if (!newJobTitle.trim() || !newJobContent.trim()) {
      return
    }

    setCreating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/job-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newJobTitle,
          content: newJobContent,
        }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Failed to create job description')
        return
      }
      
      // Reload the list
      await loadJobDescriptions()
      setIsCreateDialogOpen(false)
      setNewJobTitle('')
      setNewJobContent('')
    } catch (err: any) {
      setError(err.message || 'Failed to create job description')
    } finally {
      setCreating(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return

    setArchiving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/job-descriptions/${encodeURIComponent(archiveTarget.path)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: archiveAction }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || `Failed to ${archiveAction} job description`)
        return
      }
      
      // Clear selection if the archived item was selected
      if (selectedJob?.path === archiveTarget.path) {
        setSelectedJob(null)
      }
      
      // Reload the list
      await loadJobDescriptions()
      setArchiveTarget(null)
    } catch (err: any) {
      setError(err.message || `Failed to ${archiveAction} job description`)
    } finally {
      setArchiving(false)
    }
  }

  const filterJobs = (jobs: JobDescription[]) => {
    if (!searchQuery) return jobs
    const query = searchQuery.toLowerCase()
    return jobs.filter(job => 
      job.name.toLowerCase().includes(query)
    )
  }

  const formatJobTitle = (fileName: string) => {
    // Remove .md extension and format nicely
    return fileName.replace(/\.md$|\.markdown$/i, '').replace(/_/g, ' ')
  }

  const getDefaultContent = (title: string) => {
    return `# ${title}

## Position Overview

[Brief description of the role and its importance to the organization]

## Key Responsibilities

- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

## Qualifications

### Required
- [Required qualification 1]
- [Required qualification 2]

### Preferred
- [Preferred qualification 1]
- [Preferred qualification 2]

## Skills and Competencies

- [Skill 1]
- [Skill 2]

## Working Conditions

[Description of work environment, schedule, physical requirements, etc.]

## Salary and Benefits

[Salary range and benefits information]

---

*Last Updated: ${new Date().toLocaleDateString()}*
`
  }

  const renderJobList = (jobs: JobDescription[], isArchived: boolean) => (
    <div className="space-y-2">
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {isArchived ? 'No archived job descriptions' : 'No active job descriptions'}
        </div>
      ) : (
        jobs.map((job) => (
          <div
            key={job.path}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors',
              selectedJob?.path === job.path
                ? 'bg-primary/10 border-primary'
                : 'bg-card hover:bg-accent border-border'
            )}
          >
            <button
              onClick={() => setSelectedJob(job)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {formatJobTitle(job.name)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(job.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedJob(job)}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setArchiveTarget(job)
                  setArchiveAction(isArchived ? 'unarchive' : 'archive')
                }}
                title={isArchived ? 'Restore' : 'Archive'}
              >
                {isArchived ? (
                  <ArchiveRestore className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      {/* Job List Panel */}
      <Card className="flex flex-col lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Job Descriptions</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={loadJobDescriptions}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus className="w-4 h-4 mr-1" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Job Description</DialogTitle>
                    <DialogDescription>
                      Create a new job description document in the repository
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        Job Title
                      </label>
                      <Input
                        id="title"
                        placeholder="e.g., Case Manager, Program Director"
                        value={newJobTitle}
                        onChange={(e) => {
                          setNewJobTitle(e.target.value)
                          if (!newJobContent || newJobContent === getDefaultContent('')) {
                            setNewJobContent(getDefaultContent(e.target.value))
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="content" className="text-sm font-medium">
                        Content (Markdown)
                      </label>
                      <Textarea
                        id="content"
                        placeholder="Enter job description content in Markdown format..."
                        value={newJobContent}
                        onChange={(e) => setNewJobContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !newJobTitle.trim() || !newJobContent.trim()}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Job Description'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search job descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {error && (
            <div className="p-3 m-4 text-sm bg-destructive/10 text-destructive rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-4">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">
                  Active
                  <Badge variant="secondary" className="ml-2">
                    {filterJobs(activeJobs).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex-1">
                  Archived
                  <Badge variant="secondary" className="ml-2">
                    {filterJobs(archivedJobs).length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Loading job descriptions...</div>
                </div>
              ) : (
                <>
                  <TabsContent value="active" className="m-0">
                    {renderJobList(filterJobs(activeJobs), false)}
                  </TabsContent>
                  <TabsContent value="archived" className="m-0">
                    {renderJobList(filterJobs(archivedJobs), true)}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card className="flex flex-col lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedJob ? formatJobTitle(selectedJob.name) : 'Job Description Preview'}
          </CardTitle>
          {selectedJob && (
            <CardDescription>
              {selectedJob.status === 'archived' && (
                <Badge variant="secondary" className="mr-2">Archived</Badge>
              )}
              {selectedJob.path}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {selectedJob ? (
            <FileViewer
              owner={owner}
              repo={repo}
              filePath={selectedJob.path}
              fileName={selectedJob.name}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a job description to view its contents</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveAction === 'archive' ? 'Archive Job Description?' : 'Restore Job Description?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveAction === 'archive' ? (
                <>
                  This will move <strong>{archiveTarget?.name && formatJobTitle(archiveTarget.name)}</strong> to the archived folder.
                  You can restore it later if needed.
                </>
              ) : (
                <>
                  This will restore <strong>{archiveTarget?.name && formatJobTitle(archiveTarget.name)}</strong> to the active job descriptions.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}>
              {archiving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {archiveAction === 'archive' ? 'Archiving...' : 'Restoring...'}
                </>
              ) : (
                archiveAction === 'archive' ? 'Archive' : 'Restore'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
