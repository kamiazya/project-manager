import { type CreateTicketData, Ticket, TicketValidationError } from '@project-manager/domain'
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
      const request: CreateTicket.Request = {
        title: 'Fix login bug',
        priority: 'high',
        type: 'bug',
        status: 'pending',
        description: 'Users cannot login with email',
      }

      expect(request.title).toBe('Fix login bug')
      expect(request.description).toBe('Users cannot login with email')
      expect(request.priority).toBe('high')
      expect(request.type).toBe('bug')
      expect(request.status).toBe('pending')
    })

    it('should create request with plain object syntax', () => {
      const request: CreateTicket.Request = {
        title: 'Fix login bug',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Users cannot login with email',
      }

      expect(request.title).toBe('Fix login bug')
      expect(request.description).toBe('Users cannot login with email')
      expect(request.priority).toBe('medium')
      expect(request.type).toBe('task')
      expect(request.status).toBe('pending')
    })
  })

  describe('UseCase - Happy Path', () => {
    it('should create ticket with valid data', async () => {
      const request: CreateTicket.Request = {
        title: 'Fix login bug',
        priority: 'high',
        type: 'bug',
        status: 'pending',
        description: 'Users cannot login with email',
      }

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
      const request1: CreateTicket.Request = {
        title: 'Ticket 1',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Description 1',
      }
      const request2: CreateTicket.Request = {
        title: 'Ticket 2',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Description 2',
      }

      const response1 = await createTicketUseCase.execute(request1)
      const response2 = await createTicketUseCase.execute(request2)

      expect(response1.id).toBeDefined()
      expect(response2.id).toBeDefined()
      expect(response1.id).not.toBe(response2.id)
    })

    it('should set creation and update timestamps', async () => {
      const request: CreateTicket.Request = {
        title: 'Test',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Test description',
      }

      const response = await createTicketUseCase.execute(request)

      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
      expect(response.createdAt).toBe(response.updatedAt)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for empty title', async () => {
      const request: CreateTicket.Request = {
        title: '',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Valid description',
      }

      await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })

    it('should handle newlines and tabs in description', async () => {
      const descriptionWithFormatting = `Line 1
Line 2	Tabbed content`
      const request: CreateTicket.Request = {
        title: 'Valid title',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: descriptionWithFormatting,
      }

      const response = await createTicketUseCase.execute(request)

      expect(response.description).toBe(descriptionWithFormatting)
      expect(mockTicketRepository.save).toHaveBeenCalled()
    })
  })

  describe('Repository Integration', () => {
    it('should handle repository save errors', async () => {
      mockTicketRepository.save = vi.fn().mockRejectedValue(new Error('Database error'))

      const request: CreateTicket.Request = {
        title: 'Test ticket',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Test description',
      }

      await expect(createTicketUseCase.execute(request)).rejects.toThrow('Database error')
    })
  })
})
