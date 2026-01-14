import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/owners/[id] - Get single owner
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        apartments: true,
        _count: {
          select: { apartments: true },
        },
      },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error fetching owner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/owners/[id] - Update owner
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, password, depositEnabled, depositAmount, isActive } = body

    // Check if owner exists
    const existingOwner = await prisma.owner.findUnique({
      where: { id },
    })

    if (!existingOwner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Check if email is taken by another owner
    if (email && email !== existingOwner.email) {
      const emailTaken = await prisma.owner.findUnique({
        where: { email },
      })
      if (emailTaken) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name,
      email,
      phone,
      depositEnabled,
      depositAmount,
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const owner = await prisma.owner.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { apartments: true },
        },
      },
    })

    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error updating owner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/owners/[id] - Delete owner
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if owner exists
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        _count: {
          select: { apartments: true },
        },
      },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Delete owner (cascades to apartments, reservations, etc.)
    await prisma.owner.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting owner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
