'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, Lock, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { BilingualText } from '@/components/ui/bilingual-text'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

interface SmartLock {
  id: string
  ttlockId: string
  ttlockName: string
  isOnline: boolean
  batteryLevel: number | null
}

interface Apartment {
  id: string
  name: string
  address: string
  description: string | null
  icalUrl: string | null
  lastIcalSync: string | null
  isActive: boolean
  smartLock: SmartLock | null
  _count: {
    reservations: number
  }
}

export default function ApartmentsPage() {
  const { data: session } = useSession()
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    icalUrl: '',
    isActive: true,
  })

  useEffect(() => {
    fetchApartments()
  }, [])

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/apartments')
      const data = await res.json()
      setApartments(data)
    } catch {
      toast.error('Failed to fetch apartments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (apartment?: Apartment) => {
    if (apartment) {
      setSelectedApartment(apartment)
      setFormData({
        name: apartment.name,
        address: apartment.address,
        description: apartment.description || '',
        icalUrl: apartment.icalUrl || '',
        isActive: apartment.isActive,
      })
    } else {
      setSelectedApartment(null)
      setFormData({
        name: '',
        address: '',
        description: '',
        icalUrl: '',
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = selectedApartment
        ? `/api/apartments/${selectedApartment.id}`
        : '/api/apartments'
      const method = selectedApartment ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(`${t.messages.savedSuccessfully.ka} / ${t.messages.savedSuccessfully.en}`)
      setIsModalOpen(false)
      fetchApartments()
    } catch {
      toast.error(`${t.messages.errorOccurred.ka} / ${t.messages.errorOccurred.en}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedApartment) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/apartments/${selectedApartment.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast.success(`${t.messages.deletedSuccessfully.ka} / ${t.messages.deletedSuccessfully.en}`)
      setIsDeleteModalOpen(false)
      setSelectedApartment(null)
      fetchApartments()
    } catch {
      toast.error(`${t.messages.errorOccurred.ka} / ${t.messages.errorOccurred.en}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSyncIcal = async (apartmentId: string) => {
    setSyncingId(apartmentId)
    try {
      const res = await fetch(`/api/apartments/${apartmentId}/sync`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Sync failed')

      toast.success(`Synced ${data.eventsCount} events`)
      fetchApartments()
    } catch (error) {
      toast.error('Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <BilingualText text={t.apartments.title} as="h1" size="2xl" />
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
          <span>{t.apartments.addApartment.ka}</span>
          <span className="ml-1 opacity-80">/ {t.apartments.addApartment.en}</span>
        </Button>
      </div>

      {/* Apartments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : apartments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>{t.messages.noDataFound.ka}</p>
            <p className="text-sm">{t.messages.noDataFound.en}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map((apartment) => (
            <Card key={apartment.id} hover>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{apartment.name}</h3>
                    <p className="text-sm text-gray-500">{apartment.address}</p>
                  </div>
                  <Badge variant={apartment.isActive ? 'success' : 'default'}>
                    {apartment.isActive ? t.apartments.active.ka : t.apartments.inactive.ka}
                  </Badge>
                </div>

                {apartment.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{apartment.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {apartment._count.reservations} reservations
                  </div>
                </div>

                {/* Smart Lock Status */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <Lock className="w-4 h-4 text-gray-400" />
                  {apartment.smartLock ? (
                    <div className="flex-1">
                      <span className="text-sm font-medium">{apartment.smartLock.ttlockName}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={apartment.smartLock.isOnline ? 'success' : 'default'}
                          size="sm"
                        >
                          {apartment.smartLock.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                        {apartment.smartLock.batteryLevel && (
                          <span className="text-xs text-gray-500">
                            🔋 {apartment.smartLock.batteryLevel}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {t.apartments.noLock.ka} / {t.apartments.noLock.en}
                    </span>
                  )}
                </div>

                {/* iCal Status */}
                {apartment.icalUrl && (
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-gray-500">
                      {t.apartments.lastSync.ka}:{' '}
                      {apartment.lastIcalSync
                        ? new Date(apartment.lastIcalSync).toLocaleString('ka-GE')
                        : 'Never'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncIcal(apartment.id)}
                      disabled={syncingId === apartment.id}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${syncingId === apartment.id ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(apartment)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    {t.common.edit.ka}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedApartment(apartment)
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                    {t.common.delete.ka}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedApartment ? t.apartments.editApartment : t.apartments.addApartment}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t.apartments.name}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Cozy Studio in Tbilisi Center"
          />
          <Input
            label={t.apartments.address}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            placeholder="Rustaveli Ave 42, Tbilisi"
          />
          <Textarea
            label={t.apartments.description}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Beautiful apartment with amazing views..."
          />
          <Input
            label={t.apartments.icalUrl}
            value={formData.icalUrl}
            onChange={(e) => setFormData({ ...formData, icalUrl: e.target.value })}
            placeholder="https://www.airbnb.com/calendar/ical/..."
            hint={`${t.apartments.icalUrlHelp.ka} / ${t.apartments.icalUrlHelp.en}`}
          />

          <div className="pt-4 border-t">
            <Toggle
              enabled={formData.isActive}
              onChange={(enabled) => setFormData({ ...formData, isActive: enabled })}
              label={t.apartments.status}
              description={{
                ka: 'არააქტიური ბინები არ მიიღებენ ახალ დაჯავშნებს',
                en: 'Inactive apartments will not receive new bookings',
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t.common.cancel.ka} / {t.common.cancel.en}
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {t.common.save.ka} / {t.common.save.en}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t.common.delete}
        message={t.messages.confirmDelete}
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  )
}
