import { TicketId } from '@project-manager/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { DeleteTicket } from './delete-ticket.ts'

describe('DeleteTicket', () => {
  let mockTicketRepository: TicketRepository
  let deleteTicketUseCase: DeleteTicket.UseCase
  let validTicketId: string

  beforeEach(() => {
    validTicketId = '12345678' // 8 hex characters
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      queryTickets: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    deleteTicketUseCase = new DeleteTicket.UseCase(mockTicketRepository)
  })

  describe('Request DTO', () => {
    it('should create request with ticket ID', () => {
      const request: DeleteTicket.Request = { id: validTicketId }

      expect(request.id).toBe(validTicketId)
    })

    it('should create request with empty string ID', () => {
      const request: DeleteTicket.Request = { id: '' }

      expect(request.id).toBe('')
    })

    it('should create request with null ID', () => {
      const request: DeleteTicket.Request = { id: null as any }

      expect(request.id).toBe(null)
    })
  })

  describe('UseCase - Happy Path', () => {
    it('should delete ticket with valid ID', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }

      await deleteTicketUseCase.execute(request)

      expect(mockTicketRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: validTicketId })
      )
    })

    it('should call repository delete with correct TicketId', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }

      await deleteTicketUseCase.execute(request)

      expect(mockTicketRepository.delete).toHaveBeenCalledWith(expect.any(TicketId))
      const ticketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
      expect(ticketId.value).toBe(validTicketId)
    })

    it('should complete without error when deletion succeeds', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }

      await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
      expect(mockTicketRepository.delete).toHaveBeenCalled()
    })
  })

  describe('Input Validation Edge Cases', () => {
    describe('ID Format Validation', () => {
      it('should generate new ID for empty ID', async () => {
        const request: DeleteTicket.Request = { id: '' }

        await deleteTicketUseCase.execute(request)

        expect(mockTicketRepository.delete).toHaveBeenCalled()

        // Check that a valid TicketId was generated and passed to repository
        const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
        expect(passedTicketId.value).toMatch(/^[0-9a-f]{8}$/)
      })

      it('should generate new ID for null ID', async () => {
        const request: DeleteTicket.Request = { id: null as any }

        await deleteTicketUseCase.execute(request)

        expect(mockTicketRepository.delete).toHaveBeenCalled()

        // Check that a valid TicketId was generated and passed to repository
        const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
        expect(passedTicketId.value).toMatch(/^[0-9a-f]{8}$/)
      })

      it('should generate new ID for undefined ID', async () => {
        const request: DeleteTicket.Request = { id: undefined as any }

        await deleteTicketUseCase.execute(request)

        expect(mockTicketRepository.delete).toHaveBeenCalled()

        // Check that a valid TicketId was generated and passed to repository
        const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
        expect(passedTicketId.value).toMatch(/^[0-9a-f]{8}$/)
      })

      it('should throw error for ID with wrong length (too short)', async () => {
        const request: DeleteTicket.Request = { id: '1234567' } // 7 characters

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with wrong length (too long)', async () => {
        const request: DeleteTicket.Request = { id: '123456789' } // 9 characters

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with uppercase letters', async () => {
        const request: DeleteTicket.Request = { id: '1234567A' } // Uppercase A

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with special characters', async () => {
        const request: DeleteTicket.Request = { id: '1234567!' } // Special character

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with spaces', async () => {
        const request: DeleteTicket.Request = { id: '1234567 ' } // Space

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with non-hex characters', async () => {
        const request: DeleteTicket.Request = { id: '123456gh' } // 'g' and 'h' are not hex

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should handle valid hex ID with numbers only', async () => {
        const request: DeleteTicket.Request = { id: '12345678' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle valid hex ID with letters only', async () => {
        const request: DeleteTicket.Request = { id: 'abcdefab' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle valid hex ID with mix of numbers and letters', async () => {
        const request: DeleteTicket.Request = { id: '12ab34cd' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle boundary case with all zeros', async () => {
        const request: DeleteTicket.Request = { id: '00000000' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle boundary case with all f', async () => {
        const request: DeleteTicket.Request = { id: 'ffffffff' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })
    })

    describe('Edge Case IDs', () => {
      it('should handle ID with only numeric characters', async () => {
        const request: DeleteTicket.Request = { id: '01234567' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle ID with only letter characters', async () => {
        const request: DeleteTicket.Request = { id: 'abcdefab' }

        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle ID with mixed case (should fail)', async () => {
        const request: DeleteTicket.Request = { id: 'AbCdEfAb' }

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })
    })
  })

  describe('Repository Error Handling', () => {
    it('should propagate repository delete errors', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const deleteError = new Error('Database connection failed')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(deleteError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should propagate repository not found errors', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const notFoundError = new TicketNotFoundError(validTicketId, 'TestRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(notFoundError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        `Ticket with ID '${validTicketId}' not found`
      )
    })

    it('should propagate repository permission errors', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const permissionError = new Error('Permission denied')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(permissionError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Permission denied')
    })

    it('should propagate repository storage errors', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const storageError = new Error('Disk full')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(storageError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Disk full')
    })

    it('should propagate repository timeout errors', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const timeoutError = new Error('Operation timeout')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(timeoutError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Operation timeout')
    })

    it('should propagate repository concurrency errors', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const concurrencyError = new Error('Concurrent modification')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(concurrencyError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Concurrent modification')
    })

    it('should throw TicketNotFoundError when repository reports ticket not found', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const repositoryError = new TicketNotFoundError(validTicketId, 'JsonTicketRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        `Ticket with ID '${validTicketId}' not found`
      )
    })

    it('should propagate TicketNotFoundError directly from repository', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }

      // リポジトリから適切な TicketNotFoundError を投げる
      const repositoryError = new TicketNotFoundError(validTicketId, 'JsonTicketRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      // エラーメッセージとプロパティを検証
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
      const request: DeleteTicket.Request = { id: validTicketId }
      // リポジトリが適切な TicketNotFoundError を投げるようにモック
      const notFoundError = new TicketNotFoundError(validTicketId, 'JsonTicketRepository')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(notFoundError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(TicketNotFoundError)
      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        `Ticket with ID '${validTicketId}' not found`
      )
      expect(mockTicketRepository.delete).toHaveBeenCalled()
    })

    it('should handle deletion in different repository states', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }

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
      const request1: DeleteTicket.Request = { id: '12345678' }
      const request2: DeleteTicket.Request = { id: 'abcdefab' }
      const request3: DeleteTicket.Request = { id: 'deadbeef' }

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
      const ticketIds = ['12345678', 'abcdefab', 'deadbeef', '11111111', '22222222']

      for (const ticketId of ticketIds) {
        const request: DeleteTicket.Request = { id: ticketId }
        await expect(deleteTicketUseCase.execute(request)).resolves.toBeUndefined()
      }

      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(ticketIds.length)
    })

    it('should handle mixed success and failure scenarios', async () => {
      const successId = '12345678'
      const failureId = 'abcdefab'

      // Setup one to succeed, one to fail
      vi.mocked(mockTicketRepository.delete).mockImplementation(async ticketId => {
        if (ticketId.value === failureId) {
          throw new Error('Delete failed')
        }
        return undefined
      })

      const successRequest: DeleteTicket.Request = { id: successId }
      const failureRequest: DeleteTicket.Request = { id: failureId }

      // Success case
      await expect(deleteTicketUseCase.execute(successRequest)).resolves.toBeUndefined()

      // Failure case
      await expect(deleteTicketUseCase.execute(failureRequest)).rejects.toThrow('Delete failed')
    })
  })

  describe('Integration with Domain Objects', () => {
    it('should create TicketId correctly from string', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const ticketIdSpy = vi.spyOn(TicketId, 'create')

      await deleteTicketUseCase.execute(request)

      expect(ticketIdSpy).toHaveBeenCalledWith(validTicketId)
      ticketIdSpy.mockRestore()
    })

    it('should pass created TicketId to repository', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }

      await deleteTicketUseCase.execute(request)

      const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0]![0]
      expect(passedTicketId).toBeInstanceOf(TicketId)
      expect(passedTicketId.value).toBe(validTicketId)
    })
  })

  describe('Error Recovery', () => {
    it('should handle repository errors gracefully', async () => {
      const request: DeleteTicket.Request = { id: validTicketId }
      const repositoryError = new Error('Temporary database error')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Temporary database error')

      // Verify the error didn't leave the system in an inconsistent state
      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle validation errors before repository call', async () => {
      const request: DeleteTicket.Request = { id: 'invalidid' } // Invalid format

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
      )

      // Repository should not be called when validation fails
      expect(mockTicketRepository.delete).not.toHaveBeenCalled()
    })

    it('should maintain consistency across multiple failed operations', async () => {
      const validRequest: DeleteTicket.Request = { id: validTicketId }
      const invalidRequest: DeleteTicket.Request = { id: 'invalidid' } // Invalid format

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
