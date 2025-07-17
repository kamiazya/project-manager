import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.ts'
import { TicketValidationError } from '../../domain/types/ticket-types.ts'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { UpdateTicketStatus } from './update-ticket-status.ts'

describe('UpdateTicketStatus', () => {
  let mockTicketRepository: TicketRepository
  let updateTicketStatusUseCase: UpdateTicketStatus.UseCase
  let validTicketId: string
  let existingTicket: Ticket

  beforeEach(() => {
    validTicketId = '12345678'
    existingTicket = Ticket.create({
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      status: 'pending',
    })

    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }

    updateTicketStatusUseCase = new UpdateTicketStatus.UseCase(mockTicketRepository)
  })

  describe('Request DTO', () => {
    it('should create request with ticket ID and new status', () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      expect(request.id).toBe(validTicketId)
      expect(request.newStatus).toBe('in_progress')
    })

    it('should create request with all valid status values', () => {
      const statuses = ['pending', 'in_progress', 'completed', 'archived'] as const

      statuses.forEach(status => {
        const request = new UpdateTicketStatus.Request(validTicketId, status)
        expect(request.newStatus).toBe(status)
      })
    })

    it('should accept invalid status values in constructor', () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'invalid' as any)

      expect(request.newStatus).toBe('invalid')
    })
  })

  describe('Response DTO', () => {
    it('should extend TicketResponse', () => {
      const response = new UpdateTicketStatus.Response()
      expect(response).toBeInstanceOf(UpdateTicketStatus.Response)
    })
  })

  describe('UseCase - Happy Path', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    it('should update ticket status from pending to in_progress', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('in_progress')
      expect(mockTicketRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: validTicketId })
      )
      expect(mockTicketRepository.save).toHaveBeenCalledWith(existingTicket)
    })

    it('should update ticket status from in_progress to completed', async () => {
      const inProgressTicket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        status: 'in_progress',
      })
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(inProgressTicket)

      const request = new UpdateTicketStatus.Request(validTicketId, 'completed')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('completed')
      expect(mockTicketRepository.save).toHaveBeenCalledWith(inProgressTicket)
    })

    it('should update ticket status from completed to archived', async () => {
      const completedTicket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        status: 'completed',
      })
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(completedTicket)

      const request = new UpdateTicketStatus.Request(validTicketId, 'archived')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('archived')
      expect(mockTicketRepository.save).toHaveBeenCalledWith(completedTicket)
    })

    it('should update ticket status from completed to in_progress (reopening)', async () => {
      const completedTicket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        status: 'completed',
      })
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(completedTicket)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('in_progress')
      expect(mockTicketRepository.save).toHaveBeenCalledWith(completedTicket)
    })

    it('should return complete ticket response after status update', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.id).toBeDefined()
      expect(response.title).toBe('Test Ticket')
      expect(response.description).toBe('Test Description')
      expect(response.priority).toBe('medium')
      expect(response.status).toBe('in_progress')
      expect(response.type).toBe('task')
      expect(response.privacy).toBe('local-only')
      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
    })

    it('should update timestamp when status changes', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')
      const originalUpdatedAt = existingTicket.updatedAt

      await updateTicketStatusUseCase.execute(request)

      expect(existingTicket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('Input Validation Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    describe('ID Validation', () => {
      it('should generate new ID for empty string', async () => {
        const request = new UpdateTicketStatus.Request('', 'in_progress')

        const response = await updateTicketStatusUseCase.execute(request)

        expect(response.status).toBe('in_progress')
        expect(mockTicketRepository.findById).toHaveBeenCalledWith(
          expect.objectContaining({ value: expect.stringMatching(/^[0-9a-f]{8}$/) })
        )
      })

      it('should generate new ID for null', async () => {
        const request = new UpdateTicketStatus.Request(null as any, 'in_progress')

        const response = await updateTicketStatusUseCase.execute(request)

        expect(response.status).toBe('in_progress')
        expect(mockTicketRepository.findById).toHaveBeenCalledWith(
          expect.objectContaining({ value: expect.stringMatching(/^[0-9a-f]{8}$/) })
        )
      })

      it('should generate new ID for undefined', async () => {
        const request = new UpdateTicketStatus.Request(undefined as any, 'in_progress')

        const response = await updateTicketStatusUseCase.execute(request)

        expect(response.status).toBe('in_progress')
        expect(mockTicketRepository.findById).toHaveBeenCalledWith(
          expect.objectContaining({ value: expect.stringMatching(/^[0-9a-f]{8}$/) })
        )
      })

      it('should throw error for invalid ID format', async () => {
        const request = new UpdateTicketStatus.Request('invalid-id', 'in_progress')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.findById).not.toHaveBeenCalled()
      })

      it('should throw error for ID with wrong length', async () => {
        const request = new UpdateTicketStatus.Request('1234567', 'in_progress') // 7 characters

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.findById).not.toHaveBeenCalled()
      })

      it('should throw error for ID with non-hex characters', async () => {
        const request = new UpdateTicketStatus.Request('123456gh', 'in_progress')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Ticket ID must be exactly 8 hexadecimal characters (0-9, a-f)'
        )
        expect(mockTicketRepository.findById).not.toHaveBeenCalled()
      })

      it('should handle valid hex ID boundaries', async () => {
        const validIds = ['00000000', 'ffffffff', 'abcdef01', '12345678']

        for (const id of validIds) {
          // Create a fresh ticket for each test to avoid status conflicts
          const freshTicket = Ticket.create({
            title: 'Test Ticket',
            description: 'Test Description',
            priority: 'medium',
            status: 'pending',
          })
          vi.mocked(mockTicketRepository.findById).mockResolvedValue(freshTicket)

          const request = new UpdateTicketStatus.Request(id, 'in_progress')

          await updateTicketStatusUseCase.execute(request)

          expect(mockTicketRepository.findById).toHaveBeenCalledWith(
            expect.objectContaining({ value: id })
          )
        }
      })
    })

    describe('Status Validation', () => {
      it('should throw error for invalid status value', async () => {
        const request = new UpdateTicketStatus.Request(validTicketId, 'invalid' as any)

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Invalid ticket status: invalid'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for null status', async () => {
        const request = new UpdateTicketStatus.Request(validTicketId, null as any)

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Invalid ticket status: null'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for undefined status', async () => {
        const request = new UpdateTicketStatus.Request(validTicketId, undefined as any)

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Invalid ticket status: undefined'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should handle all valid status values', async () => {
        const validStatuses = ['pending', 'in_progress', 'completed', 'archived'] as const

        // Create tickets with different starting statuses to test valid transitions
        const testCases = [
          { from: 'pending', to: 'in_progress' },
          { from: 'in_progress', to: 'completed' },
          { from: 'completed', to: 'archived' },
          { from: 'completed', to: 'in_progress' },
          { from: 'in_progress', to: 'pending' },
        ]

        for (const testCase of testCases) {
          const ticket = Ticket.create({
            title: 'Test Ticket',
            description: 'Test Description',
            priority: 'medium',
            status: testCase.from,
          })
          vi.mocked(mockTicketRepository.findById).mockResolvedValue(ticket)

          const request = new UpdateTicketStatus.Request(validTicketId, testCase.to)
          const response = await updateTicketStatusUseCase.execute(request)

          expect(response.status).toBe(testCase.to)
        }
      })
    })
  })

  describe('Business Logic Edge Cases', () => {
    describe('Status Transition Validation', () => {
      it('should throw error for invalid transition from pending to completed', async () => {
        const pendingTicket = Ticket.create({
          title: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          status: 'pending',
        })
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(pendingTicket)

        const request = new UpdateTicketStatus.Request(validTicketId, 'completed')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          TicketValidationError
        )
        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Cannot transition from pending to completed'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for invalid transition from completed to pending', async () => {
        const completedTicket = Ticket.create({
          title: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          status: 'completed',
        })
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(completedTicket)

        const request = new UpdateTicketStatus.Request(validTicketId, 'pending')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          TicketValidationError
        )
        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Cannot transition from completed to pending'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for any transition from archived status', async () => {
        const archivedTicket = Ticket.create({
          title: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          status: 'archived',
        })
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(archivedTicket)

        const targetStatuses = ['pending', 'in_progress', 'completed'] as const

        for (const targetStatus of targetStatuses) {
          const request = new UpdateTicketStatus.Request(validTicketId, targetStatus)

          await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
            TicketValidationError
          )
          await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
            `Cannot transition from archived to ${targetStatus}`
          )
        }

        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for same status transition', async () => {
        const pendingTicket = Ticket.create({
          title: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          status: 'pending',
        })
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(pendingTicket)

        const request = new UpdateTicketStatus.Request(validTicketId, 'pending')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          TicketValidationError
        )
        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          'Cannot transition from pending to pending'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should handle complex transition scenarios', async () => {
        // Test complete workflow: pending -> in_progress -> completed -> archived
        const transitions = [
          { from: 'pending', to: 'in_progress' },
          { from: 'in_progress', to: 'completed' },
          { from: 'completed', to: 'archived' },
        ]

        const ticket = Ticket.create({
          title: 'Test Ticket',
          description: 'Test Description',
          priority: 'medium',
          status: 'pending',
        })

        for (const transition of transitions) {
          vi.mocked(mockTicketRepository.findById).mockResolvedValue(ticket)
          const request = new UpdateTicketStatus.Request(validTicketId, transition.to)

          const response = await updateTicketStatusUseCase.execute(request)

          expect(response.status).toBe(transition.to)
          expect(ticket.status.value).toBe(transition.to)
        }
      })
    })

    describe('Ticket Not Found', () => {
      it('should throw TicketNotFoundError when ticket does not exist', async () => {
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

        const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          TicketNotFoundError
        )
        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          ERROR_MESSAGES.TICKET_NOT_FOUND(validTicketId)
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw TicketNotFoundError with correct message format', async () => {
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

        const testId = 'abcd1234'
        const request = new UpdateTicketStatus.Request(testId, 'in_progress')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          ERROR_MESSAGES.TICKET_NOT_FOUND(testId)
        )
      })

      it('should handle null return from repository', async () => {
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(null)

        const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          TicketNotFoundError
        )
      })

      it('should handle undefined return from repository', async () => {
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(undefined as any)

        const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

        await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
          TicketNotFoundError
        )
      })
    })
  })

  describe('Repository Error Handling', () => {
    it('should propagate repository findById errors', async () => {
      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockTicketRepository.findById).mockRejectedValue(repositoryError)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      )
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })

    it('should propagate repository save errors', async () => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
      const saveError = new Error('Save operation failed')
      vi.mocked(mockTicketRepository.save).mockRejectedValue(saveError)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
        'Save operation failed'
      )
      expect(mockTicketRepository.findById).toHaveBeenCalled()
    })

    it('should propagate repository timeout errors', async () => {
      const timeoutError = new Error('Operation timeout')
      vi.mocked(mockTicketRepository.findById).mockRejectedValue(timeoutError)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow('Operation timeout')
    })

    it('should propagate repository permission errors', async () => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
      const permissionError = new Error('Permission denied')
      vi.mocked(mockTicketRepository.save).mockRejectedValue(permissionError)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow('Permission denied')
    })

    it('should handle repository network errors', async () => {
      const networkError = new Error('Network error')
      vi.mocked(mockTicketRepository.findById).mockRejectedValue(networkError)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow('Network error')
    })
  })

  describe('Concurrency and Performance', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    it('should handle concurrent status updates of same ticket', async () => {
      // Create separate tickets for each concurrent request to avoid same-status conflicts
      const ticket1 = Ticket.create({
        title: 'Test Ticket 1',
        description: 'Test Description 1',
        priority: 'medium',
        status: 'pending',
      })
      const ticket2 = Ticket.create({
        title: 'Test Ticket 2',
        description: 'Test Description 2',
        priority: 'medium',
        status: 'pending',
      })

      vi.mocked(mockTicketRepository.findById)
        .mockResolvedValueOnce(ticket1)
        .mockResolvedValueOnce(ticket2)

      const request1 = new UpdateTicketStatus.Request(validTicketId, 'in_progress')
      const request2 = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const promises = [
        updateTicketStatusUseCase.execute(request1),
        updateTicketStatusUseCase.execute(request2),
      ]

      const responses = await Promise.all(promises)

      expect(responses).toHaveLength(2)
      expect(responses[0]?.status).toBe('in_progress')
      expect(responses[1]?.status).toBe('in_progress')
      expect(mockTicketRepository.findById).toHaveBeenCalledTimes(2)
      expect(mockTicketRepository.save).toHaveBeenCalledTimes(2)
    })

    it('should handle concurrent status updates of different tickets', async () => {
      const ticket1 = Ticket.create({
        title: 'Test Ticket 1',
        description: 'Test Description 1',
        priority: 'medium',
        status: 'pending',
      })
      const ticket2 = Ticket.create({
        title: 'Test Ticket 2',
        description: 'Test Description 2',
        priority: 'high',
        status: 'in_progress',
      })

      vi.mocked(mockTicketRepository.findById).mockImplementation(async id => {
        if (id.value === '12345678') return ticket1
        if (id.value === 'abcdef01') return ticket2
        return null
      })

      const request1 = new UpdateTicketStatus.Request('12345678', 'in_progress')
      const request2 = new UpdateTicketStatus.Request('abcdef01', 'completed')

      const promises = [
        updateTicketStatusUseCase.execute(request1),
        updateTicketStatusUseCase.execute(request2),
      ]

      const responses = await Promise.all(promises)

      expect(responses).toHaveLength(2)
      expect(responses[0]?.status).toBe('in_progress')
      expect(responses[1]?.status).toBe('completed')
      expect(mockTicketRepository.save).toHaveBeenCalledTimes(2)
    })

    it('should handle rapid sequential status updates', async () => {
      const transitions = [
        { from: 'pending', to: 'in_progress' },
        { from: 'in_progress', to: 'completed' },
        { from: 'completed', to: 'archived' },
      ]

      const ticket = Ticket.create({
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'medium',
        status: 'pending',
      })

      for (const transition of transitions) {
        vi.mocked(mockTicketRepository.findById).mockResolvedValue(ticket)
        const request = new UpdateTicketStatus.Request(validTicketId, transition.to)

        const response = await updateTicketStatusUseCase.execute(request)

        expect(response.status).toBe(transition.to)
        expect(ticket.status.value).toBe(transition.to)
      }

      expect(mockTicketRepository.save).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed success and failure scenarios', async () => {
      // Create fresh tickets for each request to avoid state conflicts
      const pendingTicket1 = Ticket.create({
        title: 'Test Ticket 1',
        description: 'Test Description 1',
        priority: 'medium',
        status: 'pending',
      })
      const pendingTicket2 = Ticket.create({
        title: 'Test Ticket 2',
        description: 'Test Description 2',
        priority: 'medium',
        status: 'pending',
      })
      const pendingTicket3 = Ticket.create({
        title: 'Test Ticket 3',
        description: 'Test Description 3',
        priority: 'medium',
        status: 'pending',
      })

      const successRequest = new UpdateTicketStatus.Request(validTicketId, 'in_progress')
      const failureRequest = new UpdateTicketStatus.Request(validTicketId, 'completed')

      // First request should succeed
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(pendingTicket1)
      const successResponse = await updateTicketStatusUseCase.execute(successRequest)
      expect(successResponse.status).toBe('in_progress')

      // Second request should fail (invalid transition from pending to completed)
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(pendingTicket2)
      await expect(updateTicketStatusUseCase.execute(failureRequest)).rejects.toThrow(
        TicketValidationError
      )

      // Third request should succeed again
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(pendingTicket3)
      const successRequest2 = new UpdateTicketStatus.Request(validTicketId, 'in_progress')
      const successResponse2 = await updateTicketStatusUseCase.execute(successRequest2)
      expect(successResponse2.status).toBe('in_progress')
    })
  })

  describe('Integration with Domain Objects', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    it('should create TicketId correctly from request', async () => {
      const ticketIdSpy = vi.spyOn(TicketId, 'create')
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await updateTicketStatusUseCase.execute(request)

      expect(ticketIdSpy).toHaveBeenCalledWith(validTicketId)
      ticketIdSpy.mockRestore()
    })

    it('should use domain entity method for status change', async () => {
      const changeStatusSpy = vi.spyOn(existingTicket, 'changeStatus')
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await updateTicketStatusUseCase.execute(request)

      expect(changeStatusSpy).toHaveBeenCalledWith('in_progress')
      changeStatusSpy.mockRestore()
    })

    it('should pass correct ticket to repository save', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await updateTicketStatusUseCase.execute(request)

      expect(mockTicketRepository.save).toHaveBeenCalledWith(existingTicket)
    })

    it('should maintain ticket integrity during status change', async () => {
      const originalTitle = existingTicket.title.value
      const originalDescription = existingTicket.description.value
      const originalPriority = existingTicket.priority.value
      const originalCreatedAt = existingTicket.createdAt

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await updateTicketStatusUseCase.execute(request)

      // Only status and updatedAt should change
      expect(existingTicket.title.value).toBe(originalTitle)
      expect(existingTicket.description.value).toBe(originalDescription)
      expect(existingTicket.priority.value).toBe(originalPriority)
      expect(existingTicket.createdAt).toBe(originalCreatedAt)
      expect(existingTicket.status.value).toBe('in_progress')
      expect(existingTicket.updatedAt.getTime()).toBeGreaterThan(originalCreatedAt.getTime())
    })
  })

  describe('Response Structure', () => {
    beforeEach(() => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
    })

    it('should return response with complete ticket data', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('title')
      expect(response).toHaveProperty('description')
      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('priority')
      expect(response).toHaveProperty('type')
      expect(response).toHaveProperty('privacy')
      expect(response).toHaveProperty('createdAt')
      expect(response).toHaveProperty('updatedAt')
    })

    it('should return response with updated status', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.status).toBe('in_progress')
    })

    it('should return response with updated timestamp', async () => {
      const originalUpdatedAt = existingTicket.updatedAt.getTime()
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(new Date(response.updatedAt).getTime()).toBeGreaterThan(originalUpdatedAt)
    })

    it('should maintain other ticket properties unchanged', async () => {
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      const response = await updateTicketStatusUseCase.execute(request)

      expect(response.title).toBe('Test Ticket')
      expect(response.description).toBe('Test Description')
      expect(response.priority).toBe('medium')
      expect(response.type).toBe('task')
      expect(response.privacy).toBe('local-only')
    })
  })

  describe('Error Recovery', () => {
    it('should handle transient errors gracefully', async () => {
      // First call fails, second succeeds
      vi.mocked(mockTicketRepository.findById)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(existingTicket)

      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      // First call should fail
      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow('Temporary error')

      // Second call should succeed
      const response = await updateTicketStatusUseCase.execute(request)
      expect(response.status).toBe('in_progress')
    })

    it('should not modify ticket state when validation fails', async () => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
      const originalStatus = existingTicket.status.value

      const request = new UpdateTicketStatus.Request(validTicketId, 'completed') // Invalid transition

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow(
        TicketValidationError
      )

      // Ticket should remain unchanged
      expect(existingTicket.status.value).toBe(originalStatus)
      expect(mockTicketRepository.save).not.toHaveBeenCalled()
    })

    it('should handle repository errors without corrupting state', async () => {
      vi.mocked(mockTicketRepository.findById).mockResolvedValue(existingTicket)
      vi.mocked(mockTicketRepository.save).mockRejectedValue(new Error('Save failed'))

      const originalStatus = existingTicket.status.value
      const request = new UpdateTicketStatus.Request(validTicketId, 'in_progress')

      await expect(updateTicketStatusUseCase.execute(request)).rejects.toThrow('Save failed')

      // Domain object should be updated even if save fails
      expect(existingTicket.status.value).toBe('in_progress')
      expect(mockTicketRepository.save).toHaveBeenCalled()
    })
  })
})
