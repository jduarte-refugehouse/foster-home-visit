'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Loader2, Download, FileText, File, AlertCircle, Printer, FileDown } from 'lucide-react'
import { cn } from '@refugehouse/shared-core/utils'
import mammoth from 'mammoth'
import 'highlight.js/styles/github.css'
import 'github-markdown-css/github-markdown.css'

// Dynamically import PDF viewer components to avoid SSR issues
const PDFViewer = dynamic(
  () => import('./pdf-viewer-wrapper').then(mod => ({ default: mod.PDFViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Loading PDF viewer...</div>
      </div>
    )
  }
)

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

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    if (fileType !== 'markdown' || !content) return
    
    try {
      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default
      
      // Get the markdown content element
      const element = document.querySelector('.markdown-content-wrapper')
      if (!element) {
        alert('Could not find content to export. Please try again.')
        return
      }

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${fileName.replace(/\.(md|markdown)$/i, '')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['table', 'tr', 'h1', 'h2', 'h3']
        }
      }

      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try printing instead.')
    }
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
          <PDFViewer fileUrl={pdfUrl} />
        </div>
      </div>
    )
  }

  // DOCX Viewer using mammoth.js with enhanced styling
  if (fileType === 'docx' && docxHtml) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between print:hidden">
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
          <div className="p-6 print:p-8">
            <article 
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-foreground
                prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
                prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                prose-p:my-4 prose-p:leading-relaxed prose-p:text-foreground
                prose-ul:my-4 prose-ol:my-4
                prose-li:my-2 prose-li:leading-relaxed
                prose-strong:font-semibold prose-strong:text-foreground
                prose-em:italic
                prose-table:w-full prose-table:my-4 prose-table:border-collapse
                prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:font-semibold
                prose-td:border prose-td:border-border prose-td:p-2
                print:prose-sm print:prose-headings:break-inside-avoid print:prose-p:break-inside-avoid
                [&_p]:mb-4 [&_p]:leading-relaxed
                [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse
                [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:font-semibold
                [&_td]:border [&_td]:border-border [&_td]:p-2
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Markdown Viewer with react-markdown
  if (fileType === 'markdown' && content) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <style dangerouslySetInnerHTML={{ __html: `
            .markdown-content-wrapper {
              padding: 45px;
              max-width: 980px;
              margin: 0 auto;
              box-sizing: border-box;
              min-width: 200px;
            }
            @media (max-width: 767px) {
              .markdown-content-wrapper {
                padding: 15px;
              }
            }
            /* Ensure GitHub markdown styles work with our theme */
            .markdown-body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
              font-size: 16px;
              line-height: 1.5;
              word-wrap: break-word;
            }
            /* Explicitly ensure lists display with bullets and numbers */
            .markdown-body ul,
            .markdown-body ol {
              padding-left: 2em !important;
              margin-top: 0;
              margin-bottom: 16px;
            }
            .markdown-body ul {
              list-style-type: disc !important;
            }
            .markdown-body ol {
              list-style-type: decimal !important;
            }
            .markdown-body ul ul {
              list-style-type: circle !important;
            }
            .markdown-body ul ul ul {
              list-style-type: square !important;
            }
            .markdown-body ol ol {
              list-style-type: lower-alpha !important;
            }
            .markdown-body ol ol ol {
              list-style-type: lower-roman !important;
            }
            .markdown-body li {
              display: list-item !important;
              margin-top: 0.25em;
              margin-bottom: 0.25em;
            }
            .markdown-body li > p {
              margin-top: 16px;
            }
            .markdown-body li + li {
              margin-top: 0.25em;
            }
            /* Dark mode support - GitHub markdown CSS handles this, but ensure compatibility */
            .dark .markdown-body {
              color-scheme: dark;
            }
          `}} />
          <div className="markdown-content-wrapper">
            <article className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
              >
                {content}
              </ReactMarkdown>
            </article>
          </div>
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

