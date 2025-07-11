import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.js'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import { GetTicketByIdRequest } from '../dtos/requests/get-ticket-by-id.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'
import { GetTicketByIdUseCase } from './get-ticket-by-id.js'

describe('GetTicketByIdUseCase', () => {
  let useCase: GetTicketByIdUseCase
  let mockTicketRepository: TicketRepository

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }
    useCase = new GetTicketByIdUseCase(mockTicketRepository)
  })

  describe('execute', () => {
    it('should return ticket when found', async () => {
      // Arrange
      const ticketId = '12345678' // 8 hex characters
      const request = new GetTicketByIdRequest(ticketId)
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
      const request = new GetTicketByIdRequest(ticketId)

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
      const request = new GetTicketByIdRequest(ticketId)

      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      // Act
      await useCase.execute(request)

      // Assert
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
    })
  })
})
