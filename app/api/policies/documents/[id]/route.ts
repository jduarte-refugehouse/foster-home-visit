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
    const request = pool.request().input('documentId', documentId)

    if (body.status) {
      updates.push('status = @status')
      request.input('status', body.status)
    }

    if (body.nextReviewDate) {
      updates.push('next_review_date = @nextReviewDate')
      request.input('nextReviewDate', new Date(body.nextReviewDate))
    }

    if (body.reviewFrequencyMonths !== undefined) {
      updates.push('review_frequency_months = @reviewFrequencyMonths')
      request.input('reviewFrequencyMonths', body.reviewFrequencyMonths)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push('updated_at = GETUTCDATE()')

    await request.query(`
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

