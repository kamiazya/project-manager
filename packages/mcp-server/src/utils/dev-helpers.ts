import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getPidFilePath(): string {
  // Use environment variable if available, otherwise use a stable location
  if (process.env.PM_PID_FILE) {
    return process.env.PM_PID_FILE
  }

  // Try process.cwd() first (more stable for bundled/different directory structures)
  try {
    return join(process.cwd(), '.dev-server.pid')
  } catch {
    // Fallback to relative path if process.cwd() fails
    return join(__dirname, '../../.dev-server.pid')
  }
}

const pidFile = getPidFilePath()

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function writePidFile(): void {
  if (isDevelopment()) {
    writeFileSync(pidFile, process.pid.toString())
    console.error(`[DEV] MCP Server PID: ${process.pid} written to ${pidFile}`)
  }
}

export function cleanupPidFile(): void {
  if (isDevelopment() && existsSync(pidFile)) {
    try {
      const pidContent = readFileSync(pidFile, 'utf8')
      const pid = parseInt(pidContent.trim(), 10)
      if (pid === process.pid) {
        // Remove the PID file only if it belongs to this process
        unlinkSync(pidFile)
        console.error(`[DEV] Cleaned up PID file: ${pidFile}`)
      }
    } catch (error) {
      console.error(`[DEV] Error cleaning up PID file:`, error)
    }
  }
}

export function setupDevelopmentSignalHandlers(): void {
  if (!isDevelopment()) return

  const cleanup = () => {
    console.error('[DEV] Shutting down MCP server...')
    cleanupPidFile()
    process.exit(0)
  }

  // Handle process termination signals
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('SIGQUIT', cleanup)

  // Handle uncaught exceptions in development
  process.on('uncaughtException', error => {
    console.error('[DEV] Uncaught Exception:', error)
    cleanup()
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[DEV] Unhandled Rejection at:', promise, 'reason:', reason)
    cleanup()
  })
}

export function logDevelopmentInfo(): void {
  if (isDevelopment()) {
    console.error(`[DEV] MCP Server started in development mode`)
    console.error(`[DEV] Process ID: ${process.pid}`)
    console.error(`[DEV] Node version: ${process.version}`)
    console.error(`[DEV] Working directory: ${process.cwd()}`)
    console.error(`[DEV] Hot reload enabled - make changes to see them applied automatically`)
  }
}
