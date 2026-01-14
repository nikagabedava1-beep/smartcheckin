'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Send, Eye, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { BilingualText } from '@/components/ui/bilingual-text'
import { StatusBadge, SourceBadge } from '@/components/ui/badge'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

interface Apartment {
  id: string
  name: string
}

interface ReservedDate {
  checkIn: string
  checkOut: string
  guestName: string
}

interface Reservation {
  id: string
  guestName: string
  guestEmail: string | null
  guestPhone: string
  checkIn: string
  checkOut: string
  source: string
  status: string
  checkInToken: string
  apartment: {
    id: string
    name: string
  }
  guest: {
    consentGiven: boolean
    checkedInAt: string | null
  } | null
  deposit: {
    status: string
    amount: string
  } | null
}

export default function ReservationsPage() {
  const { data: session } = useSession()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reservedDates, setReservedDates] = useState<ReservedDate[]>([])
  const [dateConflict, setDateConflict] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    apartmentId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    depositRequired: false,
    depositAmount: '',
  })

  useEffect(() => {
    fetchReservations()
    fetchApartments()
  }, [])

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/reservations')
      const data = await res.json()
      setReservations(data)
    } catch {
      toast.error('Failed to fetch reservations')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/apartments')
      const data = await res.json()
      setApartments(data)
    } catch {
      console.error('Failed to fetch apartments')
    }
  }

  const fetchReservedDates = async (apartmentId: string) => {
    if (!apartmentId) {
      setReservedDates([])
      return
    }
    try {
      const res = await fetch(`/api/reservations/check-availability?apartmentId=${apartmentId}`)
      const data = await res.json()
      setReservedDates(data.reservations || [])
    } catch {
      console.error('Failed to fetch reserved dates')
    }
  }

  const checkDateConflict = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut || reservedDates.length === 0) {
      setDateConflict(null)
      return false
    }

    const newCheckIn = new Date(checkIn)
    const newCheckOut = new Date(checkOut)

    for (const reserved of reservedDates) {
      const resCheckIn = new Date(reserved.checkIn)
      const resCheckOut = new Date(reserved.checkOut)

      // Check if dates overlap
      if (newCheckIn < resCheckOut && newCheckOut > resCheckIn) {
        const conflictMsg = `${reserved.guestName}: ${new Date(reserved.checkIn).toLocaleDateString('ka-GE')} - ${new Date(reserved.checkOut).toLocaleDateString('ka-GE')}`
        setDateConflict(conflictMsg)
        return true
      }
    }

    setDateConflict(null)
    return false
  }

  const handleApartmentChange = (apartmentId: string) => {
    setFormData({ ...formData, apartmentId, checkIn: '', checkOut: '' })
    setDateConflict(null)
    fetchReservedDates(apartmentId)
  }

  const handleDateChange = (field: 'checkIn' | 'checkOut', value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    checkDateConflict(newFormData.checkIn, newFormData.checkOut)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create reservation')

      toast.success(`${t.messages.savedSuccessfully.ka} / ${t.messages.savedSuccessfully.en}`)
      setIsModalOpen(false)
      setFormData({
        apartmentId: '',
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        checkIn: '',
        checkOut: '',
        depositRequired: false,
        depositAmount: '',
      })
      fetchReservations()
    } catch {
      toast.error(`${t.messages.errorOccurred.ka} / ${t.messages.errorOccurred.en}`)
    } finally {
      setIsSaving(false)
    }
  }

  const copyCheckInLink = (token: string, id: string) => {
    const link = `${window.location.origin}/checkin/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    toast.success('Link copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sendWhatsApp = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/send-link`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to send')

      toast.success('Message sent!')
    } catch {
      toast.error('Failed to send message')
    }
  }

  const handleDeleteClick = (reservation: Reservation) => {
    setReservationToDelete(reservation)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/reservations/${reservationToDelete.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Reservation deleted / რეზერვაცია წაიშალა')
      setDeleteModalOpen(false)
      setReservationToDelete(null)
      fetchReservations()
    } catch {
      toast.error('Failed to delete reservation')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredReservations = reservations.filter((r) => {
    if (filter === 'all') return true
    return r.status === filter
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <BilingualText text={t.reservations.title} as="h1" size="2xl" />
        <div className="flex items-center gap-4">
          <Select
            options={[
              { value: 'all', label: { ka: 'ყველა', en: 'All' } },
              { value: 'pending', label: t.reservations.pending },
              { value: 'checked_in', label: t.reservations.checkedIn },
              { value: 'completed', label: t.reservations.completed },
            ]}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-40"
          />
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            <span>{t.reservations.addReservation.ka}</span>
          </Button>
        </div>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t.messages.noDataFound.ka} / {t.messages.noDataFound.en}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.guestName.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.apartments.name.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.checkIn.ka} / {t.reservations.checkOut.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.source.ka}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t.reservations.status.ka}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t.common.actions.ka}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.guestName}
                          </div>
                          <div className="text-xs text-gray-500">{reservation.guestPhone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {reservation.apartment.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {new Date(reservation.checkIn).toLocaleDateString('ka-GE')}
                          </div>
                          <div className="text-gray-500">
                            → {new Date(reservation.checkOut).toLocaleDateString('ka-GE')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <SourceBadge source={reservation.source} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={reservation.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCheckInLink(reservation.checkInToken, reservation.id)}
                            title="Copy check-in link"
                          >
                            {copiedId === reservation.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendWhatsApp(reservation.id)}
                            title="Send WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(reservation)}
                            title="Delete reservation"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Add Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.reservations.addReservation}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t.apartments.name}
            options={apartments.map((a) => ({ value: a.id, label: a.name }))}
            value={formData.apartmentId}
            onChange={(e) => handleApartmentChange(e.target.value)}
            placeholder="Select apartment..."
            required
          />

          {/* Show reserved dates for selected apartment */}
          {formData.apartmentId && reservedDates.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                დაკავებული თარიღები / Reserved Dates:
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {reservedDates.map((r, i) => (
                  <div key={i} className="text-xs text-yellow-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="font-medium">{r.guestName}:</span>
                    <span>
                      {new Date(r.checkIn).toLocaleDateString('ka-GE')} - {new Date(r.checkOut).toLocaleDateString('ka-GE')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input
            label={t.reservations.guestName}
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="email"
              label={t.reservations.guestEmail}
              value={formData.guestEmail}
              onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
            />
            <Input
              label={t.reservations.guestPhone}
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              required
              placeholder="+995 555 123 456"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label={t.reservations.checkIn}
              value={formData.checkIn}
              onChange={(e) => handleDateChange('checkIn', e.target.value)}
              required
              disabled={!formData.apartmentId}
            />
            <Input
              type="datetime-local"
              label={t.reservations.checkOut}
              value={formData.checkOut}
              onChange={(e) => handleDateChange('checkOut', e.target.value)}
              required
              disabled={!formData.apartmentId}
            />
          </div>

          {/* Date conflict warning */}
          {dateConflict && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                თარიღები კონფლიქტშია! / Date conflict!
              </p>
              <p className="text-xs text-red-600 mt-1">
                უკვე დაჯავშნილია / Already reserved: {dateConflict}
              </p>
            </div>
          )}

          {/* Deposit Settings */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="depositRequired"
                checked={formData.depositRequired}
                onChange={(e) => setFormData({ ...formData, depositRequired: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="depositRequired" className="text-sm font-medium text-gray-700">
                დეპოზიტის მოთხოვნა / Require Deposit
              </label>
            </div>
            {formData.depositRequired && (
              <Input
                type="number"
                label={{ ka: 'დეპოზიტის თანხა (GEL)', en: 'Deposit Amount (GEL)' }}
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                placeholder="100"
                min="1"
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t.common.cancel.ka} / {t.common.cancel.en}
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={!!dateConflict}>
              {t.common.save.ka} / {t.common.save.en}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setReservationToDelete(null)
        }}
        title={{ ka: 'რეზერვაციის წაშლა', en: 'Delete Reservation' }}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              დარწმუნებული ხართ, რომ გსურთ წაშალოთ ეს რეზერვაცია?
            </p>
            <p className="text-red-600 text-sm mt-1">
              Are you sure you want to delete this reservation?
            </p>
          </div>
          {reservationToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg text-sm">
              <p><strong>სტუმარი / Guest:</strong> {reservationToDelete.guestName}</p>
              <p><strong>ბინა / Apartment:</strong> {reservationToDelete.apartment.name}</p>
              <p><strong>თარიღები / Dates:</strong> {new Date(reservationToDelete.checkIn).toLocaleDateString('ka-GE')} - {new Date(reservationToDelete.checkOut).toLocaleDateString('ka-GE')}</p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            ეს მოქმედება გაათავისუფლებს თარიღებს ახალი რეზერვაციისთვის.
            <br />
            This will free up the dates for new reservations.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false)
                setReservationToDelete(null)
              }}
            >
              გაუქმება / Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              წაშლა / Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
