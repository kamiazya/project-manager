import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../../application/repositories/ticket-repository.ts'
import { CreateTicket } from '../../application/usecases/create-ticket.ts'
import { createContainer, getContainer, resetContainer } from './inversify.config.ts'
import { TYPES } from './types.ts'

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
      expect(container.isBound(TicketRepositorySymbol)).toBe(true)
      expect(container.isBound(TYPES.CreateTicketUseCase)).toBe(true)
    })

    it('should create container without storage path', () => {
      const container = createContainer()

      expect(container.isBound(TYPES.StoragePath)).toBe(false)
      expect(container.isBound(TicketRepositorySymbol)).toBe(true)
      expect(container.isBound(TYPES.CreateTicketUseCase)).toBe(true)
    })

    it('should resolve TicketRepository correctly', () => {
      const container = createContainer(tempFilePath)
      const repository = container.get<TicketRepository>(TicketRepositorySymbol)

      expect(repository).toBeDefined()
      expect(typeof repository.save).toBe('function')
      expect(typeof repository.findById).toBe('function')
    })

    it('should resolve CreateTicketUseCase correctly', () => {
      const container = createContainer(tempFilePath)
      const useCase = container.get<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)

      expect(useCase).toBeDefined()
      expect(typeof useCase.execute).toBe('function')
    })

    it('should use singleton scope for services', () => {
      const container = createContainer(tempFilePath)

      const repository1 = container.get<TicketRepository>(TicketRepositorySymbol)
      const repository2 = container.get<TicketRepository>(TicketRepositorySymbol)
      expect(repository1).toBe(repository2)

      const useCase1 = container.get<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)
      const useCase2 = container.get<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)
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
      const useCase = container.get<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)

      const { CreateTicket } = await import('../../application/usecases/create-ticket.ts')
      const request = new CreateTicket.Request(
        'Test Ticket',
        'Test Description',
        'high',
        'task',
        'local-only'
      )

      const response = await useCase.execute(request)

      expect(response.id).toBeTruthy()
      expect(response.title).toBe('Test Ticket')
      expect(response.priority).toBe('high')
    })
  })
})
