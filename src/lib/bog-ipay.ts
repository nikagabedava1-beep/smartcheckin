import axios from 'axios'
import crypto from 'crypto'

interface BOGConfig {
  merchantId: string
  secretKey: string
  apiUrl: string
  callbackUrl: string
}

interface PaymentRequest {
  orderId: string
  amount: number
  currency?: string
  description?: string
  language?: string
  preAuth?: boolean
}

interface PaymentResponse {
  transactionId: string
  paymentUrl: string
}

interface PaymentStatus {
  transactionId: string
  orderId: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  resultCode: string
  resultMessage: string
}

interface RefundRequest {
  transactionId: string
  amount?: number
}

class BOGiPayClient {
  private config: BOGConfig

  constructor() {
    this.config = {
      merchantId: process.env.BOG_MERCHANT_ID || '',
      secretKey: process.env.BOG_SECRET_KEY || '',
      apiUrl: process.env.BOG_API_URL || 'https://ipay.ge/opay/api',
      callbackUrl: process.env.BOG_CALLBACK_URL || '',
    }
  }

  // Generate signature for API requests
  private generateSignature(data: Record<string, string | number>): string {
    const sortedKeys = Object.keys(data).sort()
    const signatureString = sortedKeys.map((key) => `${key}=${data[key]}`).join('&')
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signatureString)
      .digest('hex')
      .toUpperCase()
  }

  // Verify callback signature
  verifySignature(data: Record<string, string>, receivedSignature: string): boolean {
    const calculatedSignature = this.generateSignature(data)
    return calculatedSignature === receivedSignature
  }

  // Initiate payment
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const data: Record<string, string | number> = {
      merchant_id: this.config.merchantId,
      order_id: request.orderId,
      amount: Math.round(request.amount * 100), // Convert to tetri
      currency: request.currency || 'GEL',
      description: request.description || 'Deposit payment',
      language: request.language || 'ka',
      callback_url: this.config.callbackUrl,
      preauth: request.preAuth ? '1' : '0',
    }

    data.signature = this.generateSignature(data)

    try {
      const response = await axios.post(`${this.config.apiUrl}/order/create`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Payment creation failed')
      }

      return {
        transactionId: response.data.transaction_id,
        paymentUrl: response.data.payment_url,
      }
    } catch (error) {
      console.error('BOG iPay error:', error)
      throw new Error('Failed to create payment')
    }
  }

  // Get payment status
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    const data: Record<string, string | number> = {
      merchant_id: this.config.merchantId,
      transaction_id: transactionId,
    }

    data.signature = this.generateSignature(data)

    try {
      const response = await axios.post(`${this.config.apiUrl}/order/status`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return {
        transactionId: response.data.transaction_id,
        orderId: response.data.order_id,
        amount: response.data.amount / 100, // Convert from tetri
        currency: response.data.currency,
        status: this.mapStatus(response.data.status),
        resultCode: response.data.result_code,
        resultMessage: response.data.result_message,
      }
    } catch (error) {
      console.error('BOG iPay status error:', error)
      throw new Error('Failed to get payment status')
    }
  }

  // Refund payment
  async refundPayment(request: RefundRequest): Promise<boolean> {
    const data: Record<string, string | number> = {
      merchant_id: this.config.merchantId,
      transaction_id: request.transactionId,
    }

    if (request.amount) {
      data.amount = Math.round(request.amount * 100) // Convert to tetri
    }

    data.signature = this.generateSignature(data)

    try {
      const response = await axios.post(`${this.config.apiUrl}/order/refund`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return response.data.status === 'success'
    } catch (error) {
      console.error('BOG iPay refund error:', error)
      throw new Error('Failed to refund payment')
    }
  }

  // Map BOG status to internal status
  private mapStatus(bogStatus: string): 'pending' | 'success' | 'failed' | 'refunded' {
    switch (bogStatus.toLowerCase()) {
      case 'success':
      case 'completed':
        return 'success'
      case 'failed':
      case 'declined':
      case 'error':
        return 'failed'
      case 'refunded':
        return 'refunded'
      default:
        return 'pending'
    }
  }

  // Process callback from BOG
  processCallback(data: Record<string, string>): PaymentStatus {
    const signature = data.signature
    delete data.signature

    if (!this.verifySignature(data, signature)) {
      throw new Error('Invalid callback signature')
    }

    return {
      transactionId: data.transaction_id,
      orderId: data.order_id,
      amount: parseInt(data.amount) / 100,
      currency: data.currency,
      status: this.mapStatus(data.status),
      resultCode: data.result_code,
      resultMessage: data.result_message,
    }
  }

  // Check if credentials are configured
  isConfigured(): boolean {
    return !!(this.config.merchantId && this.config.secretKey)
  }
}

export const bogIPayClient = new BOGiPayClient()
export type { BOGConfig, PaymentRequest, PaymentResponse, PaymentStatus, RefundRequest }
