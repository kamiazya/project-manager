import type { Hook } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Postrun hook for cleanup operations.
 * Ensures proper shutdown of SDK resources including logger and forces process exit.
 */
const hook: Hook<'postrun'> = async options => {
  try {
    // If we have an SDK instance, shutdown properly
    const command = options.Command as any
    if (command?.sdk && typeof command.sdk.shutdown === 'function') {
      await command.sdk.shutdown()
    }

    // Clear SDK cache for future commands
    BaseCommand.clearSDKCache()

    // Force immediate process termination for synchronous logger
    // Since we're using synchronous logging, all writes are already complete
    setTimeout(() => {
      if (process.env.DEBUG) {
        console.error('Forcing process exit after cleanup timeout')
      }
      process.exit(0)
    }, 100)
  } catch (error) {
    // Ignore errors during cleanup, but still force exit
    if (process.env.DEBUG) {
      console.error('Error during cleanup:', error)
    }

    // Force exit even on error
    setTimeout(() => {
      process.exit(1)
    }, 100)
  }
}

export default hook
