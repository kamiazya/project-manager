import { Flags } from '@oclif/core'
import type { GetAuditLogs } from '@project-manager/application'
import type { AuditLogsResponse } from '@project-manager/sdk'
import chalk from 'chalk'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {}

interface ExecuteFlags extends Record<string, unknown> {
  operation?: string
  'operation-id'?: string
  'resource-type'?: string
  'entity-id'?: string
  'actor-type'?: string
  'actor-id'?: string
  source?: string
  'trace-id'?: string
  since?: string
  until?: string
  success?: boolean
  limit?: number
  offset?: number
  json?: boolean
  summary?: boolean
}

/**
 * View audit logs
 */
export class AuditCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, AuditLogsResponse> {
  static override description = 'View audit logs'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --operation create --actor-type human',
    '<%= config.bin %> <%= command.id %> --resource-type Ticket --success true',
    '<%= config.bin %> <%= command.id %> --since "2024-01-01" --summary --json',
  ]

  static override args = {}

  static override flags = {
    operation: Flags.string({
      description: 'Filter by operation type (create, read, update, delete, search)',
      options: ['create', 'read', 'update', 'delete', 'search'],
    }),
    'operation-id': Flags.string({
      description: 'Filter by specific operation ID',
    }),
    'resource-type': Flags.string({
      description: 'Filter by resource type (e.g., Ticket)',
    }),
    'entity-id': Flags.string({
      description: 'Filter by specific entity ID',
    }),
    'actor-type': Flags.string({
      description: 'Filter by actor type (human, ai, system)',
      options: ['human', 'ai', 'system'],
    }),
    'actor-id': Flags.string({
      description: 'Filter by specific actor ID',
    }),
    source: Flags.string({
      description: 'Filter by source (cli, mcp, api, test, scheduler)',
      options: ['cli', 'mcp', 'api', 'test', 'scheduler'],
    }),
    'trace-id': Flags.string({
      description: 'Filter by trace ID',
    }),
    since: Flags.string({
      description: 'Show audit logs since this time (ISO format)',
    }),
    until: Flags.string({
      description: 'Show audit logs until this time (ISO format)',
    }),
    success: Flags.boolean({
      description: 'Filter by success status',
    }),
    limit: Flags.integer({
      description: 'Maximum number of audit logs to display',
      default: 30,
    }),
    offset: Flags.integer({
      description: 'Number of audit logs to skip',
      default: 0,
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
    }),
    summary: Flags.boolean({
      description: 'Show detailed summary statistics',
    }),
  }

  async execute(_args: ExecuteArgs, flags: ExecuteFlags): Promise<AuditLogsResponse> {
    const request: GetAuditLogs.Request = {
      operation: flags.operation as 'create' | 'read' | 'update' | 'delete' | 'search' | undefined,
      operationId: flags['operation-id'],
      resourceType: flags['resource-type'],
      entityId: flags['entity-id'],
      actorType: flags['actor-type'] as 'human' | 'ai' | 'system' | undefined,
      actorId: flags['actor-id'],
      source: flags.source as 'cli' | 'mcp' | 'api' | 'test' | 'scheduler' | undefined,
      traceId: flags['trace-id'],
      startTime: flags.since,
      endTime: flags.until,
      success: flags.success,
      limit: flags.limit,
      offset: flags.offset,
    }

    const response = await this.sdk.audit.getAuditLogs(request)

    if (flags.json) {
      this.log(JSON.stringify(response, null, 2))
    } else {
      this.displayAuditLogs(response, flags.summary)
    }

    return response
  }

  private displayAuditLogs(result: AuditLogsResponse, showSummary?: boolean): void {
    // Display summary
    this.log(chalk.cyan('\n🔍 Audit Log Summary'))
    this.log(chalk.gray('─'.repeat(50)))
    this.log(`${chalk.white('Total audit logs:')} ${chalk.yellow(result.totalCount)}`)
    this.log(`${chalk.white('Displayed:')} ${chalk.yellow(result.auditLogs.length)}`)
    this.log(
      `${chalk.white('Success Rate:')} ${this.getSuccessRateColor(result.summary.successRate)(result.summary.successRate.toString())}%`
    )

    if (result.hasMore) {
      this.log(chalk.yellow('(More audit logs available - use --limit and --offset to paginate)'))
    }

    // Show detailed summary if requested or if no specific filters
    if (showSummary || result.auditLogs.length < 20) {
      this.displayDetailedSummary(result.summary)
    }

    if (result.auditLogs.length === 0) {
      this.log(chalk.gray('\nNo audit logs found matching the criteria.'))
      return
    }

    // Display audit logs
    this.log(chalk.cyan('\n📋 Audit Logs'))
    this.log(chalk.gray('─'.repeat(50)))

    result.auditLogs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleString()
      const operationColor = this.getOperationColor(log.operation)
      const statusIcon = log.success ? chalk.green('✓') : chalk.red('✗')

      this.log(
        `${chalk.gray(timestamp)} ${statusIcon} ${operationColor(log.operation.toUpperCase())} ${chalk.white(log.resourceType)}`
      )

      // Show actor and source info
      const actorIcon = this.getActorIcon(log.actor.type)
      this.log(
        chalk.gray(`      ${actorIcon} ${log.actor.name} (${log.actor.type}) via ${log.source}`)
      )

      // Show entity ID if available
      if (log.entityId) {
        this.log(chalk.gray(`      ID: ${log.entityId}`))
      }

      // Show operation ID if different from operation
      if (log.operationId !== log.operation) {
        this.log(chalk.gray(`      Operation: ${log.operationId}`))
      }

      // Show trace ID (abbreviated)
      this.log(chalk.gray(`      Trace: ${log.traceId.substring(0, 8)}...`))

      // Show duration if available
      if (log.duration) {
        this.log(chalk.gray(`      Duration: ${log.duration}ms`))
      }

      // Show error message if failed
      if (!log.success && log.errorMessage) {
        this.log(chalk.red(`      Error: ${log.errorMessage}`))
      }

      // Show changes if available
      if (log.changes && log.changes.length > 0) {
        this.log(chalk.gray('      Changes:'))
        log.changes.forEach(change => {
          this.log(
            chalk.gray(
              `        ${change.field}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`
            )
          )
        })
      }

      this.log('') // Empty line between audit logs
    })
  }

  private displayDetailedSummary(summary: AuditLogsResponse['summary']): void {
    this.log(chalk.cyan('\n📊 Detailed Summary'))
    this.log(chalk.gray('─'.repeat(30)))

    // Operations breakdown
    if (Object.keys(summary.operationCounts).length > 0) {
      this.log(chalk.white('Operations:'))
      Object.entries(summary.operationCounts).forEach(([operation, count]) => {
        const color = this.getOperationColor(operation)
        this.log(`  ${color(operation.padEnd(8))}: ${count}`)
      })
    }

    // Actor types breakdown
    if (Object.keys(summary.actorTypeCounts).length > 0) {
      this.log(chalk.white('Actor Types:'))
      Object.entries(summary.actorTypeCounts).forEach(([actorType, count]) => {
        const icon = this.getActorIcon(actorType)
        this.log(`  ${icon} ${actorType.padEnd(6)}: ${count}`)
      })
    }

    // Sources breakdown
    if (Object.keys(summary.sourceCounts).length > 0) {
      this.log(chalk.white('Sources:'))
      Object.entries(summary.sourceCounts).forEach(([source, count]) => {
        this.log(`  ${source.padEnd(8)}: ${count}`)
      })
    }
  }

  private getOperationColor(operation: string): (text: string) => string {
    switch (operation) {
      case 'create':
        return chalk.green
      case 'read':
        return chalk.blue
      case 'update':
        return chalk.yellow
      case 'delete':
        return chalk.red
      case 'search':
        return chalk.cyan
      default:
        return chalk.white
    }
  }

  private getActorIcon(actorType: string): string {
    switch (actorType) {
      case 'human':
        return '👤'
      case 'ai':
        return '🤖'
      case 'system':
        return '⚙️'
      default:
        return '❓'
    }
  }

  private getSuccessRateColor(successRate: number): (text: string) => string {
    if (successRate >= 95) return chalk.green
    if (successRate >= 80) return chalk.yellow
    return chalk.red
  }
}
