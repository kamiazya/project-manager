import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { type Config, getConfig, validateConfig } from '@project-manager/shared'
import { Command } from 'commander'

export function configCommand(): Command {
  const command = new Command('config').description('Manage configuration settings')

  // Show current configuration
  command
    .command('show')
    .description('Show current configuration')
    .option('--json', 'Output in JSON format')
    .action(options => {
      const config = getConfig()

      if (options.json) {
        console.log(JSON.stringify(config, null, 2))
      } else {
        console.log('Current Configuration:')
        console.log('=====================')
        console.log(`Default Priority: ${config.defaultPriority}`)
        console.log(`Default Type: ${config.defaultType}`)
        console.log(`Default Privacy: ${config.defaultPrivacy}`)
        console.log(`Default Status: ${config.defaultStatus}`)
        console.log(`Default Output Format: ${config.defaultOutputFormat}`)
        console.log(`Confirm Deletion: ${config.confirmDeletion}`)
        console.log(`Show Help on Error: ${config.showHelpOnError}`)
        console.log(`Max Title Length: ${config.maxTitleLength}`)
        console.log(`Date Format: ${config.dateFormat}`)
        console.log(`Enable Interactive Mode: ${config.enableInteractiveMode}`)
        console.log(`Enable Color Output: ${config.enableColorOutput}`)

        if (config.storagePath) {
          console.log(`Storage Path: ${config.storagePath}`)
        }
      }
    })

  // Set configuration value
  command
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Configuration key')
    .argument('<value>', 'Configuration value')
    .option('--global', 'Set in global config (~/.pmrc.json)')
    .action((key: string, value: string, options) => {
      try {
        // Parse the value based on the key
        let parsedValue: any = value

        // Boolean values
        if (
          [
            'confirmDeletion',
            'showHelpOnError',
            'enableInteractiveMode',
            'enableColorOutput',
          ].includes(key)
        ) {
          parsedValue = value.toLowerCase() === 'true'
        }

        // Numeric values
        if (key === 'maxTitleLength') {
          parsedValue = parseInt(value, 10)
          if (isNaN(parsedValue)) {
            console.error(`Invalid numeric value for ${key}: ${value}`)
            process.exit(1)
          }
        }

        // Validate the configuration
        const testConfig = { [key]: parsedValue }
        const errors = validateConfig(testConfig)
        if (errors.length > 0) {
          console.error('Configuration validation errors:')
          errors.forEach(error => console.error(`  - ${error}`))
          process.exit(1)
        }

        // Determine config file path
        const configPath = options.global
          ? join(homedir(), '.pmrc.json')
          : join(process.cwd(), '.pmrc.json')

        // Load existing config or create new one
        let existingConfig = {}
        if (existsSync(configPath)) {
          try {
            existingConfig = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
          } catch (error) {
            console.error(`Failed to read existing config: ${error}`)
            process.exit(1)
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

        console.log(`Configuration updated: ${key} = ${parsedValue}`)
        console.log(`Config file: ${configPath}`)
      } catch (error) {
        console.error(`Failed to set configuration: ${error}`)
        process.exit(1)
      }
    })

  // Get configuration value
  command
    .command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Configuration key')
    .action((key: string) => {
      const config = getConfig()
      const value = (config as any)[key]

      if (value === undefined) {
        console.error(`Configuration key not found: ${key}`)
        process.exit(1)
      }

      console.log(value)
    })

  // List environment variables
  command
    .command('env')
    .description('Show environment variables that affect configuration')
    .action(() => {
      console.log('Environment Variables:')
      console.log('=====================')
      console.log('PM_STORAGE_PATH - Custom storage path')
      console.log('PM_DEFAULT_PRIORITY - Default priority (high, medium, low)')
      console.log('PM_DEFAULT_TYPE - Default type (feature, bug, task)')
      console.log('PM_DEFAULT_PRIVACY - Default privacy (local-only, shareable, public)')
      console.log('PM_DEFAULT_STATUS - Default status (pending, in_progress)')
      console.log('PM_DEFAULT_OUTPUT_FORMAT - Default output format (table, json, compact)')
      console.log('PM_CONFIRM_DELETION - Confirm deletion (true, false)')
      console.log('PM_SHOW_HELP_ON_ERROR - Show help on error (true, false)')
      console.log('PM_MAX_TITLE_LENGTH - Maximum title length (number)')
      console.log('PM_DATE_FORMAT - Date format (iso, short, relative)')
      console.log('PM_ENABLE_INTERACTIVE_MODE - Enable interactive mode (true, false)')
      console.log('PM_ENABLE_COLOR_OUTPUT - Enable color output (true, false)')
      console.log('XDG_CONFIG_HOME - XDG config directory')
      console.log()
      console.log('Currently set:')
      const envVars = [
        'PM_STORAGE_PATH',
        'PM_DEFAULT_PRIORITY',
        'PM_DEFAULT_TYPE',
        'PM_DEFAULT_PRIVACY',
        'PM_DEFAULT_STATUS',
        'PM_DEFAULT_OUTPUT_FORMAT',
        'PM_CONFIRM_DELETION',
        'PM_SHOW_HELP_ON_ERROR',
        'PM_MAX_TITLE_LENGTH',
        'PM_DATE_FORMAT',
        'PM_ENABLE_INTERACTIVE_MODE',
        'PM_ENABLE_COLOR_OUTPUT',
        'XDG_CONFIG_HOME',
      ]

      envVars.forEach(envVar => {
        const value = process.env[envVar]
        if (value !== undefined) {
          console.log(`  ${envVar}=${value}`)
        }
      })
    })

  return command
}
