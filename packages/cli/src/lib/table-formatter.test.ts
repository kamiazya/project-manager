import type { TicketSummary } from '@project-manager/core'
import { describe, expect, test, vi } from 'vitest'
import { displayTickets, formatTable } from './table-formatter.ts'

describe('Table Formatter Functions', () => {
  const mockTickets: TicketSummary[] = [
    {
      id: 'ticket-1',
      title: 'Test ticket 1',
      status: 'in_progress',
      priority: 'high',
      type: 'feature',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'ticket-2',
      title: 'Test ticket 2',
      status: 'pending',
      priority: 'medium',
      type: 'bug',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    },
  ]

  describe('displayTickets', () => {
    test('should display tickets in compact format', () => {
      const logFn = vi.fn()

      displayTickets(mockTickets, 'compact', logFn)

      expect(logFn).toHaveBeenCalledWith('ticket-1 [HF] Test ticket 1')
      expect(logFn).toHaveBeenCalledWith('ticket-2 [MB] Test ticket 2')
    })

    test('should display tickets in compact format with status', () => {
      const logFn = vi.fn()

      displayTickets(mockTickets, 'compact', logFn, { showStatus: true })

      expect(logFn).toHaveBeenCalledWith('ticket-1 [HF] (in_progress) Test ticket 1')
      expect(logFn).toHaveBeenCalledWith('ticket-2 [MB] (pending) Test ticket 2')
    })

    test('should display tickets in table format', () => {
      const logFn = vi.fn()

      displayTickets(mockTickets, 'table', logFn, {
        sectionTitle: 'Test Tickets:',
      })

      expect(logFn).toHaveBeenCalledWith('\nTest Tickets:')
      expect(logFn).toHaveBeenCalledWith('=============')
      expect(logFn).toHaveBeenCalledWith(expect.stringContaining('ID'))
      expect(logFn).toHaveBeenCalledWith(expect.stringContaining('ticket-1'))
      expect(logFn).toHaveBeenCalledWith(expect.stringContaining('Test ticket 1'))
    })

    test('should handle null and undefined values gracefully', () => {
      const logFn = vi.fn()
      const ticketsWithNulls: TicketSummary[] = [
        {
          id: null,
          title: undefined,
          status: null,
          priority: '',
          type: undefined,
          createdAt: null,
          updatedAt: null,
        } as any,
      ]

      displayTickets(ticketsWithNulls, 'compact', logFn)

      expect(logFn).toHaveBeenCalledWith('Unknown [UU] Untitled')
    })

    test('should truncate long titles', () => {
      const logFn = vi.fn()
      const longTitle =
        'This is a very long ticket title that should be truncated according to the constants'
      const ticketsWithLongTitle: TicketSummary[] = [
        {
          id: 'ticket-1',
          title: longTitle,
          status: 'pending',
          priority: 'high',
          type: 'feature',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ]

      displayTickets(ticketsWithLongTitle, 'table', logFn)

      const logCalls = logFn.mock.calls.map(call => call[0])
      const tableContent = logCalls.find(
        call => typeof call === 'string' && call.includes('This is a very long ticket title')
      )

      expect(tableContent).toContain('This is a very long ticket title that should be...')
      expect(tableContent).not.toContain(longTitle)
    })
  })

  describe('formatTable', () => {
    test('should format a table with proper alignment', () => {
      const headers = ['ID', 'Name', 'Status']
      const rows = [
        ['1', 'Short', 'Active'],
        ['1234', 'Very Long Name', 'Inactive'],
      ]

      const result = formatTable(headers, rows)

      expect(result).toContain('ID   | Name           | Status')
      expect(result).toContain('-----|----------------|--------')
      expect(result).toContain('1    | Short          | Active')
      expect(result).toContain('1234 | Very Long Name | Inactive')
    })

    test('should handle empty rows', () => {
      const headers = ['ID', 'Name']
      const rows: string[][] = []

      const result = formatTable(headers, rows)

      expect(result).toContain('ID | Name')
      expect(result).toContain('---|----')
      expect(result.split('\n')).toHaveLength(2) // Only headers and separator
    })
  })
})
