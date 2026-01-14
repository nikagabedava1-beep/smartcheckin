import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// DELETE /api/reservations/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify reservation belongs to owner
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        apartment: {
          ownerId: session.user.id,
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Delete related records first (cascade should handle this but being explicit)
    await prisma.accessCode.deleteMany({ where: { reservationId: id } })
    await prisma.deposit.deleteMany({ where: { reservationId: id } })
    await prisma.guest.deleteMany({ where: { reservationId: id } })

    // Delete the reservation
    await prisma.reservation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
