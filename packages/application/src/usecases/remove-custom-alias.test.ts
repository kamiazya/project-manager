import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.ts'
import { createTestTicket, VALID_ULID_1 } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { RemoveCustomAliasUseCase } from './remove-custom-alias.ts'

describe('RemoveCustomAliasUseCase', () => {
  let useCase: RemoveCustomAliasUseCase
  let mockRepository: TicketRepository
  let mockTicket: Ticket

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByAlias: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      queryTickets: vi.fn().mockResolvedValue([]), // Add default mock
      isAliasAvailable: vi.fn(),
      getAllAliases: vi.fn(),
      findTicketsWithAliases: vi.fn(),
    }

    useCase = new RemoveCustomAliasUseCase(mockRepository)

    // Create a mock ticket with custom aliases using the valid ULID
    mockTicket = createTestTicket({ id: VALID_ULID_1 })

    // Add canonical and custom aliases
    const canonicalAlias = TicketAlias.create('canon123', 'canonical')
    const customAlias1 = TicketAlias.create('custom1', 'custom')
    const customAlias2 = TicketAlias.create('custom2', 'custom')

    mockTicket.setCanonicalAlias(canonicalAlias)
    mockTicket.addCustomAlias(customAlias1)
    mockTicket.addCustomAlias(customAlias2)
  })

  describe('execute', () => {
    it('should remove custom alias successfully', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTicket)
      const request = {
        ticketId: VALID_ULID_1,
        alias: 'custom1',
      }

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result).toEqual({
        alias: 'custom1',
        wasRemoved: true,
        totalCustomAliases: 1, // Should have 1 remaining (custom2)
      })
      expect(mockRepository.save).toHaveBeenCalledWith(mockTicket)
    })

    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null)
      const request = {
        ticketId: 'non-existent',
        alias: 'custom1',
      }

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw TicketValidationError when trying to remove canonical alias', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTicket)
      const request = {
        ticketId: VALID_ULID_1,
        alias: 'canon123', // Canonical alias
      }

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(TicketValidationError)
      await expect(useCase.execute(request)).rejects.toThrow(
        'Cannot remove canonical alias "canon123". Canonical aliases are system-generated and protected from deletion.'
      )
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw TicketValidationError for non-existent custom alias', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTicket)
      const request = {
        ticketId: VALID_ULID_1,
        alias: 'non-existent-alias',
      }

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(TicketValidationError)
      await expect(useCase.execute(request)).rejects.toThrow(
        `Custom alias "non-existent-alias" not found on ticket ${VALID_ULID_1}`
      )
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should handle case-insensitive alias matching', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTicket)
      const request = {
        ticketId: VALID_ULID_1,
        alias: 'CUSTOM1', // Different case
      }

      // Act
      const result = await useCase.execute(request)

      // Assert
      expect(result.wasRemoved).toBe(true)
      expect(result.alias).toBe('CUSTOM1')
      expect(mockRepository.save).toHaveBeenCalledWith(mockTicket)
    })

    it('should remove all custom aliases when called multiple times', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(mockTicket)

      // Act - Remove first custom alias
      const result1 = await useCase.execute({
        ticketId: VALID_ULID_1,
        alias: 'custom1',
      })

      // Act - Remove second custom alias
      const result2 = await useCase.execute({
        ticketId: VALID_ULID_1,
        alias: 'custom2',
      })

      // Assert
      expect(result1.totalCustomAliases).toBe(1)
      expect(result2.totalCustomAliases).toBe(0)
      expect(mockRepository.save).toHaveBeenCalledTimes(2)
    })
  })
})
