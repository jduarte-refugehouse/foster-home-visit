'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Input } from '@refugehouse/shared-core/components/ui/input'
import { File, Folder, ChevronRight, ChevronDown, Search, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@refugehouse/shared-core/utils'
import { fetchRepositoryContents, fetchFileContent } from '@/app/actions/github-actions'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  sha?: string
  size?: number
}

interface RepositoryBrowserProps {
  owner: string
  repo: string
}

export function RepositoryBrowser({ owner, repo }: RepositoryBrowserProps) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  const loadFiles = async (path = '') => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRepositoryContents(owner, repo, path)
      if (!result.success) {
        setError(result.error || 'Failed to fetch repository contents')
        return
      }
      
      const fileNodes: FileNode[] = result.items.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
        size: item.size,
      }))
      
      if (path === '') {
        setFiles(fileNodes)
      } else {
        // Insert files into the tree at the correct position
        setFiles((prev) => {
          const updated = [...prev]
          const parentIndex = updated.findIndex((f) => f.path === path)
          if (parentIndex === -1) return prev
          
          // Remove old children
          const filtered = updated.filter(
            (f) => !f.path.startsWith(path + '/') || f.path === path
          )
          
          // Insert new children after parent
          filtered.splice(parentIndex + 1, 0, ...fileNodes)
          return filtered
        })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load repository contents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (owner && repo) {
      loadFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo])

  const toggleDirectory = async (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
      // Remove children from view
      setFiles((prev) => prev.filter((f) => !f.path.startsWith(path + '/') || f.path === path))
    } else {
      newExpanded.add(path)
      await loadFiles(path)
    }
    setExpandedDirs(newExpanded)
  }

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'dir') {
      toggleDirectory(file.path)
      return
    }

    setLoadingFile(true)
    try {
      const result = await fetchFileContent(owner, repo, file.path)
      if (result.success && result.content) {
        setSelectedFile({ path: file.path, content: result.content })
      } else {
        setError(result.error || 'Failed to load file content')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load file')
    } finally {
      setLoadingFile(false)
    }
  }

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFileDepth = (path: string) => {
    return path.split('/').length - 1
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Repository Contents</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => loadFiles()}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
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
          <div className="h-full overflow-y-auto">
            <div className="p-2">
              {loading && files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Loading repository...</div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {files.length === 0 ? 'No files found' : 'No files match your search'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFiles.map((file) => {
                    const depth = getFileDepth(file.path)
                    const isExpanded = expandedDirs.has(file.path)
                    const isSelected = selectedFile?.path === file.path

                    return (
                      <button
                        key={file.path}
                        onClick={() => handleFileClick(file)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-accent text-foreground'
                        )}
                        style={{ paddingLeft: `${depth * 16 + 8}px` }}
                      >
                        {file.type === 'dir' && (
                          <>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 shrink-0" />
                            )}
                            <Folder className="w-4 h-4 shrink-0" />
                          </>
                        )}
                        {file.type === 'file' && <File className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{file.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedFile ? selectedFile.path : 'File Preview'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              {loadingFile ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Loading file...</div>
                </div>
              ) : selectedFile ? (
                <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg overflow-auto">
                  {selectedFile.content}
                </pre>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Select a file to view its contents
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

