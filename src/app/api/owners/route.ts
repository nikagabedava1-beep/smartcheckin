import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET /api/owners - List all owners
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const owners = await prisma.owner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { apartments: true },
        },
      },
    })

    return NextResponse.json(owners)
  } catch (error) {
    console.error('Error fetching owners:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/owners - Create a new owner
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, password, depositEnabled, depositAmount } = body

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const existingOwner = await prisma.owner.findUnique({
      where: { email },
    })

    if (existingOwner) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create owner
    const owner = await prisma.owner.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        depositEnabled: depositEnabled || false,
        depositAmount: depositAmount || null,
      },
      include: {
        _count: {
          select: { apartments: true },
        },
      },
    })

    return NextResponse.json(owner, { status: 201 })
  } catch (error) {
    console.error('Error creating owner:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
