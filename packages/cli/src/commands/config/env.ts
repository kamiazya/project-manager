import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Show environment variables that affect configuration
 */
export class ConfigEnvCommand extends BaseCommand {
  static override description = 'Show environment variables that affect configuration'

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Show available environment variables',
  ]

  async execute(): Promise<void> {
    const envVars = [
      { name: 'PM_STORAGE_PATH', description: 'Custom storage path' },
      { name: 'PM_DEFAULT_PRIORITY', description: 'Default priority (high, medium, low)' },
      { name: 'PM_DEFAULT_TYPE', description: 'Default type (feature, bug, task)' },
      {
        name: 'PM_DEFAULT_PRIVACY',
        description: 'Default privacy (local-only, shareable, public)',
      },
      { name: 'PM_DEFAULT_STATUS', description: 'Default status (pending, in_progress)' },
      {
        name: 'PM_DEFAULT_OUTPUT_FORMAT',
        description: 'Default output format (table, json, compact)',
      },
      { name: 'PM_CONFIRM_DELETION', description: 'Confirm deletion (true, false)' },
      { name: 'PM_SHOW_HELP_ON_ERROR', description: 'Show help on error (true, false)' },
      { name: 'PM_MAX_TITLE_LENGTH', description: 'Maximum title length (number)' },
      { name: 'PM_DATE_FORMAT', description: 'Date format (iso, short, relative)' },
      { name: 'PM_ENABLE_INTERACTIVE_MODE', description: 'Enable interactive mode (true, false)' },
      { name: 'PM_ENABLE_COLOR_OUTPUT', description: 'Enable color output (true, false)' },
      { name: 'XDG_CONFIG_HOME', description: 'XDG config directory' },
    ]

    this.log('Environment Variables:')
    this.log('=====================')

    envVars.forEach(({ name, description }) => {
      this.log(`${name} - ${description}`)
    })

    this.log()
    this.log('Currently set:')

    envVars.forEach(({ name }) => {
      const value = process.env[name]
      if (value !== undefined) {
        this.log(`  ${name}=${value}`)
      }
    })
  }
}
