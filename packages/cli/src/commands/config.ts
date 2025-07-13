import { getConfig } from '@project-manager/shared'
import { BaseCommand } from '../lib/base-command.ts'

/**
 * Manage configuration settings
 */
export class ConfigCommand extends BaseCommand {
  static override description = 'Manage configuration settings'

  static override examples = ['<%= config.bin %> <%= command.id %> # Show current configuration']

  async execute(_args: any, flags: any): Promise<any> {
    // Default action - show current configuration
    const config = getConfig()

    if (flags.json) {
      this.log(JSON.stringify(config, null, 2))
    } else {
      this.log('Current Configuration:')
      this.log('=====================')
      this.log(`Default Priority: ${config.defaultPriority}`)
      this.log(`Default Type: ${config.defaultType}`)
      this.log(`Default Privacy: ${config.defaultPrivacy}`)
      this.log(`Default Status: ${config.defaultStatus}`)
      this.log(`Default Output Format: ${config.defaultOutputFormat}`)
      this.log(`Confirm Deletion: ${config.confirmDeletion}`)
      this.log(`Show Help on Error: ${config.showHelpOnError}`)
      this.log(`Max Title Length: ${config.maxTitleLength}`)
      this.log(`Date Format: ${config.dateFormat}`)
      this.log(`Enable Interactive Mode: ${config.enableInteractiveMode}`)
      this.log(`Enable Color Output: ${config.enableColorOutput}`)

      if (config.storagePath) {
        this.log(`Storage Path: ${config.storagePath}`)
      }
    }
  }
}
