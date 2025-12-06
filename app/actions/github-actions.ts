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

