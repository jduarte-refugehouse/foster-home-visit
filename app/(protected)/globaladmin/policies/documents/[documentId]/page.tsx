"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@refugehouse/shared-core/components/ui/card"
import { Button } from "@refugehouse/shared-core/components/ui/button"
import { Badge } from "@refugehouse/shared-core/components/ui/badge"
import { AccountRegistrationRequired } from "@refugehouse/shared-core/components/account-registration-required"
import { useDatabaseAccess } from "@refugehouse/shared-core/hooks/use-database-access"
import { VersionHistory } from "@/components/admin/version-history"
import { FileViewer } from "@/components/admin/file-viewer"
import { DocumentMetadataEditor } from "@/components/admin/document-metadata-editor"
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Pencil,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Document {
  document_id: string
  document_number: string | null
  document_name: string
  document_type: string
  category: string
  git_path: string
  git_sha: string | null
  status: string
  effective_date: string | null
  next_review_date: string | null
  review_frequency_months: number | null
  t3c_packages: string | null // JSON string
  domain: string | null
  tags: string | null // JSON string
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

export default function DocumentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.documentId as string
  const { user, isLoaded } = useUser()
  const { hasAccess: hasDatabaseAccess, isLoading: checkingAccess } = useDatabaseAccess()
  const [microserviceCode, setMicroserviceCode] = useState<string | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [documentInfoExpanded, setDocumentInfoExpanded] = useState(false) // Default to collapsed
  const [reviewInfoExpanded, setReviewInfoExpanded] = useState(false) // Default to collapsed
  const [copyingContent, setCopyingContent] = useState(false)
  const { toast } = useToast()

  const getUserHeaders = (): HeadersInit => {
    if (!user) {
      return { "Content-Type": "application/json" }
    }
    return {
      "Content-Type": "application/json",
      "x-user-email": user.emailAddresses[0]?.emailAddress || "",
      "x-user-clerk-id": user.id,
      "x-user-name": `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }
  }

  useEffect(() => {
    if (!isLoaded || !user || checkingAccess) return

    fetch('/api/navigation', {
      headers: getUserHeaders(),
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        const code = data.metadata?.microservice?.code || 'home-visits'
        setMicroserviceCode(code)
        if (code !== 'service-domain-admin') {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        const envCode = process.env.NEXT_PUBLIC_MICROSERVICE_CODE || 'home-visits'
        setMicroserviceCode(envCode)
        if (envCode !== 'service-domain-admin') {
          router.push('/dashboard')
        }
      })
  }, [isLoaded, user, router, checkingAccess])

  useEffect(() => {
    if (documentId) {
      loadDocument()
    }
  }, [documentId])

  const loadDocument = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/policies/documents/${documentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch document')
      }
      const data = await response.json()
      setDocument(data.document)
    } catch (err: any) {
      setError(err.message || 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestApproval = async () => {
    if (!user || !document) return
    
    try {
      const response = await fetch(`/api/policies/documents/${documentId}/approval`, {
        method: 'POST',
        headers: getUserHeaders(),
        body: JSON.stringify({
          userId: user.id,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to request approval')
      }
      
      // Reload document to show updated status
      loadDocument()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'active': { variant: 'default', label: 'Active' },
      'draft': { variant: 'secondary', label: 'Draft' },
      'pending-approval': { variant: 'outline', label: 'Pending Approval' },
      'archived': { variant: 'secondary', label: 'Archived' },
    }
    const config = variants[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getApprovalButtonLabel = (documentType: string) => {
    if (documentType === 'policy' || documentType === 'combined') {
      return 'Send for Board Approval'
    }
    if (documentType === 'procedure') {
      return 'Send for Executive Approval'
    }
    return 'Send for Approval'
  }

  const isReviewOverdue = (reviewDate: string | null) => {
    if (!reviewDate) return false
    return new Date(reviewDate) < new Date()
  }

  const handleCopyMarkdown = async () => {
    if (!document) return
    
    setCopyingContent(true)
    try {
      const response = await fetch(`/api/policies/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(document.git_path)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch document content')
      }
      const data = await response.json()
      await navigator.clipboard.writeText(data.content || '')
      toast({
        title: 'Copied to clipboard',
        description: 'Document content has been copied to your clipboard.',
      })
    } catch (err: any) {
      toast({
        title: 'Copy failed',
        description: err.message || 'Failed to copy document content',
        variant: 'destructive',
      })
    } finally {
      setCopyingContent(false)
    }
  }

  if (!isLoaded || checkingAccess) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  if (!hasDatabaseAccess) {
    return (
      <AccountRegistrationRequired 
        microserviceName="Domain Administration"
        contactEmail="jduarte@refugehouse.org"
      />
    )
  }

  if (!microserviceCode || microserviceCode !== 'service-domain-admin') {
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Loading document...</div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error loading document</p>
                <p className="text-sm mt-1">{error || 'Document not found'}</p>
              </div>
            </div>
            <Link href="/globaladmin/policies/documents">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Documents
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!
  const fileName = document.git_path.split('/').pop() || 'document'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/globaladmin/policies/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{document.document_name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {document.document_number && (
                <Badge variant="outline">{document.document_number}</Badge>
              )}
              {getStatusBadge(document.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowEditor(!showEditor)} variant="outline">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Metadata
          </Button>
          {document.status === 'active' && (
            <Button onClick={handleRequestApproval} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              {getApprovalButtonLabel(document.document_type)}
            </Button>
          )}
        </div>
      </div>

      {/* Metadata Editor or Display */}
      {showEditor ? (
        <DocumentMetadataEditor
          documentId={documentId}
          document={document}
          onSave={() => {
            setShowEditor(false)
            loadDocument()
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setDocumentInfoExpanded(!documentInfoExpanded)}
            >
              <CardTitle className="text-lg flex items-center justify-between">
                Document Information
                {documentInfoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {documentInfoExpanded && (
              <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{document.document_name}</div>
              </div>
              {document.document_number && (
                <div>
                  <div className="text-sm text-muted-foreground">Number</div>
                  <div className="font-medium">{document.document_number}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{document.document_type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="font-medium">{document.category}</div>
              </div>
              {document.domain && (
                <div>
                  <div className="text-sm text-muted-foreground">Domain</div>
                  <div className="font-medium">{document.domain}</div>
                </div>
              )}
              {document.t3c_packages && (
                <div>
                  <div className="text-sm text-muted-foreground">T3C Packages</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {JSON.parse(document.t3c_packages).map((pkg: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">{pkg}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {document.tags && (
                <div>
                  <div className="text-sm text-muted-foreground">Tags</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {JSON.parse(document.tags).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {document.effective_date && (
                <div>
                  <div className="text-sm text-muted-foreground">Effective Date</div>
                  <div className="font-medium">{format(new Date(document.effective_date), 'MMM d, yyyy')}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Path</div>
                <div className="font-mono text-sm break-all">{document.git_path}</div>
              </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setReviewInfoExpanded(!reviewInfoExpanded)}
            >
              <CardTitle className="text-lg flex items-center justify-between">
                Review Information
                {reviewInfoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {reviewInfoExpanded && (
              <CardContent className="space-y-3">
            {document.next_review_date ? (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Next Review Date</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {format(new Date(document.next_review_date), 'MMM d, yyyy')}
                    </span>
                    {isReviewOverdue(document.next_review_date) && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </div>
                </div>
                {document.review_frequency_months && (
                  <div>
                    <div className="text-sm text-muted-foreground">Review Frequency</div>
                    <div className="font-medium">Every {document.review_frequency_months} months</div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No review date set</div>
            )}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Document Content */}
      <Card className="flex flex-col" style={{ height: 'calc(100vh - 24rem)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Content
            </CardTitle>
            <Button 
              onClick={handleCopyMarkdown} 
              variant="outline" 
              size="sm"
              disabled={copyingContent || !document.git_path.toLowerCase().endsWith('.md')}
            >
              {copyingContent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Markdown
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <FileViewer
            owner={owner}
            repo={repo}
            filePath={document.git_path}
            fileName={fileName}
          />
        </CardContent>
      </Card>

      {/* Version History */}
      <VersionHistory documentId={documentId} />
    </div>
  )
}

