import type { Hook } from '@oclif/core'

/**
 * Initialize dependency injection container before command execution
 */
const hook: Hook<'init'> = async function (_opts) {
  // Note: DI container setup is handled in BaseCommand.init()
  // This hook could be used for other global initialization if needed

  // Set up any global error handlers or logging
  if (process.env.NODE_ENV === 'development') {
    this.debug('Init hook executed')
  }
}

export default hook
