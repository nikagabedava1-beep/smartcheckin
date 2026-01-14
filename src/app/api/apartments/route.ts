import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/apartments - List apartments for owner or all for admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where = session.user.role === 'admin' ? {} : { ownerId: session.user.id }

    const apartments = await prisma.apartment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        smartLock: true,
        _count: {
          select: { reservations: true },
        },
      },
    })

    return NextResponse.json(apartments)
  } catch (error) {
    console.error('Error fetching apartments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/apartments - Create new apartment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, description, icalUrl, isActive } = body

    if (!name || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apartment = await prisma.apartment.create({
      data: {
        ownerId: session.user.id,
        name,
        address,
        description,
        icalUrl: icalUrl || null,
        isActive: isActive ?? true,
      },
      include: {
        smartLock: true,
        _count: {
          select: { reservations: true },
        },
      },
    })

    return NextResponse.json(apartment, { status: 201 })
  } catch (error) {
    console.error('Error creating apartment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
