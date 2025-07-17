/**
 * JSON File Configuration Loader
 *
 * Loads configuration data from JSON files. This is part of the Common
 * Infrastructure since it provides technical capabilities for file-based
 * configuration management.
 */

import { constants } from 'node:fs'
import { access, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { BaseConfigurationLoader } from './configuration-loader.ts'

/**
 * Configuration loader for JSON files
 */
export class JsonFileLoader<T = unknown> extends BaseConfigurationLoader<T> {
  constructor(
    filePath: string,
    priority: number = 0,
    private readonly encoding: BufferEncoding = 'utf8'
  ) {
    super(resolve(filePath), priority)
  }

  async load(): Promise<Partial<T>> {
    try {
      const content = await readFile(this.source, this.encoding)
      const parsed = JSON.parse(content)

      // Validate that result is an object
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`Invalid JSON configuration: expected object, got ${typeof parsed}`)
      }

      return parsed as Partial<T>
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file ${this.source}: ${error.message}`)
      }

      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Configuration file not found: ${this.source}`)
      }

      throw error
    }
  }

  async save(config: T): Promise<void> {
    try {
      // Ensure directory exists
      const dir = dirname(this.source)
      await access(dir, constants.F_OK).catch(async () => {
        const { mkdir } = await import('node:fs/promises')
        await mkdir(dir, { recursive: true })
      })

      // Write configuration with pretty formatting
      const content = JSON.stringify(config, null, 2)
      await writeFile(this.source, content, this.encoding)
    } catch (error) {
      throw new Error(
        `Failed to save configuration to ${this.source}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async exists(): Promise<boolean> {
    try {
      await access(this.source, constants.F_OK)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Utility functions for JSON file configuration
 */
export class JsonFileUtils {
  /**
   * Create a JSON file loader with default settings
   *
   * @param filePath - Path to the JSON file
   * @param priority - Loader priority (default: 0)
   * @returns JsonFileLoader instance
   */
  static createLoader<T>(filePath: string, priority: number = 0): JsonFileLoader<T> {
    return new JsonFileLoader<T>(filePath, priority)
  }

  /**
   * Load and validate JSON configuration
   *
   * @param filePath - Path to the JSON file
   * @param validator - Optional validation function
   * @returns Promise resolving to validated configuration
   */
  static async loadAndValidate<T>(
    filePath: string,
    validator?: (config: unknown) => config is T
  ): Promise<T> {
    const loader = new JsonFileLoader<T>(filePath)
    const config = await loader.load()

    if (validator && !validator(config)) {
      throw new Error(`Configuration validation failed for ${filePath}`)
    }

    return config as T
  }

  /**
   * Safely load JSON configuration with defaults
   *
   * @param filePath - Path to the JSON file
   * @param defaults - Default configuration values
   * @returns Promise resolving to configuration with defaults applied
   */
  static async loadWithDefaults<T>(filePath: string, defaults: T): Promise<T> {
    const loader = new JsonFileLoader<T>(filePath)

    try {
      const config = await loader.load()
      return { ...defaults, ...config }
    } catch {
      return defaults
    }
  }
}
