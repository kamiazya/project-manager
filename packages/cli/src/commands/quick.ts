import { BaseCommand } from '../lib/base-command.ts'

type ExecuteArgs = {}

interface ExecuteFlags {
  // Inherits base flags from BaseCommand (json, version, etc.)
  json?: boolean
}

/**
 * Quick operations for common tasks
 */
export class QuickCommand extends BaseCommand {
  static override description = 'Quick operations for common tasks'
  static override aliases = ['q']

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Show available quick operations',
    '<%= config.bin %> <%= command.id %>:new "Fix bug" # Quickly create a ticket',
    '<%= config.bin %> <%= command.id %>:start abc123 # Start working on a ticket',
    '<%= config.bin %> <%= command.id %>:done abc123 # Mark ticket as completed',
    '<%= config.bin %> <%= command.id %>:todo # List pending tickets',
    '<%= config.bin %> <%= command.id %>:wip # List work-in-progress tickets',
  ]

  async execute(_args: ExecuteArgs, _flags: ExecuteFlags): Promise<void> {
    // Display standard oclif help for this command
    await this.config.runCommand('help', ['quick'])
  }
}
