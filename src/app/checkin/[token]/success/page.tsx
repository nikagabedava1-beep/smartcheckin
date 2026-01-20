'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Check,
  DoorOpen,
  MapPin,
  Loader2,
  Building2,
  ChevronRight,
  Key,
  Clock,
  Info,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

interface ReservationData {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  apartment: {
    name: string
    address: string
    buildingEntryCode: string | null
    buildingEntryInstructions: string | null
  }
  accessCode: {
    code: string
    validFrom: string
    validUntil: string
  } | null
}

export default function CheckInSuccessPage() {
  const params = useParams()
  const token = params.token as string
  const { language, t: translate } = useLanguage()

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockSuccess, setUnlockSuccess] = useState(false)

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
    setIsUnlocking(true)
    setUnlockSuccess(false)

    try {
      const res = await fetch(`/api/checkin/${token}/unlock`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'Access code not valid at this time') {
          toast.error(language === 'ka'
            ? 'კარის გაღება შესაძლებელია მხოლოდ დაჯავშნის პერიოდში'
            : 'Door access only available during reservation period')
        } else {
          toast.error(language === 'ka' ? 'ვერ გაიღო კარი' : 'Failed to unlock door')
        }
        return
      }

      setUnlockSuccess(true)
      toast.success(language === 'ka' ? 'კარი გაიღო!' : 'Door unlocked!')

      setTimeout(() => setUnlockSuccess(false), 3000)
    } catch {
      toast.error(language === 'ka' ? 'ვერ გაიღო კარი' : 'Failed to unlock door')
    } finally {
      setIsUnlocking(false)
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
        {/* Language Switcher */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>

        <Card className="max-w-md w-full text-center p-8">
          <p className="text-red-600">
            {language === 'ka' ? 'ბმული ვერ მოიძებნა' : 'Link not found'}
          </p>
        </Card>
      </div>
    )
  }

  // Simple 2-step flow: Passport → Final
  const steps = [
    { id: 'passport', label: t.guest.step1 },
    { id: 'complete', label: t.guest.step2 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8 px-4">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 rounded-2xl mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">SmartCheckin.ge</h1>
        </div>

        {/* Progress Steps - All Complete */}
        <div className="flex items-center justify-center gap-2 mb-6">
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

        {/* Access Time Notification */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  {language === 'ka'
                    ? 'კარის გაღება შესაძლებელია მხოლოდ დაჯავშნის პერიოდში'
                    : 'Door access is only available during your reservation period'}
                </p>
                <div className="mt-2 text-xs bg-blue-100 rounded px-2 py-1 inline-block">
                  {new Date(reservation.checkIn).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US')} {new Date(reservation.checkIn).toLocaleTimeString(language === 'ka' ? 'ka-GE' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(reservation.checkOut).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US')} {new Date(reservation.checkOut).toLocaleTimeString(language === 'ka' ? 'ka-GE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Building Entry Card */}
        {(reservation.apartment.buildingEntryCode || reservation.apartment.buildingEntryInstructions) && (
          <Card className="mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {language === 'ka' ? 'შენობის შესასვლელი' : 'Building Entrance'}
                  </h3>
                  {reservation.apartment.buildingEntryCode && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        {language === 'ka' ? 'კოდი:' : 'Code:'}
                      </p>
                      <p className="text-2xl font-bold text-yellow-600 tracking-wider">
                        {reservation.apartment.buildingEntryCode}
                      </p>
                    </div>
                  )}
                  {reservation.apartment.buildingEntryInstructions && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                      <p className="flex items-start gap-1">
                        <Info className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                        {reservation.apartment.buildingEntryInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruction Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg text-center">
              <p className="font-semibold">
                {language === 'ka'
                  ? 'კარის გასაღებად დააჭირეთ მწვანე ღილაკს'
                  : 'To open the door press the green button'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Big Green Circle Open Door Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleUnlockDoor}
            disabled={isUnlocking}
            className={cn(
              'w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl',
              'active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300',
              unlockSuccess
                ? 'bg-green-400 shadow-green-300'
                : 'bg-green-500 hover:bg-green-600 hover:shadow-2xl hover:shadow-green-200'
            )}
          >
            {isUnlocking ? (
              <Loader2 className="w-20 h-20 text-white animate-spin" />
            ) : unlockSuccess ? (
              <Check className="w-20 h-20 text-white" />
            ) : (
              <DoorOpen className="w-20 h-20 text-white" />
            )}
            <span className="text-white font-bold mt-2 text-xl">
              {unlockSuccess
                ? (language === 'ka' ? 'გაიღო!' : 'Opened!')
                : (language === 'ka' ? 'გაღება' : 'Open')}
            </span>
          </button>
        </div>

        {/* Apartment Info & Map */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-lg text-center">
              {reservation.apartment.name}
            </h3>
            <div className="flex items-center justify-center text-gray-600 mb-4">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              <span>{reservation.apartment.address}</span>
            </div>

            {/* Google Maps Link - Opens directions */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(reservation.apartment.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-blue-100 hover:from-green-100 hover:to-blue-200 transition-all cursor-pointer border-2 border-gray-200 hover:border-green-300">
                {/* Map placeholder with icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-3">
                    <MapPin className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow">
                    <span className="text-gray-800 font-medium">
                      {language === 'ka' ? 'მიმართულების ნახვა' : 'Get Directions'}
                    </span>
                  </div>
                </div>
                {/* Decorative map lines */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 left-0 right-0 h-px bg-gray-400"></div>
                  <div className="absolute top-2/4 left-0 right-0 h-px bg-gray-400"></div>
                  <div className="absolute top-3/4 left-0 right-0 h-px bg-gray-400"></div>
                  <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gray-400"></div>
                  <div className="absolute left-2/4 top-0 bottom-0 w-px bg-gray-400"></div>
                  <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gray-400"></div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>SmartCheckin.ge • {language === 'ka' ? 'სმარტ ჩექინი' : 'Smart Check-in'}</p>
        </div>
      </div>
    </div>
  )
}
