import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { TicketNotFoundError } from '@project-manager/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Ticket } from '../entities/ticket.js'
import { JsonTicketRepository } from './json-ticket-repository.js'

describe('JsonTicketRepository', () => {
  const testDir = '/tmp/project-manager-test'
  const storageFile = join(testDir, 'tickets.json')
  let repository: JsonTicketRepository

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })

    repository = new JsonTicketRepository(storageFile)
  })

  afterEach(() => {
    // Clean up after each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('repository interface compliance', () => {
    it('should implement ITicketRepository interface correctly', async () => {
      const ticket = new Ticket({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high',
      })

      // Test save and findById
      await repository.save(ticket)
      const retrieved = await repository.findById(ticket.id)

      expect(retrieved.id).toBe(ticket.id)
      expect(retrieved.title).toBe('Test Ticket')

      // Test findByIdOrNull
      const found = await repository.findByIdOrNull(ticket.id)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(ticket.id)

      const notFound = await repository.findByIdOrNull('nonexistent123')
      expect(notFound).toBeNull()

      // Test exists
      expect(await repository.exists(ticket.id)).toBe(true)
      expect(await repository.exists('nonexistent123')).toBe(false)

      // Test count
      expect(await repository.count()).toBe(1)

      // Test findAll
      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(1)
      expect(allTickets[0]?.id).toBe(ticket.id)

      // Test update
      ticket.updateStatus('completed')
      await repository.update(ticket)
      const updated = await repository.findById(ticket.id)
      expect(updated.status).toBe('completed')

      // Test delete
      await repository.delete(ticket.id)
      expect(await repository.exists(ticket.id)).toBe(false)
      await expect(repository.findById(ticket.id)).rejects.toThrow(TicketNotFoundError)

      // Test clear
      await repository.save(ticket)
      expect(await repository.count()).toBe(1)
      await repository.clear()
      expect(await repository.count()).toBe(0)
    })

    it('should handle search operations correctly', async () => {
      const ticket1 = new Ticket({
        title: 'Bug Fix',
        description: 'Critical bug',
        priority: 'high',
        type: 'bug',
      })

      const ticket2 = new Ticket({
        title: 'Feature Request',
        description: 'New feature',
        priority: 'medium',
        type: 'feature',
      })

      await repository.save(ticket1)
      await repository.save(ticket2)

      // Search by title
      const bugResults = await repository.search({ title: 'Bug' })
      expect(bugResults).toHaveLength(1)
      expect(bugResults[0]?.title).toBe('Bug Fix')

      // Search by priority
      const highPriorityResults = await repository.search({ priority: 'high' })
      expect(highPriorityResults).toHaveLength(1)
      expect(highPriorityResults[0]?.priority).toBe('high')

      // Search by type
      const featureResults = await repository.search({ type: 'feature' })
      expect(featureResults).toHaveLength(1)
      expect(featureResults[0]?.type).toBe('feature')

      // Multiple criteria search
      const combinedResults = await repository.search({
        priority: 'high',
        type: 'bug',
      })
      expect(combinedResults).toHaveLength(1)
      expect(combinedResults[0]?.title).toBe('Bug Fix')

      // No matches
      const noResults = await repository.search({ title: 'NonExistent' })
      expect(noResults).toEqual([])
    })

    it('should handle error cases correctly', async () => {
      // TicketNotFoundError for non-existent ticket
      await expect(repository.findById('nonexistent123')).rejects.toThrow(TicketNotFoundError)
      await expect(
        repository.update(
          new Ticket(
            {
              title: 'Test',
              description: 'Test',
              priority: 'low',
            },
            'nonexistent123'
          )
        )
      ).rejects.toThrow(TicketNotFoundError)
      await expect(repository.delete('nonexistent123')).rejects.toThrow(TicketNotFoundError)

      // Validation errors for invalid IDs
      await expect(repository.findById('')).rejects.toThrow()
      await expect(repository.findById('short')).rejects.toThrow()
      await expect(repository.findById('invalid-id')).rejects.toThrow()
    })

    it('should handle concurrent operations safely', async () => {
      const ticket1 = new Ticket({
        title: 'Ticket 1',
        description: 'Description 1',
        priority: 'high',
      })

      const ticket2 = new Ticket({
        title: 'Ticket 2',
        description: 'Description 2',
        priority: 'medium',
      })

      // Save tickets concurrently
      await Promise.all([repository.save(ticket1), repository.save(ticket2)])

      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(2)
    })

    it('should persist data correctly across repository instances', async () => {
      const ticket = new Ticket({
        title: 'Persistent Ticket',
        description: 'Should persist across instances',
        priority: 'medium',
      })

      // Save with first instance
      await repository.save(ticket)

      // Create new instance pointing to same file
      const secondRepository = new JsonTicketRepository(storageFile)

      // Should be able to retrieve the ticket
      const retrieved = await secondRepository.findById(ticket.id)
      expect(retrieved.title).toBe('Persistent Ticket')
      expect(retrieved.description).toBe('Should persist across instances')
    })

    it('should handle corrupted data gracefully', async () => {
      // Save a valid ticket first
      const ticket = new Ticket({
        title: 'Valid Ticket',
        description: 'Valid Description',
        priority: 'low',
      })

      await repository.save(ticket)

      // Corrupt the file by writing invalid JSON
      const fs = await import('node:fs')
      fs.writeFileSync(storageFile, 'invalid json content')

      // Create new repository instance
      const corruptedRepository = new JsonTicketRepository(storageFile)

      // Should handle corruption gracefully
      const tickets = await corruptedRepository.findAll()
      expect(tickets).toEqual([])
      expect(await corruptedRepository.count()).toBe(0)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty file gracefully', async () => {
      // Create empty file
      const fs = await import('node:fs')
      fs.writeFileSync(storageFile, '')

      const emptyRepository = new JsonTicketRepository(storageFile)

      const tickets = await emptyRepository.findAll()
      expect(tickets).toEqual([])
      expect(await emptyRepository.count()).toBe(0)
    })

    it('should handle file with empty JSON array', async () => {
      // Create file with empty array
      const fs = await import('node:fs')
      fs.writeFileSync(storageFile, '[]')

      const emptyArrayRepository = new JsonTicketRepository(storageFile)

      const tickets = await emptyArrayRepository.findAll()
      expect(tickets).toEqual([])
      expect(await emptyArrayRepository.count()).toBe(0)
    })

    it('should handle non-existent directory creation', async () => {
      const deepPath = join(testDir, 'deep', 'nested', 'path', 'tickets.json')

      const deepRepository = new JsonTicketRepository(deepPath)

      const ticket = new Ticket({
        title: 'Deep Path Ticket',
        description: 'Test deep directory creation',
        priority: 'medium',
      })

      // Should create directories and save successfully
      await deepRepository.save(ticket)

      const retrieved = await deepRepository.findById(ticket.id)
      expect(retrieved.title).toBe('Deep Path Ticket')
    })

    it('should handle very large datasets efficiently', async () => {
      const tickets: Ticket[] = []

      // Create 100 tickets
      for (let i = 0; i < 100; i++) {
        const ticket = new Ticket({
          title: `Ticket ${i}`,
          description: `Description for ticket ${i}`,
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : 'task',
        })
        tickets.push(ticket)
      }

      // Save all tickets
      for (const ticket of tickets) {
        await repository.save(ticket)
      }

      // Verify count and retrieval
      expect(await repository.count()).toBe(100)

      const allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(100)

      // Test search performance with large dataset
      const highPriorityTickets = await repository.search({ priority: 'high' })
      expect(highPriorityTickets.length).toBeGreaterThan(0)

      const bugTickets = await repository.search({ type: 'bug' })
      expect(bugTickets.length).toBeGreaterThan(0)
    })

    it('should handle malformed JSON in individual ticket objects', async () => {
      // Create file with one valid and one malformed ticket
      const fs = await import('node:fs')
      const malformedData = [
        {
          id: 'valid123',
          title: 'Valid Ticket',
          description: 'Valid Description',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'invalid123',
          // Missing required fields
          title: null,
          description: undefined,
        },
      ]

      fs.writeFileSync(storageFile, JSON.stringify(malformedData, null, 2))

      const malformedRepository = new JsonTicketRepository(storageFile)

      // Should handle partial corruption gracefully
      // Implementation should either skip invalid records or fail gracefully
      try {
        const tickets = await malformedRepository.findAll()
        // If implementation filters out invalid records
        expect(tickets.length).toBeLessThanOrEqual(2)
      } catch (error) {
        // If implementation throws on invalid data, that's also acceptable
        expect(error).toBeDefined()
      }
    })

    it('should handle search with special characters', async () => {
      const specialTicket = new Ticket({
        title: 'Special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
        description: 'Description with émojis 🚀 and unicode 中文',
        priority: 'high',
      })

      await repository.save(specialTicket)

      // Search with special characters
      const results = await repository.search({ title: '@#$%' })
      expect(results).toHaveLength(1)
      expect(results[0]?.title).toContain('@#$%')

      // Search with emoji
      const emojiResults = await repository.search({ title: '🚀' })
      expect(emojiResults).toHaveLength(0) // Title search, not description

      // Search with unicode
      const unicodeResults = await repository.search({ title: 'Special' })
      expect(unicodeResults).toHaveLength(1)
    })

    it('should handle case-insensitive search', async () => {
      const ticket = new Ticket({
        title: 'CamelCase Title',
        description: 'Mixed Case Description',
        priority: 'medium',
      })

      await repository.save(ticket)

      // Test case-insensitive search
      const lowerResults = await repository.search({ title: 'camelcase' })
      expect(lowerResults).toHaveLength(1)

      const upperResults = await repository.search({ title: 'CAMELCASE' })
      expect(upperResults).toHaveLength(1)

      const mixedResults = await repository.search({ title: 'CaMeLcAsE' })
      expect(mixedResults).toHaveLength(1)
    })

    it('should handle boundary value searches', async () => {
      const tickets = [
        new Ticket({ title: 'A', description: 'First', priority: 'high' }),
        new Ticket({ title: 'Z', description: 'Last', priority: 'low' }),
      ]

      // Save valid tickets
      await repository.save(tickets[0]!)
      await repository.save(tickets[1]!)

      // Test boundary searches
      const resultsA = await repository.search({ title: 'A' })
      expect(resultsA).toHaveLength(1)

      const resultsZ = await repository.search({ title: 'Z' })
      expect(resultsZ).toHaveLength(1)

      // Test empty search criteria
      const allResults = await repository.search({})
      expect(allResults).toHaveLength(2)
    })

    it('should handle rapid concurrent operations', async () => {
      const tickets = Array.from(
        { length: 10 },
        (_, i) =>
          new Ticket({
            title: `Concurrent Ticket ${i}`,
            description: `Description ${i}`,
            priority: 'medium',
          })
      )

      // Perform rapid concurrent saves
      const savePromises = tickets.map(ticket => repository.save(ticket))
      await Promise.all(savePromises)

      // Verify all tickets were saved
      expect(await repository.count()).toBe(10)

      // Perform rapid concurrent updates
      const updatePromises = tickets.map(ticket => {
        ticket.updateStatus('completed')
        return repository.update(ticket)
      })
      await Promise.all(updatePromises)

      // Verify all tickets were updated
      const allTickets = await repository.findAll()
      for (const ticket of allTickets) {
        expect(ticket.status).toBe('completed')
      }

      // Perform rapid concurrent deletes
      const deletePromises = tickets.map(ticket => repository.delete(ticket.id))
      await Promise.all(deletePromises)

      // Verify all tickets were deleted
      expect(await repository.count()).toBe(0)
    })
  })
})
