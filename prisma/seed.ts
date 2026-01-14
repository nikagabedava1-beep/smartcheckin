import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@smartcheckin.ge' },
    update: {},
    create: {
      email: 'admin@smartcheckin.ge',
      password: adminPassword,
      name: 'System Admin',
    },
  })
  console.log('Created admin:', admin.email)

  // Create demo owner
  const ownerPassword = await bcrypt.hash('owner123', 12)
  const owner = await prisma.owner.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: ownerPassword,
      name: 'Demo Owner',
      phone: '+995555123456',
      depositEnabled: true,
      depositAmount: 200,
    },
  })
  console.log('Created owner:', owner.email)

  // Create demo apartment
  const apartment = await prisma.apartment.upsert({
    where: { id: 'demo-apartment-1' },
    update: {},
    create: {
      id: 'demo-apartment-1',
      ownerId: owner.id,
      name: 'Cozy Studio in Tbilisi Center',
      address: 'Rustaveli Ave 42, Tbilisi',
      description: 'Beautiful studio apartment in the heart of Tbilisi',
    },
  })
  console.log('Created apartment:', apartment.name)

  // Create demo reservation
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0)

  const checkOut = new Date(tomorrow)
  checkOut.setDate(checkOut.getDate() + 3)
  checkOut.setHours(11, 0, 0, 0)

  // Create demo reservation without deposit
  const reservation = await prisma.reservation.upsert({
    where: { id: 'demo-reservation-1' },
    update: {},
    create: {
      id: 'demo-reservation-1',
      apartmentId: apartment.id,
      guestName: 'John Smith',
      guestEmail: 'john@example.com',
      guestPhone: '+1234567890',
      checkIn: tomorrow,
      checkOut: checkOut,
      source: 'manual',
      checkInToken: 'demo-checkin-token',
      status: 'pending',
      depositRequired: false,
    },
  })
  console.log('Created reservation for:', reservation.guestName, '(no deposit)')

  // Create demo reservation with deposit
  const tomorrowDeposit = new Date()
  tomorrowDeposit.setDate(tomorrowDeposit.getDate() + 5)
  tomorrowDeposit.setHours(14, 0, 0, 0)

  const checkOutDeposit = new Date(tomorrowDeposit)
  checkOutDeposit.setDate(checkOutDeposit.getDate() + 4)
  checkOutDeposit.setHours(11, 0, 0, 0)

  const reservationWithDeposit = await prisma.reservation.upsert({
    where: { id: 'demo-reservation-2' },
    update: {},
    create: {
      id: 'demo-reservation-2',
      apartmentId: apartment.id,
      guestName: 'Jane Doe',
      guestEmail: 'jane@example.com',
      guestPhone: '+1987654321',
      checkIn: tomorrowDeposit,
      checkOut: checkOutDeposit,
      source: 'manual',
      checkInToken: 'demo-checkin-deposit',
      status: 'pending',
      depositRequired: true,
      depositAmount: 150,
    },
  })
  console.log('Created reservation for:', reservationWithDeposit.guestName, '(with 150 GEL deposit)')

  console.log('\n--- Demo Credentials ---')
  console.log('Admin: admin@smartcheckin.ge / admin123')
  console.log('Owner: owner@example.com / owner123')
  console.log('')
  console.log('Guest check-in (no deposit): /checkin/demo-checkin-token')
  console.log('Guest check-in (with deposit): /checkin/demo-checkin-deposit')
  console.log('------------------------\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
