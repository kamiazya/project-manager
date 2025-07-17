import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
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
      findAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      getStatistics: vi.fn(),
    }
    deleteTicketUseCase = new DeleteTicket.UseCase(mockTicketRepository)
  })

  describe('Request DTO', () => {
    it('should create request with ticket ID', () => {
      const request = new DeleteTicket.Request(validTicketId)

      expect(request.id).toBe(validTicketId)
    })

    it('should create request with empty string ID', () => {
      const request = new DeleteTicket.Request('')

      expect(request.id).toBe('')
    })

    it('should create request with null ID', () => {
      const request = new DeleteTicket.Request(null as any)

      expect(request.id).toBe(null)
    })
  })

  describe('Response DTO', () => {
    it('should create response with success true', () => {
      const response = DeleteTicket.Response.success(validTicketId)

      expect(response.id).toBe(validTicketId)
      expect(response.success).toBe(true)
    })

    it('should create response with direct constructor', () => {
      const response = new DeleteTicket.Response(validTicketId, false)

      expect(response.id).toBe(validTicketId)
      expect(response.success).toBe(false)
    })
  })

  describe('UseCase - Happy Path', () => {
    it('should delete ticket with valid ID', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      const response = await deleteTicketUseCase.execute(request)

      expect(response.id).toBe(validTicketId)
      expect(response.success).toBe(true)
      expect(mockTicketRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({ value: validTicketId })
      )
    })

    it('should call repository delete with correct TicketId', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      await deleteTicketUseCase.execute(request)

      expect(mockTicketRepository.delete).toHaveBeenCalledWith(expect.any(TicketId))
      const ticketId = vi.mocked(mockTicketRepository.delete).mock.calls[0][0]
      expect(ticketId.value).toBe(validTicketId)
    })

    it('should return success response regardless of repository result', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      const response = await deleteTicketUseCase.execute(request)

      expect(response.success).toBe(true)
      expect(response.id).toBe(validTicketId)
    })
  })

  describe('Input Validation Edge Cases', () => {
    describe('ID Format Validation', () => {
      it('should generate new ID for empty ID', async () => {
        const request = new DeleteTicket.Request('')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(response.id).toBe('')
        expect(mockTicketRepository.delete).toHaveBeenCalled()

        // Check that a valid TicketId was generated and passed to repository
        const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0][0]
        expect(passedTicketId.value).toMatch(/^[0-9a-f]{8}$/)
      })

      it('should generate new ID for null ID', async () => {
        const request = new DeleteTicket.Request(null as any)

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(response.id).toBe(null)
        expect(mockTicketRepository.delete).toHaveBeenCalled()

        // Check that a valid TicketId was generated and passed to repository
        const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0][0]
        expect(passedTicketId.value).toMatch(/^[0-9a-f]{8}$/)
      })

      it('should generate new ID for undefined ID', async () => {
        const request = new DeleteTicket.Request(undefined as any)

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(response.id).toBe(undefined)
        expect(mockTicketRepository.delete).toHaveBeenCalled()

        // Check that a valid TicketId was generated and passed to repository
        const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0][0]
        expect(passedTicketId.value).toMatch(/^[0-9a-f]{8}$/)
      })

      it('should throw error for ID with wrong length (too short)', async () => {
        const request = new DeleteTicket.Request('1234567') // 7 characters

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with wrong length (too long)', async () => {
        const request = new DeleteTicket.Request('123456789') // 9 characters

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with uppercase letters', async () => {
        const request = new DeleteTicket.Request('1234567A') // Uppercase A

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with special characters', async () => {
        const request = new DeleteTicket.Request('1234567!') // Special character

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with spaces', async () => {
        const request = new DeleteTicket.Request('1234567 ') // Space

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should throw error for ID with non-hex characters', async () => {
        const request = new DeleteTicket.Request('123456gh') // 'g' and 'h' are not hex

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })

      it('should handle valid hex ID with numbers only', async () => {
        const request = new DeleteTicket.Request('12345678')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle valid hex ID with letters only', async () => {
        const request = new DeleteTicket.Request('abcdefab')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle valid hex ID with mix of numbers and letters', async () => {
        const request = new DeleteTicket.Request('12ab34cd')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle boundary case with all zeros', async () => {
        const request = new DeleteTicket.Request('00000000')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle boundary case with all f', async () => {
        const request = new DeleteTicket.Request('ffffffff')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })
    })

    describe('Edge Case IDs', () => {
      it('should handle ID with only numeric characters', async () => {
        const request = new DeleteTicket.Request('01234567')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle ID with only letter characters', async () => {
        const request = new DeleteTicket.Request('abcdefab')

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(mockTicketRepository.delete).toHaveBeenCalled()
      })

      it('should handle ID with mixed case (should fail)', async () => {
        const request = new DeleteTicket.Request('AbCdEfAb')

        await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.delete).not.toHaveBeenCalled()
      })
    })
  })

  describe('Repository Error Handling', () => {
    it('should propagate repository delete errors', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const deleteError = new Error('Database connection failed')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(deleteError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should propagate repository not found errors', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const notFoundError = new Error('Ticket not found')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(notFoundError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Ticket not found')
    })

    it('should propagate repository permission errors', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const permissionError = new Error('Permission denied')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(permissionError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Permission denied')
    })

    it('should propagate repository storage errors', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const storageError = new Error('Disk full')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(storageError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Disk full')
    })

    it('should propagate repository timeout errors', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const timeoutError = new Error('Operation timeout')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(timeoutError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Operation timeout')
    })

    it('should propagate repository concurrency errors', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const concurrencyError = new Error('Concurrent modification')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(concurrencyError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Concurrent modification')
    })
  })

  describe('Business Logic Edge Cases', () => {
    it('should handle deletion of non-existent ticket (depends on repository)', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      // Repository might not throw error for non-existent tickets
      vi.mocked(mockTicketRepository.delete).mockResolvedValue(undefined)

      const response = await deleteTicketUseCase.execute(request)

      expect(response.success).toBe(true)
      expect(mockTicketRepository.delete).toHaveBeenCalled()
    })

    it('should handle deletion in different repository states', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      // Test multiple scenarios
      const scenarios = [undefined, null, true, false, {}, []]

      for (const scenario of scenarios) {
        vi.mocked(mockTicketRepository.delete).mockResolvedValue(scenario as any)

        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(response.id).toBe(validTicketId)
      }
    })
  })

  describe('Concurrency and Performance', () => {
    it('should handle concurrent deletions of different tickets', async () => {
      const request1 = new DeleteTicket.Request('12345678')
      const request2 = new DeleteTicket.Request('abcdefab')
      const request3 = new DeleteTicket.Request('deadbeef')

      const promises = [
        deleteTicketUseCase.execute(request1),
        deleteTicketUseCase.execute(request2),
        deleteTicketUseCase.execute(request3),
      ]

      const responses = await Promise.all(promises)

      expect(responses).toHaveLength(3)
      expect(responses[0].success).toBe(true)
      expect(responses[1].success).toBe(true)
      expect(responses[2].success).toBe(true)
      expect(responses[0].id).toBe('12345678')
      expect(responses[1].id).toBe('abcdefab')
      expect(responses[2].id).toBe('deadbeef')
      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid sequential deletions', async () => {
      const ticketIds = ['12345678', 'abcdefab', 'deadbeef', '11111111', '22222222']

      for (const ticketId of ticketIds) {
        const request = new DeleteTicket.Request(ticketId)
        const response = await deleteTicketUseCase.execute(request)

        expect(response.success).toBe(true)
        expect(response.id).toBe(ticketId)
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

      const successRequest = new DeleteTicket.Request(successId)
      const failureRequest = new DeleteTicket.Request(failureId)

      // Success case
      const successResponse = await deleteTicketUseCase.execute(successRequest)
      expect(successResponse.success).toBe(true)

      // Failure case
      await expect(deleteTicketUseCase.execute(failureRequest)).rejects.toThrow('Delete failed')
    })
  })

  describe('Integration with Domain Objects', () => {
    it('should create TicketId correctly from string', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const ticketIdSpy = vi.spyOn(TicketId, 'create')

      await deleteTicketUseCase.execute(request)

      expect(ticketIdSpy).toHaveBeenCalledWith(validTicketId)
      ticketIdSpy.mockRestore()
    })

    it('should pass created TicketId to repository', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      await deleteTicketUseCase.execute(request)

      const passedTicketId = vi.mocked(mockTicketRepository.delete).mock.calls[0][0]
      expect(passedTicketId).toBeInstanceOf(TicketId)
      expect(passedTicketId.value).toBe(validTicketId)
    })
  })

  describe('Response Structure', () => {
    it('should return response with correct structure', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      const response = await deleteTicketUseCase.execute(request)

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('success')
      expect(typeof response.id).toBe('string')
      expect(typeof response.success).toBe('boolean')
    })

    it('should return response with original ID', async () => {
      const testId = 'abcd1234'
      const request = new DeleteTicket.Request(testId)

      const response = await deleteTicketUseCase.execute(request)

      expect(response.id).toBe(testId)
      expect(response.success).toBe(true)
    })

    it('should return response instance of DeleteTicket.Response', async () => {
      const request = new DeleteTicket.Request(validTicketId)

      const response = await deleteTicketUseCase.execute(request)

      expect(response).toBeInstanceOf(DeleteTicket.Response)
    })
  })

  describe('Error Recovery', () => {
    it('should handle repository errors gracefully', async () => {
      const request = new DeleteTicket.Request(validTicketId)
      const repositoryError = new Error('Temporary database error')
      vi.mocked(mockTicketRepository.delete).mockRejectedValue(repositoryError)

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow('Temporary database error')

      // Verify the error didn't leave the system in an inconsistent state
      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle validation errors before repository call', async () => {
      const request = new DeleteTicket.Request('invalidid') // Invalid format

      await expect(deleteTicketUseCase.execute(request)).rejects.toThrow(
        'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
      )

      // Repository should not be called when validation fails
      expect(mockTicketRepository.delete).not.toHaveBeenCalled()
    })

    it('should maintain consistency across multiple failed operations', async () => {
      const validRequest = new DeleteTicket.Request(validTicketId)
      const invalidRequest = new DeleteTicket.Request('invalidid') // Invalid format

      // First operation should succeed
      const response1 = await deleteTicketUseCase.execute(validRequest)
      expect(response1.success).toBe(true)

      // Second operation should fail
      await expect(deleteTicketUseCase.execute(invalidRequest)).rejects.toThrow()

      // Third operation should succeed again
      const response3 = await deleteTicketUseCase.execute(validRequest)
      expect(response3.success).toBe(true)

      expect(mockTicketRepository.delete).toHaveBeenCalledTimes(2)
    })
  })
})
