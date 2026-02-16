'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Check,
  MapPin,
  Loader2,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

interface ReservationData {
  id: string
  guestName: string
  apartment: {
    name: string
    address: string
    hasSmartLock: boolean
    buildingEntryCode?: string
    buildingEntryInstructions?: string
  }
  accessCode: {
    code: string
    validFrom: string
    validUntil: string
  } | null
}

function LockIcon({ isUnlocked, isUnlocking }: { isUnlocked: boolean; isUnlocking: boolean }) {
  return (
    <svg
      width="120"
      height="140"
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Lock shackle (the U-shaped part) */}
      <g
        className="transition-all duration-700 ease-in-out"
        style={{
          transformOrigin: '80px 55px',
          transform: isUnlocked ? 'rotate(-30deg) translateY(-8px)' : 'rotate(0deg) translateY(0px)',
        }}
      >
        <path
          d="M35 55 L35 35 C35 18 45 8 60 8 C75 8 85 18 85 35 L85 55"
          stroke={isUnlocking ? '#facc15' : isUnlocked ? '#22c55e' : '#ffffff'}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          className="transition-colors duration-500"
        />
      </g>

      {/* Lock body */}
      <rect
        x="20"
        y="55"
        width="80"
        height="70"
        rx="10"
        fill={isUnlocking ? '#eab308' : isUnlocked ? '#22c55e' : '#ffffff'}
        className="transition-colors duration-500"
      />

      {/* Keyhole */}
      {isUnlocking ? (
        <g className="animate-spin" style={{ transformOrigin: '60px 85px' }}>
          <circle cx="60" cy="82" r="8" fill={isUnlocked ? '#166534' : '#1e3a5f'} />
          <rect x="57" y="86" width="6" height="14" rx="3" fill={isUnlocked ? '#166534' : '#1e3a5f'} />
        </g>
      ) : isUnlocked ? (
        /* Checkmark when unlocked */
        <path
          d="M45 87 L55 97 L75 77"
          stroke="#166534"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="animate-[drawCheck_0.4s_ease-out_0.3s_both]"
          strokeDasharray="40"
          strokeDashoffset="0"
        />
      ) : (
        /* Normal keyhole */
        <>
          <circle cx="60" cy="82" r="8" fill="#1e3a5f" />
          <rect x="57" y="86" width="6" height="14" rx="3" fill="#1e3a5f" />
        </>
      )}
    </svg>
  )
}

export default function CheckInSuccessPage() {
  const params = useParams()
  const token = params.token as string

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    fetchReservation()
  }, [token])

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/checkin/${token}`)
      if (!res.ok) {
        setError(true)
        return
      }
      const data = await res.json()
      setReservation(data)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlockDoor = async () => {
    if (isUnlocking || isUnlocked) return

    setIsUnlocking(true)

    try {
      const res = await fetch(`/api/checkin/${token}/unlock`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to unlock')

      if (data.ttlockUnlocked) {
        setIsUnlocking(false)
        setIsUnlocked(true)
        toast.success('კარი გაიღო! / Door unlocked!')

        // Reset after 5 seconds
        setTimeout(() => {
          setIsUnlocked(false)
        }, 5000)
      } else {
        setIsUnlocking(false)
        toast.error('ვერ გაიღო / Could not unlock')
      }
    } catch {
      setIsUnlocking(false)
      toast.error('შეცდომა / Error unlocking')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-red-600">Link not found / ბმული ვერ მოიძებნა</p>
        </Card>
      </div>
    )
  }

  const steps = [
    { id: 'passport', label: t.guest.step1 },
    { id: 'complete', label: t.guest.step2 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 rounded-2xl mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">SmartCheckin.ge</h1>
        </div>

        {/* Progress Steps - All Complete */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-500 text-white">
                <Check className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-green-400" />
              )}
            </div>
          ))}
        </div>

        {/* Lock Button - Main Feature */}
        <div className="flex flex-col items-center mb-8">
          <p className="text-white/80 text-sm mb-4">
            {isUnlocked
              ? 'კარი ღიაა! / Door is open!'
              : 'დააჭირეთ საკეტს გასაღებად / Tap the lock to open'}
          </p>

          <button
            onClick={handleUnlockDoor}
            disabled={isUnlocking || isUnlocked}
            className={`
              relative w-48 h-56 rounded-3xl flex items-center justify-center
              transition-all duration-500 ease-out
              focus:outline-none
              ${isUnlocked
                ? 'bg-green-500/20 shadow-[0_0_60px_rgba(34,197,94,0.4)] scale-105'
                : isUnlocking
                  ? 'bg-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.3)] scale-100'
                  : 'bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-white/15 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95'
              }
            `}
          >
            {/* Pulsing ring when unlocked */}
            {isUnlocked && (
              <>
                <div className="absolute inset-0 rounded-3xl border-2 border-green-400 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-3xl border-2 border-green-400 animate-pulse opacity-50" />
              </>
            )}

            {/* Pulsing ring when unlocking */}
            {isUnlocking && (
              <div className="absolute inset-0 rounded-3xl border-2 border-yellow-400 animate-pulse opacity-50" />
            )}

            <LockIcon isUnlocked={isUnlocked} isUnlocking={isUnlocking} />
          </button>

          {/* Status text */}
          <div className="mt-4 text-center">
            {isUnlocked ? (
              <p className="text-green-400 font-semibold text-lg animate-pulse">
                ღიაა / Unlocked
              </p>
            ) : isUnlocking ? (
              <p className="text-yellow-400 text-sm animate-pulse">
                იღება... / Unlocking...
              </p>
            ) : (
              <p className="text-white/50 text-xs">
                Tap to unlock
              </p>
            )}
          </div>
        </div>

        {/* Building Entry Code */}
        {reservation.apartment.buildingEntryCode && (
          <Card className="mb-6 bg-white/10 border-white/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-white mb-2">
                  შენობის კოდი / Building Entry Code
                </h3>
                <div className="bg-white/10 text-white text-2xl font-mono font-bold py-3 px-4 rounded-xl mb-2">
                  {reservation.apartment.buildingEntryCode}
                </div>
                {reservation.apartment.buildingEntryInstructions && (
                  <p className="text-sm text-white/60">
                    {reservation.apartment.buildingEntryInstructions}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Apartment Info & Map */}
        <Card className="bg-white/10 border-white/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-white mb-2 text-lg text-center">
              {reservation.apartment.name}
            </h3>
            <div className="flex items-center justify-center text-white/70 mb-4">
              <MapPin className="w-5 h-5 mr-2 text-green-400" />
              <span>{reservation.apartment.address}</span>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(reservation.apartment.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-white/20 hover:border-green-400/50">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-3">
                    <MapPin className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                    <span className="text-white/90 font-medium text-sm">
                      მიმართულება / Get Directions
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-white/30">
          <p>SmartCheckin.ge</p>
        </div>
      </div>
    </div>
  )
}
