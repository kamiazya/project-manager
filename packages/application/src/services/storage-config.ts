/**
 * Storage configuration service interface for the application layer.
 * Resolves storage paths according to configuration requirements.
 */

/**
 * Storage configuration service interface that provides storage path resolution
 * for the application layer. Implementation should be provided by the infrastructure layer.
 */
export interface StorageConfigService {
  /**
   * Get the default storage directory path
   * @param mode Optional SDK mode to override auto-detection
   */
  getDefaultStorageDir(mode?: string): string

  /**
   * Get the default storage file path
   */
  getDefaultStoragePath(): string

  /**
   * Get storage path from custom path or default configuration
   */
  resolveStoragePath(customPath?: string): string

  /**
   * Get the logs directory path according to XDG Base Directory specification
   * @param mode Optional SDK mode to override auto-detection
   */
  getLogsPath(mode?: string): string

  /**
   * Get full path for application log file.
   * @param filename Optional filename (defaults to 'app.log')
   */
  getApplicationLogPath(filename?: string): string

  /**
   * Get full path for audit log file.
   * @param filename Optional filename (defaults to 'audit.log')
   */
  getAuditLogPath(filename?: string): string
}
