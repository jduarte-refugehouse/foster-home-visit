import { NextRequest, NextResponse } from 'next/server'
import { fetchRepositoryContents } from '@/app/actions/github-actions'
import { syncDocumentFromGit } from '@/app/actions/policy-actions'
import { fetchFileContent } from '@/app/actions/github-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Recursively find all markdown, PDF, and DOCX files in the repository
 */
async function findAllDocuments(
  owner: string,
  repo: string,
  path: string = '',
  documents: Array<{ path: string; name: string }> = []
): Promise<Array<{ path: string; name: string }>> {
  try {
    const result = await fetchRepositoryContents(owner, repo, path)
    
    if (!result.success || !result.items) {
      return documents
    }

    for (const item of result.items) {
      if (item.type === 'file') {
        const extension = item.name.toLowerCase().split('.').pop()
        // Only sync markdown and HTML files for now - DOCX/PDF need special handling
        if (['md', 'markdown', 'html'].includes(extension || '')) {
          documents.push({ path: item.path, name: item.name })
        }
      } else if (item.type === 'dir') {
        // Skip certain directories that we don't want to track
        if (!item.name.startsWith('.') && item.name !== 'node_modules') {
          await findAllDocuments(owner, repo, item.path, documents)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning path ${path}:`, error)
  }

  return documents
}

// POST /api/policies/sync - Sync all documents from Git repository to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub owner and repo not configured' },
        { status: 500 }
      )
    }

    console.log('Starting document sync from repository...')
    
    // Find all documents in the repository
    const allDocuments = await findAllDocuments(owner, repo)
    console.log(`Found ${allDocuments.length} documents to sync`)

    const results = {
      total: allDocuments.length,
      created: 0,
      updated: 0,
      errors: [] as Array<{ path: string; error: string }>,
    }

    // Sync each document
    for (const doc of allDocuments) {
      try {
        // Fetch file content to extract metadata
        // Skip binary files - they'll need special handling later
        const extension = doc.path.toLowerCase().split('.').pop()
        if (['docx', 'pdf'].includes(extension || '')) {
          // For now, skip binary files - we can add support later
          continue
        }
        
        const fileResult = await fetchFileContent(owner, repo, doc.path)
        
        if (!fileResult.success || !fileResult.content) {
          results.errors.push({
            path: doc.path,
            error: 'Failed to fetch file content',
          })
          continue
        }

        // Sync document metadata to database
        const syncResult = await syncDocumentFromGit(
          doc.path,
          'latest', // We don't have the exact SHA, so use 'latest'
          fileResult.content,
          userId
        )

        if (syncResult.success) {
          if (syncResult.action === 'created') {
            results.created++
          } else {
            results.updated++
          }
        } else {
          results.errors.push({
            path: doc.path,
            error: syncResult.error || 'Unknown error',
          })
        }
      } catch (error: any) {
        results.errors.push({
          path: doc.path,
          error: error.message || 'Unknown error',
        })
      }
    }

    console.log(`Sync complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error('Error syncing documents:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

