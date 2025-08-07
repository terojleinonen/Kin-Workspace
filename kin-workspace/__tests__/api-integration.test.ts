import { NextRequest } from 'next/server'
import { POST as registerHandler } from '../app/api/auth/register/route'
import { POST as loginHandler } from '../app/api/auth/login/route'
import { GET as meHandler } from '../app/api/auth/me/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('API Authentication Integration', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  test('should register, login, and verify user through API', async () => {
    const userData = {
      email: 'api@test.com',
      password: 'TestPass123',
      firstName: 'API',
      lastName: 'Test'
    }

    // Test registration
    const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' }
    })

    const registerResponse = await registerHandler(registerRequest)
    const registerData = await registerResponse.json()

    expect(registerResponse.status).toBe(200)
    expect(registerData.success).toBe(true)
    expect(registerData.user.email).toBe(userData.email)
    expect(registerData.token).toBeDefined()

    // Test login
    const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    const loginResponse = await loginHandler(loginRequest)
    const loginData = await loginResponse.json()

    expect(loginResponse.status).toBe(200)
    expect(loginData.success).toBe(true)
    expect(loginData.user.email).toBe(userData.email)
    expect(loginData.token).toBeDefined()

    // Test token verification
    const meRequest = new NextRequest('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    })

    const meResponse = await meHandler(meRequest)
    const meData = await meResponse.json()

    expect(meResponse.status).toBe(200)
    expect(meData.success).toBe(true)
    expect(meData.user.email).toBe(userData.email)
    expect(meData.user).not.toHaveProperty('password')
  })

  test('should handle duplicate registration', async () => {
    const userData = {
      email: 'duplicate@test.com',
      password: 'TestPass123',
      firstName: 'Duplicate',
      lastName: 'Test'
    }

    // First registration
    const firstRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' }
    })

    const firstResponse = await registerHandler(firstRequest)
    expect(firstResponse.status).toBe(200)

    // Second registration with same email
    const secondRequest = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' }
    })

    const secondResponse = await registerHandler(secondRequest)
    const secondData = await secondResponse.json()

    expect(secondResponse.status).toBe(409)
    expect(secondData.success).toBe(false)
    expect(secondData.error).toContain('already exists')
  })
})