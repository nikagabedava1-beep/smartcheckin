'use client'

import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { Globe } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'toggle' | 'minimal'
  className?: string
}

export function LanguageSwitcher({ variant = 'toggle', className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setLanguage(language === 'ka' ? 'en' : 'ka')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-colors w-full',
          className
        )}
      >
        <Globe className="w-4 h-4" />
        <span>{language === 'ka' ? 'English' : 'ქართული'}</span>
      </button>
    )
  }

  return (
    <div className={cn('inline-flex rounded-lg bg-white/80 backdrop-blur-sm p-1 shadow-lg', className)}>
      <button
        onClick={() => setLanguage('ka')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
          language === 'ka'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        ქარ
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
          language === 'en'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        ENG
      </button>
    </div>
  )
}
