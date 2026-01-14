'use client'

import { useState, useEffect } from 'react'
import { Eye, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { BilingualText } from '@/components/ui/bilingual-text'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Guest {
  id: string
  passportImages: string[]
  passportStatus: string
  rejectionReason: string | null
  consentGiven: boolean
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

export default function PassportsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchPassports()
  }, [filter])

  const fetchPassports = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/passports?status=${filter}`)
      const data = await res.json()
      setGuests(data)
    } catch {
      toast.error('Failed to fetch passports')
    } finally {
      setIsLoading(false)
    }
  }

  const openViewer = (guest: Guest) => {
    setSelectedGuest(guest)
    setCurrentImageIndex(0)
    setIsViewerOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedGuest) return
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/passports/${selectedGuest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (!res.ok) throw new Error('Failed to approve')

      toast.success('Passport approved / პასპორტი დამტკიცდა')
      setIsViewerOpen(false)
      fetchPassports()
    } catch {
      toast.error('Failed to approve passport')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedGuest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/passports/${selectedGuest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason }),
      })

      if (!res.ok) throw new Error('Failed to reject')

      toast.success('Passport rejected / პასპორტი უარყოფილია')
      setIsRejectModalOpen(false)
      setIsViewerOpen(false)
      setRejectionReason('')
      fetchPassports()
    } catch {
      toast.error('Failed to reject passport')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">მოლოდინში / Pending</Badge>
      case 'approved':
        return <Badge variant="success">დამტკიცებული / Approved</Badge>
      case 'rejected':
        return <Badge variant="danger">უარყოფილი / Rejected</Badge>
      default:
        return null
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <BilingualText
          text={{ ka: 'პასპორტები', en: 'Passports' }}
          as="h1"
          size="2xl"
        />
        <Select
          options={[
            { value: 'pending', label: { ka: 'მოლოდინში', en: 'Pending' } },
            { value: 'approved', label: { ka: 'დამტკიცებული', en: 'Approved' } },
            { value: 'rejected', label: { ka: 'უარყოფილი', en: 'Rejected' } },
            { value: 'all', label: { ka: 'ყველა', en: 'All' } },
          ]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Passports Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : guests.length === 0 ? (
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
                      თარიღები / Dates
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      სტატუსი / Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ატვირთული / Uploaded
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      მოქმედება / Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {guests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {guest.reservation.guestName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {guest.reservation.guestPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {guest.reservation.apartment.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {new Date(guest.reservation.checkIn).toLocaleDateString('ka-GE')}
                          </div>
                          <div className="text-gray-500">
                            → {new Date(guest.reservation.checkOut).toLocaleDateString('ka-GE')}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(guest.passportStatus)}
                        {guest.passportStatus === 'rejected' && guest.rejectionReason && (
                          <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={guest.rejectionReason}>
                            {guest.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {guest.passportImages.length} file(s)
                        <div className="text-xs text-gray-400">
                          {new Date(guest.createdAt).toLocaleDateString('ka-GE')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewer(guest)}
                            leftIcon={<Eye className="w-4 h-4" />}
                          >
                            ნახვა / View
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

      {/* Passport Viewer Modal */}
      <Modal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={{ ka: 'პასპორტის ნახვა', en: 'View Passport' }}
        size="xl"
      >
        {selectedGuest && (
          <div className="space-y-6">
            {/* Guest Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">სტუმარი / Guest:</span>
                  <p className="font-medium">{selectedGuest.reservation.guestName}</p>
                </div>
                <div>
                  <span className="text-gray-500">ტელეფონი / Phone:</span>
                  <p className="font-medium">{selectedGuest.reservation.guestPhone}</p>
                </div>
                <div>
                  <span className="text-gray-500">ბინა / Apartment:</span>
                  <p className="font-medium">{selectedGuest.reservation.apartment.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">თარიღები / Dates:</span>
                  <p className="font-medium">
                    {new Date(selectedGuest.reservation.checkIn).toLocaleDateString('ka-GE')} -{' '}
                    {new Date(selectedGuest.reservation.checkOut).toLocaleDateString('ka-GE')}
                  </p>
                </div>
              </div>
            </div>

            {/* Passport Images */}
            <div className="relative">
              {selectedGuest.passportImages.length > 0 ? (
                <div>
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={selectedGuest.passportImages[currentImageIndex]}
                      alt={`Passport ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  {selectedGuest.passportImages.length > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {currentImageIndex + 1} / {selectedGuest.passportImages.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentImageIndex((prev) =>
                            Math.min(selectedGuest.passportImages.length - 1, prev + 1)
                          )
                        }
                        disabled={currentImageIndex === selectedGuest.passportImages.length - 1}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No passport images available
                </div>
              )}
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">მიმდინარე სტატუსი / Current Status:</span>
              {getStatusBadge(selectedGuest.passportStatus)}
            </div>

            {/* Action Buttons */}
            {selectedGuest.passportStatus === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="danger"
                  onClick={() => setIsRejectModalOpen(true)}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  უარყოფა / Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  isLoading={isProcessing}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  დამტკიცება / Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false)
          setRejectionReason('')
        }}
        title={{ ka: 'უარყოფის მიზეზი', en: 'Rejection Reason' }}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg text-yellow-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              სტუმარს შეეძლება ხელახლა ატვირთოს პასპორტის ფოტო.
              <br />
              <span className="text-yellow-600">
                Guest will be able to re-upload passport photo.
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              უარყოფის მიზეზი / Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Please provide a reason for rejection..."
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRejectModalOpen(false)
                setRejectionReason('')
              }}
            >
              გაუქმება / Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              isLoading={isProcessing}
              disabled={!rejectionReason.trim()}
            >
              უარყოფა / Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
