'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, Lock, RefreshCw, Calendar, Link2, Unlink } from 'lucide-react'
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

interface TTLockLock {
  lockId: number
  lockName: string
  lockAlias: string
  electricQuantity: number
  hasGateway: number
}

interface Apartment {
  id: string
  name: string
  address: string
  description: string | null
  buildingEntryCode: string | null
  buildingEntryInstructions: string | null
  icalUrl: string | null
  lastIcalSync: string | null
  airbnbIcalUrl: string | null
  lastAirbnbSync: string | null
  bookingIcalUrl: string | null
  lastBookingSync: string | null
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

  // Lock assignment state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [lockModalApartment, setLockModalApartment] = useState<Apartment | null>(null)
  const [ttlockConnected, setTtlockConnected] = useState(false)
  const [availableLocks, setAvailableLocks] = useState<TTLockLock[]>([])
  const [isLoadingLocks, setIsLoadingLocks] = useState(false)
  const [isAssigningLock, setIsAssigningLock] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    buildingEntryCode: '',
    buildingEntryInstructions: '',
    icalUrl: '',
    airbnbSyncEnabled: false,
    airbnbIcalUrl: '',
    bookingSyncEnabled: false,
    bookingIcalUrl: '',
    isActive: true,
  })

  useEffect(() => {
    fetchApartments()
    checkTTLockStatus()
  }, [])

  const checkTTLockStatus = async () => {
    try {
      const res = await fetch('/api/ttlock/status')
      const data = await res.json()
      setTtlockConnected(data.connected && !data.isExpired)
    } catch {
      setTtlockConnected(false)
    }
  }

  const fetchAvailableLocks = async () => {
    setIsLoadingLocks(true)
    try {
      const res = await fetch('/api/ttlock/locks')
      const data = await res.json()
      if (res.ok) {
        setAvailableLocks(data.locks || [])
      }
    } catch {
      toast.error('Failed to fetch locks')
    } finally {
      setIsLoadingLocks(false)
    }
  }

  const handleOpenLockModal = (apartment: Apartment) => {
    setLockModalApartment(apartment)
    setIsLockModalOpen(true)
    if (ttlockConnected) {
      fetchAvailableLocks()
    }
  }

  const handleAssignLock = async (lockId: number, lockName: string) => {
    if (!lockModalApartment) return

    setIsAssigningLock(true)
    try {
      const res = await fetch(`/api/apartments/${lockModalApartment.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId, lockName }),
      })

      if (!res.ok) throw new Error('Failed to assign lock')

      toast.success('საკეტი მინიჭებულია / Lock assigned')
      setIsLockModalOpen(false)
      fetchApartments()
    } catch {
      toast.error('საკეტის მინიჭება ვერ მოხერხდა / Failed to assign lock')
    } finally {
      setIsAssigningLock(false)
    }
  }

  const handleRemoveLock = async (apartmentId: string) => {
    try {
      const res = await fetch(`/api/apartments/${apartmentId}/lock`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to remove lock')

      toast.success('საკეტი მოხსნილია / Lock removed')
      fetchApartments()
    } catch {
      toast.error('საკეტის მოხსნა ვერ მოხერხდა / Failed to remove lock')
    }
  }

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
        buildingEntryCode: apartment.buildingEntryCode || '',
        buildingEntryInstructions: apartment.buildingEntryInstructions || '',
        icalUrl: apartment.icalUrl || '',
        airbnbSyncEnabled: !!apartment.airbnbIcalUrl,
        airbnbIcalUrl: apartment.airbnbIcalUrl || '',
        bookingSyncEnabled: !!apartment.bookingIcalUrl,
        bookingIcalUrl: apartment.bookingIcalUrl || '',
        isActive: apartment.isActive,
      })
    } else {
      setSelectedApartment(null)
      setFormData({
        name: '',
        address: '',
        description: '',
        buildingEntryCode: '',
        buildingEntryInstructions: '',
        icalUrl: '',
        airbnbSyncEnabled: false,
        airbnbIcalUrl: '',
        bookingSyncEnabled: false,
        bookingIcalUrl: '',
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

      const submitData = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        buildingEntryCode: formData.buildingEntryCode || null,
        buildingEntryInstructions: formData.buildingEntryInstructions || null,
        icalUrl: formData.icalUrl,
        airbnbIcalUrl: formData.airbnbSyncEnabled ? formData.airbnbIcalUrl : null,
        bookingIcalUrl: formData.bookingSyncEnabled ? formData.bookingIcalUrl : null,
        isActive: formData.isActive,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
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
                    <div className="flex-1 flex items-center justify-between">
                      <div>
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
                              {apartment.smartLock.batteryLevel}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLock(apartment.id)}
                      >
                        <Unlink className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {t.apartments.noLock.ka} / {t.apartments.noLock.en}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenLockModal(apartment)}
                      >
                        <Link2 className="w-4 h-4 text-primary-600" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Calendar Sync Status */}
                {(apartment.airbnbIcalUrl || apartment.bookingIcalUrl) && (
                  <div className="mb-4 space-y-2">
                    {apartment.airbnbIcalUrl && (
                      <div className="flex items-center justify-between text-sm bg-red-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-700">Airbnb</span>
                          <span className="text-gray-500 text-xs">
                            {apartment.lastAirbnbSync
                              ? new Date(apartment.lastAirbnbSync).toLocaleString('ka-GE')
                              : 'არ არის სინქრ.'}
                          </span>
                        </div>
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
                    {apartment.bookingIcalUrl && (
                      <div className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700">Booking.com</span>
                          <span className="text-gray-500 text-xs">
                            {apartment.lastBookingSync
                              ? new Date(apartment.lastBookingSync).toLocaleString('ka-GE')
                              : 'არ არის სინქრ.'}
                          </span>
                        </div>
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

          {/* Building Entry Section */}
          <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-gray-900">
              შენობის შესასვლელი / Building Entrance
            </h3>
            <p className="text-sm text-gray-600">
              მიუთითეთ როგორ შევიდეს სტუმარი შენობაში / Specify how the guest enters the building
            </p>
            <Input
              label={{ ka: 'შენობის კოდი', en: 'Building Entry Code' }}
              value={formData.buildingEntryCode}
              onChange={(e) => setFormData({ ...formData, buildingEntryCode: e.target.value })}
              placeholder="1234 ან #1234"
              hint="კოდი რომლითაც იღება სადარბაზოს კარი / Code to open the building entrance"
            />
            <Textarea
              label={{ ka: 'დამატებითი ინსტრუქციები', en: 'Additional Instructions' }}
              value={formData.buildingEntryInstructions}
              onChange={(e) => setFormData({ ...formData, buildingEntryInstructions: e.target.value })}
              placeholder="მაგ: მე-2 სართული, მარცხენა კარი / e.g.: 2nd floor, left door"
              hint="სტუმრისთვის დამატებითი ინფორმაცია / Additional info for the guest"
            />
          </div>

          {/* Calendar Sync Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">
              კალენდრის სინქრონიზაცია / Calendar Sync
            </h3>

            {/* Airbnb Sync */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.airbnbSyncEnabled}
                  onChange={(e) => setFormData({ ...formData, airbnbSyncEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Airbnb კალენდრის სინქრონიზაცია / Airbnb Calendar Sync
                </span>
              </label>
              {formData.airbnbSyncEnabled && (
                <Input
                  value={formData.airbnbIcalUrl}
                  onChange={(e) => setFormData({ ...formData, airbnbIcalUrl: e.target.value })}
                  placeholder="https://www.airbnb.com/calendar/ical/..."
                  hint="Airbnb-დან iCal URL დააკოპირეთ / Copy iCal URL from Airbnb"
                />
              )}
            </div>

            {/* Booking.com Sync */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.bookingSyncEnabled}
                  onChange={(e) => setFormData({ ...formData, bookingSyncEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Booking.com კალენდრის სინქრონიზაცია / Booking.com Calendar Sync
                </span>
              </label>
              {formData.bookingSyncEnabled && (
                <Input
                  value={formData.bookingIcalUrl}
                  onChange={(e) => setFormData({ ...formData, bookingIcalUrl: e.target.value })}
                  placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
                  hint="Booking.com-დან iCal URL დააკოპირეთ / Copy iCal URL from Booking.com"
                />
              )}
            </div>
          </div>

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

      {/* Lock Assignment Modal */}
      <Modal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        title={{ ka: 'საკეტის მინიჭება', en: 'Assign Lock' }}
      >
        <div className="space-y-4">
          {lockModalApartment && (
            <p className="text-sm text-gray-600">
              {lockModalApartment.name} - {lockModalApartment.address}
            </p>
          )}

          {!ttlockConnected ? (
            <div className="text-center py-6">
              <Lock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 mb-2">
                TTLock არ არის დაკავშირებული
              </p>
              <p className="text-sm text-gray-500 mb-4">
                TTLock is not connected
              </p>
              <Button
                onClick={() => window.location.href = '/dashboard/settings'}
              >
                პარამეტრებში გადასვლა / Go to Settings
              </Button>
            </div>
          ) : isLoadingLocks ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : availableLocks.length === 0 ? (
            <div className="text-center py-6">
              <Lock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">
                საკეტები არ მოიძებნა / No locks found
              </p>
              <p className="text-sm text-gray-500 mt-2">
                დარწმუნდით რომ საკეტი დაკავშირებულია TTLock აპლიკაციაში
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableLocks.map((lock) => (
                <div
                  key={lock.lockId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{lock.lockAlias || lock.lockName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={lock.hasGateway ? 'success' : 'warning'}
                          size="sm"
                        >
                          {lock.hasGateway ? 'Gateway' : 'No Gateway'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {lock.electricQuantity}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssignLock(lock.lockId, lock.lockAlias || lock.lockName)}
                    isLoading={isAssigningLock}
                  >
                    მინიჭება / Assign
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsLockModalOpen(false)}>
              {t.common.cancel.ka} / {t.common.cancel.en}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
