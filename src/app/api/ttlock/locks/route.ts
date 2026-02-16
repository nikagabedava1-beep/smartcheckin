import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ttlockClient } from '@/lib/ttlock'
import prisma from '@/lib/prisma'

// GET /api/ttlock/locks - Get list of owner's locks from TTLock
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stored TTLock tokens
    const ttlockToken = await prisma.tTLockToken.findUnique({
      where: { ownerId: session.user.id },
    })

    if (!ttlockToken) {
      return NextResponse.json({ error: 'TTLock not connected' }, { status: 400 })
    }

    // Check if token is expired
    if (new Date() >= ttlockToken.expiresAt) {
      // Try to refresh the token
      try {
        const newTokens = await ttlockClient.refreshToken(ttlockToken.refreshToken)
        const expiresAt = new Date(Date.now() + newTokens.expiresIn * 1000)

        await prisma.tTLockToken.update({
          where: { ownerId: session.user.id },
          data: {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresAt,
          },
        })

        ttlockToken.accessToken = newTokens.accessToken
      } catch (refreshError) {
        console.error('Failed to refresh TTLock token:', refreshError)
        return NextResponse.json({ error: 'TTLock session expired, please reconnect' }, { status: 401 })
      }
    }

    // Fetch locks from TTLock API
    const locks = await ttlockClient.getLocks(ttlockToken.accessToken)

    return NextResponse.json({ locks })
  } catch (error) {
    console.error('Error fetching TTLock locks:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch locks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
