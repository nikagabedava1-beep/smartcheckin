import axios from 'axios'

interface ICalEvent {
  uid: string
  summary: string
  description?: string
  startDate: Date
  endDate: Date
  source: 'airbnb' | 'booking' | 'other'
}

interface ParsedCalendar {
  events: ICalEvent[]
  source: string
}

// Simple iCal parser (no external dependencies for basic parsing)
class ICalParser {
  // Fetch and parse iCal from URL
  async fetchAndParse(url: string): Promise<ParsedCalendar> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'CheckIn-Georgia/1.0',
        },
      })

      const events = this.parseICalContent(response.data, url)

      return {
        events,
        source: this.detectSource(url),
      }
    } catch (error) {
      console.error('iCal fetch error:', error)
      throw new Error('Failed to fetch calendar')
    }
  }

  // Parse iCal content string
  parseICalContent(content: string, url?: string): ICalEvent[] {
    const events: ICalEvent[] = []
    const lines = content.split(/\r?\n/)

    let currentEvent: Partial<ICalEvent> | null = null
    let inEvent = false

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // Handle line continuations (lines starting with space or tab)
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        i++
        line += lines[i].substring(1)
      }

      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true
        currentEvent = {
          source: url ? this.detectSource(url) : 'other',
        }
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent && currentEvent.uid && currentEvent.startDate && currentEvent.endDate) {
          events.push(currentEvent as ICalEvent)
        }
        inEvent = false
        currentEvent = null
      } else if (inEvent && currentEvent) {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const [key, ...valueParts] = line.split(':')
          const value = valueParts.join(':')

          // Handle property parameters (e.g., DTSTART;VALUE=DATE:20240101)
          const keyBase = key.split(';')[0]

          switch (keyBase) {
            case 'UID':
              currentEvent.uid = value
              break
            case 'SUMMARY':
              currentEvent.summary = this.unescapeText(value)
              break
            case 'DESCRIPTION':
              currentEvent.description = this.unescapeText(value)
              break
            case 'DTSTART':
              currentEvent.startDate = this.parseDate(value, key)
              break
            case 'DTEND':
              currentEvent.endDate = this.parseDate(value, key)
              break
          }
        }
      }
    }

    return events
  }

  // Parse iCal date format
  private parseDate(value: string, key: string): Date {
    // Check if it's a date-only value (VALUE=DATE)
    const isDateOnly = key.includes('VALUE=DATE') && !key.includes('VALUE=DATE-TIME')

    // Remove any timezone suffix for simple parsing
    const cleanValue = value.replace(/Z$/, '').split('T')[0]

    if (isDateOnly || value.length === 8) {
      // Date only format: YYYYMMDD
      const year = parseInt(cleanValue.substring(0, 4))
      const month = parseInt(cleanValue.substring(4, 6)) - 1
      const day = parseInt(cleanValue.substring(6, 8))
      return new Date(year, month, day)
    } else {
      // Date-time format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
      const year = parseInt(value.substring(0, 4))
      const month = parseInt(value.substring(4, 6)) - 1
      const day = parseInt(value.substring(6, 8))
      const hour = parseInt(value.substring(9, 11)) || 0
      const minute = parseInt(value.substring(11, 13)) || 0
      const second = parseInt(value.substring(13, 15)) || 0

      if (value.endsWith('Z')) {
        return new Date(Date.UTC(year, month, day, hour, minute, second))
      }
      return new Date(year, month, day, hour, minute, second)
    }
  }

  // Unescape iCal text
  private unescapeText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
  }

  // Detect calendar source from URL
  private detectSource(url: string): 'airbnb' | 'booking' | 'other' {
    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes('airbnb.com') || lowerUrl.includes('abnb.me')) {
      return 'airbnb'
    }

    if (lowerUrl.includes('booking.com') || lowerUrl.includes('admin.booking.com')) {
      return 'booking'
    }

    return 'other'
  }

  // Filter events to only include future or ongoing reservations
  filterActiveEvents(events: ICalEvent[], includeOngoing: boolean = true): ICalEvent[] {
    const now = new Date()

    return events.filter((event) => {
      if (includeOngoing) {
        // Include events that haven't ended yet
        return event.endDate >= now
      } else {
        // Only include future events
        return event.startDate >= now
      }
    })
  }

  // Extract guest info from Airbnb summary/description
  extractGuestInfo(event: ICalEvent): { name: string; phone?: string } {
    let name = 'Guest'
    let phone: string | undefined

    // Airbnb format: "Guest Name - Blocked" or "Reserved"
    if (event.summary) {
      // Remove common suffixes
      name = event.summary
        .replace(/\s*-\s*(Reserved|Blocked|Not available)$/i, '')
        .replace(/\(.*\)$/, '')
        .trim()

      // If it's just "Reserved" or "Blocked", use generic name
      if (/^(Reserved|Blocked|Not available|Unavailable)$/i.test(name)) {
        name = 'Guest'
      }
    }

    // Try to extract phone from description
    if (event.description) {
      const phoneMatch = event.description.match(/(?:Phone|Tel|Mobile):\s*(\+?[\d\s-]+)/i)
      if (phoneMatch) {
        phone = phoneMatch[1].replace(/[\s-]/g, '')
      }
    }

    return { name, phone }
  }
}

export const icalParser = new ICalParser()
export type { ICalEvent, ParsedCalendar }
