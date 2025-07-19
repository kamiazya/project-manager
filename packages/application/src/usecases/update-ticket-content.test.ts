import { Ticket } from '@project-manager/domain'
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
      findAll: vi.fn(),
      findAllWithFilters: vi.fn(),
      searchTickets: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new UpdateTicketContent.UseCase(mockRepository)

    testTicket = Ticket.create({
      title: 'Original Title',
      description: 'Original Description',
      priority: 'medium',
      status: 'pending',
      type: 'task',
    })
  })

  describe('execute', () => {
    it('should throw TicketValidationError when no updates are provided', async () => {
      const request = new UpdateTicketContent.Request('test-id', {})

      await expect(useCase.execute(request)).rejects.toThrow(TicketValidationError)
      await expect(useCase.execute(request)).rejects.toThrow(
        'At least one field must be provided for update'
      )
    })

    it('should throw TicketNotFoundError when ticket does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const request = new UpdateTicketContent.Request('abc12345', { title: 'New Title' })

      await expect(useCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(useCase.execute(request)).rejects.toThrow("Ticket with ID 'abc12345' not found")
    })

    it('should update title only when title is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicketContent.Request(testTicket.id.value, { title: 'New Title' })
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

      const request = new UpdateTicketContent.Request(testTicket.id.value, {
        description: 'New Description',
      })
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

      const request = new UpdateTicketContent.Request(testTicket.id.value, {
        title: 'New Title',
        description: 'New Description',
      })
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

      const request = new UpdateTicketContent.Request(testTicket.id.value, {
        title: 'New Title',
        description: 'New Description',
      })
      await useCase.execute(request)

      expect(mockRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should call domain methods that include validation', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const titleSpy = vi.spyOn(testTicket, 'updateTitle')
      const descriptionSpy = vi.spyOn(testTicket, 'updateDescription')

      const request = new UpdateTicketContent.Request(testTicket.id.value, {
        title: 'New Title',
        description: 'New Description',
      })
      await useCase.execute(request)

      expect(titleSpy).toHaveBeenCalledWith('New Title')
      expect(descriptionSpy).toHaveBeenCalledWith('New Description')
    })

    it('should not call domain method when field is not provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const titleSpy = vi.spyOn(testTicket, 'updateTitle')
      const descriptionSpy = vi.spyOn(testTicket, 'updateDescription')

      const request = new UpdateTicketContent.Request(testTicket.id.value, {
        title: 'New Title',
      })
      await useCase.execute(request)

      expect(titleSpy).toHaveBeenCalledWith('New Title')
      expect(descriptionSpy).not.toHaveBeenCalled()
    })
  })

  describe('UpdateTicketContentRequest', () => {
    it('should return false for hasUpdates when no fields are provided', () => {
      const request = new UpdateTicketContent.Request('test-id', {})
      expect(request.hasUpdates()).toBe(false)
    })

    it('should return true for hasUpdates when title is provided', () => {
      const request = new UpdateTicketContent.Request('test-id', { title: 'New Title' })
      expect(request.hasUpdates()).toBe(true)
    })

    it('should return true for hasUpdates when description is provided', () => {
      const request = new UpdateTicketContent.Request('test-id', { description: 'New Description' })
      expect(request.hasUpdates()).toBe(true)
    })
  })
})
