'use client'

import { cn } from '@/lib/utils'
import type { BilingualText } from '@/lib/translations'

interface BilingualTextProps {
  text: BilingualText
  className?: string
  kaClassName?: string
  enClassName?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'label'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
}

const sizeClasses = {
  xs: { ka: 'text-xs', en: 'text-[10px]' },
  sm: { ka: 'text-sm', en: 'text-xs' },
  base: { ka: 'text-base', en: 'text-sm' },
  lg: { ka: 'text-lg', en: 'text-sm' },
  xl: { ka: 'text-xl', en: 'text-base' },
  '2xl': { ka: 'text-2xl', en: 'text-lg' },
  '3xl': { ka: 'text-3xl', en: 'text-xl' },
}

export function BilingualText({
  text,
  className,
  kaClassName,
  enClassName,
  as: Component = 'div',
  size = 'base',
}: BilingualTextProps) {
  const sizes = sizeClasses[size]

  return (
    <Component className={cn('flex flex-col', className)}>
      <span className={cn(sizes.ka, 'font-medium text-gray-900', kaClassName)}>
        {text.ka}
      </span>
      <span className={cn(sizes.en, 'text-gray-500', enClassName)}>
        {text.en}
      </span>
    </Component>
  )
}

// Inline bilingual text (side by side)
interface InlineBilingualProps {
  text: BilingualText
  className?: string
  separator?: string
}

export function InlineBilingual({ text, className, separator = ' / ' }: InlineBilingualProps) {
  return (
    <span className={className}>
      <span className="font-medium">{text.ka}</span>
      <span className="text-gray-500">{separator}{text.en}</span>
    </span>
  )
}
