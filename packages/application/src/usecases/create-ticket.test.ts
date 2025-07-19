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
        'Users cannot login with email',
        'high',
        'bug',
        'pending'
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
        'Users cannot login with email',
        'medium',
        'task',
        'pending'
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
        'Users cannot login with email',
        'high',
        'bug',
        'pending'
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
        'Description 1',
        'medium',
        'task',
        'pending'
      )
      const request2 = new CreateTicket.Request(
        'Ticket 2',
        'Description 2',
        'medium',
        'task',
        'pending'
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
        'Test description',
        'medium',
        'task',
        'pending'
      )

      const response = await createTicketUseCase.execute(request)

      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
      expect(response.createdAt).toBe(response.updatedAt)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for empty title', async () => {
      const request = new CreateTicket.Request('', 'Valid description', 'medium', 'task', 'pending')

      await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error for empty description', async () => {
      const request = new CreateTicket.Request('Valid title', '', 'medium', 'task', 'pending')

      await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('Repository Integration', () => {
    it('should handle repository save errors', async () => {
      mockTicketRepository.save = vi.fn().mockRejectedValue(new Error('Database error'))

      const request = new CreateTicket.Request(
        'Test ticket',
        'Test description',
        'medium',
        'task',
        'pending'
      )

      await expect(createTicketUseCase.execute(request)).rejects.toThrow('Database error')
    })
  })
})
