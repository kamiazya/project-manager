import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { Args, Flags } from '@oclif/core'
import { validateConfig } from '@project-manager/shared'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Set a configuration value
 */
export class ConfigSetCommand extends BaseCommand {
  static override description = 'Set a configuration value'

  static override examples = [
    '<%= config.bin %> <%= command.id %> defaultPriority high',
    '<%= config.bin %> <%= command.id %> enableColorOutput true --global',
  ]

  static override args = {
    key: Args.string({
      description: 'Configuration key to set',
      required: true,
    }),
    value: Args.string({
      description: 'Configuration value to set',
      required: true,
    }),
  }

  static override flags = {
    global: Flags.boolean({
      description: 'Set in global config (~/.pmrc.json)',
    }),
  }

  async execute(args: { key: string; value: string }, flags: any): Promise<any> {
    try {
      // Define the possible types for configuration values
      type ConfigValue = string | boolean | number

      // All valid configuration keys
      const validKeys = [
        // Default values for CLI operations
        'defaultPriority',
        'defaultType',
        'defaultPrivacy',
        'defaultStatus',
        'defaultOutputFormat',
        // Storage configuration
        'storagePath',
        // CLI behavior
        'confirmDeletion',
        'showHelpOnError',
        // Display preferences
        'maxTitleLength',
        'dateFormat',
        // Feature flags
        'enableInteractiveMode',
        'enableColorOutput',
      ] as const

      // Validate that the key is allowed
      if (!validKeys.includes(args.key as (typeof validKeys)[number])) {
        this.error(`Invalid configuration key: ${args.key}`)
        this.log(`Valid keys are: ${validKeys.join(', ')}`)
        return
      }

      // Parse the value based on the key
      let parsedValue: ConfigValue = args.value

      // Boolean configuration keys
      const booleanKeys = [
        'confirmDeletion',
        'showHelpOnError',
        'enableInteractiveMode',
        'enableColorOutput',
      ] as const

      // Numeric configuration keys
      const numericKeys = ['maxTitleLength'] as const

      // Type guard for boolean keys
      const isBooleanKey = (key: string): key is (typeof booleanKeys)[number] => {
        return booleanKeys.includes(key as (typeof booleanKeys)[number])
      }

      // Type guard for numeric keys
      const isNumericKey = (key: string): key is (typeof numericKeys)[number] => {
        return numericKeys.includes(key as (typeof numericKeys)[number])
      }

      // Parse boolean values
      if (isBooleanKey(args.key)) {
        parsedValue = args.value.toLowerCase() === 'true'
      }

      // Parse numeric values
      if (isNumericKey(args.key)) {
        parsedValue = parseInt(args.value, 10)
        if (Number.isNaN(parsedValue)) {
          this.error(`Invalid numeric value for ${args.key}: ${args.value}`)
          return
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

      const unionKey = args.key as keyof typeof stringUnionValidation
      if (unionKey in stringUnionValidation) {
        const validValues = stringUnionValidation[unionKey] as readonly string[]
        if (!validValues.includes(args.value)) {
          this.error(`Invalid value for ${args.key}: ${args.value}`)
          this.log(`Valid values are: ${validValues.join(', ')}`)
          return
        }
      }

      // Validate the configuration
      const testConfig = { [args.key]: parsedValue }
      const errors = validateConfig(testConfig)
      if (errors.length > 0) {
        this.error('Configuration validation errors:')
        errors.forEach(error => this.log(`  - ${error}`))
        return
      }

      // Determine config file path
      const configPath = flags.global
        ? join(homedir(), '.pmrc.json')
        : join(process.cwd(), '.pmrc.json')

      // Load existing config or create new one
      let existingConfig = {}
      if (existsSync(configPath)) {
        try {
          existingConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
        } catch (error) {
          this.error(`Failed to read existing config: ${error}`)
          return
        }
      }

      // Update the config
      const updatedConfig = { ...existingConfig, [args.key]: parsedValue }

      // Validate the updated configuration
      const validationErrors = validateConfig(updatedConfig)
      if (validationErrors.length > 0) {
        this.error(`Configuration validation errors: ${validationErrors.join(', ')}`)
        return
      }

      // Create directory if it doesn't exist
      const configDir = dirname(configPath)
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true })
      }

      // Write the updated config
      writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))

      this.log(`Configuration updated: ${args.key} = ${parsedValue}`)
      this.log(`Config file: ${configPath}`)
    } catch (error) {
      this.error(`Failed to set configuration: ${error}`)
    }
  }
}
