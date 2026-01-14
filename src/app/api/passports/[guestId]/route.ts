import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/passports/[guestId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { guestId } = await params

    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        reservation: {
          apartment: {
            ownerId: session.user.id,
          },
        },
      },
      include: {
        reservation: {
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            guestPhone: true,
            checkIn: true,
            checkOut: true,
            status: true,
            apartment: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Error fetching guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/passports/[guestId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { guestId } = await params
    const body = await request.json()
    const { action, rejectionReason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Verify guest belongs to owner's reservation
    const guest = await prisma.guest.findFirst({
      where: {
        id: guestId,
        reservation: {
          apartment: {
            ownerId: session.user.id,
          },
        },
      },
      include: {
        reservation: {
          select: {
            guestName: true,
            guestPhone: true,
          },
        },
      },
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Update passport status
    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: {
        passportStatus: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating passport status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
