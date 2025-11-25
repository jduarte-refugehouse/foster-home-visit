import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@refugehouse/shared-core/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/policies/clear - Clear all documents from database
export async function POST(request: NextRequest) {
  try {
    const pool = await getConnection()

    // Delete in order to respect foreign key constraints
    await pool.request().query('DELETE FROM policy_document_approvals')
    await pool.request().query('DELETE FROM policy_document_versions')
    await pool.request().query('DELETE FROM policy_documents')

    // Get counts to verify
    const counts = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM policy_documents) AS documents,
        (SELECT COUNT(*) FROM policy_document_versions) AS versions,
        (SELECT COUNT(*) FROM policy_document_approvals) AS approvals
    `)

    return NextResponse.json({
      success: true,
      message: 'All documents cleared',
      counts: counts.recordset[0],
    })
  } catch (error: any) {
    console.error('Error clearing documents:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

