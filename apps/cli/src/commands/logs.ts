import { Flags } from '@oclif/core'
import type { GetLogs } from '@project-manager/application'
import type { LogsResponse } from '@project-manager/sdk'
import chalk from 'chalk'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {}

interface ExecuteFlags extends Record<string, unknown> {
  level?: string
  component?: string
  operation?: string
  'trace-id'?: string
  since?: string
  until?: string
  limit?: number
  offset?: number
  json?: boolean
  follow?: boolean
}

/**
 * View system logs
 */
export class LogsCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, LogsResponse> {
  static override description = 'View system logs'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --level error',
    '<%= config.bin %> <%= command.id %> --component cli --limit 20',
    '<%= config.bin %> <%= command.id %> --since "2024-01-01" --until "2024-01-31" --json',
  ]

  static override args = {}

  static override flags = {
    level: Flags.string({
      description: 'Filter by log level (debug, info, warn, error)',
      options: ['debug', 'info', 'warn', 'error'],
    }),
    component: Flags.string({
      description: 'Filter by component name',
    }),
    operation: Flags.string({
      description: 'Filter by operation',
    }),
    'trace-id': Flags.string({
      description: 'Filter by trace ID',
    }),
    since: Flags.string({
      description: 'Show logs since this time (ISO format)',
    }),
    until: Flags.string({
      description: 'Show logs until this time (ISO format)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of logs to display',
      default: 50,
    }),
    offset: Flags.integer({
      description: 'Number of logs to skip',
      default: 0,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
    }),
    follow: Flags.boolean({
      description: 'Follow log output (not implemented yet)',
    }),
  }

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<LogsResponse> {
    const request: GetLogs.Request = {
      level: flags.level as 'debug' | 'info' | 'warn' | 'error' | undefined,
      component: flags.component,
      operation: flags.operation,
      traceId: flags['trace-id'],
      startTime: flags.since,
      endTime: flags.until,
      limit: flags.limit,
      offset: flags.offset,
    }

    const response = await this.sdk.logs.getLogs(request)

    if (flags.json) {
      this.log(JSON.stringify(response, null, 2))
    } else {
      this.displayLogs(response)
    }

    return response
  }

  private displayLogs(result: LogsResponse): void {
    // Display summary
    this.log(chalk.cyan('\\n📋 Log Summary'))
    this.log(chalk.gray('─'.repeat(50)))
    this.log(`${chalk.white('Total logs:')} ${chalk.yellow(result.totalCount)}`)
    this.log(`${chalk.white('Displayed:')} ${chalk.yellow(result.logs.length)}`)
    if (result.hasMore) {
      this.log(chalk.yellow('(More logs available - use --limit and --offset to paginate)'))
    }

    if (result.logs.length === 0) {
      this.log(chalk.gray('\\nNo logs found matching the criteria.'))
      return
    }

    // Display logs
    this.log(chalk.cyan('\\n📝 Logs'))
    this.log(chalk.gray('─'.repeat(50)))

    result.logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleString()
      const levelColor = this.getLevelColor(log.level)
      const level = levelColor(log.level.toUpperCase().padEnd(5))

      this.log(`${chalk.gray(timestamp)} ${level} ${chalk.white(log.message)}`)

      if (log.component || log.operation || log.traceId) {
        const metadata: string[] = []
        if (log.component) metadata.push(`component=${log.component}`)
        if (log.operation) metadata.push(`operation=${log.operation}`)
        if (log.traceId) metadata.push(`trace=${log.traceId.substring(0, 8)}`)
        this.log(chalk.gray(`      ${metadata.join(' | ')}`))
      }

      if (log.metadata && Object.keys(log.metadata).length > 0) {
        const filteredMetadata = { ...log.metadata }
        delete filteredMetadata.component
        delete filteredMetadata.operation
        delete filteredMetadata.traceId
        delete filteredMetadata.userId

        if (Object.keys(filteredMetadata).length > 0) {
          this.log(chalk.gray(`      ${JSON.stringify(filteredMetadata)}`))
        }
      }

      this.log('') // Empty line between logs
    })
  }

  private getLevelColor(level: string): (text: string) => string {
    switch (level) {
      case 'debug':
        return chalk.gray
      case 'info':
        return chalk.blue
      case 'warn':
        return chalk.yellow
      case 'error':
        return chalk.red
      default:
        return chalk.white
    }
  }
}
