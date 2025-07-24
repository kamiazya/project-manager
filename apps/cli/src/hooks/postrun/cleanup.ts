import type { Hook } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Postrun hook for cleanup operations.
 * Ensures proper shutdown of SDK resources including logger.
 */
const hook: Hook<'postrun'> = async () => {
  try {
    // Access the statically cached SDK instance
    const sdk = (BaseCommand as any).cachedSDK
    if (sdk && typeof sdk.shutdown === 'function') {
      await sdk.shutdown()
    }

    // Clear SDK cache for future commands
    BaseCommand.clearSDKCache()

    // Exit cleanly - no setTimeout needed with synchronous logger
    process.exit(0)
  } catch (error) {
    // Log error in debug mode
    if (process.env.DEBUG) {
      console.error('Error during cleanup:', error)
    }

    // Exit with error code
    process.exit(1)
  }
}

export default hook
