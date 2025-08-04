import { NextRequest } from 'next/server'
import { POST as forgotPasswordHandler } from '../app/api/auth/forgot-password/route'
import { POST as resetPasswordHandler } from '../app/api/auth/reset-password/route'
import { PrismaClient } from '@prisma/client'
import { createUser } from '../app/lib/auth-utils'

const prisma = new PrismaClient()

describe('Password Reset API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('should handle forgot password request', async () => {
    const userData = {
      email: 'forgot@test.com',
      password: 'TestPass123',
      firstName: 'Forgot',
      lastName: 'Test'
    }

    await createUser(userData)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: userData.email }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await forgotPasswordHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('password reset link')
    expect(data.resetToken).toBeDefined() // Only in development
  })

  test('should handle forgot password for non-existent email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@test.com' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await forgotPasswordHandler(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('password reset link')
    expect(data.resetToken).toBeUndefined()
  })

  test('should reset password with valid token', async () => {
    const userData = {
      email: 'resetapi@test.com',
      password: 'OldPass123',
      firstName: 'Reset',
      lastName: 'API'
    }

    await createUser(userData)

    // Get reset token
    const forgotRequest = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: userData.email }),
      headers: { 'Content-Type': 'application/json' }
    })

    const forgotResponse = await forgotPasswordHandler(forgotRequest)
    const forgotData = await forgotResponse.json()
    const resetToken = forgotData.resetToken

    // Reset password
    const resetRequest = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        token: resetToken, 
        password: 'NewPass456' 
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const resetResponse = await resetPasswordHandler(resetRequest)
    const resetData = await resetResponse.json()

    expect(resetResponse.status).toBe(200)
    expect(resetData.success).toBe(true)
    expect(resetData.message).toContain('reset successfully')
  })

  test('should reject password reset with invalid token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        token: 'invalid-token', 
        password: 'NewPass456' 
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await resetPasswordHandler(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid')
  })
})