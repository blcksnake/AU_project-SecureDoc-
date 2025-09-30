# SecureDoc Test Suite

This directory contains all tests for the SecureDoc application.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for API workflows
├── e2e/           # End-to-end tests for full user flows
├── fixtures/      # Test data and sample files
└── README.md      # This file
```

## Running Tests

### Prerequisites
```bash
npm install --save-dev jest supertest puppeteer
```

### Unit Tests
```bash
npm test -- tests/unit/
```

### Integration Tests
```bash
npm test -- tests/integration/
```

### E2E Tests
```bash
npm test -- tests/e2e/
```

### All Tests
```bash
npm test
```

## Test Files

- `unit/test-server.js` - Server endpoint unit tests
- `integration/test-redaction-flow.js` - Complete redaction workflow tests
- `e2e/test-frontend-backend.js` - Frontend-backend integration tests
- `fixtures/test-document.pdf` - Sample PDF for testing

## Test Data

The `fixtures/` directory contains sample files used in tests:
- `test-document.pdf` - Sample PDF document for testing upload and redaction

## Writing New Tests

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows through the UI

Follow the existing patterns and use descriptive test names.
