'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  Check,
  CreditCard,
  Calendar,
  MapPin,
  X,
  AlertCircle,
  Loader2,
  Shield,
  FileImage,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/translations'
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

      if (data.accessCode || data.status === 'checked_in') {
        router.replace(`/checkin/${token}/success`)
        return
      }

      if (data.deposit?.status === 'pending' && data.depositRequired) {
        setCurrentStep('deposit')
      } else if (data.guest?.consentGiven) {
        if (data.depositRequired && data.deposit?.status === 'pending') {
          setCurrentStep('deposit')
        }
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
    maxSize: 10 * 1024 * 1024,
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

      if (reservation?.depositRequired && (!reservation?.deposit || reservation?.deposit?.status !== 'paid')) {
        router.push(`/checkin/${token}/deposit`)
      } else {
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
        if (!reservation?.deposit || reservation?.deposit?.status !== 'paid') {
          setCurrentStep('deposit')
          fetchReservation()
          return
        }
      }
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
        window.location.href = data.paymentUrl
      } else {
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

      router.push(`/checkin/${token}/success`)
    } catch {
      toast.error('Failed to complete check-in')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A] mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">
            {t.common.loading.ka}
            <br />
            <span className="text-xs text-gray-400">{t.common.loading.en}</span>
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t.guest.invalidLink.ka}</h1>
          <p className="text-gray-500">{t.guest.invalidLink.en}</p>
          <p className="mt-4 text-sm text-gray-400">
            {t.guest.reservationNotFound.ka}
            <br />
            {t.guest.reservationNotFound.en}
          </p>
        </div>
      </div>
    )
  }

  const steps = [
    { id: 'passport', label: { ka: 'რეგისტრაცია', en: 'Registration' } },
    { id: 'complete', label: { ka: 'წვდომა', en: 'Access' } },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#2563EB] pt-10 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          {/* Logo */}
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

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            ციფრული რეგისტრაცია
          </h1>
          <p className="text-blue-200 text-sm font-medium mb-1">
            Digital Check-in
          </p>
          <p className="text-blue-300/80 text-xs max-w-sm mx-auto mt-3 leading-relaxed">
            გთხოვთ შეავსოთ რეგისტრაცია ბინაში შესვლამდე
            <br />
            Please complete registration before apartment access
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-10">
        {/* Apartment Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#1E3A8A]/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg leading-tight">
                {reservation.apartment.name}
              </h2>
              <p className="text-sm text-gray-500">
                {reservation.apartment.address}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-[#F8FAFC] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span className="text-xs text-gray-500 font-medium">Check-in</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(reservation.checkIn)}
              </p>
            </div>
            <div className="flex-1 bg-[#F8FAFC] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span className="text-xs text-gray-500 font-medium">Check-out</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    index < currentStepIndex
                      ? 'bg-green-500 text-white shadow-md shadow-green-200'
                      : index === currentStepIndex
                        ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-200'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
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
                  'w-20 h-0.5 mx-3 mb-5 rounded-full transition-colors duration-300',
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          {/* Passport Upload Step */}
          {currentStep === 'passport' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <FileImage className="w-5 h-5 text-[#1E3A8A]" />
                <h2 className="text-lg font-bold text-gray-900">
                  პასპორტის ატვირთვა
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-6 ml-8">
                Upload Passport
              </p>

              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
                  isDragActive
                    ? 'border-[#1E3A8A] bg-blue-50/50'
                    : 'border-gray-200 bg-[#F1F5F9] hover:border-[#1E3A8A]/40 hover:bg-blue-50/30'
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-7 h-7 text-[#1E3A8A]" />
                </div>
                <p className="text-gray-700 font-medium mb-1">
                  აირჩიეთ ფაილი ან გადმოიტანეთ
                </p>
                <p className="text-sm text-gray-400">
                  Choose file or drag & drop here
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  JPG, PNG, PDF  &bull;  მაქსიმალური ზომა 10MB / Max size 10MB
                </p>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUploadPassport}
                disabled={uploadedFiles.length === 0 || isUploading}
                className={cn(
                  'w-full mt-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]',
                  uploadedFiles.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 active:scale-[0.99] shadow-lg shadow-blue-200'
                )}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    იტვირთება... / Uploading...
                  </span>
                ) : (
                  'გაგრძელება / Continue'
                )}
              </button>

              {/* Trust Message */}
              <div className="flex items-start gap-2 mt-5 p-3 bg-[#F8FAFC] rounded-xl">
                <Shield className="w-4 h-4 text-[#1E3A8A] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  თქვენი მონაცემები დაცულია და გამოიყენება მხოლოდ რეგისტრაციისთვის
                  <br />
                  <span className="text-gray-400">
                    Your data is securely stored and used only for registration
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Consent Step */}
          {currentStep === 'consent' && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t.guest.consentTitle.ka}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {t.guest.consentTitle.en}
              </p>

              <div className="bg-[#F8FAFC] rounded-2xl p-5 mb-6">
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  {t.guest.consentText.ka}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t.guest.consentText.en}
                </p>
              </div>

              <button
                onClick={handleConsent}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A] shadow-lg shadow-blue-200 active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    დამუშავება... / Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    {t.guest.agreeConsent.ka} / {t.guest.agreeConsent.en}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Deposit Step */}
          {currentStep === 'deposit' && reservation.deposit && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t.guest.depositRequired.ka}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {t.guest.depositRequired.en}
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {t.guest.depositAmount.ka} / {t.guest.depositAmount.en}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {reservation.deposit.amount} GEL
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t.guest.depositInfo.ka}
                  <br />
                  <span className="text-gray-400">{t.guest.depositInfo.en}</span>
                </p>
              </div>

              <button
                onClick={handlePayDeposit}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A] shadow-lg shadow-blue-200 active:scale-[0.99]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    დამუშავება... / Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t.guest.payDeposit.ka} / {t.guest.payDeposit.en}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-8 text-xs text-gray-400">
          <p>SmartCheckin.ge &bull; Secure Digital Check-in</p>
        </div>
      </div>
    </div>
  )
}
