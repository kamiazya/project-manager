import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.ts'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { GetTicketById } from './get-ticket-by-id.ts'

describe('GetTicketByIdUseCase', () => {
  let useCase: GetTicketById.UseCase
  let mockTicketRepository: TicketRepository

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }
    useCase = new GetTicketById.UseCase(mockTicketRepository)
  })

  describe('execute', () => {
    it('should return ticket when found', async () => {
      // Arrange
      const ticketId = '12345678' // 8 hex characters
      const request = new GetTicketById.Request(ticketId)
      const mockTicket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        type: 'task',
        privacy: 'local-only',
      })

      vi.mocked(mockTicketRepository.findById).mockResolvedValue(mockTicket)

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeDefined()
      expect(result!.title).toBe('Test Ticket')
      expect(result!.description).toBe('Test Description')
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
    })

    it('should return null when ticket not found', async () => {
      // Arrange
      const ticketId = '87654321' // 8 hex characters
      const request = new GetTicketById.Request(ticketId)

      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeNull()
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
    })

    it('should call repository with correct TicketId', async () => {
      // Arrange
      const ticketId = '12345678' // 8 hex characters
      const request = new GetTicketById.Request(ticketId)

      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      // Act
      await useCase.execute(request)

      // Assert
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
    })
  })
})
