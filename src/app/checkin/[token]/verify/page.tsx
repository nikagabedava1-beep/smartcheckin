'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Check,
  Loader2,
  Building2,
  ChevronRight,
  FileCheck,
  CreditCard,
  Clock,
  ArrowRight,
  AlertCircle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { t } from '@/lib/translations'

interface ReservationData {
  id: string
  guestName: string
  depositRequired: boolean
  depositAmount: string
  apartment: {
    name: string
  }
  guest: {
    passportImages: string[]
    passportStatus: string
    rejectionReason: string | null
  } | null
  deposit: {
    status: string
  } | null
  accessCode: {
    code: string
  } | null
}

export default function VerificationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    fetchReservation()
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchReservation, 3000)
    return () => clearInterval(interval)
  }, [token])

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/checkin/${token}`)
      if (!res.ok) {
        router.replace(`/checkin/${token}`)
        return
      }
      const data = await res.json()

      // If already completed, go to success
      if (data.accessCode) {
        router.replace(`/checkin/${token}/success`)
        return
      }

      // If no passport uploaded, go back to start
      if (!data.guest?.passportImages || data.guest.passportImages.length === 0) {
        router.replace(`/checkin/${token}`)
        return
      }

      // If deposit required but not paid, go to deposit page
      if (data.depositRequired && data.deposit?.status !== 'paid') {
        router.replace(`/checkin/${token}/deposit`)
        return
      }

      setReservation(data)
    } catch {
      router.replace(`/checkin/${token}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)

    try {
      const res = await fetch(`/api/checkin/${token}/complete`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to complete')

      router.push(`/checkin/${token}/success`)
    } catch {
      setIsCompleting(false)
    }
  }

  // Check if all requirements are met
  const passportUploaded = reservation?.guest?.passportImages && reservation.guest.passportImages.length > 0
  const passportStatus = reservation?.guest?.passportStatus || 'pending'
  const passportApproved = passportStatus === 'approved'
  const passportRejected = passportStatus === 'rejected'
  const depositVerified = !reservation?.depositRequired || reservation?.deposit?.status === 'paid'
  const allVerified = passportApproved && depositVerified

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!reservation) {
    return null
  }

  const steps = reservation.depositRequired
    ? [
        { id: 'passport', label: t.guest.step1 },
        { id: 'deposit', label: t.guest.step2 },
        { id: 'complete', label: t.guest.step3 },
      ]
    : [
        { id: 'passport', label: t.guest.step1 },
        { id: 'complete', label: t.guest.step2 },
      ]

  // Current step index for progress (we're at the last step before complete)
  const currentStepIndex = steps.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SmartCheckin.ge</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? allVerified
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {index < currentStepIndex || (index === currentStepIndex && allVerified) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Verification Status Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                ვერიფიკაცია
              </h2>
              <p className="text-sm text-gray-500">Verification Status</p>
            </div>

            <div className="space-y-4">
              {/* Passport Status */}
              <div
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl transition-all',
                  passportApproved
                    ? 'bg-green-50 border-2 border-green-200'
                    : passportRejected
                    ? 'bg-red-50 border-2 border-red-200'
                    : 'bg-yellow-50 border-2 border-yellow-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      passportApproved
                        ? 'bg-green-500'
                        : passportRejected
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    )}
                  >
                    {passportApproved ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : passportRejected ? (
                      <X className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">პასპორტის ფოტო</p>
                    <p className="text-sm text-gray-500">
                      {passportApproved
                        ? 'Approved'
                        : passportRejected
                        ? 'Rejected - Please re-upload'
                        : 'Pending approval'}
                    </p>
                  </div>
                </div>
                <FileCheck
                  className={cn(
                    'w-6 h-6',
                    passportApproved
                      ? 'text-green-600'
                      : passportRejected
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  )}
                />
              </div>

              {/* Rejection Reason */}
              {passportRejected && reservation.guest?.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 text-sm">უარყოფის მიზეზი / Rejection Reason:</p>
                      <p className="text-red-600 text-sm mt-1">{reservation.guest.rejectionReason}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => router.push(`/checkin/${token}`)}
                      >
                        ხელახლა ატვირთვა / Re-upload Passport
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit Status (if required) */}
              {reservation.depositRequired && (
                <div
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl transition-all',
                    depositVerified
                      ? 'bg-green-50 border-2 border-green-200'
                      : 'bg-yellow-50 border-2 border-yellow-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        depositVerified ? 'bg-green-500' : 'bg-yellow-500'
                      )}
                    >
                      {depositVerified ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Clock className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">დეპოზიტი</p>
                      <p className="text-sm text-gray-500">
                        Deposit ({reservation.depositAmount} GEL)
                      </p>
                    </div>
                  </div>
                  <CreditCard
                    className={cn(
                      'w-6 h-6',
                      depositVerified ? 'text-green-600' : 'text-yellow-600'
                    )}
                  />
                </div>
              )}
            </div>

            {/* Status Message */}
            <div
              className={cn(
                'mt-6 p-4 rounded-xl text-center',
                allVerified
                  ? 'bg-green-100'
                  : passportRejected
                  ? 'bg-red-100'
                  : 'bg-blue-50'
              )}
            >
              {allVerified ? (
                <>
                  <p className="font-semibold text-green-800">
                    ყველაფერი მზადაა!
                  </p>
                  <p className="text-sm text-green-600">
                    Everything is ready! Press Next to continue.
                  </p>
                </>
              ) : passportRejected ? (
                <>
                  <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="font-medium text-red-800">
                    პასპორტი უარყოფილია
                  </p>
                  <p className="text-sm text-red-600">
                    Your passport was rejected. Please re-upload.
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-blue-800">
                    გთხოვთ დაელოდოთ...
                  </p>
                  <p className="text-sm text-blue-600">
                    Please wait while the owner approves your passport...
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Button (only shown when all verified) */}
        {allVerified && (
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full py-4 text-lg bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            შემდეგი / Next
          </Button>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>SmartCheckin.ge • სმარტ ჩექინი</p>
        </div>
      </div>
    </div>
  )
}
