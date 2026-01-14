'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  Check,
  CreditCard,
  ChevronRight,
  Building2,
  Calendar,
  MapPin,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BilingualText } from '@/components/ui/bilingual-text'
import { t } from '@/lib/translations'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ReservationData {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  status: string
  apartment: {
    name: string
    address: string
  }
  guest: {
    passportImages: string[]
    consentGiven: boolean
  } | null
  deposit: {
    amount: string
    status: string
  } | null
  accessCode: {
    code: string
    validFrom: string
    validUntil: string
  } | null
  depositRequired: boolean
  depositAmount: string | null
}

type Step = 'passport' | 'consent' | 'deposit'

export default function CheckInPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<Step>('passport')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchReservation()
  }, [token])

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/checkin/${token}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('not_found')
        } else {
          setError('error')
        }
        return
      }

      const data = await res.json()
      setReservation(data)

      // Redirect to success page if already completed
      if (data.accessCode || data.status === 'checked_in') {
        router.replace(`/checkin/${token}/success`)
        return
      }

      // Determine current step based on state
      if (data.deposit?.status === 'pending' && data.depositRequired) {
        setCurrentStep('deposit')
      } else if (data.guest?.consentGiven) {
        if (data.depositRequired && data.deposit?.status === 'pending') {
          setCurrentStep('deposit')
        }
        // If consent given and no deposit required, will complete and redirect
      } else if (data.guest?.passportImages?.length > 0) {
        setCurrentStep('consent')
      }
    } catch {
      setError('error')
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadPassport = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one passport image')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      uploadedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const res = await fetch(`/api/checkin/${token}/passport`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      toast.success('Passport uploaded successfully')

      // Check if deposit is required
      if (reservation?.depositRequired && (!reservation?.deposit || reservation?.deposit?.status !== 'paid')) {
        // Go to deposit payment page
        router.push(`/checkin/${token}/deposit`)
      } else {
        // Go to verification page
        router.push(`/checkin/${token}/verify`)
      }
    } catch {
      toast.error('Failed to upload passport')
    } finally {
      setIsUploading(false)
    }
  }

  const handleConsent = async () => {
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/checkin/${token}/consent`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to save consent')

      toast.success('Consent saved')

      if (reservation?.depositRequired) {
        // Go to deposit step if deposit is required and not yet paid
        if (!reservation?.deposit || reservation?.deposit?.status !== 'paid') {
          setCurrentStep('deposit')
          fetchReservation()
          return
        }
      }
      // Complete check-in if no deposit required or already paid
      await completeCheckIn()
    } catch {
      toast.error('Failed to save consent')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayDeposit = async () => {
    setIsProcessing(true)

    try {
      const res = await fetch(`/api/checkin/${token}/pay-deposit`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Payment failed')

      const data = await res.json()

      if (data.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.paymentUrl
      } else {
        // Payment completed (mock mode)
        toast.success('Deposit paid successfully')
        await completeCheckIn()
        fetchReservation()
      }
    } catch {
      toast.error('Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const completeCheckIn = async () => {
    try {
      const res = await fetch(`/api/checkin/${token}/complete`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to complete check-in')

      // Redirect to success page
      router.push(`/checkin/${token}/success`)
    } catch {
      toast.error('Failed to complete check-in')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {t.common.loading.ka}
            <br />
            <span className="text-sm">{t.common.loading.en}</span>
          </p>
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t.guest.invalidLink.ka}</h1>
            <p className="text-gray-600">{t.guest.invalidLink.en}</p>
            <p className="mt-4 text-sm text-gray-500">
              {t.guest.reservationNotFound.ka}
              <br />
              {t.guest.reservationNotFound.en}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = [
    { id: 'passport', label: t.guest.step1 },
    { id: 'complete', label: t.guest.step2 },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t.guest.welcomeTitle.ka}</h1>
          <p className="text-gray-600">{t.guest.welcomeTitle.en}</p>
        </div>

        {/* Reservation Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{reservation.apartment.name}</h2>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {reservation.apartment.address}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(reservation.checkIn).toLocaleDateString('ka-GE')} -{' '}
                  {new Date(reservation.checkOut).toLocaleDateString('ka-GE')}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {t.guest.welcomeSubtitle.ka}
                  <br />
                  <span className="text-xs">{t.guest.welcomeSubtitle.en}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {/* Passport Upload Step */}
            {currentStep === 'passport' && (
              <div>
                <BilingualText text={t.guest.uploadPassport} as="h2" size="xl" className="mb-2" />
                <p className="text-gray-500 mb-6">
                  {t.guest.uploadPassportDesc.ka}
                  <br />
                  <span className="text-sm">{t.guest.uploadPassportDesc.en}</span>
                </p>

                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400'
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {t.guest.dragDropFiles.ka}
                    <br />
                    <span className="text-sm">{t.guest.dragDropFiles.en}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.guest.supportedFormats.ka} • {t.guest.maxFileSize.ka}
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {t.guest.uploadedFiles.ka} / {t.guest.uploadedFiles.en}:
                    </p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full mt-6"
                  onClick={handleUploadPassport}
                  isLoading={isUploading}
                  disabled={uploadedFiles.length === 0}
                >
                  {t.common.next.ka} / {t.common.next.en}
                </Button>
              </div>
            )}

            {/* Consent Step */}
            {currentStep === 'consent' && (
              <div>
                <BilingualText text={t.guest.consentTitle} as="h2" size="xl" className="mb-2" />

                <div className="bg-gray-50 rounded-xl p-6 my-6">
                  <p className="text-gray-700 mb-4">{t.guest.consentText.ka}</p>
                  <p className="text-sm text-gray-500">{t.guest.consentText.en}</p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleConsent}
                  isLoading={isProcessing}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {t.guest.agreeConsent.ka} / {t.guest.agreeConsent.en}
                </Button>
              </div>
            )}

            {/* Deposit Step */}
            {currentStep === 'deposit' && reservation.deposit && (
              <div>
                <BilingualText text={t.guest.depositRequired} as="h2" size="xl" className="mb-2" />

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 my-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700">
                      {t.guest.depositAmount.ka} / {t.guest.depositAmount.en}:
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {reservation.deposit.amount} GEL
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t.guest.depositInfo.ka}
                    <br />
                    {t.guest.depositInfo.en}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handlePayDeposit}
                  isLoading={isProcessing}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  {t.guest.payDeposit.ka} / {t.guest.payDeposit.en}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>SmartCheckin.ge • სმარტ ჩექინი</p>
        </div>
      </div>
    </div>
  )
}
