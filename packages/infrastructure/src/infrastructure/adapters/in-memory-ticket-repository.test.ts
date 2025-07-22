import { Ticket, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryTicketRepository } from './in-memory-ticket-repository.ts'

describe('InMemoryTicketRepository', () => {
  let repository: InMemoryTicketRepository
  let sampleTicket: Ticket

  beforeEach(() => {
    repository = new InMemoryTicketRepository()
    const ticketId = TicketId.create('12345678')
    sampleTicket = Ticket.create(ticketId, {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'high',
      type: 'feature',
      status: 'pending',
    })
  })

  describe('save', () => {
    it('should save a ticket', async () => {
      await repository.save(sampleTicket)
      expect(repository.size()).toBe(1)
      expect(repository.has(sampleTicket.id)).toBe(true)
    })

    it('should update existing ticket', async () => {
      await repository.save(sampleTicket)

      // Create a modified version with the same ID using reconstitute
      const modifiedTicket = Ticket.reconstitute({
        id: sampleTicket.id.value,
        title: 'Modified Title',
        description: 'Modified Description',
        priority: 'low',
        type: 'bug',
        status: 'in_progress',
        createdAt: sampleTicket.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await repository.save(modifiedTicket)
      expect(repository.size()).toBe(1) // Still only one ticket

      const retrieved = await repository.findById(sampleTicket.id)
      expect(retrieved?.title.value).toBe('Modified Title')
    })
  })

  describe('findById', () => {
    it('should find ticket by ID', async () => {
      await repository.save(sampleTicket)

      const found = await repository.findById(sampleTicket.id)
      expect(found).not.toBeNull()
      expect(found?.id.value).toBe(sampleTicket.id.value)
      expect(found?.title.value).toBe('Test Ticket')
    })

    it('should return null for non-existent ticket', async () => {
      const nonExistentId = TicketId.create('abcdabcd')
      const found = await repository.findById(nonExistentId)
      expect(found).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete ticket by ID', async () => {
      await repository.save(sampleTicket)
      expect(repository.size()).toBe(1)

      await repository.delete(sampleTicket.id)
      expect(repository.size()).toBe(0)
      expect(repository.has(sampleTicket.id)).toBe(false)
    })

    it('should not throw when deleting non-existent ticket', async () => {
      const nonExistentId = TicketId.create('abcdabcd')
      await expect(repository.delete(nonExistentId)).resolves.not.toThrow()
    })
  })

  describe('queryTickets', () => {
    beforeEach(async () => {
      // Create multiple test tickets
      const tickets = [
        Ticket.create(TicketId.create('11111111'), {
          title: 'Bug Fix',
          description: 'Fix critical bug',
          priority: 'high',
          type: 'bug',
          status: 'pending',
        }),
        Ticket.create(TicketId.create('22222222'), {
          title: 'Feature Request',
          description: 'Add new feature',
          priority: 'medium',
          type: 'feature',
          status: 'in_progress',
        }),
        Ticket.create(TicketId.create('33333333'), {
          title: 'Documentation',
          description: 'Update docs',
          priority: 'low',
          type: 'task',
          status: 'completed',
        }),
      ]

      for (const ticket of tickets) {
        await repository.save(ticket)
      }
    })

    it('should return all tickets when no criteria', async () => {
      const results = await repository.queryTickets()
      expect(results).toHaveLength(3)
    })

    it('should filter by status', async () => {
      const results = await repository.queryTickets({ status: 'pending' })
      expect(results).toHaveLength(1)
      expect(results[0]?.status).toBe('pending')
    })

    it('should filter by priority', async () => {
      const results = await repository.queryTickets({ priority: 'high' })
      expect(results).toHaveLength(1)
      expect(results[0]?.priority).toBe('high')
    })

    it('should filter by type', async () => {
      const results = await repository.queryTickets({ type: 'feature' })
      expect(results).toHaveLength(1)
      expect(results[0]?.type).toBe('feature')
    })

    it('should search in title', async () => {
      const results = await repository.queryTickets({
        search: 'Bug',
        searchIn: ['title'],
      })
      expect(results).toHaveLength(1)
      expect(results[0]?.title.value).toBe('Bug Fix')
    })

    it('should search in description', async () => {
      const results = await repository.queryTickets({
        search: 'critical',
        searchIn: ['description'],
      })
      expect(results).toHaveLength(1)
      expect(results[0]?.description?.value).toContain('critical')
    })

    it('should search in both title and description by default', async () => {
      const results = await repository.queryTickets({ search: 'feature' })
      expect(results).toHaveLength(1) // Found in both title and description of same ticket
    })

    it('should apply limit', async () => {
      const results = await repository.queryTickets({ limit: 2 })
      expect(results).toHaveLength(2)
    })

    it('should apply offset', async () => {
      const results = await repository.queryTickets({ offset: 1 })
      expect(results).toHaveLength(2)
    })

    it('should combine multiple filters', async () => {
      const results = await repository.queryTickets({
        status: 'pending',
        priority: 'high',
        type: 'bug',
      })
      expect(results).toHaveLength(1)
      expect(results[0]?.status).toBe('pending')
      expect(results[0]?.priority).toBe('high')
      expect(results[0]?.type).toBe('bug')
    })
  })

  describe('helper methods', () => {
    it('should clear all tickets', async () => {
      await repository.save(sampleTicket)
      expect(repository.size()).toBe(1)

      repository.clear()
      expect(repository.size()).toBe(0)
    })

    it('should return correct size', async () => {
      expect(repository.size()).toBe(0)

      await repository.save(sampleTicket)
      expect(repository.size()).toBe(1)

      const anotherTicket = Ticket.create(TicketId.create('87654321'), {
        title: 'Another Ticket',
        description: 'Another Description',
        priority: 'medium',
        type: 'task',
        status: 'pending',
      })
      await repository.save(anotherTicket)
      expect(repository.size()).toBe(2)
    })

    it('should return all tickets', async () => {
      await repository.save(sampleTicket)

      const all = repository.getAll()
      expect(all).toHaveLength(1)
      expect(all[0]?.id.value).toBe(sampleTicket.id.value)
    })

    it('should check ticket existence', async () => {
      expect(repository.has(sampleTicket.id)).toBe(false)

      await repository.save(sampleTicket)
      expect(repository.has(sampleTicket.id)).toBe(true)
    })
  })
})
