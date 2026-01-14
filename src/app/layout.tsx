import type { Metadata } from 'next'
import { Inter, Noto_Sans_Georgian } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  variable: '--font-noto-sans-georgian',
})

export const metadata: Metadata = {
  title: 'SmartCheckin.ge | სმარტ ჩექინი',
  description: 'Automated apartment check-in system for short-term rentals | ავტომატური რეგისტრაციის სისტემა მოკლევადიანი გაქირავებისთვის',
  keywords: ['check-in', 'apartment', 'rental', 'Georgia', 'Airbnb', 'smart lock', 'საქართველო', 'ბინა', 'გაქირავება'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ka" className={`${inter.variable} ${notoSansGeorgian.variable}`}>
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
