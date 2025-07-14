import type { Hook } from '@oclif/core'

/**
 * Cleanup resources and perform housekeeping after command execution
 */
const hook: Hook<'postrun'> = async function (opts) {
  // Log command execution for debugging in development
  if (process.env.NODE_ENV === 'development') {
    this.debug(`Command ${opts.Command.id} completed successfully`)
  }

  // Cleanup any temporary resources if needed
  // This is where we could add cleanup for file locks, cache invalidation, etc.
}

export default hook
