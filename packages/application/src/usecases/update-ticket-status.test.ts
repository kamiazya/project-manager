import { Ticket, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNotFoundError } from '../common/errors/application-errors.ts'
import { VALID_ULID_1 } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { UpdateTicketStatus } from './update-ticket-status.ts'

describe('UpdateTicketStatus', () => {
  let mockTicketRepository: TicketRepository
  let updateTicketStatusUseCase: UpdateTicketStatus.UseCase
  let validTicketId: string
  let existingTicket: Ticket

  beforeEach(() => {
    validTicketId = VALID_ULID_1
    const testTicketId = TicketId.create(VALID_ULID_1)
    existingTicket = Ticket.create(testTicketId, {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      type: 'task',
      status: 'pending',
    })

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

    updateTicketStatusUseCase = new UpdateTicketStatus.UseCase(mockTicketRepository)
    updateTicketStatusUseCase.logger = mockLogger as any
  })

  describe('Request DTO', () => {
    it('should create request with ticket ID and new status', () => {
      const request: UpdateTicketStatus.Request = {
        identifier: validTicketId,
        newStatus: 'in_progress',
      }

      expect(request.identifier).toBe(validTicketId)
      expect(request.newStatus).toBe('in_progress')
    })
  })

  describe('UseCase - Happy Path', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    it('should update ticket status from pending to in_progress', async () => {
      const request: UpdateTicketStatus.Request = {
        identifier: validTicketId,
        newStatus: 'in_progress',
      }

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('in_progress')
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: validTicketId })
      )
      expect(mockTicketRepository.save).toHaveBeenCalledWith(existingTicket)
    })

    it('should throw TicketNotFoundError when ticket does not exist', async () => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      const request: UpdateTicketStatus.Request = {
        identifier: validTicketId,
        newStatus: 'in_progress',
      }

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })
  })
})
