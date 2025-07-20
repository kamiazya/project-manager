import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { DevelopmentProcessService } from '@project-manager/application'

const ENV_VARS = {
  XDG_CONFIG_HOME: 'XDG_CONFIG_HOME',
  PM_PID_FILE: 'PM_PID_FILE',
} as const

const PROCESS_CONFIG = {
  CONFIG_DIR_NAME: 'project-manager',
  PID_FILE_NAME: '.dev-server.pid',
} as const

/**
 * XDG Base Directory compliant development process management service
 *
 * This service manages development processes by creating PID files in XDG-compliant
 * directories and setting up signal handlers for graceful shutdown.
 *
 * Features:
 * - XDG Base Directory Specification compliance
 * - SDK mode integration for environment-specific directories
 * - Automatic signal handler setup
 * - PID file validation and cleanup
 * - Environment variable override support
 */
export class XdgDevelopmentProcessService implements DevelopmentProcessService {
  private currentProcessId?: number
  private signalHandlersRegistered = false

  /**
   * Service identifier for caching - minification-safe and stable across instances
   */
  readonly serviceId = 'XdgDevelopmentProcessService'

  constructor(private mode?: string) {}

  async registerProcess(processId: number): Promise<void> {
    this.currentProcessId = processId

    // Create PID file
    await this.writePidFile(processId)

    // Setup signal handlers for graceful shutdown
    this.setupSignalHandlers()
  }

  async cleanupProcess(processId?: number): Promise<void> {
    const targetPid = processId || this.currentProcessId
    if (!targetPid) {
      return
    }

    const pidFilePath = this.getPidFilePath()

    if (!existsSync(pidFilePath)) {
      return
    }

    try {
      const pidContent = readFileSync(pidFilePath, 'utf8')
      const filePid = parseInt(pidContent.trim(), 10)

      // Validate that the parsed PID is a valid number
      if (Number.isNaN(filePid)) {
        console.error(`[DEV] Invalid PID in file ${pidFilePath}: "${pidContent.trim()}"`)
        // Remove the invalid PID file to prevent future issues
        unlinkSync(pidFilePath)
        console.error(`[DEV] Removed invalid PID file: ${pidFilePath}`)
      } else if (filePid === targetPid) {
        // Remove the PID file only if it belongs to this process
        unlinkSync(pidFilePath)
        console.error(`[DEV] Cleaned up PID file: ${pidFilePath}`)
      }
    } catch (error) {
      console.error(`[DEV] Error cleaning up PID file:`, error)
    }
  }

  async isProcessActive(processId: number): Promise<boolean> {
    const pidFilePath = this.getPidFilePath()

    if (!existsSync(pidFilePath)) {
      return false
    }

    try {
      const pidContent = readFileSync(pidFilePath, 'utf8')
      const filePid = parseInt(pidContent.trim(), 10)

      if (Number.isNaN(filePid)) {
        return false
      }

      // Check if the process is actually running
      try {
        // Sending signal 0 checks if process exists without actually sending a signal
        process.kill(filePid, 0)
        return filePid === processId
      } catch {
        // Process doesn't exist
        return false
      }
    } catch {
      return false
    }
  }

  getCurrentProcessPath(): string {
    return this.getPidFilePath()
  }

  private async writePidFile(processId: number): Promise<void> {
    const pidFilePath = this.getPidFilePath()
    const pidDir = dirname(pidFilePath)

    // Ensure directory exists
    try {
      await mkdir(pidDir, { recursive: true })
    } catch (error) {
      console.error(`[DEV] Failed to create PID directory ${pidDir}:`, error)
      throw error
    }

    try {
      writeFileSync(pidFilePath, processId.toString())
      console.error(`[DEV] Process PID: ${processId} written to ${pidFilePath}`)
    } catch (error) {
      console.error(`[DEV] Failed to write PID file ${pidFilePath}:`, error)
      throw error
    }
  }

  private getPidFilePath(): string {
    // Use environment variable if available (highest priority)
    const envPidFile = process.env[ENV_VARS.PM_PID_FILE]
    if (envPidFile) {
      return envPidFile
    }

    // Use XDG-compliant directory structure with mode support
    const processDir = this.getProcessDir()
    return join(processDir, PROCESS_CONFIG.PID_FILE_NAME)
  }

  private getProcessDir(): string {
    const homeDir = homedir()
    const configHome = process.env[ENV_VARS.XDG_CONFIG_HOME] || join(homeDir, '.config')

    // Use SDK mode system for directory naming
    let dirName: string
    if (this.mode) {
      // If mode is provided, use it for directory naming
      dirName =
        this.mode === 'development'
          ? `${PROCESS_CONFIG.CONFIG_DIR_NAME}-dev`
          : this.mode === 'production'
            ? PROCESS_CONFIG.CONFIG_DIR_NAME
            : `${PROCESS_CONFIG.CONFIG_DIR_NAME}-${this.mode}`
    } else {
      // Fallback to environment variable for backward compatibility
      const isDevelopment = process.env.NODE_ENV === 'development'
      dirName = isDevelopment
        ? `${PROCESS_CONFIG.CONFIG_DIR_NAME}-dev`
        : PROCESS_CONFIG.CONFIG_DIR_NAME
    }

    return join(configHome, dirName, 'processes')
  }

  private setupSignalHandlers(): void {
    if (this.signalHandlersRegistered) {
      return // Avoid duplicate registration
    }

    const cleanup = () => {
      console.error('[DEV] Shutting down process...')
      this.cleanupProcess()
        .catch(error => {
          console.error('[DEV] Error during cleanup:', error)
        })
        .finally(() => {
          process.exit(0) // Exit with success code for graceful shutdown
        })
    }

    const errorCleanup = (error: any) => {
      console.error('[DEV] Process error:', error)
      this.cleanupProcess()
        .catch(cleanupError => {
          console.error('[DEV] Error during error cleanup:', cleanupError)
        })
        .finally(() => {
          process.exit(1) // Exit with error code to indicate failure
        })
    }

    // Handle process termination signals
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('SIGQUIT', cleanup)

    // Handle uncaught exceptions in development
    process.on('uncaughtException', errorCleanup)
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[DEV] Unhandled Rejection at:', promise, 'reason:', reason)
      errorCleanup(reason)
    })

    this.signalHandlersRegistered = true
  }
}
