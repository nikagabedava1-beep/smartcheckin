import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/reservations
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where =
      session.user.role === 'admin'
        ? {}
        : {
            apartment: {
              ownerId: session.user.id,
            },
          }

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { checkIn: 'desc' },
      include: {
        apartment: {
          select: { id: true, name: true },
        },
        guest: {
          select: { consentGiven: true, checkedInAt: true },
        },
        deposit: {
          select: { status: true, amount: true },
        },
      },
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reservations
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apartmentId, guestName, guestEmail, guestPhone, checkIn, checkOut, notes, depositRequired, depositAmount } = body

    if (!apartmentId || !guestName || !guestPhone || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate deposit settings
    if (depositRequired && (!depositAmount || parseFloat(depositAmount) <= 0)) {
      return NextResponse.json({ error: 'Deposit amount is required when deposit is enabled' }, { status: 400 })
    }

    // Verify apartment belongs to owner
    const apartment = await prisma.apartment.findFirst({
      where: {
        id: apartmentId,
        ownerId: session.user.id,
      },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Check for overlapping reservations (excluding cancelled ones)
    const overlappingReservation = await prisma.reservation.findFirst({
      where: {
        apartmentId,
        status: { not: 'cancelled' },
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
      },
    })

    if (overlappingReservation) {
      return NextResponse.json({
        error: 'Dates are already booked',
        conflict: {
          guestName: overlappingReservation.guestName,
          checkIn: overlappingReservation.checkIn,
          checkOut: overlappingReservation.checkOut,
        },
      }, { status: 409 })
    }

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
        summary: true,
        startDate: true,
        endDate: true,
      },
    })

    if (overlappingICalEvent) {
      return NextResponse.json({
        error: 'Dates are blocked by external booking',
        conflict: {
          summary: overlappingICalEvent.summary,
          startDate: overlappingICalEvent.startDate,
          endDate: overlappingICalEvent.endDate,
        },
      }, { status: 409 })
    }

    // Create reservation with per-reservation deposit settings
    const reservation = await prisma.reservation.create({
      data: {
        apartmentId,
        guestName,
        guestEmail: guestEmail || null,
        guestPhone,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        source: 'manual',
        status: 'pending',
        notes: notes || null,
        depositRequired: depositRequired || false,
        depositAmount: depositRequired ? parseFloat(depositAmount) : null,
      },
      include: {
        apartment: true,
      },
    })

    // Create deposit record if deposit is required
    if (depositRequired && depositAmount) {
      await prisma.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: parseFloat(depositAmount),
          currency: 'GEL',
          status: 'pending',
        },
      })
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
