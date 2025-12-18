'use server'

// Server actions to keep GitHub token secure on the server
interface GitHubConfig {
  owner: string
  repo: string
}

interface Document {
  path: string
  name: string
  type: 'file' | 'dir'
}

async function fetchGitHub(url: string) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set')
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid GitHub token - please check your token has the correct permissions')
    } else if (response.status === 404) {
      throw new Error('Repository not found - please check owner and repo name')
    } else {
      throw new Error(`GitHub API error (${response.status}): ${response.statusText}`)
    }
  }

  return response.json()
}

async function fetchAllMarkdownFilesRecursive(
  owner: string,
  repo: string,
  path: string = ''
): Promise<Document[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const data = await fetchGitHub(url)
  
  const items = Array.isArray(data) ? data : [data]
  const allFiles: Document[] = []

  for (const item of items) {
    if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
      allFiles.push({
        path: item.path,
        name: item.name,
        type: 'file',
      })
    } else if (item.type === 'dir') {
      const subFiles = await fetchAllMarkdownFilesRecursive(owner, repo, item.path)
      allFiles.push(...subFiles)
    }
  }

  return allFiles
}

export async function fetchDocuments(config: GitHubConfig) {
  try {
    const allMarkdownFiles = await fetchAllMarkdownFilesRecursive(config.owner, config.repo)
    allMarkdownFiles.sort((a, b) => a.path.localeCompare(b.path))
    return { success: true, documents: allMarkdownFiles }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function fetchFileContent(owner: string, repo: string, path: string) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const data = await fetchGitHub(url)
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    return { success: true, content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function fetchRepositoryContents(owner: string, repo: string, path: string = '') {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const data = await fetchGitHub(url)
    const items = Array.isArray(data) ? data : [data]
    return { success: true, items }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function loadAllDocuments(owner: string, repo: string, filePaths: string[]) {
  const allDocs: Array<{ path: string; content: string }> = []
  
  for (const path of filePaths) {
    try {
      const result = await fetchFileContent(owner, repo, path)
      if (result.success && result.content) {
        allDocs.push({ path, content: result.content })
      }
    } catch (error) {
      console.error(`Failed to load ${path}`, error)
    }
  }
  
  return allDocs
}

/**
 * Create or update a file in the GitHub repository
 */
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string // Required for updates, omit for new files
) {
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set')
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    
    // Encode content to base64
    const encodedContent = Buffer.from(content, 'utf-8').toString('base64')
    
    const body: any = {
      message,
      content: encodedContent,
    }
    
    // If sha is provided, this is an update
    if (sha) {
      body.sha = sha
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    return { 
      success: true, 
      sha: data.content.sha,
      path: data.content.path,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a file from the GitHub repository
 */
export async function deleteFile(
  owner: string,
  repo: string,
  path: string,
  message: string,
  sha: string
) {
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set')
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sha,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`GitHub API error (${response.status}): ${errorData.message || response.statusText}`)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Move/rename a file in the GitHub repository (create new, delete old)
 */
export async function moveFile(
  owner: string,
  repo: string,
  oldPath: string,
  newPath: string,
  message: string
) {
  try {
    // First, fetch the current file content
    const contentResult = await fetchFileContent(owner, repo, oldPath)
    if (!contentResult.success || !contentResult.content) {
      throw new Error('Failed to fetch file content for move operation')
    }

    // Get the SHA of the old file
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set')
    }

    const oldFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${oldPath}`
    const oldFileResponse = await fetch(oldFileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!oldFileResponse.ok) {
      throw new Error('Failed to get old file info')
    }

    const oldFileData = await oldFileResponse.json()
    const oldSha = oldFileData.sha

    // Create the new file
    const createResult = await createOrUpdateFile(
      owner,
      repo,
      newPath,
      contentResult.content,
      message
    )

    if (!createResult.success) {
      throw new Error(`Failed to create new file: ${createResult.error}`)
    }

    // Delete the old file
    const deleteResult = await deleteFile(
      owner,
      repo,
      oldPath,
      message,
      oldSha
    )

    if (!deleteResult.success) {
      // Try to clean up the new file if delete failed
      console.error('Failed to delete old file after move:', deleteResult.error)
      throw new Error(`Failed to delete old file: ${deleteResult.error}`)
    }

    return { 
      success: true, 
      newPath,
      sha: createResult.sha,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get file info including SHA (needed for updates/deletes)
 */
export async function getFileInfo(owner: string, repo: string, path: string) {
  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is not set')
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'File not found' }
      }
      throw new Error(`GitHub API error (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    return { 
      success: true, 
      sha: data.sha,
      name: data.name,
      path: data.path,
      size: data.size,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

