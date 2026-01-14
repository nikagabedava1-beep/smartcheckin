'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BilingualText } from '@/lib/translations'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: BilingualText | string
  description?: BilingualText | string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                  sizes[size]
                )}
              >
                <div className="flex items-start justify-between">
                  {title && (
                    <Dialog.Title as="div" className="flex-1">
                      {typeof title === 'string' ? (
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900">{title.ka}</h3>
                          <p className="text-sm text-gray-500">{title.en}</p>
                        </>
                      )}
                    </Dialog.Title>
                  )}
                  <button
                    type="button"
                    className="ml-4 text-gray-400 hover:text-gray-500 transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {description && (
                  <div className="mt-2">
                    {typeof description === 'string' ? (
                      <p className="text-sm text-gray-500">{description}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">{description.ka}</p>
                        <p className="text-xs text-gray-400">{description.en}</p>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: BilingualText | string
  message: BilingualText | string
  confirmText?: BilingualText | string
  cancelText?: BilingualText | string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = { ka: 'დადასტურება', en: 'Confirm' },
  cancelText = { ka: 'გაუქმება', en: 'Cancel' },
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const buttonVariants = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="mb-4">
        {typeof message === 'string' ? (
          <p className="text-gray-600">{message}</p>
        ) : (
          <>
            <p className="text-gray-700">{message.ka}</p>
            <p className="text-sm text-gray-500">{message.en}</p>
          </>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          onClick={onClose}
          disabled={isLoading}
        >
          {typeof cancelText === 'string' ? cancelText : `${cancelText.ka} / ${cancelText.en}`}
        </button>
        <button
          type="button"
          className={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
            buttonVariants[variant],
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </span>
          ) : typeof confirmText === 'string' ? (
            confirmText
          ) : (
            `${confirmText.ka} / ${confirmText.en}`
          )}
        </button>
      </div>
    </Modal>
  )
}
