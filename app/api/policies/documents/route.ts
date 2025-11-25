import { NextRequest, NextResponse } from 'next/server'
import { getDocuments, syncDocumentFromGit } from '@/app/actions/policy-actions'
import { fetchFileContent } from '@/app/actions/github-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/policies/documents - List documents with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const filters: any = {}
    if (documentType) filters.documentType = documentType
    if (category) filters.category = category
    if (status) filters.status = status

    const result = await getDocuments(filters)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ documents: result.documents })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/policies/documents - Create new document (sync from Git)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gitPath, gitSha, userId } = body

    if (!gitPath) {
      return NextResponse.json({ error: 'gitPath is required' }, { status: 400 })
    }

    // Fetch file content from GitHub
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!
    
    const fileResult = await fetchFileContent(owner, repo, gitPath)
    
    if (!fileResult.success || !fileResult.content) {
      return NextResponse.json({ error: 'Failed to fetch file from GitHub' }, { status: 404 })
    }

    // Sync document metadata to database
    const syncResult = await syncDocumentFromGit(
      gitPath,
      gitSha || 'latest',
      fileResult.content,
      userId
    )

    if (!syncResult.success) {
      return NextResponse.json({ error: syncResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documentId: syncResult.documentId,
      action: syncResult.action,
    })
  } catch (error: any) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

