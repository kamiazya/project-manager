import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ITicketRepository } from '../ports/ticket-repository.js'
import { TicketUseCase } from '../usecases/ticket-usecase.js'
import { createContainer, getContainer, resetContainer } from './inversify.config.js'
import { TYPES } from './types.js'

describe('Inversify Container Configuration', () => {
  let tempDir: string
  let tempFilePath: string

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDir = await mkdtemp(join(tmpdir(), 'pm-container-test-'))
    tempFilePath = join(tempDir, 'test-tickets.json')

    // Reset container state
    resetContainer()
  })

  afterEach(async () => {
    // Clean up temporary directory
    await rm(tempDir, { recursive: true, force: true })
    resetContainer()
  })

  describe('createContainer', () => {
    it('should create container with all bindings', () => {
      const container = createContainer(tempFilePath)

      expect(container.isBound(TYPES.StoragePath)).toBe(true)
      expect(container.isBound(TYPES.TicketRepository)).toBe(true)
      expect(container.isBound(TYPES.TicketUseCase)).toBe(true)
    })

    it('should create container without storage path', () => {
      const container = createContainer()

      expect(container.isBound(TYPES.StoragePath)).toBe(false)
      expect(container.isBound(TYPES.TicketRepository)).toBe(true)
      expect(container.isBound(TYPES.TicketUseCase)).toBe(true)
    })

    it('should resolve TicketRepository correctly', () => {
      const container = createContainer(tempFilePath)
      const repository = container.get<ITicketRepository>(TYPES.TicketRepository)

      expect(repository).toBeDefined()
      expect(typeof repository.save).toBe('function')
      expect(typeof repository.findById).toBe('function')
    })

    it('should resolve TicketUseCase correctly', () => {
      const container = createContainer(tempFilePath)
      const useCase = container.get<TicketUseCase>(TYPES.TicketUseCase)

      expect(useCase).toBeDefined()
      expect(typeof useCase.createTicket).toBe('function')
      expect(typeof useCase.getTicketById).toBe('function')
    })

    it('should use singleton scope for services', () => {
      const container = createContainer(tempFilePath)

      const repository1 = container.get<ITicketRepository>(TYPES.TicketRepository)
      const repository2 = container.get<ITicketRepository>(TYPES.TicketRepository)
      expect(repository1).toBe(repository2)

      const useCase1 = container.get<TicketUseCase>(TYPES.TicketUseCase)
      const useCase2 = container.get<TicketUseCase>(TYPES.TicketUseCase)
      expect(useCase1).toBe(useCase2)
    })
  })

  describe('getContainer', () => {
    it('should return the same container instance', () => {
      const container1 = getContainer(tempFilePath)
      const container2 = getContainer(tempFilePath)

      expect(container1).toBe(container2)
    })

    it('should use provided storage path', () => {
      const container = getContainer(tempFilePath)
      const storagePath = container.get<string>(TYPES.StoragePath)

      expect(storagePath).toBe(tempFilePath)
    })
  })

  describe('resetContainer', () => {
    it('should reset container state', () => {
      const container1 = getContainer(tempFilePath)
      resetContainer()
      const container2 = getContainer(tempFilePath)

      expect(container1).not.toBe(container2)
    })
  })

  describe('Integration', () => {
    it('should create and use ticket through the container', async () => {
      const container = createContainer(tempFilePath)
      const useCase = container.get<TicketUseCase>(TYPES.TicketUseCase)

      const ticketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high' as const,
      }

      const ticket = await useCase.createTicket(ticketData)

      expect(ticket.id.value).toBeTruthy()
      expect(ticket.title.value).toBe('Test Ticket')
      expect(ticket.priority.value).toBe('high')
    })
  })
})
