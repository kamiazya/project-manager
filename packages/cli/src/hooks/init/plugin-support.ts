import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Hook } from '@oclif/core'

/**
 * Plugin architecture support hook
 * Provides infrastructure for loading and managing project-manager CLI plugins
 */
const pluginSupportHook: Hook<'init'> = async function () {
  try {
    // Initialize plugin registry in global scope
    if (!(globalThis as any).projectManagerPlugins) {
      ;(globalThis as any).projectManagerPlugins = new Map()
    }

    // Initialize extension points registry
    if (!(globalThis as any).projectManagerExtensions) {
      ;(globalThis as any).projectManagerExtensions = new Map()
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
      ;(globalThis as any).projectManagerExtensions.set(point, [])
    }

    // Check for local plugin configuration
    const configPath = join(process.cwd(), '.pm-plugins.json')
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'))
        if (config.plugins && Array.isArray(config.plugins)) {
          this.debug(`Found ${config.plugins.length} plugins in configuration`)
          // For now, just log plugin discovery
          // Actual plugin loading would be implemented in a future iteration
          for (const plugin of config.plugins) {
            if (plugin.enabled !== false) {
              this.debug(`Plugin available: ${plugin.name || plugin}`)
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
export function getPluginRegistry(): Map<string, any> {
  return (globalThis as any).projectManagerPlugins || new Map()
}

export function getExtensionPoints(): Map<string, any[]> {
  return (globalThis as any).projectManagerExtensions || new Map()
}

export default pluginSupportHook
