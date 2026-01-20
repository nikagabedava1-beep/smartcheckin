'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CreditCard,
  Loader2,
  Building2,
  ChevronRight,
  Check,
  Shield,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { t } from '@/lib/translations'
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

  // Mock card form state
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

      // If deposit already paid, go to verification
      if (data.deposit?.status === 'paid') {
        router.replace(`/checkin/${token}/verify`)
        return
      }

      // If no deposit required, go to verification
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
      // Call the payment API
      const res = await fetch(`/api/checkin/${token}/pay-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Mock payment data - in production this would go to BOG
          cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        }),
      })

      if (!res.ok) throw new Error('Payment failed')

      setPaymentStep('success')
      toast.success('გადახდა წარმატებით შესრულდა! / Payment successful!')

      // Wait a moment then redirect to verification page
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!reservation) {
    return null
  }

  const steps = [
    { id: 'passport', label: t.guest.step1 },
    { id: 'deposit', label: t.guest.step2 },
    { id: 'complete', label: t.guest.step3 },
  ]

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
                  index === 0
                    ? 'bg-green-500 text-white'
                    : index === 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {index === 0 ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Deposit Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                დეპოზიტის გადახდა
              </h2>
              <p className="text-sm text-gray-500">Deposit Payment</p>
            </div>

            <div className="bg-primary-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">თანხა / Amount:</span>
                <span className="text-2xl font-bold text-primary-700">
                  {reservation.depositAmount} GEL
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                დეპოზიტი დაგიბრუნდებათ გასვლის შემდეგ
                <br />
                Deposit will be refunded after check-out
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        {paymentStep === 'form' && (
          <Card>
            <CardContent className="pt-6">
              {/* BOG Logo Mock */}
              <div className="flex items-center justify-center mb-6">
                <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  BOG iPay
                </div>
                <Shield className="w-5 h-5 text-green-500 ml-2" />
              </div>

              <div className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ბარათის ნომერი / Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ვადა / Expiry
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="***"
                        maxLength={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Card Holder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ბარათის მფლობელი / Card Holder
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                  />
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  className="w-full py-4 text-lg bg-orange-500 hover:bg-orange-600"
                  disabled={isPaying}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  გადახდა / Pay {reservation.depositAmount} GEL
                </Button>

                <p className="text-xs text-center text-gray-500 flex items-center justify-center">
                  <Lock className="w-3 h-3 mr-1" />
                  უსაფრთხო გადახდა / Secure Payment
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing */}
        {paymentStep === 'processing' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">
                  გადახდა მიმდინარეობს...
                </h3>
                <p className="text-gray-500">Processing payment...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {paymentStep === 'success' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  გადახდა წარმატებით შესრულდა!
                </h3>
                <p className="text-gray-500">Payment successful!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>SmartCheckin.ge • სმარტ ჩექინი</p>
        </div>
      </div>
    </div>
  )
}
