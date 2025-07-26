import type { AliasGenerator } from '@project-manager/domain'
import { Ticket, TicketValidationError } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VALID_ULID_1, VALID_ULID_2 } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { IdGenerator } from '../services/id-generator.interface.ts'
import { CreateTicket } from './create-ticket.ts'

describe('CreateTicket', () => {
  let mockTicketRepository: TicketRepository
  let mockIdGenerator: IdGenerator
  let mockAliasGenerator: AliasGenerator
  let createTicketUseCase: CreateTicket.UseCase

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      queryTickets: vi.fn(),
      delete: vi.fn(),
      findByAlias: vi.fn().mockResolvedValue(null), // No existing aliases by default
      isAliasAvailable: vi.fn(),
      getAllAliases: vi.fn(),
      findTicketsWithAliases: vi.fn(),
    }
    mockIdGenerator = {
      generateId: vi.fn().mockReturnValue(VALID_ULID_1),
    }
    mockAliasGenerator = {
      generate: vi.fn().mockReturnValue('ticket-abc123'),
    }

    const mockLogger = {
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      child: vi.fn().mockReturnThis(),
      flush: vi.fn().mockResolvedValue(undefined),
    }

    createTicketUseCase = new CreateTicket.UseCase(
      mockTicketRepository,
      mockIdGenerator,
      mockAliasGenerator
    )
    createTicketUseCase.logger = mockLogger as any
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
      // Configure the mock to return different values for different calls
      vi.mocked(mockIdGenerator.generateId)
        .mockReturnValueOnce(VALID_ULID_1)
        .mockReturnValueOnce(VALID_ULID_2)

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
      // Allow for small time differences due to processing
      const createdTime = new Date(response.createdAt).getTime()
      const updatedTime = new Date(response.updatedAt).getTime()
      expect(Math.abs(createdTime - updatedTime)).toBeLessThan(100) // Less than 100ms difference
    })

    it('should generate and set canonical alias', async () => {
      const request: CreateTicket.Request = {
        title: 'Test ticket with alias',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Test description',
      }

      await createTicketUseCase.execute(request)

      // Verify alias generator was called
      expect(mockAliasGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          value: VALID_ULID_1,
        })
      )

      // Verify alias check was performed
      expect(mockTicketRepository.findByAlias).toHaveBeenCalledWith('ticket-abc123')

      // Verify ticket was saved with alias
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aliases: expect.objectContaining({
            canonical: expect.objectContaining({
              value: 'ticket-abc123',
              type: 'canonical',
            }),
          }),
        })
      )
    })

    it('should handle alias collision by retrying', async () => {
      // Create a mock existing ticket
      const mockExistingTicket = {
        id: { equals: vi.fn().mockReturnValue(false), value: VALID_ULID_2 },
      } as any

      // First call returns existing ticket, second call returns null
      vi.mocked(mockTicketRepository.findByAlias)
        .mockResolvedValueOnce(mockExistingTicket) // Collision on first attempt
        .mockResolvedValueOnce(null) // Success on second attempt

      vi.mocked(mockAliasGenerator.generate)
        .mockReturnValueOnce('ticket-abc123') // First attempt
        .mockReturnValueOnce('ticket-def456') // Second attempt

      const request: CreateTicket.Request = {
        title: 'Test',
        priority: 'medium',
        type: 'task',
        status: 'pending',
        description: 'Test description',
      }

      await createTicketUseCase.execute(request)

      // Verify alias generator was called twice
      expect(mockAliasGenerator.generate).toHaveBeenCalledTimes(2)

      // Verify both aliases were checked
      expect(mockTicketRepository.findByAlias).toHaveBeenCalledWith('ticket-abc123')
      expect(mockTicketRepository.findByAlias).toHaveBeenCalledWith('ticket-def456')

      // Verify ticket was saved with the second (non-colliding) alias
      expect(mockTicketRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          aliases: expect.objectContaining({
            canonical: expect.objectContaining({
              value: 'ticket-def456',
            }),
          }),
        })
      )
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
