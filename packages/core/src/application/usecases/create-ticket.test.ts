import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Ticket } from '../../domain/entities/ticket.ts'
import { TicketValidationError } from '../../domain/types/ticket-types.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { CreateTicket } from './create-ticket.ts'

describe('CreateTicket', () => {
  let mockTicketRepository: TicketRepository
  let createTicketUseCase: CreateTicket.UseCase

  beforeEach(() => {
    mockTicketRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      getStatistics: vi.fn(),
    }
    createTicketUseCase = new CreateTicket.UseCase(mockTicketRepository)
  })

  describe('Request DTO', () => {
    it('should create request with all fields', () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'Users cannot login with email',
        'high',
        'bug',
        'public'
      )

      expect(request.title).toBe('Fix login bug')
      expect(request.description).toBe('Users cannot login with email')
      expect(request.priority).toBe('high')
      expect(request.type).toBe('bug')
      expect(request.privacy).toBe('public')
    })

    it('should create request with minimal fields', () => {
      const request = new CreateTicket.Request('Fix login bug', 'Users cannot login with email')

      expect(request.title).toBe('Fix login bug')
      expect(request.description).toBe('Users cannot login with email')
      expect(request.priority).toBeUndefined()
      expect(request.type).toBeUndefined()
      expect(request.privacy).toBeUndefined()
    })

    it('should convert to CreateTicketData with defaults', () => {
      const request = new CreateTicket.Request('Fix login bug', 'Users cannot login with email')

      const createData = request.toCreateTicketData()

      expect(createData.title).toBe('Fix login bug')
      expect(createData.description).toBe('Users cannot login with email')
      expect(createData.priority).toBe('medium')
      expect(createData.type).toBe('task')
      expect(createData.privacy).toBe('local-only')
    })

    it('should convert to CreateTicketData with provided values', () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'Users cannot login with email',
        'high',
        'bug',
        'public'
      )

      const createData = request.toCreateTicketData()

      expect(createData.title).toBe('Fix login bug')
      expect(createData.description).toBe('Users cannot login with email')
      expect(createData.priority).toBe('high')
      expect(createData.type).toBe('bug')
      expect(createData.privacy).toBe('public')
    })
  })

  describe('UseCase - Happy Path', () => {
    it('should create ticket with valid data', async () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'Users cannot login with email',
        'high',
        'bug',
        'public'
      )

      const response = await createTicketUseCase.execute(request)

      expect(response.id).toBeDefined()
      expect(response.title).toBe('Fix login bug')
      expect(response.description).toBe('Users cannot login with email')
      expect(response.priority).toBe('high')
      expect(response.type).toBe('bug')
      expect(response.privacy).toBe('public')
      expect(response.status).toBe('pending')
      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
      expect(mockTicketRepository.save).toHaveBeenCalledWith(expect.any(Ticket))
    })

    it('should create ticket with minimal data using defaults', async () => {
      const request = new CreateTicket.Request('Fix login bug', 'Users cannot login with email')

      const response = await createTicketUseCase.execute(request)

      expect(response.id).toBeDefined()
      expect(response.title).toBe('Fix login bug')
      expect(response.description).toBe('Users cannot login with email')
      expect(response.priority).toBe('medium')
      expect(response.type).toBe('task')
      expect(response.privacy).toBe('local-only')
      expect(response.status).toBe('pending')
      expect(mockTicketRepository.save).toHaveBeenCalledWith(expect.any(Ticket))
    })

    it('should generate unique IDs for multiple tickets', async () => {
      const request1 = new CreateTicket.Request('Ticket 1', 'Description 1')
      const request2 = new CreateTicket.Request('Ticket 2', 'Description 2')

      const response1 = await createTicketUseCase.execute(request1)
      const response2 = await createTicketUseCase.execute(request2)

      expect(response1.id).toBeDefined()
      expect(response2.id).toBeDefined()
      expect(response1.id).not.toBe(response2.id)
    })

    it('should set creation and update timestamps', async () => {
      const request = new CreateTicket.Request('Test', 'Test description')

      const response = await createTicketUseCase.execute(request)

      expect(response.createdAt).toBeDefined()
      expect(response.updatedAt).toBeDefined()
      expect(response.createdAt).toBe(response.updatedAt)
    })
  })

  describe('Input Validation Edge Cases', () => {
    describe('Title Validation', () => {
      it('should throw error for empty title', async () => {
        const request = new CreateTicket.Request('', 'Valid description')

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Title cannot be empty or whitespace only'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for whitespace-only title', async () => {
        const request = new CreateTicket.Request('   ', 'Valid description')

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Title cannot be empty or whitespace only'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for title exceeding maximum length', async () => {
        const longTitle = 'A'.repeat(201) // Exceeds 200 character limit
        const request = new CreateTicket.Request(longTitle, 'Valid description')

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Title cannot exceed 200 characters'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should handle title at maximum length boundary', async () => {
        const maxLengthTitle = 'A'.repeat(200) // Exactly 200 characters
        const request = new CreateTicket.Request(maxLengthTitle, 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.title).toBe(maxLengthTitle)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should handle minimum valid title length', async () => {
        const minTitle = 'A'
        const request = new CreateTicket.Request(minTitle, 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.title).toBe(minTitle)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should trim whitespace from title', async () => {
        const titleWithWhitespace = '  Fix login bug  '
        const request = new CreateTicket.Request(titleWithWhitespace, 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.title).toBe('Fix login bug')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should handle special characters in title', async () => {
        const specialTitle = 'Fix: bug/issue #123 (urgent)'
        const request = new CreateTicket.Request(specialTitle, 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.title).toBe(specialTitle)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should handle Unicode characters in title', async () => {
        const unicodeTitle = 'ユーザー認証エラー修正 🔧'
        const request = new CreateTicket.Request(unicodeTitle, 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.title).toBe(unicodeTitle)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })
    })

    describe('Description Validation', () => {
      it('should throw error for empty description', async () => {
        const request = new CreateTicket.Request('Valid title', '')

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Description cannot be empty or whitespace only'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for whitespace-only description', async () => {
        const request = new CreateTicket.Request('Valid title', '   ')

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Description cannot be empty or whitespace only'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should throw error for description exceeding maximum length', async () => {
        const longDescription = 'A'.repeat(5001) // Exceeds 5000 character limit
        const request = new CreateTicket.Request('Valid title', longDescription)

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(TicketValidationError)
        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Description cannot exceed 5000 characters'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should handle description at maximum length boundary', async () => {
        const maxLengthDescription = 'A'.repeat(5000) // Exactly 5000 characters
        const request = new CreateTicket.Request('Valid title', maxLengthDescription)

        const response = await createTicketUseCase.execute(request)

        expect(response.description).toBe(maxLengthDescription)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should handle minimum valid description length', async () => {
        const minDescription = 'A'
        const request = new CreateTicket.Request('Valid title', minDescription)

        const response = await createTicketUseCase.execute(request)

        expect(response.description).toBe(minDescription)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should trim whitespace from description', async () => {
        const descriptionWithWhitespace = '  Users cannot login with email  '
        const request = new CreateTicket.Request('Valid title', descriptionWithWhitespace)

        const response = await createTicketUseCase.execute(request)

        expect(response.description).toBe('Users cannot login with email')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should handle newlines and tabs in description', async () => {
        const descriptionWithFormatting = 'Line 1\\nLine 2\\tTabbed content'
        const request = new CreateTicket.Request('Valid title', descriptionWithFormatting)

        const response = await createTicketUseCase.execute(request)

        expect(response.description).toBe(descriptionWithFormatting)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should handle Unicode characters in description', async () => {
        const unicodeDescription = 'ユーザーがメールアドレスでログインできない問題を修正する 📝'
        const request = new CreateTicket.Request('Valid title', unicodeDescription)

        const response = await createTicketUseCase.execute(request)

        expect(response.description).toBe(unicodeDescription)
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })
    })

    describe('Priority Validation', () => {
      it('should handle all valid priority values', async () => {
        const priorities = ['high', 'medium', 'low'] as const

        for (const priority of priorities) {
          const request = new CreateTicket.Request('Valid title', 'Valid description', priority)

          const response = await createTicketUseCase.execute(request)

          expect(response.priority).toBe(priority)
        }
      })

      it('should throw error for invalid priority', async () => {
        const request = new CreateTicket.Request(
          'Valid title',
          'Valid description',
          'invalid' as any
        )

        await expect(createTicketUseCase.execute(request)).rejects.toThrow(
          'Invalid ticket priority: invalid'
        )
        expect(mockTicketRepository.save).not.toHaveBeenCalled()
      })

      it('should use default priority when not provided', async () => {
        const request = new CreateTicket.Request('Valid title', 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.priority).toBe('medium')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })
    })

    describe('Type Validation', () => {
      it('should handle all valid type values', async () => {
        const types = ['feature', 'bug', 'task'] as const

        for (const type of types) {
          const request = new CreateTicket.Request(
            'Valid title',
            'Valid description',
            'medium',
            type
          )

          const response = await createTicketUseCase.execute(request)

          expect(response.type).toBe(type)
        }
      })

      it('should accept invalid type values (no validation in create)', async () => {
        const request = new CreateTicket.Request(
          'Valid title',
          'Valid description',
          'medium',
          'invalid' as any
        )

        const response = await createTicketUseCase.execute(request)

        expect(response.type).toBe('invalid')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should use default type when not provided', async () => {
        const request = new CreateTicket.Request('Valid title', 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.type).toBe('task')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })
    })

    describe('Privacy Validation', () => {
      it('should handle all valid privacy values', async () => {
        const privacies = ['local-only', 'shareable', 'public'] as const

        for (const privacy of privacies) {
          const request = new CreateTicket.Request(
            'Valid title',
            'Valid description',
            'medium',
            'task',
            privacy
          )

          const response = await createTicketUseCase.execute(request)

          expect(response.privacy).toBe(privacy)
        }
      })

      it('should accept invalid privacy values (no validation in create)', async () => {
        const request = new CreateTicket.Request(
          'Valid title',
          'Valid description',
          'medium',
          'task',
          'invalid' as any
        )

        const response = await createTicketUseCase.execute(request)

        expect(response.privacy).toBe('invalid')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })

      it('should use default privacy when not provided', async () => {
        const request = new CreateTicket.Request('Valid title', 'Valid description')

        const response = await createTicketUseCase.execute(request)

        expect(response.privacy).toBe('local-only')
        expect(mockTicketRepository.save).toHaveBeenCalled()
      })
    })
  })

  describe('Repository Error Handling', () => {
    it('should propagate repository save errors', async () => {
      const request = new CreateTicket.Request('Valid title', 'Valid description')
      const saveError = new Error('Database connection failed')
      vi.mocked(mockTicketRepository.save).mockRejectedValue(saveError)

      await expect(createTicketUseCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should propagate repository storage errors', async () => {
      const request = new CreateTicket.Request('Valid title', 'Valid description')
      const storageError = new Error('Disk full')
      vi.mocked(mockTicketRepository.save).mockRejectedValue(storageError)

      await expect(createTicketUseCase.execute(request)).rejects.toThrow('Disk full')
    })

    it('should propagate repository permission errors', async () => {
      const request = new CreateTicket.Request('Valid title', 'Valid description')
      const permissionError = new Error('Permission denied')
      vi.mocked(mockTicketRepository.save).mockRejectedValue(permissionError)

      await expect(createTicketUseCase.execute(request)).rejects.toThrow('Permission denied')
    })
  })

  describe('Concurrency and Performance', () => {
    it('should handle concurrent ticket creation', async () => {
      const request1 = new CreateTicket.Request('Ticket 1', 'Description 1')
      const request2 = new CreateTicket.Request('Ticket 2', 'Description 2')
      const request3 = new CreateTicket.Request('Ticket 3', 'Description 3')

      const promises = [
        createTicketUseCase.execute(request1),
        createTicketUseCase.execute(request2),
        createTicketUseCase.execute(request3),
      ]

      const responses = await Promise.all(promises)

      expect(responses).toHaveLength(3)
      expect(responses[0]?.id).toBeDefined()
      expect(responses[1]?.id).toBeDefined()
      expect(responses[2]?.id).toBeDefined()
      expect(responses[0]?.id).not.toBe(responses[1]?.id)
      expect(responses[1]?.id).not.toBe(responses[2]?.id)
      expect(responses[0]?.id).not.toBe(responses[2]?.id)
      expect(mockTicketRepository.save).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid sequential ticket creation', async () => {
      const requests = Array.from(
        { length: 10 },
        (_, i) => new CreateTicket.Request(`Ticket ${i + 1}`, `Description ${i + 1}`)
      )

      const responses = []
      for (const request of requests) {
        responses.push(await createTicketUseCase.execute(request))
      }

      expect(responses).toHaveLength(10)
      const ids = responses.map(r => r.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(10) // All IDs should be unique
      expect(mockTicketRepository.save).toHaveBeenCalledTimes(10)
    })
  })

  describe('Response Structure', () => {
    it('should return proper response structure', async () => {
      const request = new CreateTicket.Request(
        'Fix login bug',
        'Users cannot login with email',
        'high',
        'bug',
        'public'
      )

      const response = await createTicketUseCase.execute(request)

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

    it('should return response with correct structure', async () => {
      const request = new CreateTicket.Request('Valid title', 'Valid description')

      const response = await createTicketUseCase.execute(request)

      // Response should be a TicketResponse object (Response extends TicketResponse)
      expect(response.constructor.name).toBe('TicketResponse')
      expect(typeof response.id).toBe('string')
      expect(typeof response.title).toBe('string')
      expect(typeof response.description).toBe('string')
    })
  })
})
