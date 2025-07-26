import { ValidationError } from '@project-manager/base'
import { TicketAlias } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestTicket } from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { ValidateAliasUseCase } from './validate-alias.ts'

describe('ValidateAliasUseCase', () => {
  let validateAliasUseCase: ValidateAliasUseCase
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
    validateAliasUseCase = new ValidateAliasUseCase(mockTicketRepository)
  })

  describe('execute', () => {
    it('should validate a valid alias successfully', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'valid-alias',
        aliasType: 'custom' as const,
        checkUniqueness: true,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.alias).toBe('valid-alias')
      expect(result.errors).toHaveLength(0)
      expect(result.validation.format.isValid).toBe(true)
      expect(result.validation.uniqueness?.isUnique).toBe(true)
      expect(result.validation.typeSpecific?.isValid).toBe(true)
    })

    it('should reject empty alias', async () => {
      // Arrange
      const request = {
        alias: '',
        aliasType: 'custom' as const,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Alias cannot be empty')
      expect(result.validation.format.isValid).toBe(false)
    })

    it('should reject alias with only whitespace', async () => {
      // Arrange
      const request = {
        alias: '   ',
        aliasType: 'custom' as const,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Alias cannot be empty')
      expect(result.validation.format.isValid).toBe(false)
    })

    it('should reject alias that is not unique', async () => {
      // Arrange
      const existingTicket = createTestTicket({
        title: 'Existing Ticket',
        description: 'Description',
      })
      existingTicket.setCanonicalAlias(TicketAlias.create('existing-alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(existingTicket)

      const request = {
        alias: 'existing-alias',
        aliasType: 'custom' as const,
        checkUniqueness: true,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Alias "existing-alias" is already in use')
      expect(result.validation.uniqueness?.isUnique).toBe(false)
      expect(result.validation.uniqueness?.conflictingTicketId).toBe(existingTicket.id.value)
      expect(result.validation.uniqueness?.conflictingAliasType).toBe('canonical')
    })

    it('should allow non-unique alias when uniqueness check is disabled', async () => {
      // Arrange
      const existingTicket = createTestTicket({
        title: 'Existing Ticket',
        description: 'Description',
      })
      existingTicket.setCanonicalAlias(TicketAlias.create('existing-alias', 'canonical'))

      // Note: findByAlias should not be called when checkUniqueness is false

      const request = {
        alias: 'existing-alias',
        aliasType: 'custom' as const,
        checkUniqueness: false, // Key difference
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.validation.uniqueness).toBeUndefined()
      expect(mockTicketRepository.findByAlias).not.toHaveBeenCalled()
    })

    it('should allow duplicate alias for same ticket when excluded', async () => {
      // Arrange
      const existingTicket = createTestTicket({
        title: 'Existing Ticket',
        description: 'Description',
      })
      existingTicket.setCanonicalAlias(TicketAlias.create('existing-alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(existingTicket)

      const request = {
        alias: 'existing-alias',
        aliasType: 'custom' as const,
        checkUniqueness: true,
        excludeTicketId: existingTicket.id.value, // Same ticket is excluded
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.validation.uniqueness?.isUnique).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should validate canonical alias type-specific rules', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'abc', // Too short for canonical
        aliasType: 'canonical' as const,
        checkUniqueness: true,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.validation.typeSpecific?.isValid).toBe(false)
      expect(result.validation.typeSpecific?.errors).toContain(
        'Canonical aliases should be at least 4 characters long'
      )
    })

    it('should validate custom alias type-specific rules', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'alias with spaces', // Spaces not allowed in custom aliases
        aliasType: 'custom' as const,
        checkUniqueness: true,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.validation.typeSpecific?.isValid).toBe(false)
      expect(result.validation.typeSpecific?.errors).toContain(
        'Custom aliases cannot contain spaces'
      )
    })

    it('should provide helpful suggestions for invalid aliases', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'alias with spaces',
        aliasType: 'custom' as const,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.suggestions).toContain('Try "alias-with-spaces" (replace spaces with dashes)')
    })

    it('should provide suggestions for too short aliases', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'ab',
        aliasType: 'custom' as const,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.suggestions).toContain('Try a longer alias (at least 3 characters)')
    })

    it('should provide suggestions for too long aliases', async () => {
      // Arrange
      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(null)

      const request = {
        alias: 'a'.repeat(60), // Very long alias
        aliasType: 'custom' as const,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.suggestions).toContain('Try a shorter alias (maximum 50 characters)')
    })

    it('should provide suggestions for non-unique aliases', async () => {
      // Arrange
      const existingTicket = createTestTicket({
        title: 'Existing Ticket',
        description: 'Description',
      })
      existingTicket.setCanonicalAlias(TicketAlias.create('existing-alias', 'canonical'))

      vi.mocked(mockTicketRepository.findByAlias).mockResolvedValue(existingTicket)

      const request = {
        alias: 'existing-alias',
        aliasType: 'custom' as const,
        checkUniqueness: true,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.suggestions).toContain(
        'Try "existing-alias-2" or "existing-alias-alt" for a unique variation'
      )
      expect(result.suggestions).toContain('Add a prefix or suffix to make it unique')
    })
  })

  describe('format validation', () => {
    it('should reject invalid characters in alias', async () => {
      // Mock TicketAlias.create to throw validation error
      const mockTicketAliasCreate = vi.spyOn(TicketAlias, 'create')
      mockTicketAliasCreate.mockImplementation(() => {
        throw new ValidationError('Invalid characters in alias', 'alias', 'invalid@alias')
      })

      const request = {
        alias: 'invalid@alias',
        aliasType: 'custom' as const,
      }

      // Act
      const result = await validateAliasUseCase.execute(request)

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.validation.format.isValid).toBe(false)
      expect(result.validation.format.errors).toContain('Invalid characters in alias')

      // Cleanup
      mockTicketAliasCreate.mockRestore()
    })
  })
})
