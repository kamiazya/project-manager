import { BaseCommand } from '../lib/base-command.ts'

/**
 * Manage configuration settings
 */
export class ConfigCommand extends BaseCommand {
  static override description = 'Manage configuration settings'

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Show current configuration',
    '<%= config.bin %> <%= command.id %>:show # Show current configuration',
    '<%= config.bin %> <%= command.id %>:get <key> # Get a configuration value',
    '<%= config.bin %> <%= command.id %>:set <key> <value> # Set a configuration value',
    '<%= config.bin %> <%= command.id %>:env # Show environment variables',
  ]

  async execute(): Promise<any> {
    // Default action - show help for config commands
    await this.config.runCommand('help', ['config'])
  }
}
