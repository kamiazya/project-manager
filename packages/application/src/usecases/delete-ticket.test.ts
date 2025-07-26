import { Ticket, TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import {
  INVALID_ID_CONTAINS_INVALID_CHARS,
  INVALID_ID_CONTAINS_SPECIAL,
  INVALID_ID_TOO_LONG,
  INVALID_ID_TOO_SHORT,
  VALID_ULID_1,
  VALID_ULID_2,
  VALID_ULID_3,
  VALID_ULID_4,
  VALID_ULID_5,
} from '../common/test-helpers.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { DeleteTicket } from './delete-ticket.ts'

describe('DeleteTicket', () => {
  let mockTicketRepository: TicketRepository
  let deleteTicketUseCase: DeleteTicket.UseCase
  let validTicketId: string
  let mockTicket: Ticket

  beforeEach(() => {
    validTicketId = VALID_ULID_1 // Valid ULID format

    // Create mock ticket
    const ticketId = TicketId.create(validTicketId)
    mockTicket = Ticket.create(ticketId, {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      type: 'task',
      status: 'pending',
    })

    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockTicket),
      queryTickets: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      findByAlias: vi.fn(),
      isAliasAvailable: vi.fn(),
      getAllAliases: vi.fn(),
      findTicketsWithAliases: vi.fn(),
    }
    mockTicketRepository.queryTickets = vi.fn().mockResolvedValue([])

    const mockLogger = {
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      child: vi.fn().mockReturnThis(),
      flush: vi.fn().mockResolvedValue(undefined),
    }

    deleteTicketUseCase = new DeleteTicket.UseCase(mockTicketRepository)
    deleteTicketUseCase.logger = mockLogger as any
  })

  describe('Request DTO', () => {
    it('should create request with ticket identifier', () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      expect(request.identifier).toBe(validTicketId)
    })

    it('should create request with empty string identifier', () => {
      const request: DeleteTicket.Request = { identifier: '' }

      expect(request.identifier).toBe('')
    })

    it('should create request with null identifier', () => {
      const request: DeleteTicket.Request = { identifier: null as any }

      expect(request.identifier).toBe(null)
    })
  })

  describe('UseCase - Happy Path', () => {
    it('should delete ticket with valid identifier', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      await deleteTicketUseCase.execute(request)

      expect(mockTicketRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: mockTicket.id.value })
      )
    })

    it('should call repository delete with correct TicketId', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      await deleteTicketUseCase.execute(request)

      expect(mockTicketRepository.delete).toHaveBeenCalledWith(expect.any(TicketId))
      const ticketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
      expect(ticketId).toBe(mockTicket.id)
    })

    it('should complete without error when deletion succeeds', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
      expect(mockTicketRepository.delete).toHaveBeenCalled()
    })
  })

  describe('Input Validation Edge Cases', () => {
    describe('Identifier Resolution', () => {
      it('should throw TicketNotFoundError for empty identifier', async () => {
        mockTicketRepository.findById = vi.fn().mockResolvedValue(null)
        mockTicketRepository.findByAlias = vi.fn().mockResolvedValue(null)

        const request: DeleteTicket.Request = { identifier: '' }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      })

      it('should throw TicketNotFoundError for null identifier', async () => {
        mockTicketRepository.findById = vi.fn().mockResolvedValue(null)
        mockTicketRepository.findByAlias = vi.fn().mockResolvedValue(null)

        const request: DeleteTicket.Request = { identifier: null as any }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      })

      it('should throw TicketNotFoundError for undefined identifier', async () => {
        mockTicketRepository.findById = vi.fn().mockResolvedValue(null)
        mockTicketRepository.findByAlias = vi.fn().mockResolvedValue(null)

        const request: DeleteTicket.Request = { identifier: undefined as any }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      })

      it('should throw TicketNotFoundError for invalid ID (too short)', async () => {
        const request: DeleteTicket.Request = { identifier: INVALID_ID_TOO_SHORT }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw TicketNotFoundError for invalid ID (too long)', async () => {
        const request: DeleteTicket.Request = { identifier: INVALID_ID_TOO_LONG }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw TicketNotFoundError for ID with invalid characters', async () => {
        const request: DeleteTicket.Request = { identifier: INVALID_ID_CONTAINS_INVALID_CHARS }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw TicketNotFoundError for ID with special characters', async () => {
        const request: DeleteTicket.Request = { identifier: INVALID_ID_CONTAINS_SPECIAL }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw TicketNotFoundError for ID with spaces', async () => {
        const request: DeleteTicket.Request = { identifier: '01ARZ3NDEKTSV4RRFFQ69G5F V' } // Space in ULID

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw TicketNotFoundError for ID with lowercase letters', async () => {
        const request: DeleteTicket.Request = { identifier: '01arz3ndektsv4rrffq69g5fav' } // ULID must be uppercase

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should handle valid ULID', async () => {
        const request: DeleteTicket.Request = { identifier: VALID_ULID_2 }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle another valid ULID', async () => {
        const request: DeleteTicket.Request = { identifier: VALID_ULID_3 }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle yet another valid ULID', async () => {
        const request: DeleteTicket.Request = { identifier: VALID_ULID_4 }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle boundary case with all zeros in ULID', async () => {
        const request: DeleteTicket.Request = { identifier: '00000000000000000000000000' } // 26 zeros

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle boundary case with all max values', async () => {
        const request: DeleteTicket.Request = { identifier: '7ZZZZZZZZZZZZZZZZZZZZZZZZZ' } // Max ULID

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })
    })

    describe('Edge Case IDs', () => {
      it('should handle ULID with mostly numbers', async () => {
        const request: DeleteTicket.Request = { identifier: '01234567890ABCDEFGHJKMNPQR' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle ULID with mostly letters', async () => {
        const request: DeleteTicket.Request = { identifier: 'ABCDEFGHJKMNPQRSTVWXYZ0123' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle ID with mixed case (should fail)', async () => {
        const request: DeleteTicket.Request = { identifier: '01ArZ3NdEkTsV4RrFfQ69G5FaV' } // Mixed case ULID

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })
    })
  })

  describe('Repository Error Handling', () => {
    it('should propagate repository delete errors', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const deleteError = new Error('Database connection failed')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(deleteError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should propagate repository not found errors', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const notFoundError = new TicketNotFoundError(validTicketId, 'TestRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(notFoundError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        `Ticket with ID '${validTicketId}' not found`
      )
    })

    it('should propagate repository permission errors', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const permissionError = new Error('Permission denied')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(permissionError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Permission denied')
    })

    it('should propagate repository storage errors', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const storageError = new Error('Disk full')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(storageError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Disk full')
    })

    it('should propagate repository timeout errors', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const timeoutError = new Error('Operation timeout')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(timeoutError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Operation timeout')
    })

    it('should propagate repository concurrency errors', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const concurrencyError = new Error('Concurrent modification')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(concurrencyError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Concurrent modification')
    })

    it('should throw TicketNotFoundError when repository reports ticket not found', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const repositoryError = new TicketNotFoundError(validTicketId, 'JsonTicketRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        `Ticket with ID '${validTicketId}' not found`
      )
    })

    it('should propagate TicketNotFoundError directly from repository', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      // Repository should throw the appropriate TicketNotFoundError
      const repositoryError = new TicketNotFoundError(validTicketId, 'JsonTicketRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      // Verify error message and properties
      try {
        await deleteTicketUseCase.execute(request)
      } catch (error) {
        expect(error).toBeInstanceOf(TicketNotFoundError)
        expect((error as TicketNotFoundError).ticketId).toBe(validTicketId)
        expect((error as TicketNotFoundError).useCaseName).toBe('JsonTicketRepository')
      }
    })
  })

  describe('Business Logic Edge Cases', () => {
    it('should throw TicketNotFoundError for non-existent ticket', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      // Mock repository to throw appropriate TicketNotFoundError
      const notFoundError = new TicketNotFoundError(validTicketId, 'JsonTicketRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(notFoundError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        `Ticket with ID '${validTicketId}' not found`
      )
      expect(mockTicketRepository.delete).toHaveBeenCalled()
    })

    it('should handle deletion in different repository states', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      // Test multiple scenarios
      const scenarios = [undefined, null, true, false, {}, []]

      for (const scenario of scenarios) {
        vi.mocked(mockTicketRepository.delete).mockResolvedValue(scenario as any)

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      }
    })
  })

  describe('Concurrency and Performance', () => {
    it('should handle concurrent deletions of different tickets', async () => {
      const request1: DeleteTicket.Request = { identifier: VALID_ULID_1 }
      const request2: DeleteTicket.Request = { identifier: VALID_ULID_2 }
      const request3: DeleteTicket.Request = { identifier: VALID_ULID_3 }

      const promises = [
        deleteTicketUseCase.execute(request1),
        deleteTicketUseCase.execute(request2),
        deleteTicketUseCase.execute(request3),
      ]

      const responses = await Promise.all(promises)

      expect(responses).toHaveLength(3)
      // All responses should be undefined (void)
      expect(responses[0]).toBeUndefined()
      expect(responses[1]).toBeUndefined()
      expect(responses[2]).toBeUndefined()
      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid sequential deletions', async () => {
      const ticketIds = [VALID_ULID_1, VALID_ULID_2, VALID_ULID_3, VALID_ULID_4, VALID_ULID_5]

      for (const ticketId of ticketIds) {
        const request: DeleteTicket.Request = { identifier: ticketId }
        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
      }

      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(ticketIds.length)
    })

    it('should handle mixed success and failure scenarios', async () => {
      const successId = VALID_ULID_1
      const failureId = VALID_ULID_2

      // Create second ticket for failure scenario
      const failureTicketId = TicketId.create(failureId)
      const failureTicket = Ticket.create(failureTicketId, {
        title: 'Test Ticket 2',
        description: 'Test Description 2',
        priority: 'medium',
        type: 'task',
        status: 'pending',
      })

      // Setup findById to return appropriate tickets
      vi.mocked(mockTicketRepository.findById).mockImplementation(async id => {
        if (id.value === successId) {
          return mockTicket
        } else if (id.value === failureId) {
          return failureTicket
        }
        return null
      })

      // Setup one to succeed, one to fail
      vi.mocked(mockTicketRepository.delete).mockImplementation(async ticketId => {
        if (ticketId.value === failureId) {
          throw new Error('Delete failed')
        }
        return undefined
      })

      const successRequest: DeleteTicket.Request = { identifier: successId }
      const failureRequest: DeleteTicket.Request = { identifier: failureId }

      // Success case
      await expect(deleteTicketUseCase.execute(successRequest)).resolves.toBeUndefined()

      // Failure case
      await expect(deleteTicketUseCase.execute(failureRequest)).rejects.toThrow('Delete failed')
    })
  })

  describe('Integration with Domain Objects', () => {
    it('should create TicketId correctly from string', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const ticketIdSpy = vi.spyOn(TicketId, 'create')

      await deleteTicketUseCase.execute(request)

      expect(ticketIdSpy).toHaveBeenCalledWith(validTicketId)
      ticketIdSpy.mockRestore()
    })

    it('should pass created TicketId to repository', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }

      await deleteTicketUseCase.execute(request)

      const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
      expect(passedTicketId).toBeInstanceOf(TicketId)
      expect(passedTicketId.value).toBe(validTicketId)
    })
  })

  describe('Error Recovery', () => {
    it('should handle repository errors gracefully', async () => {
      const request: DeleteTicket.Request = { identifier: validTicketId }
      const repositoryError = new Error('Temporary database error')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Temporary database error')

      // Verify the error didn't leave the system in an inconsistent state
      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle validation errors before repository call', async () => {
      const request: DeleteTicket.Request = { identifier: INVALID_ID_TOO_SHORT } // Invalid format

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)

      // Repository should not be called when ticket is not found
      expect(mockTicketRepository.delete).not.toHaveBeenCalled()
    })

    it('should maintain consistency across multiple failed operations', async () => {
      const validRequest: DeleteTicket.Request = { identifier: validTicketId }
      const invalidRequest: DeleteTicket.Request = { identifier: INVALID_ID_TOO_SHORT } // Invalid format

      // First operation should succeed
      await expect(deleteTicketUseCase.execute(validRequest)).resolves.toBeUndefined()

      // Second operation should fail
      await expect(deleteTicketUseCase.execute(invalidRequest)).rejects.toThrow()

      // Third operation should succeed again
      await expect(deleteTicketUseCase.execute(validRequest)).resolves.toBeUndefined()

      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(2)
    })
  })
})
