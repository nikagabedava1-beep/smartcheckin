import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// POST /api/deposits/[depositId]/confirm
export async function POST(
  request: Request,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { depositId } = await params

    // Verify deposit belongs to owner's reservation
    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        reservation: {
          apartment: {
            ownerId: session.user.id,
          },
        },
      },
    })

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    }

    if (deposit.status !== 'paid') {
      return NextResponse.json({ error: 'Can only confirm paid deposits' }, { status: 400 })
    }

    // Confirm deposit
    const updated = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        ownerConfirmed: true,
        ownerConfirmedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error confirming deposit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
