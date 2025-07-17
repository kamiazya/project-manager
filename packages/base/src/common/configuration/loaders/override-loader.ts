/**
 * Override Configuration Loader
 *
 * Provides configuration data from in-memory overrides. This is part of the
 * Common Infrastructure since it provides technical capabilities for
 * runtime configuration overrides.
 */

import { BaseConfigurationLoader } from './configuration-loader.ts'

/**
 * Configuration loader for in-memory overrides
 */
export class OverrideLoader<T = unknown> extends BaseConfigurationLoader<T> {
  private overrides: Partial<T> = {}

  constructor(
    initialOverrides: Partial<T> = {},
    priority: number = 200 // Highest priority
  ) {
    super('override:memory', priority)
    this.overrides = { ...initialOverrides }
  }

  async load(): Promise<Partial<T>> {
    return { ...this.overrides }
  }

  async save(config: T): Promise<void> {
    this.overrides = { ...config }
  }

  /**
   * Set a specific override value
   *
   * @param key - Configuration key (supports dot notation)
   * @param value - Value to set
   */
  setOverride(key: string, value: unknown): void {
    this.setNestedValue(this.overrides as Record<string, unknown>, key, value)
  }

  /**
   * Get a specific override value
   *
   * @param key - Configuration key (supports dot notation)
   * @returns The override value or undefined
   */
  getOverride(key: string): unknown {
    return this.getNestedValue(this.overrides as Record<string, unknown>, key)
  }

  /**
   * Remove a specific override
   *
   * @param key - Configuration key (supports dot notation)
   */
  removeOverride(key: string): void {
    this.deleteNestedValue(this.overrides as Record<string, unknown>, key)
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides = {}
  }

  /**
   * Get all current overrides
   *
   * @returns Copy of current overrides
   */
  getAllOverrides(): Partial<T> {
    return { ...this.overrides }
  }

  /**
   * Merge additional overrides
   *
   * @param additionalOverrides - Overrides to merge
   */
  mergeOverrides(additionalOverrides: Partial<T>): void {
    this.overrides = { ...this.overrides, ...additionalOverrides }
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[keys[keys.length - 1]] = value
  }

  /**
   * Get nested value from object using dot notation
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

  /**
   * Delete nested value from object using dot notation
   */
  private deleteNestedValue(obj: Record<string, unknown>, path: string): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object') {
        return // Path doesn't exist
      }
      current = current[key] as Record<string, unknown>
    }

    delete current[keys[keys.length - 1]]
  }
}

/**
 * Utility functions for override configuration
 */
export class OverrideUtils {
  /**
   * Create an override loader with default settings
   *
   * @param initialOverrides - Initial override values
   * @param priority - Loader priority (default: 200)
   * @returns OverrideLoader instance
   */
  static createLoader<T>(
    initialOverrides: Partial<T> = {},
    priority: number = 200
  ): OverrideLoader<T> {
    return new OverrideLoader<T>(initialOverrides, priority)
  }

  /**
   * Create a temporary override loader for testing
   *
   * @param overrides - Override values
   * @returns OverrideLoader instance with high priority
   */
  static createTestLoader<T>(overrides: Partial<T>): OverrideLoader<T> {
    return new OverrideLoader<T>(overrides, 1000)
  }

  /**
   * Convert flat object with dot notation keys to nested object
   *
   * @param flatObject - Object with dot notation keys
   * @returns Nested object
   */
  static flatToNested(flatObject: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(flatObject)) {
      const keys = key.split('.')
      let current = result

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!(k in current) || typeof current[k] !== 'object') {
          current[k] = {}
        }
        current = current[k] as Record<string, unknown>
      }

      current[keys[keys.length - 1]] = value
    }

    return result
  }
}
