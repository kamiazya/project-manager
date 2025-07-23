import {
  type EnvironmentMode,
  getEnvironmentDisplayName,
  isDevelopmentLike,
  shouldLogVerbose,
} from '@project-manager/base'

export function isDevelopment(environment: EnvironmentMode): boolean {
  return isDevelopmentLike(environment)
}

export function logDevelopmentInfo(environment: EnvironmentMode): void {
  if (shouldLogVerbose(environment)) {
    const environmentDisplayName = getEnvironmentDisplayName(environment)
    console.error(`[DEV] MCP Server started in ${environmentDisplayName} environment`)
    console.error(`[DEV] Process ID: ${process.pid}`)
    console.error(`[DEV] Node version: ${process.version}`)
    console.error(`[DEV] Working directory: ${process.cwd()}`)

    if (isDevelopment(environment)) {
      console.error(`[DEV] Hot reload enabled - make changes to see them applied automatically`)
    }
  }
}
