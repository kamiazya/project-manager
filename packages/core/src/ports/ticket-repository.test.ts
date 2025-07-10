import type { TicketSearchCriteria } from '@project-manager/shared'
import { TicketNotFoundError } from '@project-manager/shared'
import { describe, expect, it } from 'vitest'
import { Ticket } from '../entities/ticket.js'
import type { ITicketRepository } from './ticket-repository.js'

// Test implementation for interface validation
class TestTicketRepository implements ITicketRepository {
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

  async search(criteria: TicketSearchCriteria): Promise<Ticket[]> {
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

describe('ITicketRepository interface', () => {
  let repository: ITicketRepository

  beforeEach(() => {
    repository = new TestTicketRepository()
  })

  describe('save and findById', () => {
    it('should save and retrieve a ticket', async () => {
      const ticket = new Ticket({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high',
      })

      await repository.save(ticket)
      const retrieved = await repository.findById(ticket.id)

      expect(retrieved.id).toBe(ticket.id)
      expect(retrieved.title).toBe('Test Ticket')
      expect(retrieved.description).toBe('Test Description')
      expect(retrieved.priority).toBe('high')
    })

    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      await expect(repository.findById('nonexistent123')).rejects.toThrow(TicketNotFoundError)
    })
  })

  describe('findByIdOrNull', () => {
    it('should return null for non-existent ticket', async () => {
      const result = await repository.findByIdOrNull('nonexistent123')
      expect(result).toBeNull()
    })

    it('should return ticket when it exists', async () => {
      const ticket = new Ticket({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      })

      await repository.save(ticket)
      const result = await repository.findByIdOrNull(ticket.id)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(ticket.id)
    })
  })

  describe('findAll', () => {
    it('should return empty array when no tickets exist', async () => {
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should return all saved tickets', async () => {
      const ticket1 = new Ticket({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
      })

      const ticket2 = new Ticket({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      const tickets = await repository.findAll()
      expect(tickets).toHaveLength(2)
      expect(tickets.map(t => t.id)).toContain(ticket1.id)
      expect(tickets.map(t => t.id)).toContain(ticket2.id)
    })
  })

  describe('search', () => {
    beforeEach(async () => {
      const tickets = [
        new Ticket({
          title: 'Bug Fix',
          description: 'Fix critical bug',
          priority: 'high',
          type: 'bug',
        }),
        new Ticket({
          title: 'Feature Request',
          description: 'Add new feature',
          priority: 'medium',
          type: 'feature',
        }),
        new Ticket({
          title: 'Task Update',
          description: 'Update documentation',
          priority: 'low',
          type: 'task',
        }),
      ]

      for (const ticket of tickets) {
        await repository.save(ticket)
      }
    })

    it('should search by title', async () => {
      const results = await repository.search({ title: 'Bug' })
      expect(results).toHaveLength(1)
      expect(results[0]?.title).toBe('Bug Fix')
    })

    it('should search by priority', async () => {
      const results = await repository.search({ priority: 'high' })
      expect(results).toHaveLength(1)
      expect(results[0]?.priority).toBe('high')
    })

    it('should search by type', async () => {
      const results = await repository.search({ type: 'feature' })
      expect(results).toHaveLength(1)
      expect(results[0]?.type).toBe('feature')
    })

    it('should return empty array when no matches found', async () => {
      const results = await repository.search({ title: 'NonExistent' })
      expect(results).toEqual([])
    })

    it('should search with multiple criteria', async () => {
      const results = await repository.search({
        priority: 'high',
        type: 'bug',
      })
      expect(results).toHaveLength(1)
      expect(results[0]?.title).toBe('Bug Fix')
    })
  })

  describe('update', () => {
    it('should update an existing ticket', async () => {
      const ticket = new Ticket({
        title: 'Original Title',
        description: 'Original Description',
        priority: 'low',
      })

      await repository.save(ticket)

      // Update ticket
      ticket.updateStatus('completed')
      ticket.updatePriority('high')

      await repository.update(ticket)

      const updated = await repository.findById(ticket.id)
      expect(updated.status).toBe('completed')
      expect(updated.priority).toBe('high')
    })

    it('should throw TicketNotFoundError when updating non-existent ticket', async () => {
      const ticket = new Ticket(
        {
          title: 'Test',
          description: 'Test',
          priority: 'medium',
        },
        'nonexistent123'
      )

      await expect(repository.update(ticket)).rejects.toThrow(TicketNotFoundError)
    })
  })

  describe('delete', () => {
    it('should delete an existing ticket', async () => {
      const ticket = new Ticket({
        title: 'To Delete',
        description: 'This will be deleted',
        priority: 'medium',
      })

      await repository.save(ticket)
      expect(await repository.exists(ticket.id)).toBe(true)

      await repository.delete(ticket.id)
      expect(await repository.exists(ticket.id)).toBe(false)

      await expect(repository.findById(ticket.id)).rejects.toThrow(TicketNotFoundError)
    })

    it('should throw TicketNotFoundError when deleting non-existent ticket', async () => {
      await expect(repository.delete('nonexistent123')).rejects.toThrow(TicketNotFoundError)
    })
  })

  describe('exists', () => {
    it('should return false for non-existent ticket', async () => {
      const exists = await repository.exists('nonexistent123')
      expect(exists).toBe(false)
    })

    it('should return true for existing ticket', async () => {
      const ticket = new Ticket({
        title: 'Test',
        description: 'Test',
        priority: 'low',
      })

      await repository.save(ticket)
      const exists = await repository.exists(ticket.id)
      expect(exists).toBe(true)
    })
  })

  describe('count', () => {
    it('should return 0 when no tickets exist', async () => {
      const count = await repository.count()
      expect(count).toBe(0)
    })

    it('should return correct count of tickets', async () => {
      const ticket1 = new Ticket({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
      })

      const ticket2 = new Ticket({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
      })

      await repository.save(ticket1)
      expect(await repository.count()).toBe(1)

      await repository.save(ticket2)
      expect(await repository.count()).toBe(2)

      await repository.delete(ticket1.id)
      expect(await repository.count()).toBe(1)
    })
  })

  describe('clear', () => {
    it('should remove all tickets', async () => {
      const ticket1 = new Ticket({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
      })

      const ticket2 = new Ticket({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)
      expect(await repository.count()).toBe(2)

      await repository.clear()
      expect(await repository.count()).toBe(0)
      expect(await repository.findAll()).toEqual([])
    })
  })
})
