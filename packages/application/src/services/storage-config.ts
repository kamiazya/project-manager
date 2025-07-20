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
   */
  getDefaultStorageDir(): string

  /**
   * Get the default storage file path
   */
  getDefaultStoragePath(): string

  /**
   * Get storage path from custom path or default configuration
   */
  resolveStoragePath(customPath?: string): string
}

/**
 * Symbol for dependency injection of StorageConfigService
 */
export const StorageConfigService = Symbol('StorageConfigService')
