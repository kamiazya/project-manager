import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Hook } from '@oclif/core'

/**
 * Global interface extension for project-manager plugin architecture
 */
declare global {
  var projectManagerPlugins: Map<string, unknown> | undefined
  var projectManagerExtensions: Map<string, unknown[]> | undefined
}

/**
 * Plugin configuration interface
 */
interface PluginConfig {
  name?: string
  enabled?: boolean
  [key: string]: unknown
}

interface PluginConfigFile {
  plugins?: (PluginConfig | string)[]
  [key: string]: unknown
}

/**
 * Plugin architecture support hook
 * Provides infrastructure for loading and managing project-manager CLI plugins
 */
const pluginSupportHook: Hook<'init'> = async function () {
  try {
    // Initialize plugin registry in global scope
    if (!globalThis.projectManagerPlugins) {
      globalThis.projectManagerPlugins = new Map()
    }

    // Initialize extension points registry
    if (!globalThis.projectManagerExtensions) {
      globalThis.projectManagerExtensions = new Map()
    }

    // Register built-in extension points
    const extensionPoints = [
      'command:before',
      'command:after',
      'ticket:created',
      'ticket:updated',
      'ticket:deleted',
    ]

    for (const point of extensionPoints) {
      globalThis.projectManagerExtensions!.set(point, [])
    }

    // Check for local plugin configuration
    const configPath = join(process.cwd(), '.pm-plugins.json')
    if (existsSync(configPath)) {
      try {
        const config: PluginConfigFile = JSON.parse(readFileSync(configPath, 'utf-8'))
        if (config.plugins && Array.isArray(config.plugins)) {
          this.debug(`Found ${config.plugins.length} plugins in configuration`)
          // For now, just log plugin discovery
          // Actual plugin loading would be implemented in a future iteration
          for (const plugin of config.plugins) {
            const pluginConfig = typeof plugin === 'string' ? { name: plugin } : plugin
            if (pluginConfig.enabled !== false) {
              this.debug(`Plugin available: ${pluginConfig.name || plugin}`)
            }
          }
        }
      } catch (error) {
        this.warn(
          `Failed to load plugin configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    this.debug('Plugin architecture initialized')
  } catch (error) {
    // Don't fail command execution for plugin initialization errors
    this.warn(
      `Plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Utility functions for plugin architecture (to be expanded in future)
 */
export function getPluginRegistry(): Map<string, unknown> {
  if (!globalThis.projectManagerPlugins) {
    globalThis.projectManagerPlugins = new Map()
  }
  return globalThis.projectManagerPlugins
}

export function getExtensionPoints(): Map<string, unknown[]> {
  if (!globalThis.projectManagerExtensions) {
    globalThis.projectManagerExtensions = new Map()
  }
  return globalThis.projectManagerExtensions
}

export default pluginSupportHook
