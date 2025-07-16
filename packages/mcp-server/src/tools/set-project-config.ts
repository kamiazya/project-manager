import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { type Config, DEFAULT_CONFIG, resetConfig, validateConfig } from '@project-manager/shared'
import { z } from 'zod'
import type { McpTool } from '../types/mcp-tool.ts'
import { handleError } from '../utils/error-handler.ts'

const setProjectConfigSchema = z.object({
  key: z.string().describe('Configuration key to set'),
  value: z.string().describe('Configuration value to set'),
  global: z
    .boolean()
    .optional()
    .default(false)
    .describe('Set in global config instead of project config'),
})

export const setProjectConfigTool: McpTool = {
  name: 'set_project_config',
  title: 'Set Project Config',
  description: 'Set a project configuration value',
  inputSchema: setProjectConfigSchema.shape,
  handler: async (input: z.infer<typeof setProjectConfigSchema>) => {
    try {
      const { key, value, global } = input

      // Derive valid configuration keys from the Config interface
      const validKeys = Object.keys(DEFAULT_CONFIG) as (keyof Config)[]
      // Add optional keys that aren't in DEFAULT_CONFIG but are part of Config interface
      validKeys.push('storagePath')

      // Validate that the key is allowed
      if (!validKeys.includes(key as (typeof validKeys)[number])) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Invalid configuration key: ${key}. Valid keys are: ${validKeys.join(', ')}`,
            },
          ],
          isError: true,
        }
      }

      // Parse the value based on the key
      let parsedValue: string | boolean | number = value

      // Derive boolean configuration keys from DEFAULT_CONFIG
      const booleanKeys = Object.keys(DEFAULT_CONFIG).filter(
        key => typeof DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] === 'boolean'
      ) as (keyof Config)[]

      // Derive numeric configuration keys from DEFAULT_CONFIG
      const numericKeys = Object.keys(DEFAULT_CONFIG).filter(
        key => typeof DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] === 'number'
      ) as (keyof Config)[]

      // Parse boolean values (case-insensitive and flexible)
      if (booleanKeys.includes(key as (typeof booleanKeys)[number])) {
        const lowerValue = value.toLowerCase().trim()
        // Accept various truthy values: true, 1, yes, on
        // Accept various falsy values: false, 0, no, off (all others default to false)
        parsedValue = ['true', '1', 'yes', 'on'].includes(lowerValue)
      }

      // Parse numeric values
      if (numericKeys.includes(key as (typeof numericKeys)[number])) {
        parsedValue = parseInt(value, 10)
        if (Number.isNaN(parsedValue)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Invalid numeric value for ${key}: ${value}`,
              },
            ],
            isError: true,
          }
        }
      }

      // Note: String union validation is handled by the validateConfig function below
      // This removes the need to hardcode valid values for each configuration key

      // Validate the configuration
      const testConfig = { [key]: parsedValue }
      const errors = validateConfig(testConfig)
      if (errors.length > 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Configuration validation errors: ${errors.join(', ')}`,
            },
          ],
          isError: true,
        }
      }

      // Determine config file path
      const configPath = global ? join(homedir(), '.pmrc.json') : join(process.cwd(), '.pmrc.json')

      // Load existing config or create new one
      let existingConfig = {}
      if (existsSync(configPath)) {
        try {
          existingConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Failed to read existing config: ${handleError(error).error}`,
              },
            ],
            isError: true,
          }
        }
      }

      // Update the config
      const updatedConfig = { ...existingConfig, [key]: parsedValue }

      // Validate the updated configuration
      const validationErrors = validateConfig(updatedConfig)
      if (validationErrors.length > 0) {
        throw new Error(`Configuration validation errors: ${validationErrors.join(', ')}`)
      }

      // Create directory if it doesn't exist
      const configDir = dirname(configPath)
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }

      // Write the updated config
      writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))

      // Reset config cache to ensure changes are reflected
      resetConfig()

      return {
        content: [
          {
            type: 'text' as const,
            text: `Configuration updated: ${key} = ${parsedValue}
Config file: ${configPath}`,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to set configuration: ${handleError(error).error}`,
          },
        ],
        isError: true,
      }
    }
  },
}
