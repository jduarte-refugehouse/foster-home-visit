'use server'

import { getConnection } from '@refugehouse/shared-core/lib/db'

interface DocumentMetadata {
  documentNumber?: string
  documentName: string
  documentType: 'policy' | 'procedure' | 'combined' | 'package-specific' | 'regulatory' | 'guide' | 'job-description' | 'plan' | 'model' | 'historical'
  category: 'operational' | 'regulatory-reference' | 'historical' | 'supporting'
  gitPath: string
  gitSha?: string
  effectiveDate?: string
  reviewFrequencyMonths?: number
  t3cPackages?: string[] // Array of T3C package names
  domain?: string // Functional domain
  tags?: string[] // Array of tags
}

interface DocumentVersion {
  documentId: string
  versionNumber?: string
  gitSha: string
  gitPath: string
  action: 'add' | 'replace' | 'archive'
  effectiveDate?: string
  revisionNotes?: string
}

interface ApprovalRequest {
  documentId: string
  versionId?: string
  approvalType: 'board' | 'executive' | 'designee' | 'compliance'
  notes?: string
}

/**
 * Determine approval type based on document type
 * Policies require board approval, Procedures require executive/designee approval
 */
function getApprovalType(documentType: string): 'board' | 'executive' | 'designee' {
  if (documentType === 'policy' || documentType === 'combined') {
    return 'board'
  }
  if (documentType === 'procedure') {
    return 'executive' // Default to executive, can be changed to designee
  }
  return 'executive' // Default for other types
}

/**
 * Sync document metadata from Git repository
 * Extracts metadata from document header and creates/updates database record
 */
export async function syncDocumentFromGit(
  gitPath: string,
  gitSha: string,
  content: string,
  userId?: string
) {
  try {
    const pool = await getConnection()
    
    // Extract metadata from document header
    // Try multiple patterns for document number
    let documentNumber: string | null = null
    const numberPatterns = [
      /\*\*POLICY NUMBER\*\*.*?\|.*?\|.*?\n.*?\|.*?\|.*?([A-Z0-9-]+)/i,
      /POLICY NUMBER.*?\|.*?\|.*?\n.*?\|.*?\|.*?([A-Z0-9-]+)/i,
      /POLICY NUMBER[:\s]+([A-Z0-9-]+)/i,
      /FC[-\s]?([A-Z0-9-]+)/i,
    ]
    for (const pattern of numberPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        documentNumber = match[1].trim()
        break
      }
    }
    
    // Try multiple patterns for document name
    let documentName: string = 'Unknown Document'
    const namePatterns = [
      /\*\*POLICY NAME\*\*.*?\|.*?\|.*?\n.*?\|.*?\|.*?([^\n|]+)/i,
      /POLICY NAME.*?\|.*?\|.*?\n.*?\|.*?\|.*?([^\n|]+)/i,
      /^#\s+([^\n]+)/m,  // First H1 heading
      /^##\s+([^\n]+)/m, // First H2 heading
    ]
    for (const pattern of namePatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const candidate = match[1].trim()
        // Filter out obviously bad matches (too short, contains only special chars, etc.)
        if (candidate.length > 3 && !/^[^a-zA-Z0-9]+$/.test(candidate)) {
          documentName = candidate
          break
        }
      }
    }
    
    // Fallback: use filename if we couldn't extract a good name
    if (documentName === 'Unknown Document' || documentName.length < 3) {
      const fileName = gitPath.split('/').pop() || 'Unknown Document'
      // Remove extension and clean up
      documentName = fileName.replace(/\.(md|markdown|pdf|docx|html)$/i, '').replace(/[-_]/g, ' ')
    }
    
    // Determine document type from path
    let documentType: DocumentMetadata['documentType'] = 'policy'
    let category: DocumentMetadata['category'] = 'operational'
    
    if (gitPath.includes('Policy/')) {
      documentType = 'policy'
      category = 'operational'
    } else if (gitPath.includes('Procedure/')) {
      documentType = 'procedure'
      category = 'operational'
    } else if (gitPath.includes('Policy-and-Procedure/')) {
      documentType = 'combined'
      category = 'operational'
    } else if (gitPath.includes('Package-Specific/')) {
      documentType = 'package-specific'
      category = 'operational'
    } else if (gitPath.includes('regulatory-references/')) {
      documentType = 'regulatory'
      category = 'regulatory-reference'
    } else if (gitPath.includes('historical-docs/')) {
      documentType = 'historical'
      category = 'historical'
    } else if (gitPath.includes('guides/')) {
      documentType = 'guide'
      category = 'supporting'
    } else if (gitPath.includes('job-descriptions/')) {
      documentType = 'job-description'
      category = 'supporting'
    } else if (gitPath.includes('plans/')) {
      documentType = 'plan'
      category = 'supporting'
    } else if (gitPath.includes('models/')) {
      documentType = 'model'
      category = 'supporting'
    }
    
    // Extract effective date - skip for binary files (DOCX, PDF)
    let effectiveDate: string | null = null
    if (!gitPath.toLowerCase().endsWith('.docx') && !gitPath.toLowerCase().endsWith('.pdf')) {
      const datePatterns = [
        /\*\*EFFECTIVE DATE\*\*.*?\|.*?\|.*?\n.*?\|.*?\|.*?([0-9\/\-]+)/i,
        /EFFECTIVE DATE.*?\|.*?\|.*?\n.*?\|.*?\|.*?([0-9\/\-]+)/i,
        /EFFECTIVE DATE[:\s]+([0-9\/\-]+)/i,
      ]
      for (const pattern of datePatterns) {
        const match = content.match(pattern)
        if (match && match[1]) {
          effectiveDate = match[1].trim()
          break
        }
      }
    }

    // Extract T3C packages from document content
    const t3cPackages: string[] = []
    const packagePatterns = [
      /T3C Basic/i,
      /Mental & Behavioral Health/i,
      /IDD.*Autism|Autism.*IDD|Intellectual.*Developmental.*Disability/i,
      /Substance Use/i,
      /Short-Term Assessment/i,
      /Sexual Aggression|Sex Offender/i,
      /Complex Medical|Medically Fragile/i,
      /Human Trafficking/i,
      /Treatment Foster Family Care/i,
      /Transition Support/i,
      /Kinship Caregiver/i,
      /Pregnant.*Parenting/i,
    ]
    
    for (const pattern of packagePatterns) {
      if (pattern.test(content)) {
        // Map patterns to standard names
        if (pattern.source.includes('Basic')) t3cPackages.push('T3C Basic')
        else if (pattern.source.includes('Mental')) t3cPackages.push('Mental & Behavioral Health')
        else if (pattern.source.includes('IDD') || pattern.source.includes('Autism')) t3cPackages.push('IDD/Autism')
        else if (pattern.source.includes('Substance')) t3cPackages.push('Substance Use')
        else if (pattern.source.includes('Short-Term')) t3cPackages.push('Short-Term Assessment')
        else if (pattern.source.includes('Sexual') || pattern.source.includes('Sex Offender')) t3cPackages.push('Sexual Aggression/Sex Offender')
        else if (pattern.source.includes('Medical') || pattern.source.includes('Fragile')) t3cPackages.push('Complex Medical Needs')
        else if (pattern.source.includes('Trafficking')) t3cPackages.push('Human Trafficking')
        else if (pattern.source.includes('Treatment')) t3cPackages.push('T3C Treatment Foster Family Care')
        else if (pattern.source.includes('Transition')) t3cPackages.push('Transition Support Services')
        else if (pattern.source.includes('Kinship')) t3cPackages.push('Kinship Caregiver Support')
        else if (pattern.source.includes('Pregnant') || pattern.source.includes('Parenting')) t3cPackages.push('Pregnant & Parenting Youth')
      }
    }

    // Extract domain from document number or content
    // Common domains: Intake, Discharge, Service Planning, Direct Care, Credentialing, etc.
    let domain: string | null = null
    const domainPatterns = [
      { pattern: /FC2-01|Admission|Intake/i, domain: 'Intake' },
      { pattern: /FC14-01|Discharge|Permanency/i, domain: 'Discharge' },
      { pattern: /FC3-01|Service Planning|Individual Service/i, domain: 'Service Planning' },
      { pattern: /FC-T3C-01|Basic.*Support|Direct Care/i, domain: 'Direct Care' },
      { pattern: /Credentialing|Re-credentialing/i, domain: 'Credentialing' },
      { pattern: /Recruitment|Retention/i, domain: 'Recruitment & Retention' },
      { pattern: /Home Study|Home Studies/i, domain: 'Home Studies' },
      { pattern: /Family.*Connection|Family.*Engagement/i, domain: 'Family Engagement' },
      { pattern: /Health.*Care|Physical.*Mental/i, domain: 'Health Care' },
      { pattern: /Aftercare/i, domain: 'Aftercare' },
      { pattern: /Crisis.*Management/i, domain: 'Crisis Management' },
    ]
    
    for (const { pattern, domain: domainName } of domainPatterns) {
      if (pattern.test(content) || pattern.test(gitPath)) {
        domain = domainName
        break
      }
    }
    
    // Check if document already exists
    const existingDoc = await pool.request()
      .input('gitPath', gitPath)
      .query('SELECT document_id, status FROM policy_documents WHERE git_path = @gitPath')
    
    if (existingDoc.recordset.length > 0) {
      // Update existing document
      const docId = existingDoc.recordset[0].document_id
      const t3cPackagesJson = t3cPackages.length > 0 ? JSON.stringify(t3cPackages) : null
      const tagsJson = null // Tags will be manually added, not extracted
      
      await pool.request()
        .input('documentId', docId)
        .input('gitSha', gitSha)
        .input('documentNumber', documentNumber)
        .input('documentName', documentName)
        .input('effectiveDate', effectiveDate ? new Date(effectiveDate) : null)
        .input('t3cPackages', t3cPackagesJson)
        .input('domain', domain)
        .input('tags', tagsJson)
        .input('updatedAt', new Date())
        .query(`
          UPDATE policy_documents 
          SET git_sha = @gitSha,
              document_number = COALESCE(@documentNumber, document_number),
              document_name = COALESCE(@documentName, document_name),
              effective_date = COALESCE(@effectiveDate, effective_date),
              t3c_packages = COALESCE(@t3cPackages, t3c_packages),
              domain = COALESCE(@domain, domain),
              tags = COALESCE(@tags, tags),
              updated_at = @updatedAt
          WHERE document_id = @documentId
        `)
      
      return { success: true, documentId: docId, action: 'updated' }
    } else {
      // Create new document
      const t3cPackagesJson = t3cPackages.length > 0 ? JSON.stringify(t3cPackages) : null
      const tagsJson = null // Tags will be manually added, not extracted
      
      const result = await pool.request()
        .input('documentNumber', documentNumber)
        .input('documentName', documentName)
        .input('documentType', documentType)
        .input('category', category)
        .input('gitPath', gitPath)
        .input('gitSha', gitSha)
        .input('effectiveDate', effectiveDate ? new Date(effectiveDate) : null)
        .input('reviewFrequencyMonths', 12)
        .input('t3cPackages', t3cPackagesJson)
        .input('domain', domain)
        .input('tags', tagsJson)
        .input('createdByUserId', userId)
        .query(`
          INSERT INTO policy_documents 
          (document_number, document_name, document_type, category, git_path, git_sha, 
           effective_date, review_frequency_months, t3c_packages, domain, tags, created_by_user_id)
          OUTPUT INSERTED.document_id
          VALUES (@documentNumber, @documentName, @documentType, @category, @gitPath, @gitSha,
                  @effectiveDate, @reviewFrequencyMonths, @t3cPackages, @domain, @tags, @createdByUserId)
        `)
      
      const docId = result.recordset[0].document_id
      
      // Calculate next review date
      if (effectiveDate) {
        const nextReview = new Date(effectiveDate)
        nextReview.setMonth(nextReview.getMonth() + 12)
        await pool.request()
          .input('documentId', docId)
          .input('nextReviewDate', nextReview)
          .query('UPDATE policy_documents SET next_review_date = @nextReviewDate WHERE document_id = @documentId')
      }
      
      return { success: true, documentId: docId, action: 'created' }
    }
  } catch (error: any) {
    console.error('Error syncing document from Git:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create a new version record for a document
 */
export async function createDocumentVersion(version: DocumentVersion, userId?: string) {
  try {
    const pool = await getConnection()
    
    const result = await pool.request()
      .input('documentId', version.documentId)
      .input('versionNumber', version.versionNumber)
      .input('gitSha', version.gitSha)
      .input('gitPath', version.gitPath)
      .input('action', version.action)
      .input('effectiveDate', version.effectiveDate ? new Date(version.effectiveDate) : null)
      .input('revisionNotes', version.revisionNotes)
      .input('createdByUserId', userId)
      .query(`
        INSERT INTO policy_document_versions
        (document_id, version_number, git_sha, git_path, action, effective_date, revision_notes, created_by_user_id)
        OUTPUT INSERTED.version_id
        VALUES (@documentId, @versionNumber, @gitSha, @gitPath, @action, @effectiveDate, @revisionNotes, @createdByUserId)
      `)
    
    return { success: true, versionId: result.recordset[0].version_id }
  } catch (error: any) {
    console.error('Error creating document version:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'active' | 'draft' | 'pending-approval' | 'archived'
) {
  try {
    const pool = await getConnection()
    
    await pool.request()
      .input('documentId', documentId)
      .input('status', status)
      .input('updatedAt', new Date())
      .query(`
        UPDATE policy_documents 
        SET status = @status, updated_at = @updatedAt
        WHERE document_id = @documentId
      `)
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating document status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get version history for a document
 */
export async function getDocumentVersions(documentId: string) {
  try {
    const pool = await getConnection()
    
    const result = await pool.request()
      .input('documentId', documentId)
      .query(`
        SELECT 
          version_id,
          version_number,
          git_sha,
          git_path,
          action,
          effective_date,
          revision_notes,
          created_at,
          created_by_user_id
        FROM policy_document_versions
        WHERE document_id = @documentId
        ORDER BY created_at DESC
      `)
    
    return { success: true, versions: result.recordset }
  } catch (error: any) {
    console.error('Error getting document versions:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Request approval for a document
 * Approval type is automatically determined from document type
 */
export async function requestApproval(request: ApprovalRequest, userId: string) {
  try {
    const pool = await getConnection()
    
    // Get document to determine approval type if not specified
    const docResult = await pool.request()
      .input('documentId', request.documentId)
      .query('SELECT document_type FROM policy_documents WHERE document_id = @documentId')
    
    if (docResult.recordset.length === 0) {
      return { success: false, error: 'Document not found' }
    }
    
    const documentType = docResult.recordset[0].document_type
    const approvalType = request.approvalType || getApprovalType(documentType)
    
    // Create approval request
    const result = await pool.request()
      .input('documentId', request.documentId)
      .input('versionId', request.versionId)
      .input('approvalType', approvalType)
      .input('requestedByUserId', userId)
      .input('approvalNotes', request.notes)
      .query(`
        INSERT INTO policy_document_approvals
        (document_id, version_id, approval_type, approval_status, requested_by_user_id, approval_notes)
        OUTPUT INSERTED.approval_id
        VALUES (@documentId, @versionId, @approvalType, 'pending', @requestedByUserId, @approvalNotes)
      `)
    
    // Update document status to pending-approval
    await updateDocumentStatus(request.documentId, 'pending-approval')
    
    return { success: true, approvalId: result.recordset[0].approval_id }
  } catch (error: any) {
    console.error('Error requesting approval:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all documents with optional filters
 */
export async function getDocuments(filters?: {
  documentType?: string
  category?: string
  status?: string
}) {
  try {
    const pool = await getConnection()
    
    let query = `
      SELECT 
        document_id,
        document_number,
        document_name,
        document_type,
        category,
        git_path,
        git_sha,
        status,
        effective_date,
        next_review_date,
        review_frequency_months,
        created_at,
        updated_at
      FROM policy_documents
      WHERE 1=1
    `
    
    const request = pool.request()
    
    if (filters?.documentType) {
      query += ' AND document_type = @documentType'
      request.input('documentType', filters.documentType)
    }
    
    if (filters?.category) {
      query += ' AND category = @category'
      request.input('category', filters.category)
    }
    
    if (filters?.status) {
      query += ' AND status = @status'
      request.input('status', filters.status)
    }
    
    query += ' ORDER BY document_name ASC'
    
    const result = await request.query(query)
    
    return { success: true, documents: result.recordset }
  } catch (error: any) {
    console.error('Error getting documents:', error)
    return { success: false, error: error.message }
  }
}

