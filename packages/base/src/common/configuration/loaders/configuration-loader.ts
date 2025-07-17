/**
 * Configuration Loader Interface
 *
 * Defines the contract for loading configuration data from various sources
 * (files, environment variables, etc.). This is part of the Common Infrastructure
 * since it provides technical capabilities for configuration management.
 */

/**
 * Configuration loader interface
 *
 * @template T - The type of configuration data to load
 */
export interface ConfigurationLoader<T = unknown> {
  /**
   * Load configuration data from the source
   *
   * @returns Promise resolving to partial configuration data
   */
  load(): Promise<Partial<T>>

  /**
   * Save configuration data to the source (optional)
   *
   * @param config - The configuration data to save
   * @returns Promise resolving when save is complete
   */
  save?(config: T): Promise<void>

  /**
   * Check if the configuration source exists
   *
   * @returns Promise resolving to true if source exists
   */
  exists?(): Promise<boolean>

  /**
   * Get the source identifier (path, key, etc.)
   *
   * @returns String identifying the configuration source
   */
  getSource(): string

  /**
   * Get the priority of this loader (higher numbers = higher priority)
   *
   * @returns Priority number
   */
  getPriority(): number
}

/**
 * Base configuration loader with common functionality
 */
export abstract class BaseConfigurationLoader<T = unknown> implements ConfigurationLoader<T> {
  constructor(
    protected readonly source: string,
    protected readonly priority: number = 0
  ) {}

  abstract load(): Promise<Partial<T>>

  getSource(): string {
    return this.source
  }

  getPriority(): number {
    return this.priority
  }

  async exists(): Promise<boolean> {
    try {
      await this.load()
      return true
    } catch {
      return false
    }
  }
}

/**
 * Loader result with metadata
 */
export interface LoaderResult<T = unknown> {
  /**
   * The loaded configuration data
   */
  data: Partial<T>

  /**
   * The source that loaded this data
   */
  source: string

  /**
   * The priority of the loader
   */
  priority: number

  /**
   * Whether the load was successful
   */
  success: boolean

  /**
   * Error message if load failed
   */
  error?: string
}

/**
 * Configuration loader utilities
 */
export class ConfigurationLoaderUtils {
  /**
   * Safely load configuration from a loader
   *
   * @param loader - The configuration loader to use
   * @returns Promise resolving to loader result
   */
  static async safeLoad<T>(loader: ConfigurationLoader<T>): Promise<LoaderResult<T>> {
    try {
      const data = await loader.load()
      return {
        data,
        source: loader.getSource(),
        priority: loader.getPriority(),
        success: true,
      }
    } catch (error) {
      return {
        data: {},
        source: loader.getSource(),
        priority: loader.getPriority(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Load configuration from multiple loaders and merge by priority
   *
   * @param loaders - Array of configuration loaders
   * @returns Promise resolving to merged configuration
   */
  static async loadAndMerge<T>(loaders: ConfigurationLoader<T>[]): Promise<Partial<T>> {
    const results = await Promise.all(
      loaders.map(loader => ConfigurationLoaderUtils.safeLoad(loader))
    )

    // Sort by priority (higher priority first)
    const successfulResults = results
      .filter(result => result.success)
      .sort((a, b) => b.priority - a.priority)

    // Merge configurations (higher priority overwrites lower priority)
    const merged: Partial<T> = {}
    for (const result of successfulResults.reverse()) {
      Object.assign(merged, result.data)
    }

    return merged
  }
}
