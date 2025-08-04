import { PrismaClient } from '@prisma/client'
import { createUser, findUserByEmail, findUserById, verifyPassword } from '../app/lib/auth-utils'

const prisma = new PrismaClient()

describe('Database Authentication Integration', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('should create user in database', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPass123',
      firstName: 'Test',
      lastName: 'User'
    }

    const user = await createUser(userData)

    expect(user).toMatchObject({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName
    })
    expect(user.id).toBeDefined()
    expect(user.createdAt).toBeDefined()
    expect(user).not.toHaveProperty('password')

    // Verify user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    expect(dbUser).toBeTruthy()
    expect(dbUser?.email).toBe(userData.email)
  })

  test('should find user by email', async () => {
    const userData = {
      email: 'findme@example.com',
      password: 'TestPass123',
      firstName: 'Find',
      lastName: 'Me'
    }

    await createUser(userData)
    const foundUser = await findUserByEmail(userData.email)

    expect(foundUser).toBeTruthy()
    expect(foundUser?.email).toBe(userData.email)
    expect(foundUser?.password).toBeDefined() // Should include password for auth
  })

  test('should find user by id', async () => {
    const userData = {
      email: 'findbyid@example.com',
      password: 'TestPass123',
      firstName: 'Find',
      lastName: 'ById'
    }

    const createdUser = await createUser(userData)
    const foundUser = await findUserById(createdUser.id)

    expect(foundUser).toBeTruthy()
    expect(foundUser?.id).toBe(createdUser.id)
    expect(foundUser?.email).toBe(userData.email)
    expect(foundUser).not.toHaveProperty('password') // Should not include password
  })

  test('should verify password correctly', async () => {
    const userData = {
      email: 'password@example.com',
      password: 'TestPass123',
      firstName: 'Password',
      lastName: 'Test'
    }

    await createUser(userData)
    const user = await findUserByEmail(userData.email)
    
    expect(user).toBeTruthy()
    if (user) {
      const isValid = await verifyPassword(userData.password, user.password)
      expect(isValid).toBe(true)

      const isInvalid = await verifyPassword('wrongpassword', user.password)
      expect(isInvalid).toBe(false)
    }
  })

  test('should handle duplicate email registration', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'TestPass123',
      firstName: 'First',
      lastName: 'User'
    }

    await createUser(userData)
    
    // Try to create another user with same email
    await expect(createUser({
      ...userData,
      firstName: 'Second'
    })).rejects.toThrow()
  })
})