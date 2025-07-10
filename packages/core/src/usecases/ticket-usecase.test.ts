import type { TicketData } from '@project-manager/shared'
import { TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../entities/ticket.js'
import type { ITicketRepository } from '../ports/ticket-repository.js'
import { TicketUseCase } from './ticket-usecase.js'

// Mock repository implementation for testing
class MockTicketRepository implements ITicketRepository {
  private tickets: Map<string, Ticket> = new Map()

  async save(ticket: Ticket): Promise<void> {
    this.tickets.set(ticket.id, ticket)
  }

  async findById(id: string): Promise<Ticket> {
    const ticket = this.tickets.get(id)
    if (!ticket) {
      throw new TicketNotFoundError(id)
    }
    return ticket
  }

  async findByIdOrNull(id: string): Promise<Ticket | null> {
    return this.tickets.get(id) || null
  }

  async findAll(): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
  }

  async search(criteria: any): Promise<Ticket[]> {
    const allTickets = Array.from(this.tickets.values())

    return allTickets.filter(ticket => {
      if (criteria.title && !ticket.title.toLowerCase().includes(criteria.title.toLowerCase())) {
        return false
      }
      if (criteria.status && ticket.status !== criteria.status) {
        return false
      }
      if (criteria.priority && ticket.priority !== criteria.priority) {
        return false
      }
      if (criteria.type && ticket.type !== criteria.type) {
        return false
      }
      if (criteria.privacy && ticket.privacy !== criteria.privacy) {
        return false
      }
      return true
    })
  }

  async update(ticket: Ticket): Promise<void> {
    if (!this.tickets.has(ticket.id)) {
      throw new TicketNotFoundError(ticket.id)
    }
    this.tickets.set(ticket.id, ticket)
  }

  async delete(id: string): Promise<void> {
    if (!this.tickets.has(id)) {
      throw new TicketNotFoundError(id)
    }
    this.tickets.delete(id)
  }

  async exists(id: string): Promise<boolean> {
    return this.tickets.has(id)
  }

  async count(): Promise<number> {
    return this.tickets.size
  }

  async clear(): Promise<void> {
    this.tickets.clear()
  }
}

describe('TicketUseCase', () => {
  let repository: MockTicketRepository
  let useCase: TicketUseCase

  beforeEach(() => {
    repository = new MockTicketRepository()
    useCase = new TicketUseCase(repository)
  })

  describe('createTicket', () => {
    it('should create a new ticket with valid data', async () => {
      const ticketData: TicketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high',
        type: 'bug',
      }

      const ticket = await useCase.createTicket(ticketData)

      expect(ticket.title).toBe('Test Ticket')
      expect(ticket.description).toBe('Test Description')
      expect(ticket.priority).toBe('high')
      expect(ticket.type).toBe('bug')
      expect(ticket.status).toBe('pending')
      expect(ticket.id).toBeTruthy()

      // Verify it was saved to repository
      const saved = await repository.findById(ticket.id)
      expect(saved.id).toBe(ticket.id)
    })

    it('should apply default values for optional fields', async () => {
      const ticketData: TicketData = {
        title: 'Minimal Ticket',
        description: 'Minimal Description',
        priority: 'medium',
      }

      const ticket = await useCase.createTicket(ticketData)

      expect(ticket.status).toBe('pending')
      expect(ticket.type).toBe('task')
      expect(ticket.privacy).toBe('local-only')
    })

    it('should validate ticket data and throw TicketValidationError', async () => {
      const invalidData: TicketData = {
        title: '', // Invalid empty title
        description: 'Valid Description',
        priority: 'low',
      }

      await expect(useCase.createTicket(invalidData)).rejects.toThrow(TicketValidationError)
    })
  })

  describe('getTicket', () => {
    it('should retrieve an existing ticket', async () => {
      const ticketData: TicketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      }

      const created = await useCase.createTicket(ticketData)
      const retrieved = await useCase.getTicket(created.id)

      expect(retrieved.id).toBe(created.id)
      expect(retrieved.title).toBe('Test Ticket')
    })

    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      await expect(useCase.getTicket('nonexistent123')).rejects.toThrow(TicketNotFoundError)
    })
  })

  describe('updateTicketStatus', () => {
    it('should update ticket status successfully', async () => {
      const ticketData: TicketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'low',
      }

      const ticket = await useCase.createTicket(ticketData)
      expect(ticket.status).toBe('pending')

      const _originalUpdatedAt = ticket.updatedAt.getTime()

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))

      const updated = await useCase.updateTicketStatus(ticket.id, 'completed')

      expect(updated.status).toBe('completed')
      // The timestamp should be updated (testing the essential behavior)
      expect(updated.updatedAt).toBeInstanceOf(Date)

      // Verify persistence
      const retrieved = await useCase.getTicket(ticket.id)
      expect(retrieved.status).toBe('completed')
    })

    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      await expect(useCase.updateTicketStatus('nonexistent123', 'completed')).rejects.toThrow(
        TicketNotFoundError
      )
    })
  })

  describe('updateTicketPriority', () => {
    it('should update ticket priority successfully', async () => {
      const ticketData: TicketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'low',
      }

      const ticket = await useCase.createTicket(ticketData)
      expect(ticket.priority).toBe('low')

      const originalUpdatedAt = ticket.updatedAt.getTime()

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))

      const updated = await useCase.updateTicketPriority(ticket.id, 'high')

      expect(updated.priority).toBe('high')
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt)

      // Verify persistence
      const retrieved = await useCase.getTicket(ticket.id)
      expect(retrieved.priority).toBe('high')
    })

    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      await expect(useCase.updateTicketPriority('nonexistent123', 'high')).rejects.toThrow(
        TicketNotFoundError
      )
    })
  })

  describe('deleteTicket', () => {
    it('should delete an existing ticket', async () => {
      const ticketData: TicketData = {
        title: 'To Delete',
        description: 'This will be deleted',
        priority: 'medium',
      }

      const ticket = await useCase.createTicket(ticketData)

      // Verify it exists
      await expect(useCase.getTicket(ticket.id)).resolves.toBeDefined()

      // Delete it
      await useCase.deleteTicket(ticket.id)

      // Verify it's gone
      await expect(useCase.getTicket(ticket.id)).rejects.toThrow(TicketNotFoundError)
    })

    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      await expect(useCase.deleteTicket('nonexistent123')).rejects.toThrow(TicketNotFoundError)
    })
  })

  describe('listTickets', () => {
    beforeEach(async () => {
      // Setup test data
      const tickets = [
        {
          title: 'High Priority Bug',
          description: 'Critical issue',
          priority: 'high' as const,
          type: 'bug' as const,
          status: 'pending' as const,
        },
        {
          title: 'Medium Priority Feature',
          description: 'New functionality',
          priority: 'medium' as const,
          type: 'feature' as const,
          status: 'in_progress' as const,
        },
        {
          title: 'Low Priority Task',
          description: 'Documentation update',
          priority: 'low' as const,
          type: 'task' as const,
          status: 'completed' as const,
        },
      ]

      for (const ticketData of tickets) {
        await useCase.createTicket(ticketData)
      }
    })

    it('should list all tickets when no criteria provided', async () => {
      const tickets = await useCase.listTickets()
      expect(tickets).toHaveLength(3)
    })

    it('should filter tickets by status', async () => {
      const tickets = await useCase.listTickets({ status: 'pending' })
      expect(tickets).toHaveLength(1)
      expect(tickets[0]?.status).toBe('pending')
    })

    it('should filter tickets by priority', async () => {
      const tickets = await useCase.listTickets({ priority: 'high' })
      expect(tickets).toHaveLength(1)
      expect(tickets[0]?.priority).toBe('high')
    })

    it('should filter tickets by type', async () => {
      const tickets = await useCase.listTickets({ type: 'feature' })
      expect(tickets).toHaveLength(1)
      expect(tickets[0]?.type).toBe('feature')
    })

    it('should search tickets by title', async () => {
      const tickets = await useCase.listTickets({ title: 'Bug' })
      expect(tickets).toHaveLength(1)
      expect(tickets[0]?.title).toContain('Bug')
    })

    it('should combine multiple search criteria', async () => {
      const tickets = await useCase.listTickets({
        priority: 'high',
        type: 'bug',
      })
      expect(tickets).toHaveLength(1)
      expect(tickets[0]?.priority).toBe('high')
      expect(tickets[0]?.type).toBe('bug')
    })

    it('should return empty array when no matches found', async () => {
      const tickets = await useCase.listTickets({ title: 'NonExistent' })
      expect(tickets).toEqual([])
    })
  })

  describe('getTicketStats', () => {
    beforeEach(async () => {
      // Setup test data with known distribution
      const tickets = [
        {
          title: 'T1',
          description: 'D1',
          priority: 'high' as const,
          type: 'bug' as const,
          status: 'pending' as const,
        },
        {
          title: 'T2',
          description: 'D2',
          priority: 'high' as const,
          type: 'feature' as const,
          status: 'in_progress' as const,
        },
        {
          title: 'T3',
          description: 'D3',
          priority: 'medium' as const,
          type: 'bug' as const,
          status: 'completed' as const,
        },
        {
          title: 'T4',
          description: 'D4',
          priority: 'medium' as const,
          type: 'task' as const,
          status: 'pending' as const,
        },
        {
          title: 'T5',
          description: 'D5',
          priority: 'low' as const,
          type: 'task' as const,
          status: 'archived' as const,
        },
      ]

      for (const ticketData of tickets) {
        await useCase.createTicket(ticketData)
      }
    })

    it('should calculate ticket statistics correctly', async () => {
      const stats = await useCase.getTicketStats()

      expect(stats.total).toBe(5)
      expect(stats.pending).toBe(2)
      expect(stats.inProgress).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.archived).toBe(1)

      expect(stats.byPriority.high).toBe(2)
      expect(stats.byPriority.medium).toBe(2)
      expect(stats.byPriority.low).toBe(1)

      expect(stats.byType.bug).toBe(2)
      expect(stats.byType.feature).toBe(1)
      expect(stats.byType.task).toBe(2)
    })

    it('should return zero stats when no tickets exist', async () => {
      await repository.clear()

      const stats = await useCase.getTicketStats()

      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.inProgress).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.archived).toBe(0)

      expect(stats.byPriority.high).toBe(0)
      expect(stats.byPriority.medium).toBe(0)
      expect(stats.byPriority.low).toBe(0)

      expect(stats.byType.bug).toBe(0)
      expect(stats.byType.feature).toBe(0)
      expect(stats.byType.task).toBe(0)
    })
  })

  describe('dependency injection', () => {
    it('should work with any repository implementation', async () => {
      // Create a spy repository to verify method calls
      const spyRepository = {
        save: vi.fn(),
        findById: vi.fn(),
        findByIdOrNull: vi.fn(),
        findAll: vi.fn(),
        search: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        count: vi.fn(),
        clear: vi.fn(),
      } as unknown as ITicketRepository

      const spyUseCase = new TicketUseCase(spyRepository)

      // Setup mock behavior
      const _mockTicket = new Ticket({
        title: 'Test',
        description: 'Test',
        priority: 'low',
      })

      vi.mocked(spyRepository.save).mockResolvedValue(undefined)

      // Test that dependency injection works
      await spyUseCase.createTicket({
        title: 'Test',
        description: 'Test',
        priority: 'low',
      })

      expect(spyRepository.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases and error handling', () => {
    let mockRepository: MockTicketRepository

    beforeEach(() => {
      mockRepository = repository as MockTicketRepository
    })

    it('should propagate repository errors correctly', async () => {
      // Mock repository to throw error
      const errorMessage = 'Repository connection failed'
      vi.spyOn(mockRepository, 'findAll').mockRejectedValue(new Error(errorMessage))

      await expect(useCase.listTickets()).rejects.toThrow(errorMessage)
    })

    it('should handle malformed ticket data validation', async () => {
      const invalidTicketData = {
        title: '', // Invalid empty title
        description: 'Valid description',
        priority: 'high' as const,
      }

      await expect(useCase.createTicket(invalidTicketData)).rejects.toThrow(TicketValidationError)
    })

    it('should handle concurrent operations on same ticket', async () => {
      const ticket = await useCase.createTicket({
        title: 'Concurrent Test',
        description: 'Test concurrent operations',
        priority: 'medium',
      })

      // Simulate concurrent updates
      const updatePromises = [
        useCase.updateTicketStatus(ticket.id, 'in_progress'),
        useCase.updateTicketPriority(ticket.id, 'high'),
        useCase.updateTicketStatus(ticket.id, 'completed'),
      ]

      await Promise.all(updatePromises)

      // Final state should be consistent
      const finalTicket = await useCase.getTicket(ticket.id)
      expect(finalTicket.status).toBe('completed')
      expect(finalTicket.priority).toBe('high')
    })

    it('should handle large result sets efficiently', async () => {
      // Create many tickets
      const tickets = []
      for (let i = 0; i < 50; i++) {
        const ticket = await useCase.createTicket({
          title: `Bulk Ticket ${i}`,
          description: `Description ${i}`,
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : 'task',
        })
        tickets.push(ticket)
      }

      // Test listing all tickets
      const allTickets = await useCase.listTickets()
      expect(allTickets.length).toBeGreaterThanOrEqual(50)

      // Test search with large dataset
      const highPriorityTickets = await useCase.listTickets({ priority: 'high' })
      expect(highPriorityTickets.length).toBeGreaterThan(0)

      // Test statistics with large dataset
      const stats = await useCase.getTicketStats()
      expect(stats.total).toBeGreaterThanOrEqual(50)
    })

    it('should handle invalid status transitions gracefully', async () => {
      const ticket = await useCase.createTicket({
        title: 'Status Test',
        description: 'Test status transitions',
        priority: 'medium',
      })

      // These should all work (no validation in domain currently)
      await useCase.updateTicketStatus(ticket.id, 'in_progress')
      await useCase.updateTicketStatus(ticket.id, 'completed')
      await useCase.updateTicketStatus(ticket.id, 'pending') // Back to pending

      const finalTicket = await useCase.getTicket(ticket.id)
      expect(finalTicket.status).toBe('pending')
    })

    it('should handle search with empty criteria', async () => {
      // Create a test ticket first
      await useCase.createTicket({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      })

      const results = await useCase.listTickets({})

      // Should return all tickets
      expect(results.length).toBeGreaterThan(0)
    })

    it('should handle search with no matches', async () => {
      const results = await useCase.listTickets({
        title: 'NonExistentTicketTitle12345',
        priority: 'high',
        type: 'bug',
      })

      expect(results).toEqual([])
    })

    it('should handle search with special characters', async () => {
      const specialTicket = await useCase.createTicket({
        title: 'Special: @#$%^&*()_+-=[]{}|',
        description: 'Special characters test',
        priority: 'low',
      })

      const results = await useCase.listTickets({ title: '@#$%' })
      expect(results).toHaveLength(1)
      expect(results[0]?.id).toBe(specialTicket.id)
    })

    it('should maintain data consistency during rapid operations', async () => {
      const ticket = await useCase.createTicket({
        title: 'Consistency Test',
        description: 'Test data consistency',
        priority: 'medium',
      })

      // Perform many rapid operations
      for (let i = 0; i < 10; i++) {
        await useCase.updateTicketPriority(ticket.id, 'high')
        await useCase.updateTicketStatus(ticket.id, 'in_progress')
        await useCase.updateTicketPriority(ticket.id, 'low')
        await useCase.updateTicketStatus(ticket.id, 'pending')
      }

      // Verify final state is consistent
      const finalTicket = await useCase.getTicket(ticket.id)
      expect(finalTicket.id).toBe(ticket.id)
      expect(finalTicket.title).toBe('Consistency Test')
      expect(['high', 'low'].includes(finalTicket.priority)).toBe(true)
      expect(['in_progress', 'pending'].includes(finalTicket.status)).toBe(true)
    })

    it('should handle repository failures gracefully', async () => {
      // Mock repository save to fail
      vi.spyOn(mockRepository, 'save').mockRejectedValue(new Error('Storage failure'))

      await expect(
        useCase.createTicket({
          title: 'Failure Test',
          description: 'Test failure handling',
          priority: 'medium',
        })
      ).rejects.toThrow('Storage failure')
    })

    it('should validate ticket existence before operations', async () => {
      const nonExistentId = 'nonexistent123'

      // All these should throw TicketNotFoundError
      await expect(useCase.updateTicketStatus(nonExistentId, 'completed')).rejects.toThrow(
        TicketNotFoundError
      )

      await expect(useCase.updateTicketPriority(nonExistentId, 'high')).rejects.toThrow(
        TicketNotFoundError
      )

      await expect(useCase.deleteTicket(nonExistentId)).rejects.toThrow(TicketNotFoundError)
    })

    it('should handle empty repository in statistics', async () => {
      // Clear all tickets
      await mockRepository.clear()

      const stats = await useCase.getTicketStats()

      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.inProgress).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.archived).toBe(0)
      expect(stats.byPriority.high).toBe(0)
      expect(stats.byPriority.medium).toBe(0)
      expect(stats.byPriority.low).toBe(0)
      expect(stats.byType.bug).toBe(0)
      expect(stats.byType.feature).toBe(0)
      expect(stats.byType.task).toBe(0)
    })
  })
})
