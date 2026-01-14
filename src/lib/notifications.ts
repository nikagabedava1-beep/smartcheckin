import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type NotificationType = 'passport_upload' | 'deposit_paid'

interface CreateNotificationParams {
  ownerId: string
  type: NotificationType
  title: string
  message: string
  data?: Prisma.InputJsonValue
}

export async function createNotification({
  ownerId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        ownerId,
        type,
        title,
        message,
        data: data,
      },
    })
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

export async function createPassportUploadNotification(
  ownerId: string,
  reservationId: string,
  guestName: string,
  apartmentName: string
) {
  return createNotification({
    ownerId,
    type: 'passport_upload',
    title: 'New Passport Uploaded',
    message: `${guestName} uploaded passport for ${apartmentName}`,
    data: {
      reservationId,
      guestName,
      apartmentName,
    },
  })
}

export async function createDepositPaidNotification(
  ownerId: string,
  reservationId: string,
  guestName: string,
  apartmentName: string,
  amount: number
) {
  return createNotification({
    ownerId,
    type: 'deposit_paid',
    title: 'Deposit Payment Received',
    message: `${guestName} paid ${amount} GEL deposit for ${apartmentName}`,
    data: {
      reservationId,
      guestName,
      apartmentName,
      amount,
    },
  })
}
