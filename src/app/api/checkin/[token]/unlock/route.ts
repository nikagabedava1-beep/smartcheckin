import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ttlockClient } from '@/lib/ttlock'

// POST /api/checkin/[token]/unlock - Unlock the smart lock
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { checkInToken: token },
      include: {
        accessCode: true,
        apartment: {
          include: {
            owner: true,
            smartLock: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check if reservation is checked in
    if (reservation.status !== 'checked_in') {
      return NextResponse.json({ error: 'Check-in not completed' }, { status: 400 })
    }

    // Check if access code exists and is valid
    if (!reservation.accessCode) {
      return NextResponse.json({ error: 'No access code found' }, { status: 400 })
    }

    const now = new Date()
    const validFrom = new Date(reservation.accessCode.validFrom)
    const validUntil = new Date(reservation.accessCode.validUntil)

    if (now < validFrom || now > validUntil) {
      return NextResponse.json({ error: 'Access code not valid at this time' }, { status: 400 })
    }

    // Try to unlock via TTLock if configured
    let ttlockUnlocked = false

    if (reservation.apartment.smartLock && ttlockClient.isConfigured()) {
      try {
        const ttlockToken = await prisma.tTLockToken.findUnique({
          where: { ownerId: reservation.apartment.owner.id },
        })

        if (ttlockToken) {
          await ttlockClient.unlock(
            ttlockToken.accessToken,
            parseInt(reservation.apartment.smartLock.ttlockId)
          )
          ttlockUnlocked = true
        }
      } catch (error) {
        console.error('TTLock unlock error:', error)
        // Continue anyway - return success for demo purposes
      }
    }

    // Log the unlock attempt
    console.log(`Door unlock requested for reservation ${reservation.id} at ${now.toISOString()}`)

    return NextResponse.json({
      success: true,
      ttlockUnlocked,
      message: ttlockUnlocked ? 'Door unlocked via smart lock' : 'Unlock command sent (demo mode)',
    })
  } catch (error) {
    console.error('Error unlocking door:', error)
    return NextResponse.json({ error: 'Failed to unlock door' }, { status: 500 })
  }
}
