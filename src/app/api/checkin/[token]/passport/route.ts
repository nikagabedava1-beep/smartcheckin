import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import prisma from '@/lib/prisma'
import { createPassportUploadNotification } from '@/lib/notifications'

// POST /api/checkin/[token]/passport - Upload passport images
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    // Verify reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { checkInToken: token },
      include: {
        guest: true,
        apartment: {
          select: {
            name: true,
            ownerId: true,
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'passports', reservation.id)
    await mkdir(uploadDir, { recursive: true })

    const uploadedPaths: string[] = []

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        continue
      }

      // Generate unique filename
      const ext = file.name.split('.').pop()
      const filename = `${uuidv4()}.${ext}`
      const filepath = path.join(uploadDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      // Store relative path
      uploadedPaths.push(`/uploads/passports/${reservation.id}/${filename}`)
    }

    if (uploadedPaths.length === 0) {
      return NextResponse.json({ error: 'No valid files uploaded' }, { status: 400 })
    }

    // Create or update guest record
    if (reservation.guest) {
      await prisma.guest.update({
        where: { reservationId: reservation.id },
        data: {
          passportImages: [...reservation.guest.passportImages, ...uploadedPaths],
          passportStatus: 'pending', // Reset status when new images uploaded
        },
      })
    } else {
      await prisma.guest.create({
        data: {
          reservationId: reservation.id,
          passportImages: uploadedPaths,
          passportStatus: 'pending',
        },
      })
    }

    // Create notification for owner
    await createPassportUploadNotification(
      reservation.apartment.ownerId,
      reservation.id,
      reservation.guestName,
      reservation.apartment.name
    )

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedPaths.length,
      paths: uploadedPaths,
    })
  } catch (error) {
    console.error('Error uploading passport:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
