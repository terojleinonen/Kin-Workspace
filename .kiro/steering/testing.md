# Testing Guidelines

## Core Testing Principle
**ALWAYS write tests first** - Before implementing any feature or fix, write a test that demonstrates the expected behavior. This ensures:
- Clear requirements definition
- Faster development cycles
- Reliable code quality
- Easier debugging and maintenance

## Testing Standards
- Write tests for all new features and bug fixes
- Use descriptive test names that explain the behavior being tested
- Include both positive and negative test cases
- Test edge cases and error conditions
- Keep tests focused and isolated
- Use proper setup and teardown for database tests

## Test Structure
- Use `describe` blocks to group related tests
- Use `beforeEach`/`afterEach` for test setup/cleanup
- Use `beforeAll`/`afterAll` for expensive setup operations
- Mock external dependencies when appropriate
- Use meaningful assertions with clear error messages

## Database Testing
- Always clean up test data between tests
- Use transactions or separate test databases when possible
- Test both successful operations and constraint violations
- Verify data persistence and retrieval accuracy