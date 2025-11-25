'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Loader2, Download, FileText, File, AlertCircle } from 'lucide-react'
import { cn } from '@refugehouse/shared-core/utils'
import { Viewer, Worker } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import mammoth from 'mammoth'

interface FileViewerProps {
  owner: string
  repo: string
  filePath: string
  fileName: string
}

export function FileViewer({ owner, repo, filePath, fileName }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'markdown' | 'pdf' | 'docx' | 'html' | 'unknown'>('unknown')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)

  useEffect(() => {
    const loadFile = async () => {
      setLoading(true)
      setError(null)

      // Determine file type from extension
      const extension = fileName.toLowerCase().split('.').pop()
      
      if (extension === 'md' || extension === 'markdown') {
        setFileType('markdown')
        try {
          const response = await fetch(`/api/policies/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}`)
          if (!response.ok) {
            throw new Error('Failed to fetch file')
          }
          const data = await response.json()
          setContent(data.content)
        } catch (err: any) {
          setError(err.message || 'Failed to load markdown file')
        }
      } else if (extension === 'pdf') {
        setFileType('pdf')
        // For PDF, create URL to the API endpoint
        setPdfUrl(`/api/policies/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}`)
        setLoading(false)
        return
      } else if (extension === 'docx') {
        setFileType('docx')
        try {
          // Fetch DOCX file as blob
          const response = await fetch(`/api/policies/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&download=true`)
          if (!response.ok) {
            throw new Error('Failed to fetch DOCX file')
          }
          const blob = await response.blob()
          
          // Convert DOCX to HTML using mammoth
          const arrayBuffer = await blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setDocxHtml(result.value)
          
          // Log any warnings
          if (result.messages.length > 0) {
            console.warn('DOCX conversion warnings:', result.messages)
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load DOCX file')
        }
      } else if (extension === 'html') {
        setFileType('html')
        try {
          const response = await fetch(`/api/policies/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}`)
          if (!response.ok) {
            throw new Error('Failed to fetch file')
          }
          const data = await response.json()
          setContent(data.content)
        } catch (err: any) {
          setError(err.message || 'Failed to load HTML file')
        }
      } else {
        setFileType('unknown')
        setError(`File type .${extension} is not supported for preview`)
      }

      setLoading(false)
    }

    if (filePath) {
      loadFile()
    }
  }, [owner, repo, filePath, fileName])

  const handleDownload = () => {
    const url = `/api/policies/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&download=true`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Loading file...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading file</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
        <Button onClick={handleDownload} className="mt-4" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    )
  }

  // PDF Viewer using @react-pdf-viewer/core
  if (fileType === 'pdf' && pdfUrl) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin()
    
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Worker workerUrl="/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfUrl}
              plugins={[defaultLayoutPluginInstance]}
            />
          </Worker>
        </div>
      </div>
    )
  }

  // DOCX Viewer using mammoth.js
  if (fileType === 'docx' && docxHtml) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <article 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Markdown Viewer
  if (fileType === 'markdown' && content) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <article 
            className="markdown-content prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:my-4 prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-a:text-primary prose-a:underline"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    )
  }

  // HTML Viewer
  if (fileType === 'html' && content) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-4">
          <div 
            className="html-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    )
  }

  // Unknown file type
  return (
    <div className="p-4">
      <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
        <File className="w-8 h-8 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{fileName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            This file type cannot be previewed. Please download the file to view it.
          </p>
        </div>
      </div>
      <Button onClick={handleDownload} className="mt-4" variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Download File
      </Button>
    </div>
  )
}

// Enhanced markdown to HTML converter
function renderMarkdown(markdown: string): string {
  let html = markdown
  
  // Code blocks (must come before inline code)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
    const escaped = escapeHtml(code.trim())
    return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`
  })
  
  // Inline code
  html = html.replace(/`([^`\n]+)`/gim, '<code>$1</code>')
  
  // Headers (must come before other formatting)
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>')
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>')
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>')
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>')
  html = html.replace(/^\*\*\*$/gim, '<hr>')
  
  // Bold and italic (bold first, then italic)
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" />')
  
  // Lists (unordered)
  html = html.replace(/^[\*\-\+] (.+)$/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>')
  
  // Lists (ordered)
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>')
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>')
  
  // Paragraphs (split by double newlines)
  const paragraphs = html.split(/\n\n+/)
  html = paragraphs.map(p => {
    p = p.trim()
    if (!p || p.startsWith('<')) return p
    return `<p>${p}</p>`
  }).join('\n')
  
  // Single line breaks
  html = html.replace(/\n(?!<)/g, '<br>')
  
  return html
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
