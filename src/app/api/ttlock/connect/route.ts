import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ttlockClient } from '@/lib/ttlock'
import prisma from '@/lib/prisma'

// POST /api/ttlock/connect - Connect TTLock account with username/password
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ttlockClient.isConfigured()) {
      return NextResponse.json({ error: 'TTLock not configured' }, { status: 500 })
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    // Get tokens from TTLock
    const tokens = await ttlockClient.getToken(username, password)

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000)

    // Store tokens in database
    await prisma.tTLockToken.upsert({
      where: { ownerId: session.user.id },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        ownerId: session.user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error connecting TTLock:', error)
    const message = error instanceof Error ? error.message : 'Failed to connect'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
