import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ttlockClient } from '@/lib/ttlock'
import { generateAccessCode } from '@/lib/utils'

// POST /api/checkin/[token]/complete - Complete check-in and generate access code
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const reservation = await prisma.reservation.findUnique({
      where: { checkInToken: token },
      include: {
        guest: true,
        deposit: true,
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

    // Verify guest has uploaded passport
    if (!reservation.guest?.passportImages || reservation.guest.passportImages.length === 0) {
      return NextResponse.json({ error: 'Please upload passport first' }, { status: 400 })
    }

    // Check passport approval status
    if (reservation.guest.passportStatus === 'pending') {
      return NextResponse.json({
        error: 'Passport is pending approval',
        code: 'PASSPORT_PENDING',
      }, { status: 400 })
    }

    if (reservation.guest.passportStatus === 'rejected') {
      return NextResponse.json({
        error: 'Passport was rejected. Please re-upload.',
        code: 'PASSPORT_REJECTED',
        rejectionReason: reservation.guest.rejectionReason,
      }, { status: 400 })
    }

    // Check if access code already exists
    if (reservation.accessCode) {
      return NextResponse.json({
        success: true,
        accessCode: reservation.accessCode,
      })
    }

    // Generate access code
    const code = generateAccessCode()
    const validFrom = new Date(reservation.checkIn)
    const validUntil = new Date(reservation.checkOut)

    // Try to create TTLock passcode if configured
    let ttlockCreated = false

    if (reservation.apartment.smartLock && ttlockClient.isConfigured()) {
      try {
        // Get owner's TTLock token
        const ttlockToken = await prisma.tTLockToken.findUnique({
          where: { ownerId: reservation.apartment.owner.id },
        })

        if (ttlockToken) {
          await ttlockClient.createPasscode(
            ttlockToken.accessToken,
            parseInt(reservation.apartment.smartLock.ttlockId),
            code,
            validFrom,
            validUntil,
            `Guest: ${reservation.guestName}`
          )
          ttlockCreated = true
        }
      } catch (error) {
        console.error('Failed to create TTLock passcode:', error)
        // Continue anyway, code can still be used manually
      }
    }

    // Save access code to database
    const accessCode = await prisma.accessCode.create({
      data: {
        reservationId: reservation.id,
        lockId: reservation.apartment.smartLock?.id || 'manual',
        code,
        validFrom,
        validUntil,
        isActive: true,
      },
    })

    // Update guest check-in time
    await prisma.guest.update({
      where: { reservationId: reservation.id },
      data: { checkedInAt: new Date() },
    })

    // Update reservation status
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'checked_in' },
    })

    return NextResponse.json({
      success: true,
      accessCode: {
        code: accessCode.code,
        validFrom: accessCode.validFrom,
        validUntil: accessCode.validUntil,
      },
      ttlockCreated,
    })
  } catch (error) {
    console.error('Error completing check-in:', error)
    return NextResponse.json({ error: 'Failed to complete check-in' }, { status: 500 })
  }
}
