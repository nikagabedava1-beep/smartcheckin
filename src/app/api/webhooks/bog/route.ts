import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { bogIPayClient } from '@/lib/bog-ipay'
import { createDepositPaidNotification } from '@/lib/notifications'

// POST /api/webhooks/bog - Handle BOG iPay payment callbacks
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}

    params.forEach((value, key) => {
      data[key] = value
    })

    console.log('BOG webhook received:', JSON.stringify(data, null, 2))

    // Process the callback
    const paymentStatus = bogIPayClient.processCallback(data)

    // Find the deposit by order ID (format: DEP-{reservationId})
    const orderId = paymentStatus.orderId
    if (!orderId.startsWith('DEP-')) {
      console.error('Invalid order ID format:', orderId)
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const reservationId = orderId.replace('DEP-', '')

    // Find the deposit
    const deposit = await prisma.deposit.findFirst({
      where: {
        reservationId,
        transactionId: paymentStatus.transactionId,
      },
      include: {
        reservation: {
          include: {
            apartment: {
              select: {
                name: true,
                ownerId: true,
              },
            },
          },
        },
      },
    })

    if (!deposit) {
      console.error('Deposit not found for transaction:', paymentStatus.transactionId)
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    }

    // Update deposit based on payment status
    if (paymentStatus.status === 'success') {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      })

      // Create notification for owner
      await createDepositPaidNotification(
        deposit.reservation.apartment.ownerId,
        deposit.reservationId,
        deposit.reservation.guestName,
        deposit.reservation.apartment.name,
        parseFloat(deposit.amount.toString())
      )

      console.log('Deposit marked as paid:', deposit.id)
    } else if (paymentStatus.status === 'failed') {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'pending', // Reset to pending so guest can try again
        },
      })
      console.log('Payment failed for deposit:', deposit.id)
    } else if (paymentStatus.status === 'refunded') {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'refunded',
        },
      })
      console.log('Deposit refunded:', deposit.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('BOG webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// GET handler for callback redirect from BOG (user returns after payment)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get('transaction_id')
  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')

  console.log('BOG callback redirect:', { transactionId, status, orderId })

  if (!orderId || !orderId.startsWith('DEP-')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const reservationId = orderId.replace('DEP-', '')

  // Find the reservation to get the check-in token
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { checkInToken: true },
  })

  if (!reservation?.checkInToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect to verification page if payment was successful
  if (status === 'success') {
    return NextResponse.redirect(
      new URL(`/checkin/${reservation.checkInToken}/verify`, request.url)
    )
  }

  // Redirect back to deposit page if payment failed
  return NextResponse.redirect(
    new URL(`/checkin/${reservation.checkInToken}/deposit?error=payment_failed`, request.url)
  )
}
