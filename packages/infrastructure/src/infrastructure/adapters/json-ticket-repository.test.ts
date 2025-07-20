import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Ticket } from '@project-manager/domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JsonTicketRepository } from './json-ticket-repository.ts'

interface FileSystemOperations {
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, data: string) => Promise<void>
}

describe('JsonTicketRepository', () => {
  let repository: JsonTicketRepository
  let tempDir: string
  let storagePath: string
  let mockFileSystem: FileSystemOperations

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = join(tmpdir(), `test-tickets-${Date.now()}`)
    storagePath = join(tempDir, 'tickets.json')
    await mkdir(tempDir, { recursive: true })

    // Create a mock file system that actually writes to disk
    mockFileSystem = {
      readFile: vi.fn(async (path: string) => {
        try {
          const content = await readFile(path, 'utf-8')
          return content
        } catch {
          return JSON.stringify([])
        }
      }),
      writeFile: vi.fn(async (path: string, data: string) => {
        await writeFile(path, data, 'utf-8')
      }),
    }

    repository = new JsonTicketRepository(storagePath)
  })

  afterEach(async () => {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('save', () => {
    it('should save a new ticket', async () => {
      const ticket = Ticket.create({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'high',
        type: 'task',
        status: 'pending',
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
        type: 'task',
        status: 'pending',
      })

      await repository.save(ticket)

      // Update the ticket
      ticket.updateTitle('Updated title')
      await repository.save(ticket)

      const updatedTicket = await repository.findById(ticket.id)
      expect(updatedTicket!.title.value).toBe('Updated title')

      // Verify only one ticket exists
      const allTickets = await repository.queryTickets()
      expect(allTickets).toHaveLength(1)
    })

    it('should handle multiple tickets', async () => {
      const ticket1 = Ticket.create({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
        type: 'task',
        status: 'pending',
      })

      // Add small delay to ensure different timestamps for ID generation
      await new Promise(resolve => setTimeout(resolve, 1))

      const ticket2 = Ticket.create({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
        type: 'task',
        status: 'pending',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      const allTickets = await repository.queryTickets()
      expect(allTickets).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('should find an existing ticket', async () => {
      const ticket = Ticket.create({
        title: 'Findable ticket',
        description: 'Test description',
        priority: 'medium',
        type: 'task',
        status: 'pending',
      })

      await repository.save(ticket)

      const foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).toBeDefined()
      expect(foundTicket!.id.value).toBe(ticket.id.value)
      expect(foundTicket!.title.value).toBe(ticket.title.value)
    })

    it('should return null for non-existent ticket', async () => {
      const nonExistentId = '00000000000000000000'
      const foundTicket = await repository.findById({ value: nonExistentId } as any)
      expect(foundTicket).toBeNull()
    })
  })

  describe('queryTickets', () => {
    it('should return empty array when no tickets exist', async () => {
      const tickets = await repository.queryTickets()
      expect(tickets).toEqual([])
    })

    it('should return all tickets when no criteria provided', async () => {
      const ticket1 = Ticket.create({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
        type: 'feature',
        status: 'pending',
      })

      const ticket2 = Ticket.create({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'low',
        type: 'bug',
        status: 'in_progress',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      const tickets = await repository.queryTickets()
      expect(tickets).toHaveLength(2)
      expect(tickets.map(t => t.title.value)).toContain('Ticket 1')
      expect(tickets.map(t => t.title.value)).toContain('Ticket 2')
    })
  })

  describe('delete', () => {
    it('should delete an existing ticket', async () => {
      const ticket = Ticket.create({
        title: 'To be deleted',
        description: 'Test description',
        priority: 'low',
        type: 'task',
        status: 'pending',
      })

      await repository.save(ticket)

      // Verify ticket exists
      let foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).toBeDefined()

      // Delete ticket
      await repository.delete(ticket.id)

      // Verify ticket no longer exists
      foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).toBeNull()
    })

    it('should throw TicketNotFoundError when deleting non-existent ticket', async () => {
      const { TicketNotFoundError } = await import('@project-manager/application')
      const nonExistentId = '00000000000000000000'

      await expect(repository.delete({ value: nonExistentId } as any)).rejects.toThrow(
        TicketNotFoundError
      )

      await expect(repository.delete({ value: nonExistentId } as any)).rejects.toThrow(
        `Ticket with ID '${nonExistentId}' not found`
      )
    })
  })

  describe('queryTickets', () => {
    beforeEach(async () => {
      const ticket1 = Ticket.create({
        title: 'High priority bug',
        description: 'Critical issue',
        priority: 'high',
        type: 'bug',
        status: 'pending',
      })

      const ticket2 = Ticket.create({
        title: 'Low priority feature',
        description: 'Nice to have',
        priority: 'low',
        type: 'feature',
        status: 'in_progress',
      })

      const ticket3 = Ticket.create({
        title: 'Medium priority task',
        description: 'Regular work',
        priority: 'medium',
        type: 'task',
        status: 'completed',
      })

      const ticket4 = Ticket.create({
        title: 'High priority feature',
        description: 'Important feature',
        priority: 'high',
        type: 'feature',
        status: 'pending',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)
      await repository.save(ticket3)
      await repository.save(ticket4)
    })

    it('should filter by status', async () => {
      const tickets = await repository.queryTickets({ status: 'pending' })
      expect(tickets).toHaveLength(2)
      tickets.forEach(ticket => {
        expect(ticket.status).toBe('pending')
      })
    })

    it('should filter by priority', async () => {
      const tickets = await repository.queryTickets({ priority: 'high' })
      expect(tickets).toHaveLength(2)
      tickets.forEach(ticket => {
        expect(ticket.priority).toBe('high')
      })
    })

    it('should filter by type', async () => {
      const tickets = await repository.queryTickets({ type: 'feature' })
      expect(tickets).toHaveLength(2)
      tickets.forEach(ticket => {
        expect(ticket.type).toBe('feature')
      })
    })

    it('should filter by multiple criteria', async () => {
      const tickets = await repository.queryTickets({
        priority: 'high',
        status: 'pending',
      })
      expect(tickets).toHaveLength(2)
      tickets.forEach(ticket => {
        expect(ticket.priority).toBe('high')
        expect(ticket.status).toBe('pending')
      })
    })

    it('should return all tickets when no filters provided', async () => {
      const tickets = await repository.queryTickets({})
      expect(tickets).toHaveLength(4)
    })

    it('should paginate results', async () => {
      const firstPage = await repository.queryTickets({ limit: 2 })
      expect(firstPage).toHaveLength(2)

      const allTickets = await repository.queryTickets({})
      expect(allTickets.length).toBeGreaterThan(2)
    })
  })

  describe('queryTickets', () => {
    beforeEach(async () => {
      const ticket1 = Ticket.create({
        title: 'Fix login bug',
        description: 'Users cannot login with email',
        priority: 'high',
        type: 'bug',
        status: 'pending',
      })

      const ticket2 = Ticket.create({
        title: 'Add new feature',
        description: 'Implement user profile page',
        priority: 'medium',
        type: 'feature',
        status: 'in_progress',
      })

      const ticket3 = Ticket.create({
        title: 'Update documentation',
        description: 'Fix typos in API docs',
        priority: 'low',
        type: 'task',
        status: 'completed',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)
      await repository.save(ticket3)
    })

    it('should search in titles', async () => {
      const results = await repository.queryTickets({ search: 'login' })
      expect(results).toHaveLength(1)
      expect(results[0]!.title.value).toContain('login')
    })

    it('should search in descriptions', async () => {
      const results = await repository.queryTickets({ search: 'email' })
      expect(results).toHaveLength(1)
      expect(results[0]!.description?.value).toContain('email')
    })

    it('should search case-insensitively', async () => {
      const results = await repository.queryTickets({ search: 'LOGIN' })
      expect(results).toHaveLength(1)
      expect(results[0]!.title.value).toContain('login')
    })

    it('should return empty array for no matches', async () => {
      const results = await repository.queryTickets({ search: 'nonexistent' })
      expect(results).toEqual([])
    })

    it('should handle partial matches', async () => {
      const results = await repository.queryTickets({ search: 'doc' })
      expect(results).toHaveLength(1) // 'documentation' in title OR 'docs' in description
      expect(results[0]!.title.value).toContain('documentation')
    })
  })

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const errorMessage = 'Permission denied'
      mockFileSystem.readFile = vi.fn().mockRejectedValue(new Error(errorMessage))

      const tickets = await repository.queryTickets()
      expect(tickets).toEqual([])
    })

    it('should handle corrupted JSON data', async () => {
      mockFileSystem.readFile = vi.fn().mockResolvedValue('{ invalid json }')

      const tickets = await repository.queryTickets()
      expect(tickets).toEqual([])
    })
  })
})
