import { Ticket, TicketValidationError } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { CreateTicket } from './create-ticket.ts'

describe('CreateTicket', () => {
  let mockTicketRepository: TicketRepository
  let createTicketUseCase: CreateTicket.UseCase

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllWithFilters: vi.fn(),
      searchTickets: vi.fn(),
      delete: vi.fn(),
    }
    createTicketUseCase = new CreateTicket.UseCase(mockTicketRepository)
  })

  describe('Request DTO', () => {
    it('should create request with all fields', () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'high',
        'bug',
        'pending',
        'Users cannot login with email'
      )

      expect(request.title).toBe('Fix login bug')
      expect(request.description).toBe('Users cannot login with email')
      expect(request.priority).toBe('high')
      expect(request.type).toBe('bug')
      expect(request.status).toBe('pending')
    })

    it('should convert to CreateTicketData', () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'medium',
        'task',
        'pending',
        'Users cannot login with email'
      )

      const createData = request.toCreateTicketData()

      expect(createData.title).toBe('Fix login bug')
      expect(createData.description).toBe('Users cannot login with email')
      expect(createData.priority).toBe('medium')
      expect(createData.type).toBe('task')
      expect(createData.status).toBe('pending')
    })
  })

  describe('UseCase - Happy Path', () => {
    it('should create ticket with valid data', async () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'high',
        'bug',
        'pending',
        'Users cannot login with email'
      )

      const response = await createTicketUseCase.execute(request)

      expect(response.id).toBeDefined()
      expect(response.title).toBe('Fix login bug')
      expect(response.description).toBe('Users cannot login with email')
      expect(response.priority).toBe('high')
      expect(response.type).toBe('bug')
      expect(response.status).toBe('pending')
      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
      expect(mockTicketRepository.save).toHaveBeenCalledWith(expect.any(Ticket))
    })

    it('should generate unique IDs for multiple tickets', async () => {
      const request1 = new CreateTicket.Request(
        'Ticket 1',
        'medium',
        'task',
        'pending',
        'Description 1'
      )
      const request2 = new CreateTicket.Request(
        'Ticket 2',
        'medium',
        'task',
        'pending',
        'Description 2'
      )

      const response1 = await createTicketUseCase.execute(request1)
      const response2 = await createTicketUseCase.execute(request2)

      expect(response1.id).toBeDefined()
      expect(response2.id).toBeDefined()
      expect(response1.id).not.toBe(response2.id)
    })

    it('should set creation and update timestamps', async () => {
      const request = new CreateTicket.Request(
        'Test',
        'medium',
        'task',
        'pending',
        'Test description'
      )

      const response = await createTicketUseCase.execute(request)

      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
      expect(response.createdAt).toBe(response.updatedAt)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for empty title', async () => {
      const request = new CreateTicket.Request('', 'medium', 'task', 'pending', 'Valid description')

      await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })

    it('should handle newlines and tabs in description', async () => {
      const descriptionWithFormatting = `Line 1
Line 2	Tabbed content`
      const request = new CreateTicket.Request(
        'Valid title',
        'medium',
        'task',
        'pending',
        descriptionWithFormatting
      )

      const response = await createTicketUseCase.execute(request)

      expect(response.description).toBe(descriptionWithFormatting)
      expect(mockTicketRepository.save).toHaveBeenCalled()
    })
  })

  describe('Repository Integration', () => {
    it('should handle repository save errors', async () => {
      mockTicketRepository.save = vi.fn().mockRejectedValue(new Error('Database error'))

      const request = new CreateTicket.Request(
        'Test ticket',
        'medium',
        'task',
        'pending',
        'Test description'
      )

      await expect(createTicketUseCase.execute(request)).rejects.toThrow('Database error')
    })
  })
})
