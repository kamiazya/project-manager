import { type Ticket, TicketAlias } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestTicket } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { FindTicketByAliasUseCase } from './find-ticket-by-alias.ts'

describe('FindTicketByAliasUseCase', () => {
  let findTicketByAliasUseCase: FindTicketByAliasUseCase
  let mockTicketRepository: TicketRepository

  beforeEach(() => {
    mockTicketRepository = {
      queryTickets: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByAlias: vi.fn(),
      delete: vi.fn(),
      isAliasAvailable: vi.fn(),
      getAllAliases: vi.fn(),
      findTicketsWithAliases: vi.fn(),
    }
    findTicketByAliasUseCase = new FindTicketByAliasUseCase(mockTicketRepository)
  })

  describe('execute', () => {
    it('should find ticket by canonical alias (case sensitive)', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.setCanonicalAlias(TicketAlias.create('test-alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'test-alias',
        caseSensitive: true,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.ticket).toBeDefined()
      expect(result.ticket?.id).toBe(testTicket.id.value)
      expect(result.searchAlias).toBe('test-alias')
      expect(result.matchedAliasType).toBe('canonical')
      expect(result.caseSensitive).toBe(true)
      expect(mockTicketRepository.findByAlias).toHaveBeenCalledWith('test-alias')
    })

    it('should find ticket by custom alias (case sensitive)', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.addCustomAlias(TicketAlias.create('custom-alias', 'custom'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'custom-alias',
        caseSensitive: true,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.ticket).toBeDefined()
      expect(result.ticket?.id).toBe(testTicket.id.value)
      expect(result.searchAlias).toBe('custom-alias')
      expect(result.matchedAliasType).toBe('custom')
      expect(result.caseSensitive).toBe(true)
    })

    it('should find ticket by alias (case insensitive by default)', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.setCanonicalAlias(TicketAlias.create('Test-Alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'test-alias',
        // caseSensitive defaults to false
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.ticket).toBeDefined()
      expect(result.searchAlias).toBe('test-alias')
      expect(result.caseSensitive).toBe(false)
    })

    it('should return null when no ticket found', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'non-existent-alias',
        caseSensitive: true,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.ticket).toBeNull()
      expect(result.searchAlias).toBe('non-existent-alias')
      expect(result.matchedAliasType).toBeUndefined()
      expect(result.caseSensitive).toBe(true)
    })

    it('should handle case-insensitive search correctly', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.setCanonicalAlias(TicketAlias.create('Test-Alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'TEST-ALIAS',
        caseSensitive: false,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.ticket).toBeDefined()
      expect(result.searchAlias).toBe('TEST-ALIAS')
      expect(result.matchedAliasType).toBe('canonical')
      expect(result.caseSensitive).toBe(false)
    })
  })

  describe('determineMatchedAliasType', () => {
    it('should correctly identify canonical alias match', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.setCanonicalAlias(TicketAlias.create('canonical-alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'canonical-alias',
        caseSensitive: true,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.matchedAliasType).toBe('canonical')
    })

    it('should correctly identify custom alias match', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.addCustomAlias(TicketAlias.create('custom-alias', 'custom'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'custom-alias',
        caseSensitive: true,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.matchedAliasType).toBe('custom')
    })

    it('should prefer canonical alias when both exist with same value', async () => {
      // Arrange
      const testTicket = createTestTicket({
        title: 'Test Ticket',
        description: 'Test Description',
      })
      testTicket.setCanonicalAlias(TicketAlias.create('same-alias', 'canonical'))
      testTicket.addCustomAlias(TicketAlias.create('same-alias', 'custom'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(testTicket)

      const request = {
        alias: 'same-alias',
        caseSensitive: true,
      }

      // Act
      const result = await findTicketByAliasUseCase.execute(request)

      // Assert
      expect(result.matchedAliasType).toBe('canonical')
    })
  })
})
