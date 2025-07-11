import { Ticket } from '@project-manager/core'
import type { TicketStats } from '@project-manager/shared'
import { describe, expect, it } from 'vitest'
import { formatStats, formatTicket, formatTicketList } from './output.js'

describe('output', () => {
  const sampleTicket = Ticket.create({
    title: 'Test Ticket',
    description: 'Test Description',
    priority: 'high',
    type: 'bug',
    privacy: 'local-only',
  })

  describe('formatTicket', () => {
    it('should format ticket in table format by default', () => {
      const output = formatTicket(sampleTicket)

      expect(output).toContain('ID:')
      expect(output).toContain('Test Ticket')
      expect(output).toContain('Test Description')
      expect(output).toContain('pending')
      expect(output).toContain('high')
      expect(output).toContain('bug')
    })

    it('should format ticket in JSON format', () => {
      const output = formatTicket(sampleTicket, { format: 'json' })

      const parsed = JSON.parse(output)
      expect(parsed.title).toBe('Test Ticket')
      expect(parsed.description).toBe('Test Description')
      expect(parsed.priority).toBe('high')
      expect(parsed.type).toBe('bug')
    })

    it('should format ticket in compact format', () => {
      const output = formatTicket(sampleTicket, { format: 'compact' })

      expect(output).toContain(sampleTicket.id)
      expect(output).toContain('Test Ticket')
      expect(output).toContain('🔴') // High priority icon
    })
  })

  describe('formatTicketList', () => {
    const tickets = [
      Ticket.create({
        title: 'Bug Fix',
        description: 'Fix issue',
        priority: 'high',
        type: 'bug',
        privacy: 'local-only',
      }),
      Ticket.create({
        title: 'Feature Request',
        description: 'Add feature',
        priority: 'medium',
        type: 'feature',
        privacy: 'local-only',
      }),
    ]

    it('should format ticket list in table format by default', () => {
      const output = formatTicketList(tickets)

      expect(output).toContain('ID')
      expect(output).toContain('Title')
      expect(output).toContain('Status')
      expect(output).toContain('Priority')
      expect(output).toContain('Type')
      expect(output).toContain('Bug Fix')
      expect(output).toContain('Feature Request')
    })

    it('should format ticket list in JSON format', () => {
      const output = formatTicketList(tickets, { format: 'json' })

      const parsed = JSON.parse(output)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].title).toBe('Bug Fix')
      expect(parsed[1].title).toBe('Feature Request')
    })

    it('should format ticket list in compact format', () => {
      const output = formatTicketList(tickets, { format: 'compact' })

      expect(output).toContain('Bug Fix')
      expect(output).toContain('Feature Request')
      expect(output).toContain('🔴') // High priority icon
      expect(output).toContain('🟡') // Medium priority icon
    })

    it('should handle empty ticket list', () => {
      const output = formatTicketList([])

      expect(output).toContain('No tickets found.')
    })

    it('should truncate long titles in table format', () => {
      const longTitleTicket = Ticket.create({
        title: 'This is a very long ticket title that should be truncated',
        description: 'Description',
        priority: 'low',
        type: 'feature',
        privacy: 'local-only',
      })

      const output = formatTicketList([longTitleTicket])

      expect(output).toContain('...')
    })
  })

  describe('formatStats', () => {
    const sampleStats: TicketStats = {
      total: 10,
      pending: 3,
      inProgress: 4,
      completed: 2,
      archived: 1,
      byPriority: {
        high: 2,
        medium: 5,
        low: 3,
      },
      byType: {
        feature: 4,
        bug: 3,
        task: 3,
      },
    }

    it('should format stats correctly', () => {
      const output = formatStats(sampleStats)

      expect(output).toContain('Ticket Statistics')
      expect(output).toContain('Total: 10')
      expect(output).toContain('Pending: 3')
      expect(output).toContain('In Progress: 4')
      expect(output).toContain('Completed: 2')
      expect(output).toContain('Archived: 1')
      expect(output).toContain('High: 2')
      expect(output).toContain('Medium: 5')
      expect(output).toContain('Low: 3')
      expect(output).toContain('Features: 4')
      expect(output).toContain('Bugs: 3')
      expect(output).toContain('Tasks: 3')
    })

    it('should handle zero stats gracefully', () => {
      const emptyStats: TicketStats = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        archived: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        byType: { feature: 0, bug: 0, task: 0 },
      }

      const output = formatStats(emptyStats)

      expect(output).toContain('Total: 0')
      expect(output).toContain('Pending: 0')
      expect(output).toContain('High: 0')
      expect(output).toContain('Features: 0')
    })
  })

  describe('edge cases and special characters', () => {
    it('should handle tickets with special characters in title', () => {
      const specialTicket = Ticket.create({
        title: 'Special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
        description: 'Description with émojis 🚀 and unicode 中文',
        priority: 'medium',
        type: 'feature',
        privacy: 'local-only',
      })

      const tableOutput = formatTicket(specialTicket, { format: 'table' })
      const jsonOutput = formatTicket(specialTicket, { format: 'json' })
      const compactOutput = formatTicket(specialTicket, { format: 'compact' })

      expect(tableOutput).toContain('@#$%^&*()_+-=[]{}|')
      expect(jsonOutput).toContain('@#$%^&*()_+-=[]{}|')
      expect(compactOutput).toContain('@#$%')

      // Should be valid JSON
      expect(() => JSON.parse(jsonOutput)).not.toThrow()
    })

    it('should handle very long descriptions', () => {
      const longDescriptionTicket = Ticket.create({
        title: 'Normal Title',
        description: 'A'.repeat(1000), // Very long description
        priority: 'low',
        type: 'feature',
        privacy: 'local-only',
      })

      const tableOutput = formatTicket(longDescriptionTicket, { format: 'table' })
      const jsonOutput = formatTicket(longDescriptionTicket, { format: 'json' })

      expect(tableOutput).toContain('Normal Title')
      expect(jsonOutput).toContain('A'.repeat(1000))
      expect(() => JSON.parse(jsonOutput)).not.toThrow()
    })

    it('should handle minimal title and description', () => {
      // Test with minimal but valid content (DDD validation prevents empty)
      const ticket = Ticket.create({
        title: 'T', // Minimal valid title
        description: 'D', // Minimal valid description
        priority: 'medium',
        type: 'feature',
        privacy: 'local-only',
      })

      const tableOutput = formatTicket(ticket, { format: 'table' })
      const jsonOutput = formatTicket(ticket, { format: 'json' })

      expect(tableOutput).toBeDefined()
      expect(tableOutput).toContain('T')
      expect(tableOutput).toContain('D')
      expect(() => JSON.parse(jsonOutput)).not.toThrow()
    })

    it('should handle newlines and tabs in content', () => {
      const multilineTicket = Ticket.create({
        title: 'Title\nWith\nNewlines',
        description: 'Description\twith\ttabs\nand\nnewlines',
        priority: 'high',
        type: 'feature',
        privacy: 'local-only',
      })

      const tableOutput = formatTicket(multilineTicket, { format: 'table' })
      const jsonOutput = formatTicket(multilineTicket, { format: 'json' })

      expect(tableOutput).toBeDefined()
      expect(() => JSON.parse(jsonOutput)).not.toThrow()
    })

    it('should handle large ticket lists efficiently', () => {
      const largeTicketList = Array.from({ length: 100 }, (_, i) =>
        Ticket.create({
          title: `Ticket ${i}`,
          description: `Description ${i}`,
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : 'task',
          privacy: 'local-only',
        })
      )

      const tableOutput = formatTicketList(largeTicketList, { format: 'table' })
      const jsonOutput = formatTicketList(largeTicketList, { format: 'json' })
      const compactOutput = formatTicketList(largeTicketList, { format: 'compact' })

      expect(tableOutput).toContain('Ticket 0')
      expect(tableOutput).toContain('Ticket 99')

      const parsed = JSON.parse(jsonOutput)
      expect(parsed).toHaveLength(100)

      expect(compactOutput).toContain('Ticket 0')
      expect(compactOutput).toContain('Ticket 99')
    })

    it('should handle undefined format gracefully', () => {
      const output = formatTicket(sampleTicket, { format: undefined as any })

      // Should default to table format
      expect(output).toContain('ID:')
      expect(output).toContain('Test Ticket')
    })

    it('should handle invalid format gracefully', () => {
      const output = formatTicket(sampleTicket, { format: 'invalid' as any })

      // Should default to table format
      expect(output).toContain('ID:')
      expect(output).toContain('Test Ticket')
    })

    it('should handle extreme stat values', () => {
      const extremeStats: TicketStats = {
        total: 999999,
        pending: 100000,
        inProgress: 200000,
        completed: 300000,
        archived: 399999,
        byPriority: { high: 333333, medium: 333333, low: 333333 },
        byType: { feature: 333333, bug: 333333, task: 333333 },
      }

      const output = formatStats(extremeStats)

      expect(output).toContain('Total: 999999')
      expect(output).toContain('High: 333333')
    })

    it('should maintain consistent formatting across different locales', () => {
      // Test with tickets containing various unicode characters
      const unicodeTicket = Ticket.create({
        title: '测试 Тест परीक्षण テスト',
        description: 'العربية русский 한국어 日本語',
        priority: 'medium',
        type: 'feature',
        privacy: 'local-only',
      })

      const output = formatTicket(unicodeTicket, { format: 'json' })
      const parsed = JSON.parse(output)

      expect(parsed.title).toBe('测试 Тест परीक्षण テスト')
      expect(parsed.description).toBe('العربية русский 한국어 日本語')
    })
  })
})
