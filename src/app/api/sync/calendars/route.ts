import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { icalParser } from '@/lib/ical'

// POST /api/sync/calendars - Auto sync all calendars (called by cron)
export async function POST(request: Request) {
  try {
    // Verify sync secret key
    const authHeader = request.headers.get('authorization')
    const syncSecret = process.env.SYNC_SECRET_KEY

    if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all apartments with calendar URLs
    const apartments = await prisma.apartment.findMany({
      where: {
        isActive: true,
        OR: [
          { airbnbIcalUrl: { not: null } },
          { bookingIcalUrl: { not: null } },
          { icalUrl: { not: null } },
        ],
      },
    })

    console.log(`[Calendar Sync] Starting sync for ${apartments.length} apartments`)

    const results: Array<{
      apartmentId: string
      apartmentName: string
      success: boolean
      events: number
      error?: string
    }> = []

    for (const apartment of apartments) {
      let totalEvents = 0
      const updateData: Record<string, Date> = {}

      try {
        // Sync Airbnb calendar
        if (apartment.airbnbIcalUrl) {
          try {
            const result = await syncCalendar(apartment.id, apartment.airbnbIcalUrl, 'airbnb')
            totalEvents += result.count
            updateData.lastAirbnbSync = new Date()
          } catch (error) {
            console.error(`[Calendar Sync] Airbnb sync failed for ${apartment.name}:`, error)
          }
        }

        // Sync Booking.com calendar
        if (apartment.bookingIcalUrl) {
          try {
            const result = await syncCalendar(apartment.id, apartment.bookingIcalUrl, 'booking')
            totalEvents += result.count
            updateData.lastBookingSync = new Date()
          } catch (error) {
            console.error(`[Calendar Sync] Booking sync failed for ${apartment.name}:`, error)
          }
        }

        // Sync legacy iCal
        if (apartment.icalUrl) {
          try {
            const result = await syncCalendar(apartment.id, apartment.icalUrl, 'ical')
            totalEvents += result.count
            updateData.lastIcalSync = new Date()
          } catch (error) {
            console.error(`[Calendar Sync] iCal sync failed for ${apartment.name}:`, error)
          }
        }

        // Update last sync times
        if (Object.keys(updateData).length > 0) {
          await prisma.apartment.update({
            where: { id: apartment.id },
            data: updateData,
          })
        }

        results.push({
          apartmentId: apartment.id,
          apartmentName: apartment.name,
          success: true,
          events: totalEvents,
        })

        console.log(`[Calendar Sync] Synced ${apartment.name}: ${totalEvents} events`)
      } catch (error) {
        results.push({
          apartmentId: apartment.id,
          apartmentName: apartment.name,
          success: false,
          events: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalEventsCount = results.reduce((acc, r) => acc + r.events, 0)

    console.log(`[Calendar Sync] Completed: ${successCount}/${apartments.length} successful, ${totalEventsCount} total events`)

    return NextResponse.json({
      success: true,
      synced: successCount,
      total: apartments.length,
      totalEvents: totalEventsCount,
      results,
    })
  } catch (error) {
    console.error('[Calendar Sync] Error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

// Helper function to sync a single calendar
async function syncCalendar(apartmentId: string, url: string, source: string) {
  const calendar = await icalParser.fetchAndParse(url)
  const activeEvents = icalParser.filterActiveEvents(calendar.events)
  let created = 0

  for (const event of activeEvents) {
    const existing = await prisma.iCalEvent.findUnique({
      where: {
        apartmentId_uid: {
          apartmentId: apartmentId,
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
    } else {
      await prisma.iCalEvent.create({
        data: {
          apartmentId: apartmentId,
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
          apartmentId: apartmentId,
          checkIn: event.startDate,
          checkOut: event.endDate,
        },
      })

      if (!existingReservation && guestInfo.name !== 'Guest') {
        await prisma.reservation.create({
          data: {
            apartmentId: apartmentId,
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

  return { created, count: activeEvents.length }
}

// GET endpoint to check sync status (for monitoring)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const syncSecret = process.env.SYNC_SECRET_KEY

  if (!syncSecret || authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      isActive: true,
      OR: [
        { airbnbIcalUrl: { not: null } },
        { bookingIcalUrl: { not: null } },
        { icalUrl: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      airbnbIcalUrl: true,
      lastAirbnbSync: true,
      bookingIcalUrl: true,
      lastBookingSync: true,
      icalUrl: true,
      lastIcalSync: true,
    },
  })

  return NextResponse.json({
    apartmentsWithCalendar: apartments.length,
    apartments,
  })
}
