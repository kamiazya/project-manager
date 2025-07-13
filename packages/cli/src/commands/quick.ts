import { BaseCommand } from '../lib/base-command.ts'

/**
 * Quick operations for common tasks
 */
export class QuickCommand extends BaseCommand {
  static override description = 'Quick operations for common tasks'
  static override aliases = ['q']

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Show available quick operations',
  ]

  async execute(_args: any, _flags: any): Promise<any> {
    // Display standard oclif help for this command
    await this.config.runCommand('help', ['quick'])
  }
}
