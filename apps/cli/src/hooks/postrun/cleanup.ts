import type { Hook } from '@oclif/core'
import { isDevelopmentLike } from '@project-manager/base'
import { NodeEnvironmentDetectionService } from '@project-manager/infrastructure'

/**
 * Cleanup resources and perform housekeeping after command execution
 */
const hook: Hook<'postrun'> = async function (opts) {
  // Log command execution for debugging in development
  const environmentService = new NodeEnvironmentDetectionService()
  const environment = environmentService.detectEnvironment()
  if (isDevelopmentLike(environment)) {
    this.debug(`Command ${opts.Command?.id || 'unknown'} completed successfully`)
  }

  // Cleanup any temporary resources if needed
  // This is where we could add cleanup for file locks, cache invalidation, etc.
}

export default hook
