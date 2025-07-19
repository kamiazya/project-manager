/**
 * MCP Container - Following CLI BaseCommand pattern for SDK management
 *
 * Since MCP tools now use BaseTool class with DI SDK pattern,
 * this container file is maintained for backward compatibility only.
 * All tools now use the BaseTool class which handles SDK initialization.
 */

/**
 * Reset the SDK instance (useful for testing)
 * This delegates to BaseTool.resetSDK() for consistency
 */
export async function resetContainer(): Promise<void> {
  // Import here to avoid circular dependencies
  const { BaseTool } = await import('../lib/base-tool.ts')
  BaseTool.resetSDK()
}
