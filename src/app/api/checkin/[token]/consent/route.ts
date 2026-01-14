import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/checkin/[token]/consent - Accept consent
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const reservation = await prisma.reservation.findUnique({
      where: { checkInToken: token },
      include: { guest: true },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (!reservation.guest) {
      return NextResponse.json({ error: 'Please upload passport first' }, { status: 400 })
    }

    if (reservation.guest.passportImages.length === 0) {
      return NextResponse.json({ error: 'Please upload passport first' }, { status: 400 })
    }

    // Update guest with consent
    await prisma.guest.update({
      where: { reservationId: reservation.id },
      data: {
        consentGiven: true,
        consentDate: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving consent:', error)
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 })
  }
}
