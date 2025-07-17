/**
 * Cascading Configuration Resolver
 *
 * Resolves configuration from multiple sources in priority order.
 * This is part of the Common Infrastructure since it provides technical
 * capabilities for advanced configuration management.
 */

import type { ConfigurationLoader, LoaderResult } from '../loaders/configuration-loader.ts'
import { ConfigurationLoaderUtils } from '../loaders/configuration-loader.ts'

/**
 * Configuration resolver that cascades through multiple loaders
 */
export class CascadingConfigurationResolver<T = unknown> {
  private readonly loaders: ConfigurationLoader<T>[] = []
  private cachedConfig: Partial<T> | null = null
  private cacheTimestamp: number = 0
  private readonly cacheTimeout: number

  constructor(
    loaders: ConfigurationLoader<T>[] = [],
    cacheTimeout: number = 60000 // 1 minute
  ) {
    this.loaders = [...loaders].sort((a, b) => b.getPriority() - a.getPriority())
    this.cacheTimeout = cacheTimeout
  }

  /**
   * Add a configuration loader
   *
   * @param loader - Configuration loader to add
   */
  addLoader(loader: ConfigurationLoader<T>): void {
    this.loaders.push(loader)
    this.loaders.sort((a, b) => b.getPriority() - a.getPriority())
    this.invalidateCache()
  }

  /**
   * Remove a configuration loader
   *
   * @param loader - Configuration loader to remove
   */
  removeLoader(loader: ConfigurationLoader<T>): void {
    const index = this.loaders.indexOf(loader)
    if (index >= 0) {
      this.loaders.splice(index, 1)
      this.invalidateCache()
    }
  }

  /**
   * Get all registered loaders
   *
   * @returns Array of configuration loaders
   */
  getLoaders(): ConfigurationLoader<T>[] {
    return [...this.loaders]
  }

  /**
   * Resolve configuration from all loaders
   *
   * @param useCache - Whether to use cached configuration
   * @returns Promise resolving to merged configuration
   */
  async resolve(useCache: boolean = true): Promise<Partial<T>> {
    if (useCache && this.isCacheValid()) {
      return this.cachedConfig!
    }

    const config = await ConfigurationLoaderUtils.loadAndMerge(this.loaders)

    this.cachedConfig = config
    this.cacheTimestamp = Date.now()

    return config
  }

  /**
   * Get detailed results from all loaders
   *
   * @returns Promise resolving to array of loader results
   */
  async getDetailedResults(): Promise<LoaderResult<T>[]> {
    const results = await Promise.all(
      this.loaders.map(loader => ConfigurationLoaderUtils.safeLoad(loader))
    )

    return results.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Invalidate the configuration cache
   */
  invalidateCache(): void {
    this.cachedConfig = null
    this.cacheTimestamp = 0
  }

  /**
   * Check if the cache is still valid
   *
   * @returns True if cache is valid
   */
  private isCacheValid(): boolean {
    return this.cachedConfig !== null && Date.now() - this.cacheTimestamp < this.cacheTimeout
  }

  /**
   * Get configuration value with fallback
   *
   * @param key - Configuration key (supports dot notation)
   * @param fallback - Fallback value if key not found
   * @returns Promise resolving to configuration value
   */
  async getValue<K = unknown>(key: string, fallback?: K): Promise<K | undefined> {
    const config = await this.resolve()
    const value = this.getNestedValue(config as Record<string, unknown>, key)
    return value !== undefined ? (value as K) : fallback
  }

  /**
   * Check if a configuration key exists
   *
   * @param key - Configuration key (supports dot notation)
   * @returns Promise resolving to true if key exists
   */
  async hasValue(key: string): Promise<boolean> {
    const config = await this.resolve()
    return this.getNestedValue(config as Record<string, unknown>, key) !== undefined
  }

  /**
   * Get nested value from configuration using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.')
    let current: unknown = obj

    for (const key of keys) {
      if (typeof current !== 'object' || current === null || !(key in current)) {
        return undefined
      }
      current = (current as Record<string, unknown>)[key]
    }

    return current
  }
}

/**
 * Utility functions for cascading configuration
 */
export class CascadingResolverUtils {
  /**
   * Create a resolver with common loaders
   *
   * @param loaders - Array of configuration loaders
   * @param cacheTimeout - Cache timeout in milliseconds
   * @returns CascadingConfigurationResolver instance
   */
  static createResolver<T>(
    loaders: ConfigurationLoader<T>[],
    cacheTimeout: number = 60000
  ): CascadingConfigurationResolver<T> {
    return new CascadingConfigurationResolver<T>(loaders, cacheTimeout)
  }

  /**
   * Create a resolver with default loader priority
   *
   * @param loaders - Array of configuration loaders
   * @returns CascadingConfigurationResolver instance
   */
  static createWithDefaults<T>(
    loaders: ConfigurationLoader<T>[]
  ): CascadingConfigurationResolver<T> {
    // Sort loaders by priority and create resolver
    const sortedLoaders = [...loaders].sort((a, b) => b.getPriority() - a.getPriority())
    return new CascadingConfigurationResolver<T>(sortedLoaders)
  }

  /**
   * Validate configuration against a schema
   *
   * @param config - Configuration to validate
   * @param validator - Validation function
   * @returns True if configuration is valid
   */
  static validateConfiguration<T>(
    config: unknown,
    validator: (config: unknown) => config is T
  ): config is T {
    return validator(config)
  }
}
