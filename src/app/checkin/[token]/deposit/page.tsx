'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CreditCard,
  Loader2,
  Check,
  Shield,
  Lock,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ReservationData {
  id: string
  guestName: string
  depositRequired: boolean
  depositAmount: string
  apartment: {
    name: string
  }
  deposit: {
    status: string
  } | null
}

export default function DepositPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form')

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardHolder, setCardHolder] = useState('')

  useEffect(() => {
    fetchReservation()
  }, [token])

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/checkin/${token}`)
      if (!res.ok) {
        router.replace(`/checkin/${token}`)
        return
      }
      const data = await res.json()

      if (data.deposit?.status === 'paid') {
        router.replace(`/checkin/${token}/verify`)
        return
      }

      if (!data.depositRequired) {
        router.replace(`/checkin/${token}/verify`)
        return
      }

      setReservation(data)
    } catch {
      router.replace(`/checkin/${token}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !cardHolder) {
      toast.error('Please fill all card details')
      return
    }

    setIsPaying(true)
    setPaymentStep('processing')

    try {
      const res = await fetch(`/api/checkin/${token}/pay-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        }),
      })

      if (!res.ok) throw new Error('Payment failed')

      setPaymentStep('success')
      toast.success('გადახდა წარმატებით შესრულდა! / Payment successful!')

      setTimeout(() => {
        router.push(`/checkin/${token}/verify`)
      }, 1500)
    } catch {
      toast.error('გადახდა ვერ შესრულდა / Payment failed')
      setPaymentStep('form')
    } finally {
      setIsPaying(false)
    }
  }

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

  const steps = [
    { id: 'passport', label: { ka: 'რეგისტრაცია', en: 'Registration' } },
    { id: 'deposit', label: { ka: 'დეპოზიტი', en: 'Deposit' } },
    { id: 'complete', label: { ka: 'წვდომა', en: 'Access' } },
  ]

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
            დეპოზიტის გადახდა
          </h1>
          <p className="text-blue-200 text-sm font-medium">
            Deposit Payment
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
                      index === 0
                        ? 'bg-green-500 text-white shadow-md shadow-green-200'
                        : index === 1
                          ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-200'
                          : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {index === 0 ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-1.5 font-medium',
                    index <= 1 ? 'text-gray-700' : 'text-gray-400'
                  )}>
                    {step.label.ka}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-14 h-0.5 mx-2 mb-5 rounded-full',
                    index === 0 ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deposit Amount Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {reservation.apartment.name}
              </h2>
              <p className="text-sm text-gray-500">
                საგარანტიო დეპოზიტი / Security Deposit
              </p>
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">თანხა / Amount</span>
              <span className="text-3xl font-bold text-[#1E3A8A]">
                {reservation.depositAmount} <span className="text-lg">GEL</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              დეპოზიტი დაგიბრუნდებათ გასვლის შემდეგ / Refunded after check-out
            </p>
          </div>
        </div>

        {/* Payment Form */}
        {paymentStep === 'form' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="p-6">
              {/* Payment Header */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="bg-orange-500 text-white px-4 py-1.5 rounded-lg font-bold text-sm">
                  BOG iPay
                </div>
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-400">Secure</span>
              </div>

              <div className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    ბარათის ნომერი / Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-[#F8FAFC] text-gray-900 placeholder-gray-400"
                    />
                    <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  </div>
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      ვადა / Expiry
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-[#F8FAFC] text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      CVV
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="***"
                        maxLength={3}
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-[#F8FAFC] text-gray-900 placeholder-gray-400"
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </div>

                {/* Card Holder */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    ბარათის მფლობელი / Card Holder
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all bg-[#F8FAFC] text-gray-900 placeholder-gray-400 uppercase"
                  />
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg shadow-orange-200 active:scale-[0.99] mt-2"
                >
                  <span className="flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    გადახდა / Pay {reservation.depositAmount} GEL
                  </span>
                </button>

                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400">
                    უსაფრთხო გადახდა / Secure Payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {paymentStep === 'processing' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 mb-6">
            <div className="text-center">
              <Loader2 className="w-14 h-14 animate-spin text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">
                გადახდა მიმდინარეობს...
              </h3>
              <p className="text-sm text-gray-500 mt-1">Processing payment...</p>
            </div>
          </div>
        )}

        {/* Success */}
        {paymentStep === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                გადახდა წარმატებით შესრულდა!
              </h3>
              <p className="text-sm text-gray-500 mt-1">Payment successful!</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pb-8 text-xs text-gray-400">
          <p>SmartCheckin.ge &bull; Secure Digital Check-in</p>
        </div>
      </div>
    </div>
  )
}
