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

    // Check if any calendar URL is configured
    if (!apartment.airbnbIcalUrl && !apartment.bookingIcalUrl && !apartment.icalUrl) {
      return NextResponse.json({ error: 'No calendar URL configured' }, { status: 400 })
    }

    let totalCreated = 0
    let totalUpdated = 0
    let totalEvents = 0

    // Helper function to sync a single calendar
    const syncCalendar = async (url: string, source: string) => {
      const calendar = await icalParser.fetchAndParse(url)
      const activeEvents = icalParser.filterActiveEvents(calendar.events)
      let created = 0
      let updated = 0

      for (const event of activeEvents) {
        const existing = await prisma.iCalEvent.findUnique({
          where: {
            apartmentId_uid: {
              apartmentId: apartment.id,
              uid: event.uid,
            },
          },
        })

        if (existing) {
          await prisma.iCalEvent.update({
            where: { id: existing.id },
            data: {
              summary: event.summary,
              startDate: event.startDate,
              endDate: event.endDate,
            },
          })
          updated++
        } else {
          await prisma.iCalEvent.create({
            data: {
              apartmentId: apartment.id,
              uid: event.uid,
              summary: event.summary,
              startDate: event.startDate,
              endDate: event.endDate,
            },
          })
          created++

          const guestInfo = icalParser.extractGuestInfo(event)

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
                source: source,
                externalId: event.uid,
                status: 'pending',
              },
            })
          }
        }
      }

      return { created, updated, count: activeEvents.length }
    }

    const updateData: Record<string, Date> = {}

    // Sync Airbnb calendar
    if (apartment.airbnbIcalUrl) {
      try {
        const result = await syncCalendar(apartment.airbnbIcalUrl, 'airbnb')
        totalCreated += result.created
        totalUpdated += result.updated
        totalEvents += result.count
        updateData.lastAirbnbSync = new Date()
      } catch (error) {
        console.error('Error syncing Airbnb calendar:', error)
      }
    }

    // Sync Booking.com calendar
    if (apartment.bookingIcalUrl) {
      try {
        const result = await syncCalendar(apartment.bookingIcalUrl, 'booking')
        totalCreated += result.created
        totalUpdated += result.updated
        totalEvents += result.count
        updateData.lastBookingSync = new Date()
      } catch (error) {
        console.error('Error syncing Booking.com calendar:', error)
      }
    }

    // Sync legacy iCal URL if exists
    if (apartment.icalUrl) {
      try {
        const result = await syncCalendar(apartment.icalUrl, 'ical')
        totalCreated += result.created
        totalUpdated += result.updated
        totalEvents += result.count
        updateData.lastIcalSync = new Date()
      } catch (error) {
        console.error('Error syncing iCal:', error)
      }
    }

    // Update last sync times
    if (Object.keys(updateData).length > 0) {
      await prisma.apartment.update({
        where: { id: apartment.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      success: true,
      eventsCount: totalEvents,
      created: totalCreated,
      updated: totalUpdated,
    })
  } catch (error) {
    console.error('Error syncing iCal:', error)
    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 })
  }
}
