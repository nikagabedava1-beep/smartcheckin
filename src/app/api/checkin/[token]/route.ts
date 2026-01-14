import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/checkin/[token] - Get reservation details for check-in
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const reservation = await prisma.reservation.findUnique({
      where: { checkInToken: token },
      include: {
        apartment: {
          select: {
            name: true,
            address: true,
          },
        },
        guest: {
          select: {
            passportImages: true,
            passportStatus: true,
            rejectionReason: true,
            consentGiven: true,
            checkedInAt: true,
          },
        },
        deposit: {
          select: {
            amount: true,
            status: true,
          },
        },
        accessCode: {
          select: {
            code: true,
            validFrom: true,
            validUntil: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check if reservation is still valid
    const now = new Date()
    const checkOutDate = new Date(reservation.checkOut)

    if (now > checkOutDate) {
      return NextResponse.json({ error: 'Reservation has expired' }, { status: 410 })
    }

    // Check if reservation is cancelled
    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Reservation is cancelled' }, { status: 410 })
    }

    return NextResponse.json({
      id: reservation.id,
      guestName: reservation.guestName,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      status: reservation.status,
      apartment: {
        name: reservation.apartment.name,
        address: reservation.apartment.address,
      },
      guest: reservation.guest,
      deposit: reservation.deposit,
      accessCode: reservation.accessCode,
      depositRequired: reservation.depositRequired,
      depositAmount: reservation.depositAmount ? reservation.depositAmount.toString() : null,
    })
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
