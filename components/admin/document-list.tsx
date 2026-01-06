'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Input } from '@refugehouse/shared-core/components/ui/input'
import { Badge } from '@refugehouse/shared-core/components/ui/badge'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@refugehouse/shared-core/components/ui/tabs'
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Shield,
  BookOpen,
  FolderOpen,
  FileCheck
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Document {
  document_id: string
  document_number: string | null
  document_name: string
  document_type: string
  category: string
  git_path: string
  status: string
  effective_date: string | null
  next_review_date: string | null
  review_frequency_months: number | null
  created_at: string
  updated_at: string
}

interface DocumentListProps {
  userId?: string
}

export function DocumentList({ userId }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string>('policies')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/policies/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'policy': 'Policy',
      'procedure': 'Procedure',
      'combined': 'Policy & Procedure',
      'package-specific': 'Package-Specific',
      'regulatory': 'Regulatory Reference',
      'guide': 'Guide',
      'job-description': 'Job Description',
      'plan': 'Plan',
      'model': 'Model',
      'historical': 'Historical',
    }
    return labels[type] || type
  }

  const isReviewOverdue = (reviewDate: string | null) => {
    if (!reviewDate) return false
    return new Date(reviewDate) < new Date()
  }

  const isReviewDueSoon = (reviewDate: string | null) => {
    if (!reviewDate) return false
    const daysUntilReview = Math.ceil((new Date(reviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilReview <= 30 && daysUntilReview > 0
  }

  // Filter documents based on active tab
  const getFilteredDocuments = (tab: string) => {
    let filtered = documents

    // Filter by document type based on tab
    switch (tab) {
      case 'policies':
        // Show policies and combined policy-procedures
        filtered = documents.filter(doc => 
          doc.document_type === 'policy' || doc.document_type === 'combined'
        )
        break
      case 'procedures':
        // Show procedures and combined policy-procedures
        filtered = documents.filter(doc => 
          doc.document_type === 'procedure' || doc.document_type === 'combined'
        )
        break
      case 'regulatory':
        filtered = documents.filter(doc => doc.document_type === 'regulatory')
        break
      case 'supporting':
        filtered = documents.filter(doc => 
          ['guide', 'job-description', 'plan', 'model'].includes(doc.document_type)
        )
        break
      case 'historical':
        filtered = documents.filter(doc => doc.document_type === 'historical')
        break
      default:
        filtered = documents
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((doc) => {
        return (
          doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.document_number && doc.document_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
          doc.git_path.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    return filtered
  }

  const filteredDocuments = getFilteredDocuments(activeTab)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Loading documents...</div>
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
              <p className="font-medium">Error loading documents</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-4">
        {/* Tabs and Search */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Documents</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="policies" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Policies</span>
                </TabsTrigger>
                <TabsTrigger value="procedures" className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Procedures</span>
                </TabsTrigger>
                <TabsTrigger value="regulatory" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Regulatory</span>
                </TabsTrigger>
                <TabsTrigger value="supporting" className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Supporting</span>
                </TabsTrigger>
                <TabsTrigger value="historical" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Historical</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardContent className="p-0">
            <TabsContent value={activeTab} className="mt-0">
              {filteredDocuments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents found</p>
                  {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.document_id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Link 
                              href={`/globaladmin/policies/documents/${doc.document_id}`}
                              className="font-medium hover:underline truncate"
                            >
                              {doc.document_name}
                            </Link>
                            {doc.document_number && (
                              <Badge variant="outline" className="text-xs">
                                {doc.document_number}
                              </Badge>
                            )}
                            {getStatusBadge(doc.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>{getTypeLabel(doc.document_type)}</span>
                            {doc.effective_date && (
                              <span>Effective: {format(new Date(doc.effective_date), 'MMM d, yyyy')}</span>
                            )}
                            {doc.next_review_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Review: {format(new Date(doc.next_review_date), 'MMM d, yyyy')}
                                </span>
                                {isReviewOverdue(doc.next_review_date) && (
                                  <Badge variant="destructive" className="ml-1 text-xs">Overdue</Badge>
                                )}
                                {isReviewDueSoon(doc.next_review_date) && (
                                  <Badge variant="outline" className="ml-1 text-xs">Due Soon</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            {doc.git_path}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/globaladmin/policies/documents/${doc.document_id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {doc.status === 'active' && (
                            <Button variant="ghost" size="icon" title="Send for Approval">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </Tabs>
  )
}

