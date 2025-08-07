# Testing Guide

This guide explains how to run and write tests for the Kin Workspace CMS.

## Test Structure

The test suite is organized into three main categories:

```
tests/
├── setup.ts                    # Test configuration and utilities
├── database/                   # Database layer tests
│   ├── connection.test.ts      # Database connectivity tests
│   ├── error-handling.test.ts  # Error handling utilities tests
│   └── models.test.ts          # Database model CRUD tests
├── api/                        # API endpoint tests
│   └── health.test.ts          # Health check API tests
└── integration/                # Integration tests
    └── database-setup.test.ts  # Full database setup tests
```

## Running Tests

### Prerequisites

1. **Database Setup**: Ensure PostgreSQL is running
   ```bash
   npm run db:setup
   ```

2. **Dependencies**: Install test dependencies
   ```bash
   npm install
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test categories
npm run test:db          # Database tests only
npm run test:api         # API tests only
npm run test:integration # Integration tests only

# Run specific test file
npx jest tests/database/connection.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="User Model"
```

## Test Categories

### 1. Database Tests (`tests/database/`)

#### Connection Tests
- Database connectivity verification
- Health check functionality
- Connection error handling
- Database operation utilities

#### Error Handling Tests
- Prisma error conversion to user-friendly messages
- Error type identification utilities
- Constraint violation handling
- Field extraction from errors

#### Model Tests
- CRUD operations for all database models
- Constraint enforcement (unique, foreign key)
- Default value assignment
- Relationship management
- Data validation

### 2. API Tests (`tests/api/`)

#### Health Check Tests
- Endpoint response validation
- Database status reporting
- Error condition handling
- Response format verification

### 3. Integration Tests (`tests/integration/`)

#### Database Setup Tests
- Complete schema validation
- Enum value support
- UUID generation
- JSONB data type support
- Foreign key constraints
- Cascade delete operations
- Performance benchmarks
- Concurrent operation handling
- Full-text search capabilities

## Writing Tests

### Test Standards

1. **Descriptive Names**: Use clear, descriptive test names
   ```typescript
   it('should create a user with all required fields', async () => {
     // Test implementation
   })
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   it('should handle unique constraint violations', async () => {
     // Arrange
     const userData = { email: 'test@example.com', ... }
     
     // Act
     await prisma.user.create({ data: userData })
     const result = prisma.user.create({ data: userData })
     
     // Assert
     await expect(result).rejects.toThrow()
   })
   ```

3. **Cleanup**: Always clean up test data
   ```typescript
   afterEach(async () => {
     await prisma.user.deleteMany()
   })
   ```

4. **Custom Matchers**: Use provided custom matchers
   ```typescript
   expect(user.id).toBeValidUUID()
   expect(user.email).toBeValidEmail()
   ```

### Database Test Patterns

#### Creating Test Data
```typescript
const testUser = await prisma.user.create({
  data: {
    email: 'test@example.com',
    passwordHash: await bcrypt.hash('password', 12),
    name: 'Test User',
  },
})
```

#### Testing Relationships
```typescript
const productWithCategories = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    categories: {
      include: {
        category: true,
      },
    },
  },
})

expect(productWithCategories?.categories).toHaveLength(1)
```

#### Testing Constraints
```typescript
await expect(
  prisma.user.create({
    data: { email: 'duplicate@example.com', ... }
  })
).rejects.toThrow()
```

### API Test Patterns

#### Mocking Dependencies
```typescript
jest.mock('@/lib/db', () => ({
  getDatabaseHealth: jest.fn(),
}))

import { getDatabaseHealth } from '@/lib/db'

beforeEach(() => {
  jest.clearAllMocks()
})
```

#### Testing API Responses
```typescript
const response = await GET(request)
const data = await response.json()

expect(response.status).toBe(200)
expect(data.status).toBe('healthy')
```

## Custom Test Utilities

### Custom Matchers

#### `toBeValidUUID()`
Validates that a string is a properly formatted UUID.

```typescript
expect(user.id).toBeValidUUID()
```

#### `toBeValidEmail()`
Validates that a string is a properly formatted email address.

```typescript
expect(user.email).toBeValidEmail()
```

### Test Database

Tests use the same database as development but with careful cleanup to avoid interference. Each test file includes cleanup procedures to ensure test isolation.

## Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 100% coverage for database utilities and error handling
- **API Endpoints**: 100% coverage for all API routes

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD integration

## Continuous Integration

### Pre-commit Hooks

Tests should be run before committing:

```bash
# Add to your pre-commit hook
npm run test:coverage
```

### CI/CD Pipeline

Tests are automatically run in the CI/CD pipeline with the following stages:

1. **Setup**: Install dependencies and start database
2. **Database**: Run database setup and migrations
3. **Test**: Execute full test suite with coverage
4. **Report**: Generate and upload coverage reports

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   Solution: Ensure PostgreSQL is running (`npm run db:setup`)

2. **Test Timeouts**
   ```
   Error: Timeout - Async callback was not invoked within the 5000ms timeout
   ```
   Solution: Increase timeout in test file or jest config

3. **Memory Leaks**
   ```
   Warning: Jest detected open handles
   ```
   Solution: Ensure all database connections are properly closed

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm test
```

Or for specific components:

```bash
DEBUG=prisma:* npm test
```

## Best Practices

1. **Test Independence**: Each test should be able to run independently
2. **Data Cleanup**: Always clean up test data to avoid interference
3. **Realistic Data**: Use realistic test data that matches production patterns
4. **Error Testing**: Test both success and failure scenarios
5. **Performance**: Include performance assertions for critical operations
6. **Documentation**: Document complex test scenarios and edge cases

## Permanent Testing Rule

**Every implementation must include comprehensive tests before being considered complete.**

This includes:
- Unit tests for all functions and utilities
- Integration tests for API endpoints
- Database tests for all models and relationships
- Error handling tests for all error scenarios
- Performance tests for critical operations

Tests must pass with at least 80% coverage before any code is merged or considered complete.