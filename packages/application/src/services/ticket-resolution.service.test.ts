import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VALID_ULID_1, VALID_ULID_2, VALID_ULID_3 } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { TicketResolutionService } from './ticket-resolution.service.ts'

describe('TicketResolutionService', () => {
  let mockRepository: TicketRepository
  let service: TicketResolutionService
  let testTicket1: Ticket
  let testTicket2: Ticket

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      queryTickets: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
      findByAlias: vi.fn(),
      isAliasAvailable: vi.fn(),
      getAllAliases: vi.fn(),
      findTicketsWithAliases: vi.fn(),
    }

    service = new TicketResolutionService(mockRepository)

    // Create test tickets using valid ULIDs from test helpers
    const ticketId1 = TicketId.create(VALID_ULID_1)
    testTicket1 = Ticket.create(ticketId1, {
      title: 'First Test Ticket',
      description: 'Test Description',
      priority: 'high',
      type: 'feature',
      status: 'pending',
    })

    // Add aliases to test ticket
    testTicket1.setCanonicalAlias(TicketAlias.createCanonical('ticket1'))
    testTicket1.addCustomAlias(TicketAlias.create('auth-bug'))

    const ticketId2 = TicketId.create(VALID_ULID_2)
    testTicket2 = Ticket.create(ticketId2, {
      title: 'Second Test Ticket',
      description: 'Test Description 2',
      priority: 'medium',
      type: 'bug',
      status: 'pending',
    })

    testTicket2.addCustomAlias(TicketAlias.create('auth-fix'))
  })

  describe('resolveTicket', () => {
    describe('exact ID match', () => {
      it('should resolve ticket by exact ID', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(testTicket1)

        const result = await service.resolveTicket(VALID_ULID_1)

        expect(result.ticket).toBe(testTicket1)
        expect(result.resolvedBy).toBe('id')
        expect(result.originalIdentifier).toBe(VALID_ULID_1)
        expect(mockRepository.findById).toHaveBeenCalledWith(
          expect.objectContaining({ value: VALID_ULID_1 })
        )
      })
    })

    describe('exact alias match', () => {
      it('should resolve ticket by exact alias when ID not found', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(testTicket1)

        const result = await service.resolveTicket('auth-bug')

        expect(result.ticket).toBe(testTicket1)
        expect(result.resolvedBy).toBe('alias')
        expect(result.originalIdentifier).toBe('auth-bug')
        expect(mockRepository.findByAlias).toHaveBeenCalledWith('auth-bug')
      })
    })

    describe('prefix matching', () => {
      it('should resolve ticket by partial ID when unique', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
        vi.mocked(mockRepository.queryTickets).mockResolvedValue([testTicket1, testTicket2])
        const result = await service.resolveTicket('01ARZ3NDEKTSV4RRFFQ69G5')
        expect(result.ticket).toBe(testTicket1)
        expect(result.resolvedBy).toBe('partial_id')
        expect(result.originalIdentifier).toBe('01ARZ3NDEKTSV4RRFFQ69G5')
      })

      it('should resolve ticket by partial alias when unique', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
        vi.mocked(mockRepository.queryTickets).mockResolvedValue([testTicket1, testTicket2])
        const result = await service.resolveTicket('ticket')
        expect(result.ticket).toBe(testTicket1)
        expect(result.resolvedBy).toBe('partial_alias')
        expect(result.originalIdentifier).toBe('ticket')
      })

      it('should throw error when multiple matches found', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
        vi.mocked(mockRepository.queryTickets).mockResolvedValue([testTicket1, testTicket2])
        await expect(service.resolveTicket('auth')).rejects.toThrow(/Multiple tickets match "auth"/)
      })

      it('should return null when no matches found', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
        vi.mocked(mockRepository.queryTickets).mockResolvedValue([testTicket1, testTicket2])
        const result = await service.resolveTicket('nonexistent')
        expect(result.ticket).toBeNull()
        expect(result.resolvedBy).toBeNull()
        expect(result.originalIdentifier).toBe('nonexistent')
      })
    })

    describe('case insensitive matching', () => {
      it('should match prefixes case insensitively', async () => {
        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
        vi.mocked(mockRepository.queryTickets).mockResolvedValue([testTicket1, testTicket2])
        const result = await service.resolveTicket('AUTH-BUG')
        expect(result.ticket).toBe(testTicket1)
        expect(result.resolvedBy).toBe('partial_alias')
      })
    })

    describe('duplicate prevention', () => {
      it('should not duplicate tickets when both ID and alias match', async () => {
        // Create ticket where ID prefix matches and also has alias
        const ticketWithBoth = Ticket.create(TicketId.create(VALID_ULID_3), {
          title: 'Auth Ticket',
          description: 'Auth Description',
          priority: 'high',
          type: 'feature',
          status: 'pending',
        })
        ticketWithBoth.addCustomAlias(TicketAlias.create('auth-system'))

        vi.mocked(mockRepository.findById).mockResolvedValue(null)
        vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
        vi.mocked(mockRepository.queryTickets).mockResolvedValue([ticketWithBoth])
        const result = await service.resolveTicket('01HH3KGV')
        expect(result.ticket).toBe(ticketWithBoth)
        expect(result.resolvedBy).toBe('partial_id')
      })
    })
  })

  describe('isValidUlid', () => {
    it('should return true for valid ULID', () => {
      expect(service.isValidUlid(VALID_ULID_1)).toBe(true)
    })

    it('should return false for invalid ULID', () => {
      expect(service.isValidUlid('invalid-id')).toBe(false)
      expect(service.isValidUlid('')).toBe(false)
      expect(service.isValidUlid('too-short')).toBe(false)
    })
  })
})
