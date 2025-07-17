import { constants } from 'node:fs'
import { access, mkdtemp, rm, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Ticket, TicketId } from '@project-manager/domain'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { TicketNotFoundError } from '../errors/infrastructure-errors.ts'
import { JsonTicketRepository } from './json-ticket-repository.ts'

describe('JsonTicketRepository', () => {
  let repository: JsonTicketRepository
  let tempDir: string
  let testFilePath: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'json-ticket-repo-test-'))
  })

  beforeEach(() => {
    testFilePath = join(tempDir, `${Date.now()}.json`)
    repository = new JsonTicketRepository(testFilePath)
  })

  afterEach(async () => {
    // Clean up test file
    try {
      await access(testFilePath, constants.F_OK)
      await unlink(testFilePath)
    } catch {
      // File doesn't exist, nothing to clean up
    }
  })

  afterAll(async () => {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('save', () => {
    it('should save a new ticket', async () => {
      const ticket = Ticket.create({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'high',
      })

      await repository.save(ticket)

      const savedTicket = await repository.findById(ticket.id)
      expect(savedTicket).toBeDefined()
      expect(savedTicket!.id.value).toBe(ticket.id.value)
      expect(savedTicket!.title.value).toBe(ticket.title.value)
    })

    it('should update an existing ticket', async () => {
      const ticket = Ticket.create({
        title: 'Original title',
        description: 'Original description',
        priority: 'high',
      })

      await repository.save(ticket)

      // Update the ticket
      ticket.updateTitle('Updated title')
      await repository.save(ticket)

      const savedTicket = await repository.findById(ticket.id)
      expect(savedTicket!.title.value).toBe('Updated title')

      // Verify only one ticket exists
      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(1)
    })

    it('should handle multiple tickets', async () => {
      const ticket1 = Ticket.create({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
      })

      // Add small delay to ensure different timestamps for ID generation
      await new Promise(resolve => setTimeout(resolve, 1))

      const ticket2 = Ticket.create({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('should find an existing ticket', async () => {
      const ticket = Ticket.create({
        title: 'Findable ticket',
        description: 'Test description',
        priority: 'medium',
      })

      await repository.save(ticket)

      const foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).toBeDefined()
      expect(foundTicket!.id.value).toBe(ticket.id.value)
      expect(foundTicket!.title.value).toBe('Findable ticket')
    })

    it('should return null for non-existent ticket', async () => {
      const nonExistentId = TicketId.create('abcdef12') // 8 hex characters
      const foundTicket = await repository.findById(nonExistentId)
      expect(foundTicket).toBeNull()
    })

    it('should return null when file does not exist', async () => {
      const id = TicketId.create('fedcba98') // 8 hex characters
      const foundTicket = await repository.findById(id)
      expect(foundTicket).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return empty array when no tickets exist', async () => {
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should return all tickets', async () => {
      const ticket1 = Ticket.create({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
      })

      // Add small delay to ensure different timestamps for ID generation
      await new Promise(resolve => setTimeout(resolve, 1))

      const ticket2 = Ticket.create({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(2)

      const titles = allTickets.map(t => t.title.value)
      expect(titles).toContain('Ticket 1')
      expect(titles).toContain('Ticket 2')
    })

    it('should return tickets as domain objects with proper value objects', async () => {
      const ticket = Ticket.create({
        title: 'Domain test',
        description: 'Test description',
        priority: 'high',
      })

      await repository.save(ticket)

      const allTickets = await repository.findAll()
      const foundTicket = allTickets[0]!

      expect(foundTicket.id).toBeInstanceOf(TicketId)
      expect(foundTicket.title.value).toBe('Domain test')
      expect(foundTicket.status.value).toBe('pending')
      expect(foundTicket.priority.value).toBe('high')
    })
  })

  describe('delete', () => {
    it('should delete an existing ticket', async () => {
      const ticket = Ticket.create({
        title: 'To be deleted',
        description: 'Test description',
        priority: 'medium',
      })

      await repository.save(ticket)

      // Verify ticket exists
      let foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).toBeDefined()

      // Delete ticket
      await repository.delete(ticket.id)

      // Verify ticket is gone
      foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).toBeNull()
    })

    it('should throw error when trying to delete non-existent ticket', async () => {
      const nonExistentId = TicketId.create('11223344') // 8 hex characters

      await expect(repository.delete(nonExistentId)).rejects.toThrow(TicketNotFoundError)
    })

    it('should not affect other tickets when deleting one', async () => {
      const ticket1 = Ticket.create({
        title: 'Keep this',
        description: 'Description 1',
        priority: 'high',
      })

      const ticket2 = Ticket.create({
        title: 'Delete this',
        description: 'Description 2',
        priority: 'low',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      // Delete second ticket
      await repository.delete(ticket2.id)

      // Verify first ticket still exists
      const foundTicket = await repository.findById(ticket1.id)
      expect(foundTicket).toBeDefined()
      expect(foundTicket!.title.value).toBe('Keep this')

      // Verify only one ticket remains
      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(1)
    })
  })

  describe('data integrity', () => {
    it('should handle corrupted JSON file gracefully', async () => {
      // Write invalid JSON to file
      const fs = await import('node:fs/promises')
      await fs.writeFile(testFilePath, 'invalid json content')

      // Should return empty array instead of throwing
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should handle empty file gracefully', async () => {
      // Write empty content to file
      const fs = await import('node:fs/promises')
      await fs.writeFile(testFilePath, '')

      // Should return empty array
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should handle non-array JSON gracefully', async () => {
      // Write object instead of array
      const fs = await import('node:fs/promises')
      await fs.writeFile(testFilePath, '{"not": "an array"}')

      // Should return empty array
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })
  })

  describe('concurrency', () => {
    it('should handle concurrent saves safely', async () => {
      const ticket1 = Ticket.create({
        title: 'Concurrent 1',
        description: 'Description 1',
        priority: 'high',
      })

      // Add small delay to ensure different timestamps for ID generation
      await new Promise(resolve => setTimeout(resolve, 1))

      const ticket2 = Ticket.create({
        title: 'Concurrent 2',
        description: 'Description 2',
        priority: 'low',
      })

      // Save both tickets concurrently
      await Promise.all([repository.save(ticket1), repository.save(ticket2)])

      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(2)

      const titles = allTickets.map(t => t.title.value)
      expect(titles).toContain('Concurrent 1')
      expect(titles).toContain('Concurrent 2')
    })
  })

  describe('getStatistics', () => {
    it('should return empty statistics when no tickets exist', async () => {
      const stats = await repository.getStatistics()

      expect(stats).toEqual({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        archived: 0,
        byPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
        byType: {
          feature: 0,
          bug: 0,
          task: 0,
        },
      })
    })

    it('should calculate statistics correctly for multiple tickets', async () => {
      // Create tickets with different properties
      const tickets = [
        Ticket.create({
          title: 'High Priority Bug',
          description: 'Critical bug',
          priority: 'high',
          type: 'bug',
          status: 'pending',
        }),
        Ticket.create({
          title: 'Medium Priority Feature',
          description: 'New feature',
          priority: 'medium',
          type: 'feature',
          status: 'in_progress',
        }),
        Ticket.create({
          title: 'Low Priority Task',
          description: 'Simple task',
          priority: 'low',
          type: 'task',
          status: 'completed',
        }),
        Ticket.create({
          title: 'Another High Priority Bug',
          description: 'Another bug',
          priority: 'high',
          type: 'bug',
          status: 'archived',
        }),
      ]

      // Save all tickets
      for (const ticket of tickets) {
        await repository.save(ticket)
      }

      const stats = await repository.getStatistics()

      expect(stats).toEqual({
        total: 4,
        pending: 1,
        inProgress: 1,
        completed: 1,
        archived: 1,
        byPriority: {
          high: 2,
          medium: 1,
          low: 1,
        },
        byType: {
          feature: 1,
          bug: 2,
          task: 1,
        },
      })
    })

    it('should handle file not existing gracefully', async () => {
      // Using a non-existent file path
      const emptyRepo = new JsonTicketRepository(join(tempDir, 'non-existent.json'))
      const stats = await emptyRepo.getStatistics()

      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
    })
  })
})
