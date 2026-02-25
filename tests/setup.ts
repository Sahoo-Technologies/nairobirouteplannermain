// Global test setup
import { afterEach } from "vitest";
import express from "express";

// Export test utilities
export function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

afterEach(() => {
  // Clean up after each test
});
