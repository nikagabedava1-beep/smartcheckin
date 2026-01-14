'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { t } from '@/lib/translations'
import toast from 'react-hot-toast'

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('admin-login', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(`${t.auth.invalidCredentials.ka} / ${t.auth.invalidCredentials.en}`)
      } else {
        const callbackUrl = searchParams.get('callbackUrl')
        router.push(callbackUrl || '/admin')
        router.refresh()
      }
    } catch {
      toast.error(`${t.messages.errorOccurred.ka} / ${t.messages.errorOccurred.en}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SmartCheckin.ge</h1>
          <p className="text-gray-400">ადმინისტრატორის პანელი / Admin Panel</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  label={t.auth.email}
                  placeholder="admin@smartcheckin.ge"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              <div>
                <Input
                  type="password"
                  label={t.auth.password}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                <Lock className="w-4 h-4 mr-2" />
                <span>{t.auth.loginButton.ka}</span>
                <span className="ml-1 opacity-80">/ {t.auth.loginButton.en}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900">Loading...</div>}>
      <AdminLoginContent />
    </Suspense>
  )
}
