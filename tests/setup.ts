// Jest setup file
// This file runs before each test suite

// Increase timeout for tests if needed
jest.setTimeout(10000);

// Global test setup
beforeAll(() => {
  // Suppress console output during tests if needed
  // console.log = jest.fn();
});

afterAll(() => {
  // Cleanup after all tests
});
