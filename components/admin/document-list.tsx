'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Input } from '@refugehouse/shared-core/components/ui/input'
import { Badge } from '@refugehouse/shared-core/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@refugehouse/shared-core/components/ui/select'
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Archive, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Edit
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
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadDocuments()
  }, [filterType, filterStatus, filterCategory])

  const loadDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('documentType', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterCategory !== 'all') params.append('category', filterCategory)

      const response = await fetch(`/api/policies/documents?${params.toString()}`)
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

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.document_number && doc.document_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.git_path.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

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
    <div className="flex flex-col gap-4">
      {/* Filters and Search */}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="policy">Policies</SelectItem>
                <SelectItem value="procedure">Procedures</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
                <SelectItem value="package-specific">Package-Specific</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-approval">Pending Approval</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="regulatory-reference">Regulatory Reference</SelectItem>
                <SelectItem value="historical">Historical</SelectItem>
                <SelectItem value="supporting">Supporting</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              {searchQuery && <p className="text-sm mt-2">Try adjusting your search or filters</p>}
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
        </CardContent>
      </Card>
    </div>
  )
}

