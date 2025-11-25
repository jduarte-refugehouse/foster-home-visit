import { NextRequest, NextResponse } from 'next/server'
import { fetchFileContent, fetchRepositoryContents } from '@/app/actions/github-actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const path = searchParams.get('path')
    const download = searchParams.get('download') === 'true'

    if (!owner || !repo || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, path' },
        { status: 400 }
      )
    }

    // For PDF and DOCX files, we need to fetch the raw file from GitHub
    const fileExtension = path.toLowerCase().split('.').pop()
    const isBinary = fileExtension === 'pdf' || fileExtension === 'docx' || fileExtension === 'doc'

    if (isBinary || download) {
      // Fetch raw file from GitHub
      const token = process.env.GITHUB_TOKEN
      if (!token) {
        return NextResponse.json(
          { error: 'GITHUB_TOKEN not configured' },
          { status: 500 }
        )
      }

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: `GitHub API error: ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      
      // Decode base64 content
      const fileBuffer = Buffer.from(data.content, 'base64')
      
      // Determine content type
      let contentType = 'application/octet-stream'
      if (fileExtension === 'pdf') {
        contentType = 'application/pdf'
      } else if (fileExtension === 'docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      } else if (fileExtension === 'doc') {
        contentType = 'application/msword'
      }

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': download 
            ? `attachment; filename="${data.name}"` 
            : `inline; filename="${data.name}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    }

    // For text files (markdown, HTML, etc.), return as JSON
    const result = await fetchFileContent(owner, repo, path)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch file content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      path,
    })
  } catch (error: any) {
    console.error('Error fetching file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch file' },
      { status: 500 }
    )
  }
}

