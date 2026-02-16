import axios from 'axios'
import crypto from 'crypto'

const TTLOCK_API_URL = 'https://euapi.ttlock.com'

interface TTLockConfig {
  clientId: string
  clientSecret: string
}

interface TTLockToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface TTLockLock {
  lockId: number
  lockName: string
  lockAlias: string
  lockMac: string
  electricQuantity: number
  hasGateway: number
}

interface TTLockPasscode {
  keyboardPwdId: number
  keyboardPwd: string
  startDate: number
  endDate: number
}

class TTLockClient {
  private config: TTLockConfig

  constructor() {
    this.config = {
      clientId: process.env.TTLOCK_CLIENT_ID || '',
      clientSecret: process.env.TTLOCK_CLIENT_SECRET || '',
    }
  }

  // Hash password with MD5 (TTLock requires MD5 hashed password)
  private hashPassword(password: string): string {
    return crypto.createHash('md5').update(password).digest('hex')
  }

  // Get access token using username/password (Resource Owner Password flow)
  async getToken(username: string, password: string): Promise<TTLockToken> {
    const hashedPassword = this.hashPassword(password)

    const response = await axios.post(`${TTLOCK_API_URL}/oauth2/token`, null, {
      params: {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username,
        password: hashedPassword,
      },
    })

    if (response.data.errcode) {
      throw new Error(`TTLock Auth Error: ${response.data.errmsg}`)
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<TTLockToken> {
    const response = await axios.post(`${TTLOCK_API_URL}/oauth2/token`, null, {
      params: {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
    })

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    }
  }

  // Get list of locks
  async getLocks(accessToken: string, pageNo: number = 1, pageSize: number = 100): Promise<TTLockLock[]> {
    const response = await axios.post(`${TTLOCK_API_URL}/v3/lock/list`, null, {
      params: {
        clientId: this.config.clientId,
        accessToken,
        pageNo,
        pageSize,
        date: Date.now(),
      },
    })

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`TTLock API Error: ${response.data.errmsg || JSON.stringify(response.data)}`)
    }

    return response.data.list || []
  }

  // Get lock details
  async getLockDetails(accessToken: string, lockId: number): Promise<TTLockLock> {
    const response = await axios.post(`${TTLOCK_API_URL}/v3/lock/detail`, null, {
      params: {
        clientId: this.config.clientId,
        accessToken,
        lockId,
        date: Date.now(),
      },
    })

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`TTLock API Error: ${response.data.errmsg}`)
    }

    return response.data
  }

  // Create time-limited passcode
  async createPasscode(
    accessToken: string,
    lockId: number,
    passcode: string,
    startDate: Date,
    endDate: Date,
    passcodeName?: string
  ): Promise<TTLockPasscode> {
    const response = await axios.post(`${TTLOCK_API_URL}/v3/keyboardPwd/add`, null, {
      params: {
        clientId: this.config.clientId,
        accessToken,
        lockId,
        keyboardPwd: passcode,
        keyboardPwdName: passcodeName || 'Guest Access',
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        addType: 2, // Custom passcode
        date: Date.now(),
      },
    })

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`TTLock API Error: ${response.data.errmsg}`)
    }

    return {
      keyboardPwdId: response.data.keyboardPwdId,
      keyboardPwd: passcode,
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    }
  }

  // Delete passcode
  async deletePasscode(accessToken: string, lockId: number, keyboardPwdId: number): Promise<void> {
    const response = await axios.post(`${TTLOCK_API_URL}/v3/keyboardPwd/delete`, null, {
      params: {
        clientId: this.config.clientId,
        accessToken,
        lockId,
        keyboardPwdId,
        deleteType: 2,
        date: Date.now(),
      },
    })

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`TTLock API Error: ${response.data.errmsg}`)
    }
  }

  // Get passcode list
  async getPasscodes(accessToken: string, lockId: number): Promise<TTLockPasscode[]> {
    const response = await axios.post(`${TTLOCK_API_URL}/v3/keyboardPwd/list`, null, {
      params: {
        clientId: this.config.clientId,
        accessToken,
        lockId,
        pageNo: 1,
        pageSize: 100,
        date: Date.now(),
      },
    })

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`TTLock API Error: ${response.data.errmsg}`)
    }

    return response.data.list || []
  }

  // Get lock battery level
  async getBatteryLevel(accessToken: string, lockId: number): Promise<number> {
    const details = await this.getLockDetails(accessToken, lockId)
    return details.electricQuantity
  }

  // Remote unlock (requires gateway)
  async unlock(accessToken: string, lockId: number): Promise<boolean> {
    const response = await axios.post(`${TTLOCK_API_URL}/v3/lock/unlock`, null, {
      params: {
        clientId: this.config.clientId,
        accessToken,
        lockId,
        date: Date.now(),
      },
    })

    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`TTLock API Error: ${response.data.errmsg}`)
    }

    return true
  }

  // Check if credentials are configured
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret)
  }
}

export const ttlockClient = new TTLockClient()
export type { TTLockConfig, TTLockToken, TTLockLock, TTLockPasscode }
