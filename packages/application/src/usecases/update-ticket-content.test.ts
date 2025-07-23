import { Ticket, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { UpdateTicketContent } from './update-ticket-content.ts'

describe('UpdateTicketContentUseCase', () => {
  let useCase: UpdateTicketContent.UseCase
  let mockRepository: TicketRepository
  let testTicket: Ticket

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      queryTickets: vi.fn(),
      delete: vi.fn(),
    }

    const mockLogger = {
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      child: vi.fn().mockReturnThis(),
      flush: vi.fn().mockResolvedValue(undefined),
    }

    useCase = new UpdateTicketContent.UseCase(mockRepository)
    useCase.logger = mockLogger as any

    const testTicketId = TicketId.create('12345678')
    testTicket = Ticket.create(testTicketId, {
      title: 'Original Title',
      description: 'Original Description',
      priority: 'medium',
      type: 'task',
      status: 'pending',
    })
  })

  describe('execute', () => {
    it('should throw TicketValidationError when no updates are provided', async () => {
      const request: UpdateTicketContent.Request = {
        id: 'test-id',
        updates: {},
      }

      await expect(useCase.execute(request)).rejects.toThrow(TicketValidationError)
      await expect(useCase.execute(request)).rejects.toThrow(
        'At least one field must be provided for update'
      )
    })

    it('should throw TicketNotFoundError when ticket does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const request: UpdateTicketContent.Request = {
        id: 'abc12345',
        updates: { title: 'New Title' },
      }

      await expect(useCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(useCase.execute(request)).rejects.toThrow("Ticket with ID 'abc12345' not found")
    })

    it('should update title only when title is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request: UpdateTicketContent.Request = {
        id: testTicket.id.value,
        updates: { title: 'New Title' },
      }
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('New Title')
      expect(testTicket.description?.value).toBe('Original Description')
      expect(testTicket.priority).toBe('medium')
      expect(testTicket.status).toBe('pending')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.title).toBe('New Title')
    })

    it('should update description only when description is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request: UpdateTicketContent.Request = {
        id: testTicket.id.value,
        updates: {
          description: 'New Description',
        },
      }
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('Original Title')
      expect(testTicket.description?.value).toBe('New Description')
      expect(testTicket.priority).toBe('medium')
      expect(testTicket.status).toBe('pending')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.description).toBe('New Description')
    })

    it('should update both title and description when both are provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request: UpdateTicketContent.Request = {
        id: testTicket.id.value,
        updates: {
          title: 'New Title',
          description: 'New Description',
        },
      }
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('New Title')
      expect(testTicket.description?.value).toBe('New Description')
      expect(testTicket.priority).toBe('medium')
      expect(testTicket.status).toBe('pending')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.title).toBe('New Title')
      expect(result.description).toBe('New Description')
    })

    it('should perform only one fetch and one save operation', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request: UpdateTicketContent.Request = {
        id: testTicket.id.value,
        updates: {
          title: 'New Title',
          description: 'New Description',
        },
      }
      await useCase.execute(request)

      expect(mockRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should call domain methods that include validation', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const titleSpy = vi.spyOn(testTicket, 'updateTitle')
      const descriptionSpy = vi.spyOn(testTicket, 'updateDescription')

      const request: UpdateTicketContent.Request = {
        id: testTicket.id.value,
        updates: {
          title: 'New Title',
          description: 'New Description',
        },
      }
      await useCase.execute(request)

      expect(titleSpy).toHaveBeenCalledWith('New Title')
      expect(descriptionSpy).toHaveBeenCalledWith('New Description')
    })

    it('should not call domain method when field is not provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const titleSpy = vi.spyOn(testTicket, 'updateTitle')
      const descriptionSpy = vi.spyOn(testTicket, 'updateDescription')

      const request: UpdateTicketContent.Request = {
        id: testTicket.id.value,
        updates: {
          title: 'New Title',
        },
      }
      await useCase.execute(request)

      expect(titleSpy).toHaveBeenCalledWith('New Title')
      expect(descriptionSpy).not.toHaveBeenCalled()
    })
  })

  describe('UpdateTicketContentRequest', () => {
    it('should validate that no updates are provided via request structure', () => {
      const request: UpdateTicketContent.Request = {
        id: 'test-id',
        updates: {},
      }
      // No updates provided - use case will validate this
      expect(Object.keys(request.updates)).toHaveLength(0)
    })

    it('should allow title updates via request structure', () => {
      const request: UpdateTicketContent.Request = {
        id: 'test-id',
        updates: { title: 'New Title' },
      }
      expect(request.updates.title).toBe('New Title')
      expect(request.updates.description).toBeUndefined()
    })

    it('should allow description updates via request structure', () => {
      const request: UpdateTicketContent.Request = {
        id: 'test-id',
        updates: { description: 'New Description' },
      }
      expect(request.updates.description).toBe('New Description')
      expect(request.updates.title).toBeUndefined()
    })
  })
})
