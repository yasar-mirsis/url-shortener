// Jest setup file for integration tests
import app from '../../src/index';
import { storage } from '../../src/storage';
import { URLData } from '../../src/types';

// Global test variables
declare global {
  var testServer: ReturnType<typeof app.listen>;
  var testPort: number;
}

// Use a specific port for integration tests to avoid conflicts
const TEST_PORT = 3456;

beforeAll(async () => {
  // Start the test server
  global.testServer = app.listen(TEST_PORT);
  global.testPort = TEST_PORT;
});

afterAll(async () => {
  // Clean up storage
  const allKeys = Array.from((storage as any).urlStore.keys());
  for (const key of allKeys) {
    (storage as any).urlStore.delete(key);
  }

  // Close the test server
  if (global.testServer) {
    await new Promise((resolve) => {
      global.testServer.close(resolve);
    });
  }
});

// Clear storage before each test to ensure isolation
beforeEach(async () => {
  const allKeys = Array.from((storage as any).urlStore.keys());
  for (const key of allKeys) {
    (storage as any).urlStore.delete(key);
  }
});

// Export helper function for making requests
export const makeRequest = async (
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{
  status: number;
  body: unknown;
  headers: Record<string, string>;
}> => {
  const response = await fetch(`http://localhost:${TEST_PORT}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let responseBody: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    status: response.status,
    body: responseBody,
    headers: responseHeaders
  };
};
