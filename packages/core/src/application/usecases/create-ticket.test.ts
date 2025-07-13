import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.ts'
import { CreateTicketRequest } from '../dtos/requests/create-ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { CreateTicketUseCase } from './create-ticket.ts'

describe('CreateTicketUseCase', () => {
  let useCase: CreateTicketUseCase
  let mockTicketRepository: TicketRepository

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }
    useCase = new CreateTicketUseCase(mockTicketRepository)
  })

  describe('execute', () => {
    it('should create a ticket with valid data', async () => {
      // Arrange
      const request = new CreateTicketRequest(
        'Test Ticket',
        'Test Description',
        'high',
        'feature',
        'local-only'
      )

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeDefined()
      expect(result.title).toBe('Test Ticket')
      expect(result.description).toBe('Test Description')
      expect(result.priority).toBe('high')
      expect(result.type).toBe('feature')
      expect(result.privacy).toBe('local-only')
      expect(result.status).toBe('pending')
      expect(mockTicketRepository.save).toHaveBeenCalledWith(expect.any(Ticket))
    })

    it('should create a ticket with default values', async () => {
      // Arrange
      const request = new CreateTicketRequest('Test Ticket', 'Test Description')

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeDefined()
      expect(result.title).toBe('Test Ticket')
      expect(result.description).toBe('Test Description')
      expect(result.priority).toBe('medium')
      expect(result.type).toBe('task')
      expect(result.privacy).toBe('local-only')
      expect(result.status).toBe('pending')
      expect(mockTicketRepository.save).toHaveBeenCalledWith(expect.any(Ticket))
    })

    it('should call repository save method', async () => {
      // Arrange
      const request = new CreateTicketRequest('Test Ticket', 'Test Description')

      // Act
      await useCase.execute(request)

      // Assert
      expect(mockTicketRepository.save).toHaveBeenCalledTimes(1)
    })
  })
})
