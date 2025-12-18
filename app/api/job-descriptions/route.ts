import { NextRequest, NextResponse } from 'next/server'
import { 
  fetchRepositoryContents, 
  createOrUpdateFile, 
  moveFile,
  getFileInfo 
} from '@/app/actions/github-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const JOB_DESCRIPTIONS_PATH = 'job-descriptions'
const ARCHIVED_PATH = 'job-descriptions/archived'

// GET /api/job-descriptions - List all job descriptions
export async function GET(request: NextRequest) {
  try {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'GitHub owner and repo not configured' },
        { status: 500 }
      )
    }

    // Fetch job descriptions from the job-descriptions folder
    const result = await fetchRepositoryContents(owner, repo, JOB_DESCRIPTIONS_PATH)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch job descriptions' },
        { status: 500 }
      )
    }

    // Filter to only markdown files and separate active from archived
    const items = result.items || []
    const activeJobs: any[] = []
    const archivedJobs: any[] = []
    let hasArchivedFolder = false

    for (const item of items) {
      if (item.type === 'dir' && item.name === 'archived') {
        hasArchivedFolder = true
        // Fetch archived items
        const archivedResult = await fetchRepositoryContents(owner, repo, ARCHIVED_PATH)
        if (archivedResult.success && archivedResult.items) {
          for (const archivedItem of archivedResult.items) {
            if (archivedItem.type === 'file' && 
                (archivedItem.name.endsWith('.md') || archivedItem.name.endsWith('.markdown'))) {
              archivedJobs.push({
                name: archivedItem.name,
                path: archivedItem.path,
                sha: archivedItem.sha,
                size: archivedItem.size,
                status: 'archived',
              })
            }
          }
        }
      } else if (item.type === 'file' && 
                 (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
        activeJobs.push({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          status: 'active',
        })
      }
    }

    return NextResponse.json({
      success: true,
      active: activeJobs,
      archived: archivedJobs,
      hasArchivedFolder,
    })
  } catch (error: any) {
    console.error('Error fetching job descriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/job-descriptions - Create a new job description
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
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

    // Sanitize title for filename
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    const fileName = `${sanitizedTitle}.md`
    const filePath = `${JOB_DESCRIPTIONS_PATH}/${fileName}`

    // Check if file already exists
    const existingFile = await getFileInfo(owner, repo, filePath)
    if (existingFile.success) {
      return NextResponse.json(
        { error: 'A job description with this title already exists' },
        { status: 409 }
      )
    }

    // Create the file
    const result = await createOrUpdateFile(
      owner,
      repo,
      filePath,
      content,
      `Add job description: ${title}`
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create job description' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      path: result.path,
      sha: result.sha,
      fileName,
    })
  } catch (error: any) {
    console.error('Error creating job description:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
