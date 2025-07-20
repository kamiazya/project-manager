import { Ticket } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNotFoundError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { UpdateTicketStatus } from './update-ticket-status.ts'

describe('UpdateTicketStatus', () => {
  let mockTicketRepository: TicketRepository
  let updateTicketStatusUseCase: UpdateTicketStatus.UseCase
  let validTicketId: string
  let existingTicket: Ticket

  beforeEach(() => {
    validTicketId = '12345678'
    existingTicket = Ticket.create({
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      status: 'pending',
      type: 'task',
    })

    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllWithFilters: vi.fn(),
      searchTickets: vi.fn(),
      delete: vi.fn(),
    }

    updateTicketStatusUseCase = new UpdateTicketStatus.UseCase(mockTicketRepository)
  })

  describe('Request DTO', () => {
    it('should create request with ticket ID and new status', () => {
      const request = { id: validTicketId, newStatus: 'in_progress' } as UpdateTicketStatus.Request

      expect(request.id).toBe(validTicketId)
      expect(request.newStatus).toBe('in_progress')
    })
  })

  describe('UseCase - Happy Path', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    it('should update ticket status from pending to in_progress', async () => {
      const request = { id: validTicketId, newStatus: 'in_progress' } as UpdateTicketStatus.Request

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('in_progress')
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: validTicketId })
      )
      expect(mockTicketRepository.save).toHaveBeenCalledWith(existingTicket)
    })

    it('should throw TicketNotFoundError when ticket does not exist', async () => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

      const request = { id: validTicketId, newStatus: 'in_progress' } as UpdateTicketStatus.Request

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })
  })
})
