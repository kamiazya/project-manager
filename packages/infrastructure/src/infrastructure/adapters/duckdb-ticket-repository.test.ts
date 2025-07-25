import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { IdGenerator } from '@project-manager/application'
import type { Logger } from '@project-manager/base/common/logging'
import { createTicketPriority, Ticket, TicketId } from '@project-manager/domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UlidIdGenerator } from '../services/ulid-id-generator.ts'
import { DuckDbTicketRepository } from './duckdb-ticket-repository.ts'

describe('DuckDbTicketRepository', () => {
  let repository: DuckDbTicketRepository
  let testDbPath: string
  let mockLogger: Logger
  let idGenerator: IdGenerator

  beforeEach(() => {
    // Create a unique test database path
    const testId = Date.now() + Math.random().toString(36).substring(7)
    testDbPath = join(tmpdir(), `test-tickets-${testId}.duckdb`)

    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any as Logger

    // Create real ID generator for authentic testing
    idGenerator = new UlidIdGenerator()

    // Create repository instance
    repository = new DuckDbTicketRepository(testDbPath, mockLogger)
  })

  afterEach(async () => {
    // Close the database connection
    await repository.close()

    // Clean up test database file and WAL files
    if (existsSync(testDbPath)) {
      rmSync(testDbPath, { force: true })
    }

    // Also clean up WAL file (Write-Ahead Log)
    const walPath = `${testDbPath}.wal`
    if (existsSync(walPath)) {
      rmSync(walPath, { force: true })
    }

    // Clean up temporary files
    const tmpPath = `${testDbPath}.tmp`
    if (existsSync(tmpPath)) {
      rmSync(tmpPath, { force: true })
    }
  })

  // Helper function to create a ticket with generated ID
  const createTestTicket = (
    overrides: Partial<{
      title: string
      description: string
      priority: string
      type: string
      status: string
    }> = {}
  ) => {
    const ticketId = TicketId.create(idGenerator.generateId())
    return Ticket.create(ticketId, {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      type: 'task',
      status: 'pending',
      ...overrides,
    })
  }

  describe('save', () => {
    it('should save a new ticket', async () => {
      // Arrange
      const ticket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high',
        type: 'feature',
        status: 'pending',
      })

      // Act
      await repository.save(ticket)

      // Assert
      const savedTicket = await repository.findById(ticket.id)
      expect(savedTicket).not.toBeNull()
      expect(savedTicket?.id.value).toBe(ticket.id.value)
      expect(savedTicket?.title.value).toBe('Test Ticket')
      expect(savedTicket?.description?.value).toBe('Test Description')
      expect(savedTicket?.priority).toBe('high')
      expect(savedTicket?.type).toBe('feature')
      expect(savedTicket?.status).toBe('pending')
    })

    it('should update an existing ticket', async () => {
      // Arrange
      const ticket = createTestTicket({
        title: 'Original Title',
        description: 'Original Description',
        priority: 'medium',
        type: 'task',
        status: 'pending',
      })

      // Save original ticket
      await repository.save(ticket)

      // Update ticket
      ticket.updateTitle('Updated Title')
      ticket.updateDescription('Updated Description')
      ticket.changePriority(createTicketPriority('high'))

      // Act
      await repository.save(ticket)

      // Assert
      const updatedTicket = await repository.findById(ticket.id)
      expect(updatedTicket).not.toBeNull()
      expect(updatedTicket?.title.value).toBe('Updated Title')
      expect(updatedTicket?.description?.value).toBe('Updated Description')
      expect(updatedTicket?.priority).toBe('high')
    })
  })

  describe('findById', () => {
    it('should return null when ticket does not exist', async () => {
      // Arrange
      const nonExistentId = TicketId.create(idGenerator.generateId())

      // Act
      const result = await repository.findById(nonExistentId)

      // Assert
      expect(result).toBeNull()
    })

    it('should find an existing ticket by id', async () => {
      // Arrange
      const ticket = createTestTicket({
        title: 'Find Me',
        description: 'I should be found',
        priority: 'low',
        type: 'bug',
        status: 'in_progress',
      })
      await repository.save(ticket)

      // Act
      const foundTicket = await repository.findById(ticket.id)

      // Assert
      expect(foundTicket).not.toBeNull()
      expect(foundTicket?.id.value).toBe(ticket.id.value)
      expect(foundTicket?.title.value).toBe('Find Me')
      expect(foundTicket?.description?.value).toBe('I should be found')
      expect(foundTicket?.priority).toBe('low')
      expect(foundTicket?.type).toBe('bug')
      expect(foundTicket?.status).toBe('in_progress')
    })
  })

  describe('queryTickets', () => {
    beforeEach(async () => {
      // Create test tickets using helper function
      const tickets = [
        createTestTicket({
          title: 'High Priority Bug',
          description: 'Critical issue in production',
          priority: 'high',
          type: 'bug',
          status: 'pending',
        }),
        createTestTicket({
          title: 'Medium Priority Feature',
          description: 'New feature request',
          priority: 'medium',
          type: 'feature',
          status: 'in_progress',
        }),
        createTestTicket({
          title: 'Low Priority Task',
          description: 'Routine maintenance task',
          priority: 'low',
          type: 'task',
          status: 'completed',
        }),
        createTestTicket({
          title: 'Another High Priority Bug',
          description: 'Another critical bug',
          priority: 'high',
          type: 'bug',
          status: 'pending',
        }),
      ]

      for (const ticket of tickets) {
        await repository.save(ticket)
      }
    })

    it('should return all tickets when no criteria provided', async () => {
      // Act
      const tickets = await repository.queryTickets({})

      // Assert
      expect(tickets).toHaveLength(4)
    })

    it('should filter by status', async () => {
      // Act
      const tickets = await repository.queryTickets({ status: 'pending' })

      // Assert
      expect(tickets).toHaveLength(2)
      expect(tickets.every(t => t.status === 'pending')).toBe(true)
    })

    it('should filter by priority', async () => {
      // Act
      const tickets = await repository.queryTickets({ priority: 'high' })

      // Assert
      expect(tickets).toHaveLength(2)
      expect(tickets.every(t => t.priority === 'high')).toBe(true)
    })

    it('should filter by type', async () => {
      // Act
      const tickets = await repository.queryTickets({ type: 'bug' })

      // Assert
      expect(tickets).toHaveLength(2)
      expect(tickets.every(t => t.type === 'bug')).toBe(true)
    })

    it('should search by title', async () => {
      // Act
      const tickets = await repository.queryTickets({
        search: 'high priority',
        searchIn: ['title'],
      })

      // Assert
      expect(tickets).toHaveLength(2)
      expect(tickets.every(t => t.title.value.toLowerCase().includes('high priority'))).toBe(true)
    })

    it('should search by description', async () => {
      // Act
      const tickets = await repository.queryTickets({
        search: 'critical',
        searchIn: ['description'],
      })

      // Assert
      expect(tickets).toHaveLength(2)
      expect(
        tickets.every(t => t.description?.value.toLowerCase().includes('critical') ?? false)
      ).toBe(true)
    })

    it('should search in both title and description by default', async () => {
      // Act
      const tickets = await repository.queryTickets({
        search: 'bug',
      })

      // Assert
      expect(tickets).toHaveLength(2)
    })

    it('should apply limit', async () => {
      // Act
      const tickets = await repository.queryTickets({ limit: 2 })

      // Assert
      expect(tickets).toHaveLength(2)
    })

    it('should apply offset', async () => {
      // Act
      const ticketsWithoutOffset = await repository.queryTickets({})
      const ticketsWithOffset = await repository.queryTickets({ offset: 2 })

      // Assert
      expect(ticketsWithOffset).toHaveLength(2)
      expect(ticketsWithOffset[0]?.id.value).not.toBe(ticketsWithoutOffset[0]?.id.value)
    })

    it('should combine multiple filters', async () => {
      // Act
      const tickets = await repository.queryTickets({
        priority: 'high',
        type: 'bug',
        status: 'pending',
      })

      // Assert
      expect(tickets).toHaveLength(2)
      expect(
        tickets.every(t => t.priority === 'high' && t.type === 'bug' && t.status === 'pending')
      ).toBe(true)
    })
  })

  describe('delete', () => {
    it('should delete an existing ticket', async () => {
      // Arrange
      const ticket = createTestTicket({
        title: 'To Be Deleted',
        description: 'This ticket will be deleted',
      })
      await repository.save(ticket)

      // Act
      await repository.delete(ticket.id)

      // Assert
      const deletedTicket = await repository.findById(ticket.id)
      expect(deletedTicket).toBeNull()
    })

    it('should not throw when deleting non-existent ticket', async () => {
      // Arrange
      const nonExistentId = TicketId.create(idGenerator.generateId())

      // Act & Assert
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow()
    })
  })

  describe('security', () => {
    describe('SQL injection prevention', () => {
      it('should prevent SQL injection in search queries', async () => {
        // Arrange - malicious search input
        const maliciousSearch = "'; DROP TABLE tickets; --"

        // Act & Assert - should not execute malicious SQL
        await expect(async () => {
          await repository.queryTickets({ search: maliciousSearch })
        }).not.toThrow()

        // Verify table still exists by running a simple query
        const tickets = await repository.queryTickets({})
        expect(Array.isArray(tickets)).toBe(true)
      })

      it('should prevent SQL injection in filter values', async () => {
        // Arrange - malicious filter values
        const maliciousStatus = "pending'; DROP TABLE tickets; --"
        const maliciousPriority = "high' OR '1'='1"
        const maliciousType = "task'; UPDATE tickets SET title='HACKED"

        // Act & Assert - should not execute malicious SQL
        await expect(async () => {
          await repository.queryTickets({
            status: maliciousStatus as any,
            priority: maliciousPriority as any,
            type: maliciousType as any,
          })
        }).not.toThrow()

        // Verify no unauthorized changes occurred
        const tickets = await repository.queryTickets({})
        expect(tickets.every(t => !t.title.value.includes('HACKED'))).toBe(true)
      })

      it('should prevent SQL injection in ticket ID lookups', async () => {
        // Arrange - malicious ticket ID should be rejected by domain validation
        const maliciousIdString = "01K10'; DROP TABLE tickets; --"

        // Act & Assert - domain layer should reject invalid ID format
        expect(() => {
          TicketId.create(maliciousIdString)
        }).toThrow('Ticket ID must be a valid ULID')

        // Verify table integrity after domain validation prevents the attack
        const tickets = await repository.queryTickets({})
        expect(Array.isArray(tickets)).toBe(true)
      })

      it('should sanitize special characters in search', async () => {
        // Arrange - ticket with special characters for legitimate search
        const ticket = createTestTicket({
          title: 'Test with \'quotes\' and "double quotes"',
          description: 'Content with % and _ wildcards',
        })
        await repository.save(ticket)

        // Act - search for legitimate special characters
        const results1 = await repository.queryTickets({ search: 'quotes' })
        const results2 = await repository.queryTickets({ search: 'wildcards' })

        // Assert - should find legitimate content
        expect(results1.length).toBeGreaterThan(0)
        expect(results2.length).toBeGreaterThan(0)

        // Should find the specific ticket
        expect(results1.some(t => t.id.value === ticket.id.value)).toBe(true)
      })
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent saves correctly', async () => {
      // Arrange
      const tickets = Array.from({ length: 10 }, (_, i) =>
        createTestTicket({
          title: `Concurrent Ticket ${i}`,
          description: `Concurrent Description ${i}`,
          priority: i % 2 === 0 ? 'high' : 'low',
          type: 'task',
          status: 'pending',
        })
      )

      // Act - Save all tickets concurrently
      await Promise.all(tickets.map(ticket => repository.save(ticket)))

      // Assert - All tickets should be saved
      const savedTickets = await repository.queryTickets({})
      expect(savedTickets).toHaveLength(10)
    })

    it('should handle concurrent reads correctly', async () => {
      // Arrange
      const ticket = createTestTicket({
        title: 'Concurrent Read Test',
        description: 'Testing concurrent reads',
      })
      await repository.save(ticket)

      // Act - Perform multiple concurrent reads
      const readPromises = Array.from({ length: 10 }, () => repository.findById(ticket.id))
      const results = await Promise.all(readPromises)

      // Assert - All reads should return the same ticket
      expect(results.every(t => t !== null && t.id.value === ticket.id.value)).toBe(true)
    })
  })
})
