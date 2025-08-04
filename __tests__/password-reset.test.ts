import { PrismaClient } from '@prisma/client'
import { createUser, generatePasswordResetToken, verifyPasswordResetToken, resetPassword } from '../app/lib/auth-utils'

const prisma = new PrismaClient()

describe('Password Reset Functionality', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('should generate password reset token', async () => {
    const userData = {
      email: 'reset@test.com',
      password: 'OldPass123',
      firstName: 'Reset',
      lastName: 'Test'
    }

    const user = await createUser(userData)
    const token = generatePasswordResetToken(user.email)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(10)
  })

  test('should verify valid password reset token', async () => {
    const email = 'verify@test.com'
    const token = generatePasswordResetToken(email)
    
    const result = verifyPasswordResetToken(token)
    
    expect(result).toBeTruthy()
    expect(result?.email).toBe(email)
  })

  test('should reject invalid password reset token', async () => {
    const result = verifyPasswordResetToken('invalid-token')
    expect(result).toBeNull()
  })

  test('should reset password with valid token', async () => {
    const userData = {
      email: 'resetpass@test.com',
      password: 'OldPass123',
      firstName: 'Reset',
      lastName: 'Password'
    }

    const user = await createUser(userData)
    const token = generatePasswordResetToken(user.email)
    const newPassword = 'NewPass456'

    const result = await resetPassword(token, newPassword)

    expect(result.success).toBe(true)
    expect(result.user?.email).toBe(userData.email)

    // Verify old password no longer works
    const { verifyPassword, findUserByEmail } = require('../app/lib/auth-utils')
    const updatedUser = await findUserByEmail(userData.email)
    const oldPasswordValid = await verifyPassword(userData.password, updatedUser!.password)
    const newPasswordValid = await verifyPassword(newPassword, updatedUser!.password)

    expect(oldPasswordValid).toBe(false)
    expect(newPasswordValid).toBe(true)
  })

  test('should reject password reset with invalid token', async () => {
    const result = await resetPassword('invalid-token', 'NewPass123')
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid')
  })
})