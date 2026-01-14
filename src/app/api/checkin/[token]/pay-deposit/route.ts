import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { bogIPayClient } from '@/lib/bog-ipay'
import { createDepositPaidNotification } from '@/lib/notifications'

// POST /api/checkin/[token]/pay-deposit - Initiate deposit payment
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await request.json().catch(() => ({}))

    const reservation = await prisma.reservation.findUnique({
      where: { checkInToken: token },
      include: {
        deposit: true,
        apartment: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Check if deposit is required for this reservation
    if (!reservation.depositRequired) {
      return NextResponse.json({ error: 'Deposit not required' }, { status: 400 })
    }

    // Create deposit record if doesn't exist
    let deposit = reservation.deposit

    if (!deposit && reservation.depositAmount) {
      deposit = await prisma.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: reservation.depositAmount,
          currency: 'GEL',
          status: 'pending',
        },
      })
    }

    if (!deposit) {
      return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
    }

    if (deposit.status === 'paid') {
      return NextResponse.json({ error: 'Deposit already paid' }, { status: 400 })
    }

    // Check if BOG iPay is configured
    if (bogIPayClient.isConfigured()) {
      try {
        const payment = await bogIPayClient.createPayment({
          orderId: `DEP-${reservation.id}`,
          amount: parseFloat(deposit.amount.toString()),
          currency: deposit.currency,
          description: `Deposit for ${reservation.apartment.name}`,
          language: 'ka',
        })

        // Update deposit with transaction ID
        await prisma.deposit.update({
          where: { id: deposit.id },
          data: { transactionId: payment.transactionId },
        })

        return NextResponse.json({
          success: true,
          paymentUrl: payment.paymentUrl,
          transactionId: payment.transactionId,
        })
      } catch (error) {
        console.error('Payment initiation error:', error)
        return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
      }
    } else {
      // Mock payment for development
      console.log('BOG iPay not configured, using mock payment')

      const cardLast4 = body.cardLast4 || '****'

      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          transactionId: `MOCK-${Date.now()}-${cardLast4}`,
        },
      })

      // Create notification for owner
      await createDepositPaidNotification(
        reservation.apartment.ownerId,
        reservation.id,
        reservation.guestName,
        reservation.apartment.name,
        parseFloat(deposit.amount.toString())
      )

      return NextResponse.json({
        success: true,
        mock: true,
        message: 'Payment completed successfully',
      })
    }
  } catch (error) {
    console.error('Error processing deposit:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
