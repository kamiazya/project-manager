import type { TicketSearchCriteria } from '@project-manager/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.js'
import { SearchTicketsRequest } from '../dtos/requests/search-tickets.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'
import { SearchTicketsUseCase } from './search-tickets.js'

describe('SearchTicketsUseCase', () => {
  let searchTicketsUseCase: SearchTicketsUseCase
  let mockTicketRepository: TicketRepository
  let sampleTickets: Ticket[]

  beforeEach(() => {
    // Create mock repository
    mockTicketRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }

    // Create use case with mock repository
    searchTicketsUseCase = new SearchTicketsUseCase(mockTicketRepository)

    // Create sample tickets for testing
    sampleTickets = [
      Ticket.reconstitute({
        id: '12345678',
        title: 'Fix login bug',
        description: 'Users cannot login with email',
        status: 'pending',
        priority: 'high',
        type: 'bug',
        privacy: 'local-only',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      }),
      Ticket.reconstitute({
        id: '87654321',
        title: 'Add new feature',
        description: 'Implement user dashboard',
        status: 'in_progress',
        priority: 'medium',
        type: 'feature',
        privacy: 'shareable',
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
      }),
      Ticket.reconstitute({
        id: 'abcdef01',
        title: 'Update documentation',
        description: 'Fix typos in README',
        status: 'completed',
        priority: 'low',
        type: 'task',
        privacy: 'public',
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
      }),
    ]

    vi.mocked(mockTicketRepository.findAll).mockResolvedValue(sampleTickets)
  })

  it('should return all tickets when no criteria provided', async () => {
    const criteria: TicketSearchCriteria = {}
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(3)
    expect(vi.mocked(mockTicketRepository.findAll)).toHaveBeenCalledTimes(1)
  })

  it('should filter tickets by status', async () => {
    const criteria: TicketSearchCriteria = { status: 'pending' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].status).toBe('pending')
  })

  it('should filter tickets by priority', async () => {
    const criteria: TicketSearchCriteria = { priority: 'high' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].priority).toBe('high')
  })

  it('should filter tickets by type', async () => {
    const criteria: TicketSearchCriteria = { type: 'feature' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].type).toBe('feature')
  })

  it('should filter tickets by privacy', async () => {
    const criteria: TicketSearchCriteria = { privacy: 'public' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    // Note: TicketSummary doesn't include privacy field, but filtering works correctly
    expect(response.tickets[0].title).toBe('Update documentation')
  })

  it('should filter tickets by text search in title', async () => {
    const criteria: TicketSearchCriteria = { search: 'login' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].title).toContain('login')
  })

  it('should filter tickets by text search in description', async () => {
    const criteria: TicketSearchCriteria = { search: 'dashboard' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].title).toContain('feature')
  })

  it('should perform case-insensitive search', async () => {
    const criteria: TicketSearchCriteria = { search: 'LOGIN' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].title.toLowerCase()).toContain('login')
  })

  it('should combine multiple criteria with AND logic', async () => {
    const criteria: TicketSearchCriteria = {
      status: 'pending',
      priority: 'high',
      type: 'bug',
    }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(1)
    expect(response.tickets[0].status).toBe('pending')
    expect(response.tickets[0].priority).toBe('high')
    expect(response.tickets[0].type).toBe('bug')
  })

  it('should return empty array when no tickets match criteria', async () => {
    const criteria: TicketSearchCriteria = { status: 'archived' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(0)
  })

  it('should handle empty search string', async () => {
    const criteria: TicketSearchCriteria = { search: '' }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(3)
  })

  it('should handle undefined search criteria gracefully', async () => {
    const criteria: TicketSearchCriteria = {
      status: undefined,
      priority: undefined,
      type: undefined,
      privacy: undefined,
      search: undefined,
    }
    const request = new SearchTicketsRequest(criteria)

    const response = await searchTicketsUseCase.execute(request)

    expect(response.tickets).toHaveLength(3)
  })
})
