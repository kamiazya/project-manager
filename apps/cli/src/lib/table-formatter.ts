import type { TicketResponse } from '@project-manager/sdk'

type TicketSummary = TicketResponse

import { MAX_TITLE_LENGTH, TITLE_TRUNCATE_LENGTH } from './constants.ts'

export interface TableFormatterOptions {
  showStatus?: boolean
  sectionTitle?: string
  customCompactFormat?: (ticket: TicketSummary) => string
  useStatusAbbreviations?: boolean
}

/**
 * Display tickets in either compact or table format
 */
export function displayTickets(
  tickets: TicketSummary[],
  format: 'compact' | 'table',
  logFn: (message: string) => void,
  options: TableFormatterOptions = {}
): void {
  if (format === 'compact') {
    displayCompactFormat(tickets, logFn, options)
  } else {
    displayTableFormat(tickets, logFn, options)
  }
}

/**
 * Display tickets in compact format
 */
function displayCompactFormat(
  tickets: TicketSummary[],
  logFn: (message: string) => void,
  options: TableFormatterOptions
): void {
  tickets.forEach(ticket => {
    if (options.customCompactFormat) {
      logFn(options.customCompactFormat(ticket))
    } else {
      const priority = ticket.priority?.charAt(0).toUpperCase() || 'U'
      const type = ticket.type?.charAt(0).toUpperCase() || 'U'

      let statusPart = ''
      if (options.showStatus && ticket.status) {
        if (options.useStatusAbbreviations) {
          const status =
            ticket.status === 'in_progress' ? 'WIP' : ticket.status?.charAt(0).toUpperCase() || 'U'
          statusPart = status
        } else {
          statusPart = ` (${ticket.status})`
        }
      }

      const title = truncateTitle(ticket.title)
      const statusDisplay = `${priority}${type}`
      logFn(`${ticket.id || 'Unknown'} [${statusDisplay}]${statusPart} ${title}`)
    }
  })
}

/**
 * Display tickets in table format
 */
function displayTableFormat(
  tickets: TicketSummary[],
  logFn: (message: string) => void,
  options: TableFormatterOptions
): void {
  const headers = getTableHeaders(options.showStatus)
  const rows = tickets.map(ticket => getTableRow(ticket, options.showStatus))

  const sectionTitle = options.sectionTitle || 'Tickets:'
  const separator = '='.repeat(sectionTitle.length)

  logFn(`\n${sectionTitle}`)
  logFn(separator)
  logFn(formatTable(headers, rows))
}

/**
 * Get table headers based on options
 */
function getTableHeaders(showStatus = false): string[] {
  const baseHeaders = ['ID', 'Title', 'Priority', 'Type']
  if (showStatus) {
    baseHeaders.push('Status')
  }
  baseHeaders.push('Created')
  return baseHeaders
}

/**
 * Get table row data for a ticket
 */
function getTableRow(ticket: TicketSummary, showStatus = false): string[] {
  const row = [
    ticket.id || 'Unknown',
    truncateTitle(ticket.title),
    ticket.priority || 'unknown',
    ticket.type || 'unknown',
  ]

  if (showStatus) {
    row.push(ticket.status || 'unknown')
  }

  row.push(ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A')

  return row
}

/**
 * Truncate title if it exceeds maximum length
 */
function truncateTitle(title: string | null | undefined): string {
  if (!title) return 'Untitled'

  return title.length > MAX_TITLE_LENGTH ? `${title.substring(0, TITLE_TRUNCATE_LENGTH)}...` : title
}

/**
 * Format data into an ASCII table
 */
export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map(row => row[i]?.length || 0))
  )

  const headerRow = headers.map((header, i) => header.padEnd(colWidths[i] || 0)).join(' | ')
  const separator = colWidths.map(width => '-'.repeat(width || 0)).join('-|-')
  const dataRows = rows.map(row => row.map((cell, i) => cell.padEnd(colWidths[i] || 0)).join(' | '))

  return [headerRow, separator, ...dataRows].join('\n')
}
