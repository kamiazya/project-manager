/**
 * Tests for ProjectManagerSDK
 */

import { Container } from 'inversify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectManagerSDK } from './project-manager-sdk.ts'
import { SDKContainer } from './sdk-container.ts'

describe('ProjectManagerSDK', () => {
  let container: Container
  let sdk: ProjectManagerSDK

  beforeEach(async () => {
    // Reset all singletons and caches to ensure test isolation
    SDKContainer.reset()

    // Also reset the UseCaseFactoryProvider
    const { UseCaseFactoryProvider } = await import('@project-manager/application')
    UseCaseFactoryProvider.resetInstance()

    // Use unique storage path for each test to avoid data contamination
    const uniquePath = `./test-data-${Date.now()}-${Math.random().toString(36).substring(7)}`
    container = await SDKContainer.create({
      environment: 'test',
      storagePath: uniquePath,
    })
    sdk = await ProjectManagerSDK.create(container)
  })

  describe('tickets', () => {
    it('should create a ticket successfully', async () => {
      const request = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high' as const,
        type: 'feature' as const,
      }

      const response = await sdk.tickets.create(request)

      expect(response).toEqual({
        id: expect.any(String),
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        type: 'feature',
        privacy: 'local-only',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('should get all tickets', async () => {
      // Create a test ticket first
      await sdk.tickets.create({
        title: 'Test Ticket',
        description: 'Test Description',
      })

      const tickets = await sdk.tickets.getAll()

      expect(tickets).toHaveLength(1)
      expect(tickets[0]).toEqual({
        id: expect.any(String),
        title: 'Test Ticket',
        status: 'pending',
        priority: 'medium',
        type: 'task',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('should get ticket by ID', async () => {
      // Create a test ticket first
      const created = await sdk.tickets.create({
        title: 'Test Ticket',
        description: 'Test Description',
      })

      const found = await sdk.tickets.getById(created.id)

      expect(found).toEqual(created)
    })

    it('should return null for non-existent ticket', async () => {
      const found = await sdk.tickets.getById('12345678')

      expect(found).toBeNull()
    })

    it('should update a ticket', async () => {
      // Create a test ticket first
      const created = await sdk.tickets.create({
        title: 'Original Title',
        description: 'Original Description',
      })

      const updated = await sdk.tickets.update({
        id: created.id,
        title: 'Updated Title',
        priority: 'high',
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.priority).toBe('high')
      expect(updated.description).toBe('Original Description') // Should remain unchanged
    })

    it('should update ticket status', async () => {
      // Create a test ticket first
      const created = await sdk.tickets.create({
        title: 'Test Ticket',
        description: 'Test Description',
      })

      const updated = await sdk.tickets.updateStatus(created.id, 'in_progress')

      expect(updated.status).toBe('in_progress')
    })

    it('should delete a ticket', async () => {
      // Create a test ticket first
      const created = await sdk.tickets.create({
        title: 'Test Ticket',
        description: 'Test Description',
      })

      await sdk.tickets.delete(created.id)

      const found = await sdk.tickets.getById(created.id)
      expect(found).toBeNull()
    })

    it('should search tickets', async () => {
      // Create test tickets
      await sdk.tickets.create({
        title: 'Bug Report',
        description: 'Critical bug',
        type: 'bug',
        priority: 'high',
      })
      await sdk.tickets.create({
        title: 'Feature Request',
        description: 'New feature',
        type: 'feature',
        priority: 'medium',
      })

      const bugTickets = await sdk.tickets.search({
        type: 'bug',
      })

      expect(bugTickets).toHaveLength(1)
      expect(bugTickets[0]?.title).toBe('Bug Report')
    })

    it('should get ticket statistics', async () => {
      // Create test tickets with different statuses
      await sdk.tickets.create({
        title: 'Pending Ticket',
        description: 'Test',
      })
      const inProgress = await sdk.tickets.create({
        title: 'In Progress Ticket',
        description: 'Test',
      })
      await sdk.tickets.updateStatus(inProgress.id, 'in_progress')

      const stats = await sdk.tickets.getStats()

      expect(stats.total).toBe(2)
      expect(stats.pending).toBe(1)
      expect(stats.inProgress).toBe(1)
    })
  })

  describe('repository', () => {
    it('should provide access to ticket repository', () => {
      const repository = sdk.repository.getTicketRepository()

      expect(repository).toBeDefined()
      expect(typeof repository.save).toBe('function')
      expect(typeof repository.findById).toBe('function')
    })
  })

  describe('configuration', () => {
    it('should throw error for unimplemented configuration methods', async () => {
      await expect(sdk.configuration.get()).rejects.toThrow(
        'Configuration management not yet implemented'
      )
      await expect(sdk.configuration.update({})).rejects.toThrow(
        'Configuration management not yet implemented'
      )
    })
  })
})
