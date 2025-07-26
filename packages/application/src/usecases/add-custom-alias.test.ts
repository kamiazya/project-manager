import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { describe, expect, it, vi } from 'vitest'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { AddCustomAliasUseCase } from './add-custom-alias.ts'

// Mock implementations
const createMockTicketRepository = (): TicketRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  queryTickets: vi.fn(),
  delete: vi.fn(),
  // Alias-related methods
  findByAlias: vi.fn(),
  isAliasAvailable: vi.fn(),
  getAllAliases: vi.fn(),
  findTicketsWithAliases: vi.fn(),
})

const createTestTicket = (withCustomAliases: string[] = []): Ticket => {
  const ticketId = TicketId.create('01H8XGJWBWBAQ1J3T3B8A0V0A8')
  const ticket = Ticket.create(ticketId, {
    title: 'Test Ticket',
    description: 'Test Description',
    priority: 'medium',
    status: 'pending',
    type: 'task',
  })

  // Add custom aliases if provided
  withCustomAliases.forEach(aliasValue => {
    const customAlias = TicketAlias.create(aliasValue, 'custom')
    ticket.addCustomAlias(customAlias)
  })

  return ticket
}

describe('AddCustomAliasUseCase', () => {
  const ticketId = '01H8XGJWBWBAQ1J3T3B8A0V0A8'

  describe('execute', () => {
    it('should add custom alias to ticket successfully', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(null) // No conflict

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act
      const result = await useCase.execute({
        ticketId,
        alias: 'my-custom-alias',
      })

      // Assert
      expect(result).toEqual({
        alias: 'my-custom-alias',
        type: 'custom',
        wasAdded: true,
        totalCustomAliases: 1,
      })

      expect(mockRepository.findById).toHaveBeenCalledWith(expect.any(TicketId))
      expect(mockRepository.findByAlias).toHaveBeenCalledWith('my-custom-alias')
      expect(mockRepository.save).toHaveBeenCalledWith(ticket)
      expect(ticket.matchesAlias('my-custom-alias')).toBe(true)
    })

    it('should add multiple custom aliases to same ticket', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket(['existing-alias'])

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(null) // No conflict

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act
      const result = await useCase.execute({
        ticketId,
        alias: 'second-alias',
      })

      // Assert
      expect(result).toEqual({
        alias: 'second-alias',
        type: 'custom',
        wasAdded: true,
        totalCustomAliases: 2,
      })

      expect(ticket.matchesAlias('existing-alias')).toBe(true)
      expect(ticket.matchesAlias('second-alias')).toBe(true)
    })

    it('should throw error when ticket not found', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId,
          alias: 'my-alias',
        })
      ).rejects.toThrow(`Ticket with ID '${ticketId}' not found`)
    })

    it('should throw error for invalid ticket ID', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId: 'invalid-id',
          alias: 'my-alias',
        })
      ).rejects.toThrow()
    })

    it('should throw error for invalid alias format', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()
      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert - Test empty alias
      await expect(
        useCase.execute({
          ticketId,
          alias: '',
        })
      ).rejects.toThrow()

      // Act & Assert - Test alias too long
      await expect(
        useCase.execute({
          ticketId,
          alias: 'a'.repeat(100),
        })
      ).rejects.toThrow()

      // Act & Assert - Test invalid characters
      await expect(
        useCase.execute({
          ticketId,
          alias: 'invalid@alias!',
        })
      ).rejects.toThrow()
    })
  })

  describe('alias uniqueness validation', () => {
    it('should throw error when alias conflicts with another ticket', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()
      const conflictingTicket = createTestTicket()

      // Ensure tickets have different IDs
      const conflictingId = TicketId.create('01H8XGJWBWBAQ1J3T3B8A0V0B9')
      Object.defineProperty(conflictingTicket, 'id', { value: conflictingId })

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(conflictingTicket)

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId,
          alias: 'conflicting-alias',
        })
      ).rejects.toThrow('Alias "conflicting-alias" is already in use by ticket')
    })

    it('should allow same alias if owned by same ticket', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket(['existing-alias'])

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(ticket) // Same ticket

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      // Should throw because ticket already has this custom alias, not because of uniqueness
      await expect(
        useCase.execute({
          ticketId,
          alias: 'existing-alias',
        })
      ).rejects.toThrow('Ticket already has custom alias "existing-alias"')
    })

    it('should prevent duplicate custom aliases on same ticket', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket(['existing-alias'])

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(ticket) // Same ticket owns it

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId,
          alias: 'existing-alias',
        })
      ).rejects.toThrow('Ticket already has custom alias "existing-alias"')
    })
  })

  describe('edge cases', () => {
    it('should handle repository save failure', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)
      vi.mocked(mockRepository.save).mockRejectedValue(new Error('Save failed'))

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId,
          alias: 'valid-alias',
        })
      ).rejects.toThrow('Save failed')
    })

    it('should handle repository findByAlias failure', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockRejectedValue(new Error('Database error'))

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId,
          alias: 'valid-alias',
        })
      ).rejects.toThrow('Database error')
    })

    it('should validate case-insensitive alias conflicts', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()
      const conflictingTicket = createTestTicket()

      // Ensure tickets have different IDs
      const conflictingId = TicketId.create('01H8XGJWBWBAQ1J3T3B8A0V0C1')
      Object.defineProperty(conflictingTicket, 'id', { value: conflictingId })

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(conflictingTicket)

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Act & Assert
      await expect(
        useCase.execute({
          ticketId,
          alias: 'My-Custom-Alias',
        })
      ).rejects.toThrow('Alias "My-Custom-Alias" is already in use')
    })
  })

  describe('integration with domain validation', () => {
    it('should respect TicketAlias validation rules', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()
      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Test minimum length (should be 3+ characters)
      await expect(
        useCase.execute({
          ticketId,
          alias: 'ab',
        })
      ).rejects.toThrow()

      // Test reserved words
      await expect(
        useCase.execute({
          ticketId,
          alias: 'new',
        })
      ).rejects.toThrow()

      // Test invalid characters
      await expect(
        useCase.execute({
          ticketId,
          alias: 'alias_with_underscore',
        })
      ).rejects.toThrow()
    })

    it('should accept valid alias formats', async () => {
      // Arrange
      const mockRepository = createMockTicketRepository()
      const ticket = createTestTicket()

      vi.mocked(mockRepository.findById).mockResolvedValue(ticket)
      vi.mocked(mockRepository.findByAlias).mockResolvedValue(null)

      const useCase = new AddCustomAliasUseCase(mockRepository)

      // Test valid formats
      const validAliases = ['my-feature', 'bug-123', 'login-fix', 'api-enhancement', 'user-auth-v2']

      for (const alias of validAliases) {
        const result = await useCase.execute({
          ticketId,
          alias,
        })
        expect(result.alias).toBe(alias)
        expect(result.wasAdded).toBe(true)
      }

      expect(ticket.aliases.custom.length).toBe(validAliases.length)
    })
  })
})
