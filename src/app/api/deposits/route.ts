import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/deposits
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending | paid | refunded | all

    // Get all deposits for owner's reservations
    const deposits = await prisma.deposit.findMany({
      where: {
        reservation: {
          apartment: {
            ownerId: session.user.id,
          },
        },
        ...(status && status !== 'all' ? { status } : {}),
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

    return NextResponse.json(deposits)
  } catch (error) {
    console.error('Error fetching deposits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
