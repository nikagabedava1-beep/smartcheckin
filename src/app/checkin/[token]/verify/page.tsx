'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Check,
  Loader2,
  ChevronRight,
  FileCheck,
  CreditCard,
  Clock,
  ArrowRight,
  AlertCircle,
  X,
  Shield,
} from 'lucide-react'
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

      if (data.accessCode) {
        router.replace(`/checkin/${token}/success`)
        return
      }

      if (!data.guest?.passportImages || data.guest.passportImages.length === 0) {
        router.replace(`/checkin/${token}`)
        return
      }

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

  const passportUploaded = reservation?.guest?.passportImages && reservation.guest.passportImages.length > 0
  const passportStatus = reservation?.guest?.passportStatus || 'pending'
  const passportApproved = passportStatus === 'approved'
  const passportRejected = passportStatus === 'rejected'
  const depositVerified = !reservation?.depositRequired || reservation?.deposit?.status === 'paid'
  const allVerified = passportApproved && depositVerified

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A]" />
      </div>
    )
  }

  if (!reservation) {
    return null
  }

  const steps = reservation.depositRequired
    ? [
        { id: 'passport', label: { ka: 'რეგისტრაცია', en: 'Registration' } },
        { id: 'deposit', label: { ka: 'დეპოზიტი', en: 'Deposit' } },
        { id: 'complete', label: { ka: 'წვდომა', en: 'Access' } },
      ]
    : [
        { id: 'passport', label: { ka: 'რეგისტრაცია', en: 'Registration' } },
        { id: 'complete', label: { ka: 'წვდომა', en: 'Access' } },
      ]

  const currentStepIndex = steps.length - 1

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#2563EB] pt-10 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                SmartCheckin.ge
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            ვერიფიკაცია
          </h1>
          <p className="text-blue-200 text-sm font-medium">
            Verification Status
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-10">
        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-5">
          <div className="flex items-center justify-center gap-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                      index < currentStepIndex
                        ? 'bg-green-500 text-white shadow-md shadow-green-200'
                        : index === currentStepIndex
                          ? allVerified
                            ? 'bg-green-500 text-white shadow-md shadow-green-200'
                            : 'bg-[#1E3A8A] text-white shadow-md shadow-blue-200'
                          : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {index < currentStepIndex || (index === currentStepIndex && allVerified) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-1.5 font-medium',
                    index <= currentStepIndex ? 'text-gray-700' : 'text-gray-400'
                  )}>
                    {step.label.ka}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-14 h-0.5 mx-2 mb-5 rounded-full',
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="space-y-3">
              {/* Passport Status */}
              <div
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl transition-all',
                  passportApproved
                    ? 'bg-green-50 border border-green-100'
                    : passportRejected
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-amber-50 border border-amber-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      passportApproved
                        ? 'bg-green-500'
                        : passportRejected
                          ? 'bg-red-500'
                          : 'bg-amber-500'
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
                    <p className="font-semibold text-gray-900 text-sm">პასპორტის ფოტო</p>
                    <p className="text-xs text-gray-500">
                      {passportApproved
                        ? 'დამტკიცებულია / Approved'
                        : passportRejected
                          ? 'უარყოფილია / Rejected'
                          : 'მოლოდინში / Pending approval'}
                    </p>
                  </div>
                </div>
                <FileCheck
                  className={cn(
                    'w-5 h-5',
                    passportApproved
                      ? 'text-green-500'
                      : passportRejected
                        ? 'text-red-500'
                        : 'text-amber-500'
                  )}
                />
              </div>

              {/* Rejection Reason */}
              {passportRejected && reservation.guest?.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 text-sm">
                        უარყოფის მიზეზი / Rejection Reason:
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        {reservation.guest.rejectionReason}
                      </p>
                      <button
                        onClick={() => router.push(`/checkin/${token}`)}
                        className="mt-3 px-4 py-2 text-sm font-medium border border-red-200 rounded-xl text-red-700 hover:bg-red-100 transition-colors"
                      >
                        ხელახლა ატვირთვა / Re-upload Passport
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Deposit Status */}
              {reservation.depositRequired && (
                <div
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl transition-all',
                    depositVerified
                      ? 'bg-green-50 border border-green-100'
                      : 'bg-amber-50 border border-amber-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        depositVerified ? 'bg-green-500' : 'bg-amber-500'
                      )}
                    >
                      {depositVerified ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Clock className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">დეპოზიტი</p>
                      <p className="text-xs text-gray-500">
                        Deposit ({reservation.depositAmount} GEL)
                      </p>
                    </div>
                  </div>
                  <CreditCard
                    className={cn(
                      'w-5 h-5',
                      depositVerified ? 'text-green-500' : 'text-amber-500'
                    )}
                  />
                </div>
              )}
            </div>

            {/* Status Message */}
            <div
              className={cn(
                'mt-6 p-5 rounded-xl text-center',
                allVerified
                  ? 'bg-green-50 border border-green-100'
                  : passportRejected
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-[#F8FAFC] border border-gray-100'
              )}
            >
              {allVerified ? (
                <>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-bold text-green-800">
                    ყველაფერი მზადაა!
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Everything is ready! Press Continue.
                  </p>
                </>
              ) : passportRejected ? (
                <>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="font-bold text-red-800">
                    პასპორტი უარყოფილია
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Your passport was rejected. Please re-upload.
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A] mx-auto mb-3" />
                  <p className="font-bold text-gray-800">
                    გთხოვთ დაელოდოთ...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please wait while the owner approves your passport...
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {allVerified && (
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 shadow-lg shadow-green-200 active:scale-[0.99] mb-6"
          >
            {isCompleting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                დამუშავება... / Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4" />
                გაგრძელება / Continue
              </span>
            )}
          </button>
        )}

        {/* Footer */}
        <div className="text-center pb-8 text-xs text-gray-400">
          <p>SmartCheckin.ge &bull; Secure Digital Check-in</p>
        </div>
      </div>
    </div>
  )
}
