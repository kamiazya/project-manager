import { Ticket } from '@project-manager/domain'
import { TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { UpdateTicket } from './update-ticket.ts'

describe('UpdateTicketUseCase', () => {
  let useCase: UpdateTicket.UseCase
  let mockRepository: TicketRepository
  let testTicket: Ticket

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }
    useCase = new UpdateTicket.UseCase(mockRepository)

    testTicket = Ticket.create({
      title: 'Original Title',
      description: 'Original Description',
      priority: 'medium',
      status: 'pending',
      type: 'task',
      privacy: 'local-only',
    })
  })

  describe('execute', () => {
    it('should throw TicketValidationError when no updates are provided', async () => {
      const request = new UpdateTicket.Request('test-id', {})

      await expect(useCase.execute(request)).rejects.toThrow(TicketValidationError)
      await expect(useCase.execute(request)).rejects.toThrow(
        'At least one field must be provided for update'
      )
    })

    it('should throw TicketNotFoundError when ticket does not exist', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const request = new UpdateTicket.Request('abc12345', { title: 'New Title' })

      await expect(useCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(useCase.execute(request)).rejects.toThrow('Ticket not found: abc12345')
    })

    it('should update title only when title is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicket.Request(testTicket.id.value, { title: 'New Title' })
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('New Title')
      expect(testTicket.description.value).toBe('Original Description')
      expect(testTicket.priority.value).toBe('medium')
      expect(testTicket.status.value).toBe('pending')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.title).toBe('New Title')
    })

    it('should update description only when description is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicket.Request(testTicket.id.value, {
        description: 'New Description',
      })
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('Original Title')
      expect(testTicket.description.value).toBe('New Description')
      expect(testTicket.priority.value).toBe('medium')
      expect(testTicket.status.value).toBe('pending')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.description).toBe('New Description')
    })

    it('should update status only when status is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicket.Request(testTicket.id.value, { status: 'in_progress' })
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('Original Title')
      expect(testTicket.description.value).toBe('Original Description')
      expect(testTicket.priority.value).toBe('medium')
      expect(testTicket.status.value).toBe('in_progress')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.status).toBe('in_progress')
    })

    it('should update priority only when priority is provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicket.Request(testTicket.id.value, { priority: 'high' })
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('Original Title')
      expect(testTicket.description.value).toBe('Original Description')
      expect(testTicket.priority.value).toBe('high')
      expect(testTicket.status.value).toBe('pending')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.priority).toBe('high')
    })

    it('should update multiple fields when multiple fields are provided', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicket.Request(testTicket.id.value, {
        title: 'New Title',
        description: 'New Description',
        status: 'in_progress',
        priority: 'high',
      })
      const result = await useCase.execute(request)

      expect(testTicket.title.value).toBe('New Title')
      expect(testTicket.description.value).toBe('New Description')
      expect(testTicket.priority.value).toBe('high')
      expect(testTicket.status.value).toBe('in_progress')
      expect(mockRepository.save).toHaveBeenCalledWith(testTicket)
      expect(result.title).toBe('New Title')
      expect(result.description).toBe('New Description')
      expect(result.status).toBe('in_progress')
      expect(result.priority).toBe('high')
    })

    it('should perform only one fetch and one save operation', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const request = new UpdateTicket.Request(testTicket.id.value, {
        title: 'New Title',
        description: 'New Description',
        status: 'in_progress',
        priority: 'high',
      })
      await useCase.execute(request)

      expect(mockRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should call domain methods that include validation', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      const titleSpy = vi.spyOn(testTicket, 'updateTitle')
      const descriptionSpy = vi.spyOn(testTicket, 'updateDescription')
      const statusSpy = vi.spyOn(testTicket, 'changeStatus')
      const prioritySpy = vi.spyOn(testTicket, 'changePriority')

      const request = new UpdateTicket.Request(testTicket.id.value, {
        title: 'New Title',
        description: 'New Description',
        status: 'in_progress',
        priority: 'high',
      })
      await useCase.execute(request)

      expect(titleSpy).toHaveBeenCalledWith('New Title')
      expect(descriptionSpy).toHaveBeenCalledWith('New Description')
      expect(statusSpy).toHaveBeenCalledWith('in_progress')
      expect(prioritySpy).toHaveBeenCalledWith('high')
    })

    it('should propagate domain validation errors', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(testTicket)

      // This will throw because tickets cannot transition from pending to completed
      const request = new UpdateTicket.Request(testTicket.id.value, { status: 'completed' })

      await expect(useCase.execute(request)).rejects.toThrow(
        'Cannot transition from pending to completed'
      )
    })
  })

  describe('UpdateTicketRequest', () => {
    it('should return false for hasUpdates when no fields are provided', () => {
      const request = new UpdateTicket.Request('test-id', {})
      expect(request.hasUpdates()).toBe(false)
    })

    it('should return true for hasUpdates when at least one field is provided', () => {
      const request = new UpdateTicket.Request('test-id', { title: 'New Title' })
      expect(request.hasUpdates()).toBe(true)
    })
  })
})
