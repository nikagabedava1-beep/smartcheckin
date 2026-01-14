import axios from 'axios'

interface WhatsAppConfig {
  token: string
  phoneId: string
  apiUrl: string
}

interface MessageTemplate {
  name: string
  language: string
  components?: TemplateComponent[]
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: TemplateParameter[]
}

interface TemplateParameter {
  type: 'text' | 'image' | 'document'
  text?: string
  image?: { link: string }
}

interface SendMessageResult {
  messageId: string
  status: 'sent' | 'failed'
}

class WhatsAppClient {
  private config: WhatsAppConfig

  constructor() {
    this.config = {
      token: process.env.WHATSAPP_TOKEN || '',
      phoneId: process.env.WHATSAPP_PHONE_ID || '',
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    }
  }

  // Send text message
  async sendTextMessage(to: string, text: string): Promise<SendMessageResult> {
    const formattedPhone = this.formatPhoneNumber(to)

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/${this.config.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        messageId: response.data.messages[0].id,
        status: 'sent',
      }
    } catch (error) {
      console.error('WhatsApp send error:', error)
      return {
        messageId: '',
        status: 'failed',
      }
    }
  }

  // Send check-in link message
  async sendCheckInLink(
    to: string,
    guestName: string,
    apartmentName: string,
    checkInDate: string,
    checkInLink: string
  ): Promise<SendMessageResult> {
    const message = `გამარჯობა ${guestName}! / Hello ${guestName}!

თქვენი დაჯავშნა დადასტურებულია.
Your reservation is confirmed.

ბინა / Apartment: ${apartmentName}
შემოსვლა / Check-in: ${checkInDate}

გთხოვთ დაასრულოთ რეგისტრაცია ბმულზე:
Please complete your check-in at:
${checkInLink}

მადლობა! / Thank you!
SmartCheckin.ge`

    return this.sendTextMessage(to, message)
  }

  // Send access code message
  async sendAccessCode(
    to: string,
    guestName: string,
    accessCode: string,
    validFrom: string,
    validUntil: string,
    address: string
  ): Promise<SendMessageResult> {
    const message = `გამარჯობა ${guestName}! / Hello ${guestName}!

თქვენი წვდომის კოდი / Your access code:
🔑 ${accessCode}

მოქმედებს / Valid:
${validFrom} - ${validUntil}

მისამართი / Address:
📍 ${address}

გისურვებთ სასიამოვნო დასვენებას!
Enjoy your stay!

SmartCheckin.ge`

    return this.sendTextMessage(to, message)
  }

  // Send checkout reminder
  async sendCheckoutReminder(
    to: string,
    guestName: string,
    checkOutDate: string,
    checkOutTime: string
  ): Promise<SendMessageResult> {
    const message = `გამარჯობა ${guestName}! / Hello ${guestName}!

შეგახსენებთ, რომ გასვლის დრო არის:
Reminder: Check-out time is:
📅 ${checkOutDate} ${checkOutTime}

გთხოვთ დარწმუნდეთ, რომ:
Please make sure to:
- დატოვეთ გასაღებები ბინაში / Leave keys in apartment
- გამორთეთ ელ.მოწყობილობები / Turn off electronics

მადლობა დასვენებისთვის!
Thank you for staying!

SmartCheckin.ge`

    return this.sendTextMessage(to, message)
  }

  // Format phone number to international format
  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and parentheses
    let formatted = phone.replace(/[\s\-\(\)]/g, '')

    // Add Georgia country code if not present
    if (formatted.startsWith('5') && formatted.length === 9) {
      formatted = '995' + formatted
    }

    // Remove leading + if present
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1)
    }

    return formatted
  }

  // Check if credentials are configured
  isConfigured(): boolean {
    return !!(this.config.token && this.config.phoneId)
  }

  // Send template message (for approved templates)
  async sendTemplate(to: string, template: MessageTemplate): Promise<SendMessageResult> {
    const formattedPhone = this.formatPhoneNumber(to)

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/${this.config.phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: template.name,
            language: { code: template.language },
            components: template.components,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        messageId: response.data.messages[0].id,
        status: 'sent',
      }
    } catch (error) {
      console.error('WhatsApp template error:', error)
      return {
        messageId: '',
        status: 'failed',
      }
    }
  }
}

export const whatsappClient = new WhatsAppClient()
export type { WhatsAppConfig, MessageTemplate, SendMessageResult }
