'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReservedDate {
  checkIn: string
  checkOut: string
  guestName: string
}

interface DateRangePickerProps {
  reservedDates: ReservedDate[]
  checkIn: Date | null
  checkOut: Date | null
  onCheckInChange: (date: Date | null) => void
  onCheckOutChange: (date: Date | null) => void
}

export function DateRangePicker({
  reservedDates,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingCheckOut, setSelectingCheckOut] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all reserved date ranges as Date objects
  const reservedRanges = useMemo(() => {
    return reservedDates.map((r) => ({
      start: new Date(r.checkIn),
      end: new Date(r.checkOut),
      guestName: r.guestName,
    }))
  }, [reservedDates])

  // Check if a date is reserved
  const isDateReserved = (date: Date): boolean => {
    const checkDate = new Date(date)
    checkDate.setHours(12, 0, 0, 0)

    for (const range of reservedRanges) {
      const start = new Date(range.start)
      start.setHours(0, 0, 0, 0)
      const end = new Date(range.end)
      end.setHours(23, 59, 59, 999)

      if (checkDate >= start && checkDate <= end) {
        return true
      }
    }
    return false
  }

  // Check if a date is in the past
  const isDatePast = (date: Date): boolean => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  // Check if date is in selected range
  const isInSelectedRange = (date: Date): boolean => {
    if (!checkIn || !checkOut) return false
    const checkDate = new Date(date)
    checkDate.setHours(12, 0, 0, 0)
    const start = new Date(checkIn)
    start.setHours(0, 0, 0, 0)
    const end = new Date(checkOut)
    end.setHours(23, 59, 59, 999)
    return checkDate >= start && checkDate <= end
  }

  // Check if selecting this date would cross a reserved period
  const wouldCrossReserved = (date: Date): boolean => {
    if (!checkIn || selectingCheckOut === false) return false

    const start = new Date(checkIn)
    const end = new Date(date)

    if (end <= start) return false

    for (const range of reservedRanges) {
      const resStart = new Date(range.start)
      const resEnd = new Date(range.end)

      // Check if any reserved date falls between checkIn and this date
      if (resStart > start && resStart < end) {
        return true
      }
    }
    return false
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const days: (Date | null)[] = []

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentMonth])

  const handleDateClick = (date: Date) => {
    if (isDateReserved(date) || isDatePast(date)) return

    if (!checkIn || (checkIn && checkOut) || selectingCheckOut === false) {
      // Start new selection
      onCheckInChange(date)
      onCheckOutChange(null)
      setSelectingCheckOut(true)
    } else {
      // Selecting check-out
      if (date <= checkIn) {
        // If selected date is before check-in, restart selection
        onCheckInChange(date)
        onCheckOutChange(null)
      } else if (wouldCrossReserved(date)) {
        // Can't cross reserved dates
        return
      } else {
        onCheckOutChange(date)
        setSelectingCheckOut(false)
      }
    }
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthNames = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ]

  const dayNames = ['კვ', 'ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა']

  return (
    <div className="bg-white border rounded-lg p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />
          }

          const reserved = isDateReserved(date)
          const past = isDatePast(date)
          const disabled = reserved || past
          const isCheckIn = checkIn && date.toDateString() === checkIn.toDateString()
          const isCheckOut = checkOut && date.toDateString() === checkOut.toDateString()
          const inRange = isInSelectedRange(date)
          const crossesReserved = selectingCheckOut && checkIn && wouldCrossReserved(date)

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled || !!crossesReserved}
              onClick={() => handleDateClick(date)}
              className={cn(
                'h-9 w-full rounded text-sm transition-colors relative',
                // Base styles
                !disabled && !crossesReserved && 'hover:bg-primary-100 cursor-pointer',
                // Disabled styles
                disabled && 'cursor-not-allowed',
                past && !reserved && 'text-gray-300',
                reserved && 'bg-red-100 text-red-400 cursor-not-allowed',
                crossesReserved && 'bg-gray-100 text-gray-300 cursor-not-allowed',
                // Selected styles
                isCheckIn && 'bg-primary-600 text-white hover:bg-primary-700',
                isCheckOut && 'bg-primary-600 text-white hover:bg-primary-700',
                inRange && !isCheckIn && !isCheckOut && 'bg-primary-100 text-primary-800',
                // Today
                date.toDateString() === today.toDateString() && !isCheckIn && !isCheckOut && !reserved && 'font-bold'
              )}
            >
              {date.getDate()}
              {reserved && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 rounded border border-red-200" />
          <span className="text-gray-600">დაკავებული / Reserved</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-primary-600 rounded" />
          <span className="text-gray-600">არჩეული / Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-primary-100 rounded" />
          <span className="text-gray-600">დიაპაზონი / Range</span>
        </div>
      </div>

      {/* Selected dates display */}
      <div className="mt-3 pt-3 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">შესვლა / Check-in:</span>
            <p className="font-medium">
              {checkIn ? checkIn.toLocaleDateString('ka-GE') : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">გასვლა / Check-out:</span>
            <p className="font-medium">
              {checkOut ? checkOut.toLocaleDateString('ka-GE') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {checkIn && !checkOut && (
        <p className="mt-2 text-xs text-primary-600">
          აირჩიეთ გასვლის თარიღი / Select check-out date
        </p>
      )}
    </div>
  )
}
