import type { Ticket } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { SearchTickets } from './search-tickets.ts'

describe('SearchTicketsUseCase', () => {
  let useCase: SearchTickets.UseCase
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

    const mockLogger = {
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      child: vi.fn().mockReturnThis(),
      flush: vi.fn().mockResolvedValue(undefined),
    }

    useCase = new SearchTickets.UseCase(mockTicketRepository)
    useCase.logger = mockLogger as any
  })

  describe('Request DTO', () => {
    it('should create request with all criteria', () => {
      const request: SearchTickets.Request = {
        criteria: {
          search: 'login',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          searchIn: ['title', 'description'],
          limit: 10,
          offset: 0,
        },
      }

      expect(request.criteria).toBeDefined()
      expect(request.criteria!.search).toBe('login')
      expect(request.criteria!.status).toBe('pending')
    })

    it('should create request with partial criteria', () => {
      const request: SearchTickets.Request = {
        criteria: {
          search: 'bug',
        },
      }

      expect(request.criteria!.search).toBe('bug')
    })

    it('should create request with empty criteria', () => {
      const request: SearchTickets.Request = {}

      expect(request.criteria).toBeUndefined()
    })
  })

  describe('Response DTO', () => {
    it('should create response from tickets array', () => {
      const mockTickets = [
        {
          id: { value: '1' },
          title: { value: 'Test ticket' },
          description: { value: 'Test description' },
          status: { value: 'pending' },
          priority: { value: 'high' },
          type: { value: 'bug' },
          aliases: { canonical: null, custom: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Ticket,
      ]

      const response = SearchTickets.Response.fromTickets(mockTickets)

      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]!.id).toBe('1')
      expect(response.tickets[0]!.title).toBe('Test ticket')
    })

    it('should handle empty tickets array', () => {
      const response = SearchTickets.Response.fromTickets([])

      expect(response.tickets).toEqual([])
    })
  })

  describe('execute', () => {
    it('should search tickets with all criteria', async () => {
      const mockTickets = [
        {
          id: { value: '1' },
          title: { value: 'Login bug' },
          description: { value: 'Users cannot login' },
          status: { value: 'pending' },
          priority: { value: 'high' },
          type: { value: 'bug' },
          aliases: { canonical: null, custom: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Ticket,
      ]

      vi.mocked(mockTicketRepository.queryTickets).mockResolvedValue(mockTickets)

      const request: SearchTickets.Request = {
        criteria: {
          search: 'login',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          searchIn: ['title', 'description'],
          limit: 10,
          offset: 0,
        },
      }

      const response = await useCase.execute(request)

      expect(mockTicketRepository.queryTickets).toHaveBeenCalledWith({
        status: 'pending',
        priority: 'high',
        type: 'bug',
        search: 'login',
        searchIn: ['title', 'description'],
        limit: 10,
        offset: 0,
      })
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0]!.title).toBe('Login bug')
    })

    it('should search tickets with no criteria (return all)', async () => {
      const mockTickets = [
        {
          id: { value: '1' },
          title: { value: 'Ticket 1' },
          status: { value: 'pending' },
          priority: { value: 'high' },
          type: { value: 'bug' },
          aliases: { canonical: null, custom: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Ticket,
        {
          id: { value: '2' },
          title: { value: 'Ticket 2' },
          status: { value: 'completed' },
          priority: { value: 'low' },
          type: { value: 'feature' },
          aliases: { canonical: null, custom: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Ticket,
      ]

      vi.mocked(mockTicketRepository.queryTickets).mockResolvedValue(mockTickets)

      const request: SearchTickets.Request = {}

      const response = await useCase.execute(request)

      expect(mockTicketRepository.queryTickets).toHaveBeenCalledWith({
        status: undefined,
        priority: undefined,
        type: undefined,
        search: undefined,
        searchIn: undefined,
        limit: undefined,
        offset: undefined,
      })
      expect(response.tickets).toHaveLength(2)
    })

    it('should handle empty search results', async () => {
      vi.mocked(mockTicketRepository.queryTickets).mockResolvedValue([])

      const request: SearchTickets.Request = {
        criteria: {
          search: 'nonexistent',
        },
      }

      const response = await useCase.execute(request)

      expect(response.tickets).toEqual([])
    })
  })
})
