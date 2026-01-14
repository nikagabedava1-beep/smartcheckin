import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/reservations/check-availability?apartmentId=xxx&checkIn=xxx&checkOut=xxx
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const apartmentId = searchParams.get('apartmentId')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const excludeReservationId = searchParams.get('excludeReservationId')

    if (!apartmentId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Check for overlapping reservations (excluding cancelled ones)
    const overlappingReservation = await prisma.reservation.findFirst({
      where: {
        apartmentId,
        status: { not: 'cancelled' },
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        AND: [
          { checkIn: { lt: checkOutDate } },
          { checkOut: { gt: checkInDate } },
        ],
      },
      select: {
        id: true,
        guestName: true,
        checkIn: true,
        checkOut: true,
        source: true,
      },
    })

    // Check for overlapping iCal events (from Airbnb/Booking.com sync)
    const overlappingICalEvent = await prisma.iCalEvent.findFirst({
      where: {
        apartmentId,
        AND: [
          { startDate: { lt: checkOutDate } },
          { endDate: { gt: checkInDate } },
        ],
      },
      select: {
        id: true,
        summary: true,
        startDate: true,
        endDate: true,
      },
    })

    if (overlappingReservation || overlappingICalEvent) {
      return NextResponse.json({
        available: false,
        conflict: overlappingReservation
          ? {
              type: 'reservation',
              guestName: overlappingReservation.guestName,
              checkIn: overlappingReservation.checkIn,
              checkOut: overlappingReservation.checkOut,
              source: overlappingReservation.source,
            }
          : {
              type: 'ical',
              summary: overlappingICalEvent!.summary,
              startDate: overlappingICalEvent!.startDate,
              endDate: overlappingICalEvent!.endDate,
            },
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
