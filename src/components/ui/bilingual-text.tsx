'use client'

import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import type { BilingualText as BilingualTextType } from '@/lib/translations'

interface BilingualTextProps {
  text: BilingualTextType
  className?: string
  kaClassName?: string
  enClassName?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'label'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
}

export function BilingualText({
  text,
  className,
  kaClassName,
  enClassName,
  as: Component = 'div',
  size = 'base',
}: BilingualTextProps) {
  const { language } = useLanguage()
  const sizeClass = sizeClasses[size]

  return (
    <Component
      className={cn(
        sizeClass,
        'font-medium text-gray-900',
        className,
        language === 'ka' ? kaClassName : enClassName
      )}
    >
      {text[language]}
    </Component>
  )
}

// Inline bilingual text (shows only selected language)
interface InlineBilingualProps {
  text: BilingualTextType
  className?: string
  separator?: string // Kept for API compatibility but not used anymore
}

export function InlineBilingual({ text, className }: InlineBilingualProps) {
  const { language } = useLanguage()

  return (
    <span className={cn('font-medium', className)}>
      {text[language]}
    </span>
  )
}
