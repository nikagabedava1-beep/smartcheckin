'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { BilingualText } from '@/lib/translations'

export interface SelectOption {
  value: string
  label: string | BilingualText
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: BilingualText | string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block mb-1.5">
            {typeof label === 'string' ? (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            ) : (
              <>
                <span className="block text-sm font-medium text-gray-900">{label.ka}</span>
                <span className="block text-xs text-gray-500">{label.en}</span>
              </>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full px-3 py-2 rounded-lg border border-gray-300',
            'text-gray-900 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {typeof option.label === 'string'
                ? option.label
                : `${option.label.ka} / ${option.label.en}`}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
