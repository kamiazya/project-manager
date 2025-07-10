import type { Ticket } from '@project-manager/core'
import type { TicketStats } from '@project-manager/shared'
import { INFO_MESSAGES, VALIDATION } from '@project-manager/shared'
import chalk from 'chalk'

export interface OutputOptions {
  format: 'table' | 'json' | 'compact'
}

export function formatTicket(ticket: Ticket, options: OutputOptions = { format: 'table' }): string {
  if (options.format === 'json') {
    return JSON.stringify(ticket.toJSON(), null, 2)
  }

  if (options.format === 'compact') {
    return `${chalk.blue(ticket.id)} ${getPriorityIcon(ticket.priority)} ${ticket.title} (${getStatusColor(ticket.status)})`
  }

  // Table format (default)
  return [
    `${chalk.bold('ID:')} ${chalk.blue(ticket.id)}`,
    `${chalk.bold('Title:')} ${ticket.title}`,
    `${chalk.bold('Description:')} ${ticket.description}`,
    `${chalk.bold('Status:')} ${getStatusColor(ticket.status)}`,
    `${chalk.bold('Priority:')} ${getPriorityColor(ticket.priority)}`,
    `${chalk.bold('Type:')} ${ticket.type}`,
    `${chalk.bold('Privacy:')} ${ticket.privacy}`,
    `${chalk.bold('Created:')} ${ticket.createdAt.toLocaleString()}`,
    `${chalk.bold('Updated:')} ${ticket.updatedAt.toLocaleString()}`,
  ].join('\n')
}

export function formatTicketList(
  tickets: Ticket[],
  options: OutputOptions = { format: 'table' }
): string {
  if (options.format === 'json') {
    return JSON.stringify(
      tickets.map(t => t.toJSON()),
      null,
      2
    )
  }

  if (tickets.length === 0) {
    return chalk.gray(INFO_MESSAGES.NO_TICKETS_FOUND)
  }

  if (options.format === 'compact') {
    return tickets.map(ticket => formatTicket(ticket, options)).join('\n')
  }

  // Table format (default)
  const header = [
    chalk.bold('ID'),
    chalk.bold('Title'),
    chalk.bold('Status'),
    chalk.bold('Priority'),
    chalk.bold('Type'),
  ].join('\t')

  const rows = tickets.map(ticket =>
    [
      chalk.blue(ticket.id),
      ticket.title.length > VALIDATION.TITLE_DISPLAY_MAX_LENGTH
        ? `${ticket.title.substring(0, VALIDATION.TITLE_TRUNCATE_LENGTH)}...`
        : ticket.title,
      getStatusColor(ticket.status),
      getPriorityColor(ticket.priority),
      ticket.type,
    ].join('\t')
  )

  return [header, ...rows].join('\n')
}

export function formatStats(stats: TicketStats): string {
  return [
    chalk.bold(INFO_MESSAGES.TICKET_STATISTICS),
    '',
    chalk.bold('By Status:'),
    `  Total: ${chalk.blue(stats.total)}`,
    `  Pending: ${chalk.yellow(stats.pending)}`,
    `  In Progress: ${chalk.blue(stats.inProgress)}`,
    `  Completed: ${chalk.green(stats.completed)}`,
    `  Archived: ${chalk.gray(stats.archived)}`,
    '',
    chalk.bold('By Priority:'),
    `  High: ${chalk.red(stats.byPriority.high)}`,
    `  Medium: ${chalk.yellow(stats.byPriority.medium)}`,
    `  Low: ${chalk.green(stats.byPriority.low)}`,
    '',
    chalk.bold('By Type:'),
    `  Features: ${chalk.green(stats.byType.feature)}`,
    `  Bugs: ${chalk.red(stats.byType.bug)}`,
    `  Tasks: ${chalk.blue(stats.byType.task)}`,
  ].join('\n')
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return chalk.yellow(status)
    case 'in_progress':
      return chalk.blue(status)
    case 'completed':
      return chalk.green(status)
    case 'archived':
      return chalk.gray(status)
    default:
      return status
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return chalk.red(priority)
    case 'medium':
      return chalk.yellow(priority)
    case 'low':
      return chalk.green(priority)
    default:
      return priority
  }
}

function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high':
      return chalk.red('🔴')
    case 'medium':
      return chalk.yellow('🟡')
    case 'low':
      return chalk.green('🟢')
    default:
      return '⚪'
  }
}
