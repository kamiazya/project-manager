import type { TicketResponse } from '@project-manager/sdk'

type TicketSummary = TicketResponse

/**
 * Maximum title length before truncation in table displays
 */
const MAX_TITLE_LENGTH = 50

/**
 * Number of characters to show before adding ellipsis
 * (MAX_TITLE_LENGTH - 3 for "...")
 */
const TITLE_TRUNCATE_LENGTH = MAX_TITLE_LENGTH - 3

export interface TableFormatterOptions {
  showStatus?: boolean
  showAliases?: boolean
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
      const aliasInfo = ticket.aliases?.canonical ? ` (${ticket.aliases.canonical})` : ''
      logFn(`${ticket.id || 'Unknown'}${aliasInfo} [${statusDisplay}]${statusPart} ${title}`)
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
  const showAliases = options.showAliases ?? true
  const headers = getTableHeaders(options.showStatus, showAliases)
  const rows = tickets.map(ticket => getTableRow(ticket, options.showStatus, showAliases))

  const sectionTitle = options.sectionTitle || 'Tickets:'
  const separator = '='.repeat(sectionTitle.length)

  logFn(`\n${sectionTitle}`)
  logFn(separator)
  logFn(formatTable(headers, rows))
}

/**
 * Get table headers based on options
 */
function getTableHeaders(showStatus = false, showAliases = true): string[] {
  const baseHeaders = ['ID', 'Title', 'Priority', 'Type']
  if (showAliases) {
    baseHeaders.push('Alias')
  }
  if (showStatus) {
    baseHeaders.push('Status')
  }
  baseHeaders.push('Created')
  return baseHeaders
}

/**
 * Get table row data for a ticket
 */
function getTableRow(ticket: TicketSummary, showStatus = false, showAliases = true): string[] {
  const row = [
    ticket.id || 'Unknown',
    truncateTitle(ticket.title),
    ticket.priority || 'unknown',
    ticket.type || 'unknown',
  ]

  if (showAliases) {
    const aliasDisplay = ticket.aliases?.canonical || '-'
    row.push(aliasDisplay)
  }

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
