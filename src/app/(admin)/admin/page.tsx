import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BilingualText } from '@/components/ui/bilingual-text'
import { t } from '@/lib/translations'
import { Users, Building2, CalendarDays, Lock, TrendingUp, Activity } from 'lucide-react'

async function getStats() {
  const [ownersCount, apartmentsCount, reservationsCount, locksCount, pendingReservations, todayCheckins] = await Promise.all([
    prisma.owner.count({ where: { isActive: true } }),
    prisma.apartment.count({ where: { isActive: true } }),
    prisma.reservation.count(),
    prisma.smartLock.count(),
    prisma.reservation.count({ where: { status: 'pending' } }),
    prisma.reservation.count({
      where: {
        checkIn: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ])

  return {
    ownersCount,
    apartmentsCount,
    reservationsCount,
    locksCount,
    pendingReservations,
    todayCheckins,
  }
}

async function getRecentReservations() {
  return prisma.reservation.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      apartment: {
        include: { owner: true },
      },
    },
  })
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: { ka: string; en: string }
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <BilingualText text={title} size="sm" className="text-gray-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
      ))}
    </div>
  )
}

async function StatsSection() {
  const stats = await getStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title={t.admin.totalOwners}
        value={stats.ownersCount}
        icon={Users}
        color="bg-blue-500"
      />
      <StatCard
        title={t.admin.totalApartments}
        value={stats.apartmentsCount}
        icon={Building2}
        color="bg-green-500"
      />
      <StatCard
        title={t.admin.totalReservations}
        value={stats.reservationsCount}
        icon={CalendarDays}
        color="bg-purple-500"
      />
      <StatCard
        title={t.admin.activeLocks}
        value={stats.locksCount}
        icon={Lock}
        color="bg-orange-500"
      />
      <StatCard
        title={t.dashboard.pendingCheckins}
        value={stats.pendingReservations}
        icon={TrendingUp}
        color="bg-yellow-500"
      />
      <StatCard
        title={t.dashboard.todayCheckins}
        value={stats.todayCheckins}
        icon={Activity}
        color="bg-red-500"
      />
    </div>
  )
}

async function RecentReservationsSection() {
  const reservations = await getRecentReservations()

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>
          <BilingualText text={t.dashboard.recentActivity} size="lg" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t.messages.noDataFound.ka} / {t.messages.noDataFound.en}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    სტუმარი / Guest
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ბინა / Apartment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    მფლობელი / Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    შემოსვლა / Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    სტატუსი / Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reservation.guestName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reservation.apartment.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reservation.apartment.owner.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(reservation.checkIn).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : reservation.status === 'checked_in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {reservation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <BilingualText text={t.admin.systemOverview} as="h1" size="2xl" />
      </div>

      {/* Stats */}
      <Suspense fallback={<LoadingCards />}>
        <StatsSection />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<div className="h-64 bg-gray-200 animate-pulse rounded-xl mt-8" />}>
        <RecentReservationsSection />
      </Suspense>
    </div>
  )
}
