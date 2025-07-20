/**
 * Development process management service interface for the application layer.
 * Provides process management capabilities for development environments.
 */

/**
 * Development process management service interface
 *
 * This service provides process management capabilities specifically for development
 * environments, including PID file management and signal handling for graceful
 * process shutdown.
 */
export interface DevelopmentProcessService {
  /**
   * Register the current process for development management
   * - Creates PID file
   * - Sets up signal handlers for graceful shutdown
   * - Configures development-specific logging
   *
   * @param processId - The process ID to register
   */
  registerProcess(processId: number): Promise<void>

  /**
   * Clean up process resources
   * - Removes PID file if it belongs to this process
   * - Performs graceful cleanup
   *
   * @param processId - Optional specific process ID to clean up. If not provided, uses current process
   */
  cleanupProcess(processId?: number): Promise<void>

  /**
   * Check if a process is currently active
   * - Reads PID file and validates process existence
   *
   * @param processId - The process ID to check
   * @returns Promise resolving to true if process is active
   */
  isProcessActive(processId: number): Promise<boolean>

  /**
   * Get the current process file path for debugging
   * - Returns the path where PID file is stored
   *
   * @returns The file path used for process management
   */
  getCurrentProcessPath(): string
}
