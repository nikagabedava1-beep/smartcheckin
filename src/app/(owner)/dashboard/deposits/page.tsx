'use client'

import { useState, useEffect } from 'react'
import { Check, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { BilingualText } from '@/components/ui/bilingual-text'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

interface Deposit {
  id: string
  amount: string
  currency: string
  status: string
  transactionId: string | null
  paidAt: string | null
  ownerConfirmed: boolean
  ownerConfirmedAt: string | null
  createdAt: string
  reservation: {
    id: string
    guestName: string
    guestPhone: string
    checkIn: string
    checkOut: string
    status: string
    apartment: {
      id: string
      name: string
    }
  }
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('paid')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDeposits()
  }, [filter])

  const fetchDeposits = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/deposits?status=${filter}`)
      const data = await res.json()
      setDeposits(data)
    } catch {
      toast.error('Failed to fetch deposits')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (depositId: string) => {
    setConfirmingId(depositId)

    try {
      const res = await fetch(`/api/deposits/${depositId}/confirm`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to confirm')

      toast.success('Deposit confirmed / დეპოზიტი დადასტურდა')
      fetchDeposits()
    } catch {
      toast.error('Failed to confirm deposit')
    } finally {
      setConfirmingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">მოლოდინში / Pending</Badge>
      case 'paid':
        return <Badge variant="success">გადახდილი / Paid</Badge>
      case 'refunded':
        return <Badge variant="info">დაბრუნებული / Refunded</Badge>
      case 'held':
        return <Badge variant="default">დაკავებული / Held</Badge>
      default:
        return null
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <BilingualText
          text={{ ka: 'დეპოზიტები', en: 'Deposits' }}
          as="h1"
          size="2xl"
        />
        <Select
          options={[
            { value: 'paid', label: { ka: 'გადახდილი', en: 'Paid' } },
            { value: 'pending', label: { ka: 'მოლოდინში', en: 'Pending' } },
            { value: 'refunded', label: { ka: 'დაბრუნებული', en: 'Refunded' } },
            { value: 'all', label: { ka: 'ყველა', en: 'All' } },
          ]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {deposits.filter((d) => d.status === 'paid' && d.ownerConfirmed).length}
            </div>
            <p className="text-sm text-gray-500">დადასტურებული / Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {deposits.filter((d) => d.status === 'paid' && !d.ownerConfirmed).length}
            </div>
            <p className="text-sm text-gray-500">დასადასტურებელი / To Confirm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {deposits
                .filter((d) => d.status === 'paid')
                .reduce((sum, d) => sum + parseFloat(d.amount), 0)
                .toFixed(2)}{' '}
              GEL
            </div>
            <p className="text-sm text-gray-500">სულ გადახდილი / Total Paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Deposits Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t.messages.noDataFound.ka} / {t.messages.noDataFound.en}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      სტუმარი / Guest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ბინა / Apartment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      თანხა / Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      სტატუსი / Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      დადასტურებული / Confirmed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ტრანზაქცია / Transaction
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      მოქმედება / Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deposit.reservation.guestName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {deposit.reservation.guestPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {deposit.reservation.apartment.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {parseFloat(deposit.amount).toFixed(2)} {deposit.currency}
                        </div>
                        {deposit.paidAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(deposit.paidAt).toLocaleDateString('ka-GE')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(deposit.status)}</td>
                      <td className="px-4 py-4">
                        {deposit.ownerConfirmed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">დადასტურებული</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            არა / No
                          </span>
                        )}
                        {deposit.ownerConfirmedAt && (
                          <div className="text-xs text-gray-400">
                            {new Date(deposit.ownerConfirmedAt).toLocaleDateString('ka-GE')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {deposit.transactionId ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {deposit.transactionId}
                          </code>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end">
                          {deposit.status === 'paid' && !deposit.ownerConfirmed && (
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(deposit.id)}
                              isLoading={confirmingId === deposit.id}
                              leftIcon={<Check className="w-4 h-4" />}
                            >
                              დადასტურება / Confirm
                            </Button>
                          )}
                        </div>
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
