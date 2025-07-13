import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { validateConfig } from '@project-manager/shared'
import { z } from 'zod'
import { handleError } from '../utils/error-handler.js'

const setProjectConfigSchema = z.object({
  key: z.string().describe('Configuration key to set'),
  value: z.string().describe('Configuration value to set'),
  global: z
    .boolean()
    .optional()
    .default(false)
    .describe('Set in global config instead of project config'),
})

export const setProjectConfigTool = {
  name: 'set_project_config',
  title: 'Set Project Config',
  description: 'Set a project configuration value',
  inputSchema: setProjectConfigSchema.shape,
  handler: async (input: z.infer<typeof setProjectConfigSchema>) => {
    try {
      const { key, value, global } = input

      // All valid configuration keys
      const validKeys = [
        'defaultPriority',
        'defaultType',
        'defaultPrivacy',
        'defaultStatus',
        'defaultOutputFormat',
        'storagePath',
        'confirmDeletion',
        'showHelpOnError',
        'maxTitleLength',
        'dateFormat',
        'enableInteractiveMode',
        'enableColorOutput',
      ] as const

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

      // Boolean configuration keys
      const booleanKeys = [
        'confirmDeletion',
        'showHelpOnError',
        'enableInteractiveMode',
        'enableColorOutput',
      ] as const

      // Numeric configuration keys
      const numericKeys = ['maxTitleLength'] as const

      // Parse boolean values
      if (booleanKeys.includes(key as (typeof booleanKeys)[number])) {
        parsedValue = value.toLowerCase() === 'true'
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

      // Validate string union types
      const stringUnionValidation = {
        defaultPriority: ['high', 'medium', 'low'],
        defaultType: ['feature', 'bug', 'task'],
        defaultPrivacy: ['local-only', 'shareable', 'public'],
        defaultStatus: ['pending', 'in_progress'],
        defaultOutputFormat: ['table', 'json', 'compact'],
        dateFormat: ['iso', 'short', 'relative'],
      } as const

      const unionKey = key as keyof typeof stringUnionValidation
      if (unionKey in stringUnionValidation) {
        const validValues = stringUnionValidation[unionKey] as readonly string[]
        if (!validValues.includes(value)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Invalid value for ${key}: ${value}. Valid values are: ${validValues.join(', ')}`,
              },
            ],
            isError: true,
          }
        }
      }

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

      // Create directory if it doesn't exist
      const configDir = dirname(configPath)
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }

      // Write the updated config
      writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))

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
