import type { Hook } from '@oclif/core'
import { Errors } from '@oclif/core'
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

    // Normal completion - let oclif handle the exit
  } catch (error) {
    // Log error in debug mode
    if (process.env.DEBUG) {
      console.error('Error during cleanup:', error)
    }

    // Throw CLIError instead of calling process.exit
    // This allows oclif to handle the exit properly and makes testing easier
    throw new Errors.CLIError('Failed to cleanup SDK resources', { exit: 1 })
  }
}

export default hook
