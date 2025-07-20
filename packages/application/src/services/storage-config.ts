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
}
