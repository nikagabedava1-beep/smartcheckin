import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/ttlock/status - Check if TTLock is connected
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ttlockToken = await prisma.tTLockToken.findUnique({
      where: { ownerId: session.user.id },
    })

    if (!ttlockToken) {
      return NextResponse.json({ connected: false })
    }

    const isExpired = new Date() >= ttlockToken.expiresAt

    return NextResponse.json({
      connected: true,
      isExpired,
      expiresAt: ttlockToken.expiresAt,
    })
  } catch (error) {
    console.error('Error checking TTLock status:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}

// DELETE /api/ttlock/status - Disconnect TTLock
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.tTLockToken.delete({
      where: { ownerId: session.user.id },
    }).catch(() => {
      // Ignore if not found
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting TTLock:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
