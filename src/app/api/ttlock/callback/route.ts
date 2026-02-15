import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ttlockClient } from '@/lib/ttlock'
import prisma from '@/lib/prisma'

// POST /api/ttlock/callback - Handle TTLock callback test
export async function POST() {
  // TTLock tests the callback URL with POST
  return NextResponse.json({ success: true })
}

// GET /api/ttlock/callback - Handle TTLock OAuth callback
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('TTLock OAuth error:', error)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=ttlock_auth_failed', request.url)
      )
    }

    // Verify state matches session user
    if (state !== session.user.id) {
      console.error('TTLock OAuth state mismatch')
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=ttlock_state_mismatch', request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=ttlock_no_code', request.url)
      )
    }

    // Exchange code for tokens
    const tokens = await ttlockClient.getToken(code)

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000)

    // Store tokens in database
    await prisma.tTLockToken.upsert({
      where: { ownerId: session.user.id },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        ownerId: session.user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    })

    // Redirect to settings with success
    return NextResponse.redirect(
      new URL('/dashboard/settings?success=ttlock_connected', request.url)
    )
  } catch (error) {
    console.error('Error handling TTLock callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=ttlock_callback_failed', request.url)
    )
  }
}
