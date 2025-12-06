import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@refugehouse/shared-core/lib/db'
import { updateDocumentStatus } from '@/app/actions/policy-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/policies/documents/[id] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = await getConnection()
    const documentId = params.id

    const result = await pool.request()
      .input('documentId', documentId)
      .query(`
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
          t3c_packages,
          domain,
          tags,
          created_at,
          updated_at,
          created_by_user_id
        FROM policy_documents
        WHERE document_id = @documentId
      `)

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document: result.recordset[0] })
  } catch (error: any) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/policies/documents/[id] - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const documentId = params.id
    const pool = await getConnection()

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const dbRequest = pool.request().input('documentId', documentId)

    if (body.documentName) {
      updates.push('document_name = @documentName')
      dbRequest.input('documentName', body.documentName)
    }

    if (body.documentNumber !== undefined) {
      updates.push('document_number = @documentNumber')
      dbRequest.input('documentNumber', body.documentNumber || null)
    }

    if (body.status) {
      updates.push('status = @status')
      dbRequest.input('status', body.status)
    }

    if (body.nextReviewDate) {
      updates.push('next_review_date = @nextReviewDate')
      dbRequest.input('nextReviewDate', new Date(body.nextReviewDate))
    }

    if (body.reviewFrequencyMonths !== undefined) {
      updates.push('review_frequency_months = @reviewFrequencyMonths')
      dbRequest.input('reviewFrequencyMonths', body.reviewFrequencyMonths)
    }

    if (body.t3cPackages !== undefined) {
      updates.push('t3c_packages = @t3cPackages')
      dbRequest.input('t3cPackages', body.t3cPackages ? JSON.stringify(body.t3cPackages) : null)
    }

    if (body.domain !== undefined) {
      updates.push('domain = @domain')
      dbRequest.input('domain', body.domain || null)
    }

    if (body.tags !== undefined) {
      updates.push('tags = @tags')
      dbRequest.input('tags', body.tags ? JSON.stringify(body.tags) : null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push('updated_at = GETUTCDATE()')

    await dbRequest.query(`
      UPDATE policy_documents 
      SET ${updates.join(', ')}
      WHERE document_id = @documentId
    `)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating document:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

