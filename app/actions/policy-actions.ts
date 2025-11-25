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
    const documentNumberMatch = content.match(/\*\*POLICY NUMBER\*\*.*?\|.*?\|.*?\n.*?\|.*?\|.*?([A-Z0-9-]+)/i) ||
                               content.match(/POLICY NUMBER.*?([A-Z0-9-]+)/i)
    const documentNumber = documentNumberMatch ? documentNumberMatch[1].trim() : null
    
    const documentNameMatch = content.match(/\*\*POLICY NAME\*\*.*?\|.*?\|.*?\n.*?\|.*?\|.*?([^\n|]+)/i) ||
                                content.match(/#\s+([^\n]+)/)
    const documentName = documentNameMatch ? documentNameMatch[1].trim() : 'Unknown Document'
    
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
    
    // Extract effective date
    const effectiveDateMatch = content.match(/\*\*EFFECTIVE DATE\*\*.*?\|.*?\|.*?\n.*?\|.*?\|.*?([^\n|]+)/i) ||
                            content.match(/EFFECTIVE DATE.*?([0-9\/]+)/i)
    const effectiveDate = effectiveDateMatch ? effectiveDateMatch[1].trim() : null
    
    // Check if document already exists
    const existingDoc = await pool.request()
      .input('gitPath', gitPath)
      .query('SELECT document_id, status FROM policy_documents WHERE git_path = @gitPath')
    
    if (existingDoc.recordset.length > 0) {
      // Update existing document
      const docId = existingDoc.recordset[0].document_id
      await pool.request()
        .input('documentId', docId)
        .input('gitSha', gitSha)
        .input('documentNumber', documentNumber)
        .input('documentName', documentName)
        .input('effectiveDate', effectiveDate ? new Date(effectiveDate) : null)
        .input('updatedAt', new Date())
        .query(`
          UPDATE policy_documents 
          SET git_sha = @gitSha,
              document_number = COALESCE(@documentNumber, document_number),
              document_name = COALESCE(@documentName, document_name),
              effective_date = COALESCE(@effectiveDate, effective_date),
              updated_at = @updatedAt
          WHERE document_id = @documentId
        `)
      
      return { success: true, documentId: docId, action: 'updated' }
    } else {
      // Create new document
      const result = await pool.request()
        .input('documentNumber', documentNumber)
        .input('documentName', documentName)
        .input('documentType', documentType)
        .input('category', category)
        .input('gitPath', gitPath)
        .input('gitSha', gitSha)
        .input('effectiveDate', effectiveDate ? new Date(effectiveDate) : null)
        .input('reviewFrequencyMonths', 12)
        .input('createdByUserId', userId)
        .query(`
          INSERT INTO policy_documents 
          (document_number, document_name, document_type, category, git_path, git_sha, 
           effective_date, review_frequency_months, created_by_user_id)
          OUTPUT INSERTED.document_id
          VALUES (@documentNumber, @documentName, @documentType, @category, @gitPath, @gitSha,
                  @effectiveDate, @reviewFrequencyMonths, @createdByUserId)
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

