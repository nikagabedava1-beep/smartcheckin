import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/apartments/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id },
      include: {
        owner: true,
        smartLock: true,
        reservations: {
          orderBy: { checkIn: 'desc' },
          take: 10,
        },
        _count: {
          select: { reservations: true },
        },
      },
    })

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    // Check ownership for non-admin users
    if (session.user.role !== 'admin' && apartment.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(apartment)
  } catch (error) {
    console.error('Error fetching apartment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/apartments/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingApartment = await prisma.apartment.findUnique({
      where: { id },
    })

    if (!existingApartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && existingApartment.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, description, icalUrl, airbnbIcalUrl, bookingIcalUrl, isActive } = body

    const apartment = await prisma.apartment.update({
      where: { id },
      data: {
        name,
        address,
        description,
        icalUrl: icalUrl || null,
        airbnbIcalUrl: airbnbIcalUrl || null,
        bookingIcalUrl: bookingIcalUrl || null,
        isActive,
      },
      include: {
        smartLock: true,
        _count: {
          select: { reservations: true },
        },
      },
    })

    return NextResponse.json(apartment)
  } catch (error) {
    console.error('Error updating apartment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/apartments/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingApartment = await prisma.apartment.findUnique({
      where: { id },
    })

    if (!existingApartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 })
    }

    if (session.user.role !== 'admin' && existingApartment.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.apartment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting apartment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
