import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/passports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending | approved | rejected | all

    // Get all guests with passports for owner's reservations
    const guests = await prisma.guest.findMany({
      where: {
        reservation: {
          apartment: {
            ownerId: session.user.id,
          },
        },
        passportImages: { isEmpty: false },
        ...(status && status !== 'all' ? { passportStatus: status } : {}),
      },
      include: {
        reservation: {
          select: {
            id: true,
            guestName: true,
            guestPhone: true,
            checkIn: true,
            checkOut: true,
            status: true,
            apartment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(guests)
  } catch (error) {
    console.error('Error fetching passports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
