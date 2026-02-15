import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ttlockClient } from '@/lib/ttlock'

// POST /api/apartments/[id]/lock - Assign a TTLock to an apartment
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { lockId, lockName } = await request.json()

    // Verify apartment belongs to owner
    const apartment = await prisma.apartment.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    // Verify TTLock is connected
    const ttlockToken = await prisma.tTLockToken.findUnique({
      where: { ownerId: session.user.id },
    })

    if (!ttlockToken) {
      return NextResponse.json({ error: 'TTLock not connected' }, { status: 400 })
    }

    // Verify the lock exists and belongs to this account
    try {
      const locks = await ttlockClient.getLocks(ttlockToken.accessToken)
      const lock = locks.find((l) => l.lockId === lockId)

      if (!lock) {
        return NextResponse.json({ error: 'Lock not found in your TTLock account' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Failed to verify lock' }, { status: 500 })
    }

    // Create or update smart lock assignment
    const smartLock = await prisma.smartLock.upsert({
      where: { apartmentId: apartment.id },
      update: {
        ttlockId: String(lockId),
        ttlockName: lockName,
      },
      create: {
        apartmentId: apartment.id,
        ttlockId: String(lockId),
        ttlockName: lockName,
      },
    })

    return NextResponse.json({ smartLock })
  } catch (error) {
    console.error('Error assigning lock:', error)
    return NextResponse.json({ error: 'Failed to assign lock' }, { status: 500 })
  }
}

// DELETE /api/apartments/[id]/lock - Remove lock from apartment
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify apartment belongs to owner
    const apartment = await prisma.apartment.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
      include: { smartLock: true },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    if (!apartment.smartLock) {
      return NextResponse.json({ error: 'No lock assigned' }, { status: 400 })
    }

    await prisma.smartLock.delete({
      where: { apartmentId: apartment.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing lock:', error)
    return NextResponse.json({ error: 'Failed to remove lock' }, { status: 500 })
  }
}
