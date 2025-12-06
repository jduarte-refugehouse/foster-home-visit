import { NextRequest, NextResponse } from 'next/server'
import { getDocumentVersions } from '@/app/actions/policy-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/policies/documents/[id]/versions - Get version history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    const result = await getDocumentVersions(documentId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ versions: result.versions })
  } catch (error: any) {
    console.error('Error fetching document versions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

