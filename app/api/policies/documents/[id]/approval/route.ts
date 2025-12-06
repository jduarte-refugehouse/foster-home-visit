import { NextRequest, NextResponse } from 'next/server'
import { requestApproval } from '@/app/actions/policy-actions'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/policies/documents/[id]/approval - Request approval for document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const documentId = params.id
    const { versionId, approvalType, notes, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const result = await requestApproval(
      {
        documentId,
        versionId,
        approvalType,
        notes,
      },
      userId
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      approvalId: result.approvalId,
    })
  } catch (error: any) {
    console.error('Error requesting approval:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

