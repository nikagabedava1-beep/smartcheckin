import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BilingualText } from '@/components/ui/bilingual-text'
import { StatusBadge, SourceBadge } from '@/components/ui/badge'
import { t } from '@/lib/translations'
import { Building2, CalendarDays, Users, Clock } from 'lucide-react'
import Link from 'next/link'

async function getOwnerStats(ownerId: string) {
  const [apartmentsCount, reservationsCount, todayCheckins, pendingCheckins] = await Promise.all([
    prisma.apartment.count({ where: { ownerId, isActive: true } }),
    prisma.reservation.count({
      where: { apartment: { ownerId } },
    }),
    prisma.reservation.count({
      where: {
        apartment: { ownerId },
        checkIn: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.reservation.count({
      where: {
        apartment: { ownerId },
        status: 'pending',
      },
    }),
  ])

  return { apartmentsCount, reservationsCount, todayCheckins, pendingCheckins }
}

async function getUpcomingReservations(ownerId: string) {
  return prisma.reservation.findMany({
    where: {
      apartment: { ownerId },
      checkIn: { gte: new Date() },
      status: { in: ['pending', 'checked_in'] },
    },
    orderBy: { checkIn: 'asc' },
    take: 5,
    include: {
      apartment: true,
      guest: true,
    },
  })
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: { ka: string; en: string }
  value: number
  icon: React.ElementType
  href?: string
}) {
  const content = (
    <Card className={href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <BilingualText text={title} size="sm" className="text-gray-500" />
          </div>
          <div className="p-3 rounded-xl bg-primary-100">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

export default async function OwnerDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'owner') {
    redirect('/login')
  }

  const stats = await getOwnerStats(session.user.id)
  const upcomingReservations = await getUpcomingReservations(session.user.id)

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t.dashboard.welcome.ka}, {session.user.name}!
        </h1>
        <p className="text-gray-500">{t.dashboard.welcome.en}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t.dashboard.totalApartments}
          value={stats.apartmentsCount}
          icon={Building2}
          href="/dashboard/apartments"
        />
        <StatCard
          title={t.dashboard.totalReservations}
          value={stats.reservationsCount}
          icon={CalendarDays}
          href="/dashboard/reservations"
        />
        <StatCard
          title={t.dashboard.todayCheckins}
          value={stats.todayCheckins}
          icon={Users}
        />
        <StatCard
          title={t.dashboard.pendingCheckins}
          value={stats.pendingCheckins}
          icon={Clock}
        />
      </div>

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <BilingualText
                text={{ ka: 'მომავალი დაჯავშნები', en: 'Upcoming Reservations' }}
                size="lg"
              />
            </CardTitle>
            <Link
              href="/dashboard/reservations"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {t.reservations.viewDetails.ka} / {t.reservations.viewDetails.en} →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t.messages.noDataFound.ka}</p>
              <p className="text-sm">{t.messages.noDataFound.en}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.guestName.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.apartments.name.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.checkIn.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.checkOut.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.source.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.status.ka}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.guestName}
                          </div>
                          {reservation.guestPhone && (
                            <div className="text-xs text-gray-500">{reservation.guestPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {reservation.apartment.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(reservation.checkIn).toLocaleDateString('ka-GE')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(reservation.checkOut).toLocaleDateString('ka-GE')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <SourceBadge source={reservation.source} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={reservation.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
