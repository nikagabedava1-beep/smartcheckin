'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link2, Unlink, RefreshCw, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BilingualText } from '@/components/ui/bilingual-text'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface TTLockStatus {
  connected: boolean
  isExpired?: boolean
  expiresAt?: string
}

interface TTLockLock {
  lockId: number
  lockName: string
  lockAlias: string
  lockMac: string
  electricQuantity: number
  hasGateway: number
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [ttlockStatus, setTTLockStatus] = useState<TTLockStatus | null>(null)
  const [locks, setLocks] = useState<TTLockLock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLocks, setIsLoadingLocks] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    // Check for success/error messages from OAuth callback
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'ttlock_connected') {
      toast.success('TTLock დაკავშირებულია! / TTLock connected successfully!')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        ttlock_auth_failed: 'TTLock ავტორიზაცია ვერ მოხერხდა / TTLock authorization failed',
        ttlock_state_mismatch: 'უსაფრთხოების შეცდომა / Security error',
        ttlock_no_code: 'კოდი არ მიღებულა / No authorization code received',
        ttlock_callback_failed: 'შეცდომა დაკავშირებისას / Connection error',
      }
      toast.error(errorMessages[error] || 'Unknown error')
    }

    fetchTTLockStatus()
  }, [searchParams])

  const fetchTTLockStatus = async () => {
    try {
      const res = await fetch('/api/ttlock/status')
      const data = await res.json()
      setTTLockStatus(data)

      if (data.connected && !data.isExpired) {
        fetchLocks()
      }
    } catch {
      toast.error('Failed to check TTLock status')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLocks = async () => {
    setIsLoadingLocks(true)
    try {
      const res = await fetch('/api/ttlock/locks')
      const data = await res.json()

      if (res.ok) {
        setLocks(data.locks || [])
      } else {
        console.error('Failed to fetch locks:', data.error)
      }
    } catch {
      console.error('Failed to fetch locks')
    } finally {
      setIsLoadingLocks(false)
    }
  }

  const handleConnect = () => {
    window.location.href = '/api/ttlock/authorize'
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const res = await fetch('/api/ttlock/status', { method: 'DELETE' })
      if (res.ok) {
        setTTLockStatus({ connected: false })
        setLocks([])
        toast.success('TTLock გათიშულია / TTLock disconnected')
      }
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <BilingualText
          text={{ ka: 'პარამეტრები', en: 'Settings' }}
          as="h1"
          size="2xl"
        />
      </div>

      {/* TTLock Integration */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">TTLock</h2>
                <p className="text-sm text-gray-500">
                  ჭკვიანი საკეტების ინტეგრაცია / Smart Lock Integration
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
            ) : ttlockStatus?.connected ? (
              <Badge variant={ttlockStatus.isExpired ? 'warning' : 'success'}>
                {ttlockStatus.isExpired ? (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    ვადაგასული / Expired
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    დაკავშირებული / Connected
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="default">
                არ არის დაკავშირებული / Not Connected
              </Badge>
            )}
          </div>

          {/* Connection Actions */}
          <div className="flex gap-3 mb-6">
            {!ttlockStatus?.connected ? (
              <Button onClick={handleConnect} leftIcon={<Link2 className="w-4 h-4" />}>
                დაკავშირება / Connect TTLock
              </Button>
            ) : (
              <>
                {ttlockStatus.isExpired && (
                  <Button onClick={handleConnect} leftIcon={<RefreshCw className="w-4 h-4" />}>
                    ხელახლა დაკავშირება / Reconnect
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={handleDisconnect}
                  isLoading={isDisconnecting}
                  leftIcon={<Unlink className="w-4 h-4" />}
                >
                  გათიშვა / Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Available Locks */}
          {ttlockStatus?.connected && !ttlockStatus.isExpired && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  ხელმისაწვდომი საკეტები / Available Locks
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchLocks}
                  disabled={isLoadingLocks}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingLocks ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {isLoadingLocks ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : locks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>საკეტები არ მოიძებნა / No locks found</p>
                  <p className="text-sm mt-1">
                    დარწმუნდით რომ საკეტი დაკავშირებულია TTLock აპლიკაციაში
                  </p>
                  <p className="text-sm">
                    Make sure your lock is connected in the TTLock app
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locks.map((lock) => (
                    <div
                      key={lock.lockId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{lock.lockAlias || lock.lockName}</p>
                          <p className="text-sm text-gray-500">ID: {lock.lockId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge
                            variant={lock.hasGateway ? 'success' : 'warning'}
                            size="sm"
                          >
                            {lock.hasGateway ? 'Gateway' : 'No Gateway'}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            {lock.electricQuantity}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {locks.length > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  საკეტების ბინებთან დასაკავშირებლად გადადით &quot;ბინები&quot; გვერდზე
                  <br />
                  To assign locks to apartments, go to the &quot;Apartments&quot; page
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium text-gray-900 mb-2">
            როგორ მუშაობს TTLock ინტეგრაცია?
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. დააკავშირეთ თქვენი TTLock ანგარიში ზემოთ მოცემული ღილაკით</li>
            <li>2. მიიღეთ ხელმისაწვდომი საკეტების სია</li>
            <li>3. მიანიჭეთ საკეტი თითოეულ ბინას</li>
            <li>4. სტუმრები ავტომატურად მიიღებენ წვდომის კოდს ჩექინის დროს</li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium text-gray-900 mb-2">
              How does TTLock integration work?
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>1. Connect your TTLock account using the button above</li>
              <li>2. View your available locks</li>
              <li>3. Assign a lock to each apartment</li>
              <li>4. Guests will automatically receive access codes during check-in</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
