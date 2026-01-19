import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPointTransactions } from '@/services/loyalty.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await getPointTransactions(session.user.id, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching point transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch point transactions' },
      { status: 500 }
    )
  }
}
