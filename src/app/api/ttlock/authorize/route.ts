import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ttlockClient } from '@/lib/ttlock'

// GET /api/ttlock/authorize - Start TTLock OAuth flow
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ttlockClient.isConfigured()) {
      return NextResponse.json({ error: 'TTLock not configured' }, { status: 500 })
    }

    // Use owner ID as state for security
    const state = session.user.id
    const authUrl = ttlockClient.getAuthUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error starting TTLock auth:', error)
    return NextResponse.json({ error: 'Failed to start authorization' }, { status: 500 })
  }
}
