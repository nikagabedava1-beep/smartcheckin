'use client'

import { Switch } from '@headlessui/react'
import { cn } from '@/lib/utils'
import type { BilingualText } from '@/lib/translations'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: BilingualText | string
  description?: BilingualText | string
  disabled?: boolean
}

export function Toggle({ enabled, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <Switch.Group>
      <div className="flex items-center justify-between">
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && (
              <Switch.Label className="block cursor-pointer">
                {typeof label === 'string' ? (
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                ) : (
                  <>
                    <span className="block text-sm font-medium text-gray-900">{label.ka}</span>
                    <span className="block text-xs text-gray-500">{label.en}</span>
                  </>
                )}
              </Switch.Label>
            )}
            {description && (
              <div className="mt-1">
                {typeof description === 'string' ? (
                  <span className="text-sm text-gray-500">{description}</span>
                ) : (
                  <>
                    <span className="block text-sm text-gray-600">{description.ka}</span>
                    <span className="block text-xs text-gray-400">{description.en}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <Switch
          checked={enabled}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            enabled ? 'bg-primary-600' : 'bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
              enabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  )
}
