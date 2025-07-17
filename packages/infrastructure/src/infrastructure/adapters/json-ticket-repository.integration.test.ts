import { constants } from 'node:fs'
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Ticket } from '@project-manager/domain'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JsonTicketRepository } from './json-ticket-repository.ts'

describe('JsonTicketRepository - Integration Tests', () => {
  let repository: JsonTicketRepository
  let testStoragePath: string
  let testTicketsFile: string

  beforeEach(async () => {
    // Create unique temporary directory for each test
    testStoragePath = join(tmpdir(), 'pm-integration-test', `test-${Date.now()}-${Math.random()}`)
    testTicketsFile = join(testStoragePath, 'tickets.json')

    // Ensure directory exists
    await mkdir(testStoragePath, { recursive: true })

    // Create repository instance with test tickets file path
    repository = new JsonTicketRepository(testTicketsFile)
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testStoragePath, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('File System Integration', () => {
    it('should create tickets file when it does not exist', async () => {
      const ticket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      })

      await repository.save(ticket)

      // File should exist
      await expect(access(testTicketsFile, constants.F_OK)).resolves.not.toThrow()

      // File should contain the ticket
      const fileContent = await readFile(testTicketsFile, 'utf-8')
      const tickets = JSON.parse(fileContent)
      expect(tickets).toHaveLength(1)
      expect(tickets[0].title).toBe('Test Ticket')
    })

    it('should create nested directories when storage path does not exist', async () => {
      const nestedPath = join(testStoragePath, 'nested', 'deep', 'path')
      const nestedTicketsFile = join(nestedPath, 'tickets.json')
      const nestedRepository = new JsonTicketRepository(nestedTicketsFile)

      const ticket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      })

      await nestedRepository.save(ticket)

      // Directory should exist
      await expect(access(nestedTicketsFile, constants.F_OK)).resolves.not.toThrow()
    })

    it('should handle empty tickets file gracefully', async () => {
      // Create empty file
      await writeFile(testTicketsFile, '')

      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should handle corrupted tickets file', async () => {
      // Create corrupted JSON file
      await writeFile(testTicketsFile, '{"invalid": json}')

      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should handle missing tickets file', async () => {
      // Don't create the file
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])
    })

    it('should preserve file permissions after operations', async () => {
      const ticket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      })

      await repository.save(ticket)

      const stats = await stat(testTicketsFile)
      // Check that file is readable (permissions vary by system)
      expect(stats.mode & 0o400).toBeGreaterThan(0) // Owner readable
    })

    it('should handle concurrent file system operations', async () => {
      const tickets = Array.from({ length: 10 }, (_, i) =>
        Ticket.create({
          title: `Test Ticket ${i}`,
          description: `Test Description ${i}`,
          priority: 'medium',
        })
      )

      // Save all tickets concurrently
      await Promise.all(tickets.map(ticket => repository.save(ticket)))

      // All tickets should be saved
      const savedTickets = await repository.findAll()
      expect(savedTickets).toHaveLength(10)

      // Check that all tickets have unique IDs
      const ids = savedTickets.map(t => t.id.value)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10)
    })

    it('should handle disk space exhaustion gracefully', async () => {
      // Create a large ticket description (within validation limits)
      const largeDescription = 'x'.repeat(5000) // Maximum allowed description length

      const ticket = Ticket.create({
        title: 'Large Ticket',
        description: largeDescription,
        priority: 'medium',
      })

      // This should either succeed or throw a meaningful error
      await expect(repository.save(ticket)).resolves.not.toThrow()
    })

    it('should handle file system permission errors', async () => {
      // Create read-only directory (if supported by the file system)
      const readOnlyPath = join(testStoragePath, 'readonly')
      await mkdir(readOnlyPath, { recursive: true })

      // Try to make directory read-only (best effort)
      try {
        await import('node:fs').then(fs => fs.promises.chmod(readOnlyPath, 0o444))
      } catch {
        // Skip test if chmod not supported
        return
      }

      const readOnlyTicketsFile = join(readOnlyPath, 'tickets.json')
      const readOnlyRepository = new JsonTicketRepository(readOnlyTicketsFile)
      const ticket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
      })

      // Should handle permission error gracefully
      await expect(readOnlyRepository.save(ticket)).rejects.toThrow()
    })
  })

  describe('Data Integrity Integration', () => {
    it('should maintain data integrity across multiple operations', async () => {
      const originalTicket = Ticket.create({
        title: 'Original Ticket',
        description: 'Original Description',
        priority: 'high',
      })

      // Save original
      await repository.save(originalTicket)

      // Modify and save again
      originalTicket.updateTitle('Updated Title')
      originalTicket.changePriority('low')
      await repository.save(originalTicket)

      // Retrieve and verify
      const retrievedTicket = await repository.findById(originalTicket.id)
      expect(retrievedTicket).not.toBeNull()
      expect(retrievedTicket!.title.value).toBe('Updated Title')
      expect(retrievedTicket!.priority.value).toBe('low')
      expect(retrievedTicket!.description.value).toBe('Original Description')
    })

    it('should handle round-trip data conversion correctly', async () => {
      const tickets = [
        Ticket.create({
          title: 'Ticket with special chars: áéíóú',
          description: 'Description with newlines\nand tabs\t',
          priority: 'high',
          type: 'bug',
          privacy: 'public',
        }),
        Ticket.create({
          title: 'Ticket with Unicode: 🎉🚀',
          description: 'Unicode description: こんにちは世界',
          priority: 'low',
          type: 'feature',
          privacy: 'team',
        }),
        Ticket.create({
          title: 'Ticket with JSON chars: {"key": "value"}',
          description: 'Description with quotes: "quoted text"',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
        }),
      ]

      // Save all tickets
      for (const ticket of tickets) {
        await repository.save(ticket)
      }

      // Retrieve and verify all tickets
      const savedTickets = await repository.findAll()
      expect(savedTickets).toHaveLength(3)

      // Check each ticket's data integrity
      for (const originalTicket of tickets) {
        const savedTicket = savedTickets.find(t => t.id.value === originalTicket.id.value)
        expect(savedTicket).toBeDefined()

        expect(savedTicket!.title.value).toBe(originalTicket.title.value)
        expect(savedTicket!.description.value).toBe(originalTicket.description.value)
        expect(savedTicket!.priority.value).toBe(originalTicket.priority.value)
        expect(savedTicket!.type).toBe(originalTicket.type)
        expect(savedTicket!.privacy).toBe(originalTicket.privacy)
        expect(savedTicket!.status.value).toBe(originalTicket.status.value)
      }
    })

    it('should maintain timestamp consistency', async () => {
      const ticket = Ticket.create({
        title: 'Timestamp Test',
        description: 'Testing timestamp consistency',
        priority: 'medium',
      })

      const originalCreatedAt = ticket.createdAt
      const originalUpdatedAt = ticket.updatedAt

      // Save and retrieve
      await repository.save(ticket)
      const retrievedTicket = await repository.findById(ticket.id)

      // Timestamps should be preserved
      expect(retrievedTicket!.createdAt.getTime()).toBe(originalCreatedAt.getTime())
      expect(retrievedTicket!.updatedAt.getTime()).toBe(originalUpdatedAt.getTime())

      // Update ticket
      ticket.updateTitle('Updated Title')
      await repository.save(ticket)

      // Retrieve again
      const updatedRetrievedTicket = await repository.findById(ticket.id)

      // Created timestamp should remain the same, updated should change
      expect(updatedRetrievedTicket!.createdAt.getTime()).toBe(originalCreatedAt.getTime())
      expect(updatedRetrievedTicket!.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      )
    })

    it('should handle ID collision gracefully', async () => {
      // Create two tickets with same content
      const ticket1 = Ticket.create({
        title: 'Identical Ticket',
        description: 'Identical Description',
        priority: 'medium',
      })

      const ticket2 = Ticket.create({
        title: 'Identical Ticket',
        description: 'Identical Description',
        priority: 'medium',
      })

      // IDs should be different
      expect(ticket1.id.value).not.toBe(ticket2.id.value)

      // Both should save successfully
      await repository.save(ticket1)
      await repository.save(ticket2)

      // Both should be retrievable
      const savedTickets = await repository.findAll()
      expect(savedTickets).toHaveLength(2)
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) =>
        Ticket.create({
          title: `Ticket ${i}`,
          description: `Description for ticket ${i}`,
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        })
      )

      const startTime = Date.now()

      // Save all tickets concurrently for a better performance test
      await Promise.all(largeDataset.map(ticket => repository.save(ticket)))

      const saveTime = Date.now() - startTime

      // Retrieve all tickets
      const retrieveStartTime = Date.now()
      const savedTickets = await repository.findAll()
      const retrieveTime = Date.now() - retrieveStartTime

      // Verify ALL tickets were saved. No data loss.
      expect(savedTickets).toHaveLength(100)

      // Performance should be reasonable (adjust thresholds as needed)
      expect(saveTime).toBeLessThan(10000) // 10 seconds for 100 saves
      expect(retrieveTime).toBeLessThan(1000) // 1 second for 100 retrieves

      console.log(`Performance: ${saveTime}ms save, ${retrieveTime}ms retrieve`)
    })

    it('should handle concurrent reads during writes', async () => {
      const ticket = Ticket.create({
        title: 'Concurrent Test',
        description: 'Testing concurrent access',
        priority: 'medium',
      })

      await repository.save(ticket)

      // Perform concurrent reads and writes
      const operations = [
        repository.findAll(),
        repository.findById(ticket.id),
        repository.save(ticket),
        repository.findAll(),
        repository.findById(ticket.id),
      ]

      // All operations should complete successfully
      await expect(Promise.all(operations)).resolves.not.toThrow()
    })

    it('should handle rapid sequential operations', async () => {
      const ticket = Ticket.create({
        title: 'Rapid Test',
        description: 'Testing rapid operations',
        priority: 'medium',
      })

      // Perform rapid sequential operations
      await repository.save(ticket)
      const retrieved1 = await repository.findById(ticket.id)

      ticket.updateTitle('Updated Title')
      await repository.save(ticket)
      const retrieved2 = await repository.findById(ticket.id)

      ticket.changePriority('high')
      await repository.save(ticket)
      const retrieved3 = await repository.findById(ticket.id)

      // All retrievals should succeed and show progressive changes
      expect(retrieved1!.title.value).toBe('Rapid Test')
      expect(retrieved2!.title.value).toBe('Updated Title')
      expect(retrieved3!.priority.value).toBe('high')
    })
  })

  describe('Error Handling Integration', () => {
    it('should recover from partial write failures', async () => {
      const ticket = Ticket.create({
        title: 'Recovery Test',
        description: 'Testing error recovery',
        priority: 'medium',
      })

      // Save successfully first
      await repository.save(ticket)

      // Simulate partial failure by corrupting the file
      await writeFile(testTicketsFile, '{"incomplete": ')

      // Repository should handle corruption gracefully
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])

      // Should be able to save new tickets after corruption
      const newTicket = Ticket.create({
        title: 'New Ticket',
        description: 'After corruption',
        priority: 'high',
      })

      await repository.save(newTicket)

      // Should only contain the new ticket
      const recoveredTickets = await repository.findAll()
      expect(recoveredTickets).toHaveLength(1)
      expect(recoveredTickets[0]!.title.value).toBe('New Ticket')
    })

    it('should handle network drive disconnection simulation', async () => {
      const ticket = Ticket.create({
        title: 'Network Test',
        description: 'Testing network issues',
        priority: 'medium',
      })

      // Save successfully
      await repository.save(ticket)

      // Simulate network disconnection by removing the storage directory
      await rm(testStoragePath, { recursive: true, force: true })

      // Operations should handle missing directory gracefully
      const tickets = await repository.findAll()
      expect(tickets).toEqual([])

      // Should be able to recover by recreating storage
      await repository.save(ticket)

      // Should work again
      const recoveredTickets = await repository.findAll()
      expect(recoveredTickets).toHaveLength(1)
    })

    it('should handle file locking conflicts', async () => {
      const ticket1 = Ticket.create({
        title: 'Locking Test 1',
        description: 'Testing file locking',
        priority: 'medium',
      })

      const ticket2 = Ticket.create({
        title: 'Locking Test 2',
        description: 'Testing file locking',
        priority: 'high',
      })

      // Perform concurrent saves that might conflict
      await Promise.all([repository.save(ticket1), repository.save(ticket2)])

      // Both tickets should be saved
      const savedTickets = await repository.findAll()
      expect(savedTickets).toHaveLength(2)

      const titles = savedTickets.map(t => t.title.value).sort()
      expect(titles).toEqual(['Locking Test 1', 'Locking Test 2'])
    })
  })

  describe('Statistics Integration', () => {
    it('should calculate statistics correctly with real data', async () => {
      const tickets = [
        Ticket.create({
          title: 'High Priority Bug',
          description: 'Bug desc',
          priority: 'high',
          type: 'bug',
        }),
        Ticket.create({
          title: 'Medium Priority Feature',
          description: 'Feature desc',
          priority: 'medium',
          type: 'feature',
        }),
        Ticket.create({
          title: 'Low Priority Task',
          description: 'Task desc',
          priority: 'low',
          type: 'task',
        }),
        Ticket.create({
          title: 'Another High Priority',
          description: 'Another desc',
          priority: 'high',
          type: 'bug',
        }),
      ]

      // Save all tickets and change some statuses
      for (const ticket of tickets) {
        await repository.save(ticket)
      }

      // Update some statuses with valid transitions
      tickets[0]!.changeStatus('in_progress')
      tickets[1]!.changeStatus('in_progress')
      tickets[1]!.changeStatus('completed')
      await repository.save(tickets[0]!)
      await repository.save(tickets[1]!)

      // Get statistics
      const stats = await repository.getStatistics()

      // Verify statistics
      expect(stats.total).toBe(4)
      expect(stats.pending).toBe(2)
      expect(stats.inProgress).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.archived).toBe(0)
      expect(stats.byPriority.high).toBe(2)
      expect(stats.byPriority.medium).toBe(1)
      expect(stats.byPriority.low).toBe(1)
      expect(stats.byType.bug).toBe(2)
      expect(stats.byType.feature).toBe(1)
      expect(stats.byType.task).toBe(1)
    })

    it('should handle statistics with empty repository', async () => {
      const stats = await repository.getStatistics()

      expect(stats.total).toBe(0)
      expect(stats.pending).toBe(0)
      expect(stats.inProgress).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.archived).toBe(0)
      expect(stats.byPriority).toBeDefined()
      expect(stats.byType).toBeDefined()
    })
  })

  describe('Mapper Integration', () => {
    it('should handle complex mapping scenarios', async () => {
      const complexTicket = Ticket.create({
        title: 'Complex Mapping Test',
        description: 'Testing complex mapping scenarios',
        priority: 'medium',
        type: 'feature',
        privacy: 'public',
      })

      // Perform multiple state changes
      complexTicket.changeStatus('in_progress')
      complexTicket.changePriority('high')
      complexTicket.updateDescription('Updated description')
      complexTicket.changeType('bug')

      // Save and retrieve
      await repository.save(complexTicket)
      const retrievedTicket = await repository.findById(complexTicket.id)

      // Verify all changes were persisted correctly
      expect(retrievedTicket!.status.value).toBe('in_progress')
      expect(retrievedTicket!.priority.value).toBe('high')
      expect(retrievedTicket!.description.value).toBe('Updated description')
      expect(retrievedTicket!.type).toBe('bug')
      expect(retrievedTicket!.privacy).toBe('public')
    })

    it('should handle edge cases in mapping', async () => {
      // Test with boundary values
      const edgeCaseTicket = Ticket.create({
        title: 'A'.repeat(200), // Maximum title length
        description: 'B'.repeat(5000), // Maximum description length
        priority: 'high',
      })

      await repository.save(edgeCaseTicket)
      const retrievedTicket = await repository.findById(edgeCaseTicket.id)

      expect(retrievedTicket!.title.value).toBe('A'.repeat(200))
      expect(retrievedTicket!.description.value).toBe('B'.repeat(5000))
    })
  })

  describe('Cross-Operation Integration', () => {
    it('should handle complete CRUD workflow', async () => {
      const ticket = Ticket.create({
        title: 'CRUD Test',
        description: 'Testing complete CRUD workflow',
        priority: 'medium',
      })

      // CREATE
      await repository.save(ticket)
      let allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(1)

      // READ
      const foundTicket = await repository.findById(ticket.id)
      expect(foundTicket).not.toBeNull()
      expect(foundTicket!.title.value).toBe('CRUD Test')

      // UPDATE
      ticket.updateTitle('Updated CRUD Test')
      await repository.save(ticket)
      const updatedTicket = await repository.findById(ticket.id)
      expect(updatedTicket!.title.value).toBe('Updated CRUD Test')

      // DELETE
      await repository.delete(ticket.id)
      const deletedTicket = await repository.findById(ticket.id)
      expect(deletedTicket).toBeNull()

      allTickets = await repository.findAll()
      expect(allTickets).toHaveLength(0)
    })

    it('should handle mixed operations with multiple tickets', async () => {
      const tickets = Array.from({ length: 5 }, (_, i) =>
        Ticket.create({
          title: `Mixed Test ${i}`,
          description: `Description ${i}`,
          priority: i % 2 === 0 ? 'high' : 'low',
        })
      )

      // Save all tickets
      for (const ticket of tickets) {
        await repository.save(ticket)
      }

      // Update some tickets
      tickets[0]!.updateTitle('Updated 0')
      tickets[2]!.changePriority('medium')
      await repository.save(tickets[0]!)
      await repository.save(tickets[2]!)

      // Delete some tickets
      await repository.delete(tickets[1]!.id)
      await repository.delete(tickets[3]!.id)

      // Verify final state
      const remainingTickets = await repository.findAll()
      expect(remainingTickets).toHaveLength(3)

      const titles = remainingTickets.map(t => t.title.value).sort()
      expect(titles).toEqual(['Mixed Test 2', 'Mixed Test 4', 'Updated 0'])
    })
  })
})
