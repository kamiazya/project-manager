import { Ticket, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VALID_ULID_1 } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { GetTicketById } from './get-ticket-by-id.ts'

describe('GetTicketByIdUseCase', () => {
  let useCase: GetTicketById.UseCase
  let mockTicketRepository: TicketRepository

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      queryTickets: vi.fn(),
      delete: vi.fn(),
      findByAlias: vi.fn(),
      isAliasAvailable: vi.fn(),
      getAllAliases: vi.fn(),
      findTicketsWithAliases: vi.fn(),
    }
    mockTicketRepository.queryTickets = vi.fn().mockResolvedValue([])

    const mockLogger = {
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      child: vi.fn().mockReturnThis(),
      flush: vi.fn().mockResolvedValue(undefined),
    }

    useCase = new GetTicketById.UseCase(mockTicketRepository)
    useCase.logger = mockLogger as any
  })

  describe('execute', () => {
    it('should return ticket when found', async () => {
      // Arrange
      const ticketId = VALID_ULID_1 // Valid ULID
      const request: GetTicketById.Request = { identifier: ticketId }
      const mockTicketId = TicketId.create(VALID_ULID_1)
      const mockTicket = Ticket.create(mockTicketId, {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        type: 'task',
        status: 'pending',
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
      const ticketId = VALID_ULID_1
      const request: GetTicketById.Request = { identifier: ticketId }

      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toBeNull()
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
    })

    it('should call repository with correct TicketId', async () => {
      // Arrange
      const ticketId = VALID_ULID_1
      const request: GetTicketById.Request = { identifier: ticketId }

      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      // Act
      await useCase.execute(request)

      // Assert
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
    })
  })
})
