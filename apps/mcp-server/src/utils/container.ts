/**
 * MCP Container - Now used for SDK dependency injection
 *
 * MCP tools now receive SDK from external source for process consistency.
 * This container provides utilities for testing and development.
 */

/**
 * Reset container state (useful for testing)
 * Since SDK is now injected externally, this is primarily for test cleanup
 */
export async function resetContainer(): Promise<void> {
  // No SDK state to reset since it's injected externally
  // This function is kept for backward compatibility in tests
}
