import { NextRequest, NextResponse } from 'next/server'
import { 
  fetchFileContent,
  createOrUpdateFile, 
  moveFile,
  getFileInfo,
  deleteFile 
} from '@/app/actions/github-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JOB_DESCRIPTIONS_PATH = 'job-descriptions'
const ARCHIVED_PATH = 'job-descriptions/archived'

// GET /api/job-descriptions/[...path] - Get a specific job description content
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const fullPath = filePath.startsWith('job-descriptions/') 
      ? filePath 
      : `${JOB_DESCRIPTIONS_PATH}/${filePath}`

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub owner and repo not configured' },
        { status: 500 }
      )
    }

    const result = await fetchFileContent(owner, repo, fullPath)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch file content' },
        { status: 404 }
      )
    }

    // Get file info for SHA
    const fileInfo = await getFileInfo(owner, repo, fullPath)

    return NextResponse.json({
      success: true,
      content: result.content,
      path: fullPath,
      sha: fileInfo.success ? fileInfo.sha : undefined,
    })
  } catch (error: any) {
    console.error('Error fetching job description:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/job-descriptions/[...path] - Update a job description
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const body = await request.json()
    const { content, sha } = body
    const filePath = params.path.join('/')
    const fullPath = filePath.startsWith('job-descriptions/') 
      ? filePath 
      : `${JOB_DESCRIPTIONS_PATH}/${filePath}`

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub owner and repo not configured' },
        { status: 500 }
      )
    }

    // If no SHA provided, get it
    let fileSha = sha
    if (!fileSha) {
      const fileInfo = await getFileInfo(owner, repo, fullPath)
      if (!fileInfo.success) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
      fileSha = fileInfo.sha
    }

    const fileName = fullPath.split('/').pop() || 'job-description.md'
    const result = await createOrUpdateFile(
      owner,
      repo,
      fullPath,
      content,
      `Update job description: ${fileName}`,
      fileSha
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update job description' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      path: result.path,
      sha: result.sha,
    })
  } catch (error: any) {
    console.error('Error updating job description:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/job-descriptions/[...path] - Archive or unarchive a job description
export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const body = await request.json()
    const { action } = body // 'archive' or 'unarchive'
    const filePath = params.path.join('/')
    const fullPath = filePath.startsWith('job-descriptions/') 
      ? filePath 
      : `${JOB_DESCRIPTIONS_PATH}/${filePath}`

    if (!action || !['archive', 'unarchive'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "archive" or "unarchive"' },
        { status: 400 }
      )
    }

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub owner and repo not configured' },
        { status: 500 }
      )
    }

    const fileName = fullPath.split('/').pop() || ''
    let newPath: string

    if (action === 'archive') {
      // Move to archived folder
      newPath = `${ARCHIVED_PATH}/${fileName}`
    } else {
      // Move back to main folder
      newPath = `${JOB_DESCRIPTIONS_PATH}/${fileName}`
    }

    const result = await moveFile(
      owner,
      repo,
      fullPath,
      newPath,
      `${action === 'archive' ? 'Archive' : 'Unarchive'} job description: ${fileName}`
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || `Failed to ${action} job description` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      newPath: result.newPath,
      sha: result.sha,
      action,
    })
  } catch (error: any) {
    console.error('Error archiving/unarchiving job description:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/job-descriptions/[...path] - Permanently delete a job description
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const fullPath = filePath.startsWith('job-descriptions/') 
      ? filePath 
      : `${JOB_DESCRIPTIONS_PATH}/${filePath}`

    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub owner and repo not configured' },
        { status: 500 }
      )
    }

    // Get file SHA
    const fileInfo = await getFileInfo(owner, repo, fullPath)
    if (!fileInfo.success) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const fileName = fullPath.split('/').pop() || ''
    const result = await deleteFile(
      owner,
      repo,
      fullPath,
      `Delete job description: ${fileName}`,
      fileInfo.sha
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete job description' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted: fullPath,
    })
  } catch (error: any) {
    console.error('Error deleting job description:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
