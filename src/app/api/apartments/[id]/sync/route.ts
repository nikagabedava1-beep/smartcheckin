import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { icalParser } from '@/lib/ical'

// POST /api/apartments/[id]/sync - Sync iCal calendar
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && apartment.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!apartment.icalUrl) {
      return NextResponse.json({ error: 'No iCal URL configured' }, { status: 400 })
    }

    // Fetch and parse iCal
    const calendar = await icalParser.fetchAndParse(apartment.icalUrl)
    const activeEvents = icalParser.filterActiveEvents(calendar.events)

    let createdCount = 0
    let updatedCount = 0

    // Process each event
    for (const event of activeEvents) {
      // Check if event already exists
      const existing = await prisma.iCalEvent.findUnique({
        where: {
          apartmentId_uid: {
            apartmentId: apartment.id,
            uid: event.uid,
          },
        },
      })

      if (existing) {
        // Update existing event
        await prisma.iCalEvent.update({
          where: { id: existing.id },
          data: {
            summary: event.summary,
            startDate: event.startDate,
            endDate: event.endDate,
          },
        })
        updatedCount++
      } else {
        // Create new event
        await prisma.iCalEvent.create({
          data: {
            apartmentId: apartment.id,
            uid: event.uid,
            summary: event.summary,
            startDate: event.startDate,
            endDate: event.endDate,
          },
        })
        createdCount++

        // Extract guest info and create reservation
        const guestInfo = icalParser.extractGuestInfo(event)

        // Check if reservation already exists for this period
        const existingReservation = await prisma.reservation.findFirst({
          where: {
            apartmentId: apartment.id,
            checkIn: event.startDate,
            checkOut: event.endDate,
          },
        })

        if (!existingReservation && guestInfo.name !== 'Guest') {
          await prisma.reservation.create({
            data: {
              apartmentId: apartment.id,
              guestName: guestInfo.name,
              guestPhone: guestInfo.phone || '',
              checkIn: event.startDate,
              checkOut: event.endDate,
              source: event.source,
              externalId: event.uid,
              status: 'pending',
            },
          })
        }
      }
    }

    // Update last sync time
    await prisma.apartment.update({
      where: { id: apartment.id },
      data: { lastIcalSync: new Date() },
    })

    return NextResponse.json({
      success: true,
      eventsCount: activeEvents.length,
      created: createdCount,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('Error syncing iCal:', error)
    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 })
  }
}
