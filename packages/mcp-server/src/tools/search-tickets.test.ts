import { SearchTickets } from '@project-manager/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as containerModule from '../utils/container.ts'
import { searchTicketsTool } from './search-tickets.ts'

// Mock the container
vi.mock('../utils/container.ts')

describe('searchTicketsTool', () => {
  let mockUseCase: {
    execute: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    }
    vi.spyOn(containerModule, 'getSearchTicketsUseCase').mockReturnValue(mockUseCase as any)
  })

  describe('Tool Metadata', () => {
    it('should have correct name', () => {
      expect(searchTicketsTool.name).toBe('search_tickets')
    })

    it('should have correct description', () => {
      expect(searchTicketsTool.description).toBe('Search tickets by query')
    })

    it('should have correct input schema', () => {
      expect(searchTicketsTool.inputSchema).toBeDefined()
      expect(typeof searchTicketsTool.inputSchema).toBe('object')
    })
  })

  describe('Tool Handler', () => {
    it('should search tickets by query in title and description by default', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Fix login bug',
          description: 'Users cannot login with email',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ticket-2',
          title: 'Add login feature',
          description: 'Implement social login options',
          status: 'in_progress',
          priority: 'medium',
          type: 'feature',
          privacy: 'shareable',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: 'login' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: 'login',
            searchIn: ['title', 'description'],
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(2)
      expect(response.tickets[0]).toMatchObject({
        id: 'ticket-1',
        title: 'Fix login bug',
        status: 'pending',
        priority: 'high',
        type: 'bug',
      })
      expect(response.tickets[1]).toMatchObject({
        id: 'ticket-2',
        title: 'Add login feature',
        status: 'in_progress',
        priority: 'medium',
        type: 'feature',
      })
      expect(response.total).toBe(2)
    })

    it('should search tickets only in title', async () => {
      const mockTickets = [
        {
          id: 'title-match',
          title: 'Authentication error handling',
          description: 'Improve error messages',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({
        query: 'authentication',
        searchIn: ['title'],
      })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: 'authentication',
            searchIn: ['title'],
          }),
        })
      )

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toBe('Authentication error handling')
    })

    it('should search tickets only in description', async () => {
      const mockTickets = [
        {
          id: 'desc-match',
          title: 'Update documentation',
          description: 'Add authentication flow diagrams',
          status: 'pending',
          priority: 'low',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({
        query: 'authentication',
        searchIn: ['description'],
      })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: 'authentication',
            searchIn: ['description'],
          }),
        })
      )

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toBe('Update documentation')
    })

    it('should handle empty search results', async () => {
      mockUseCase.execute.mockResolvedValue({ tickets: [] })

      const result = await searchTicketsTool.handler({ query: 'nonexistent' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(0)
      expect(response.total).toBe(0)
    })

    it('should handle case-insensitive search', async () => {
      const mockTickets = [
        {
          id: 'case-1',
          title: 'CRITICAL BUG',
          description: 'System crashes on startup',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: 'critical' })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toBe('CRITICAL BUG')
    })

    it('should handle partial word matching', async () => {
      const mockTickets = [
        {
          id: 'partial-1',
          title: 'Authentication module refactoring',
          description: 'Refactor auth code for better maintainability',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: 'auth' })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toContain('Authentication')
    })

    it('should handle special characters in search query', async () => {
      const mockTickets = [
        {
          id: 'special-1',
          title: 'Fix [BUG] in @mention feature',
          description: 'The @mention feature crashes with #hashtags',
          status: 'pending',
          priority: 'high',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: '@mention' })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toContain('@mention')
    })

    it('should handle multi-word search queries', async () => {
      const mockTickets = [
        {
          id: 'multi-1',
          title: 'User profile page redesign',
          description: 'Update the user profile interface with new design',
          status: 'in_progress',
          priority: 'medium',
          type: 'feature',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: 'user profile' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: 'user profile',
          }),
        })
      )

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toBe('User profile page redesign')
    })

    it('should handle use case errors', async () => {
      const useCaseError = new Error('Search service unavailable')
      useCaseError.name = 'SearchError'

      mockUseCase.execute.mockRejectedValue(useCaseError)

      const result = await searchTicketsTool.handler({ query: 'test' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: true,
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Search service unavailable')
    })

    it('should handle empty query validation', async () => {
      // The schema requires min length of 1, so this should return a validation error
      const result = await searchTicketsTool.handler({ query: '' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: true,
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(false)
      expect(response.error).toContain('too_small')

      // The use case should not be called if validation fails
      expect(mockUseCase.execute).not.toHaveBeenCalled()
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000)
      const mockTickets = []

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: longQuery })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: longQuery,
          }),
        })
      )

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(0)
    })

    it('should handle performance with large result sets', async () => {
      const mockTickets = Array.from({ length: 500 }, (_, i) => ({
        id: `ticket-${i}`,
        title: `Task ${i} with keyword`,
        description: `Description containing the search keyword for ticket ${i}`,
        status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'in_progress' : 'completed',
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        type: i % 3 === 0 ? 'bug' : i % 3 === 1 ? 'feature' : 'task',
        privacy: 'local-only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const startTime = Date.now()
      const result = await searchTicketsTool.handler({ query: 'keyword' })
      const duration = Date.now() - startTime

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(500)
      expect(response.total).toBe(500)
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds
    })

    it('should handle concurrent search requests', async () => {
      const mockTickets = [
        {
          id: 'concurrent-1',
          title: 'Concurrent search test',
          description: 'Testing concurrent search functionality',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      // Execute multiple concurrent searches
      const promises = [
        searchTicketsTool.handler({ query: 'concurrent' }),
        searchTicketsTool.handler({ query: 'search' }),
        searchTicketsTool.handler({ query: 'test' }),
        searchTicketsTool.handler({ query: 'functionality' }),
      ]

      const results = await Promise.all(promises)

      expect(mockUseCase.execute).toHaveBeenCalledTimes(4)
      results.forEach(result => {
        expect(result).toHaveProperty('content')
        expect(result.content).toHaveLength(1)
        const response = JSON.parse(result.content[0].text)
        expect(response.success).toBe(true)
      })
    })

    it('should handle different search field combinations', async () => {
      const mockTickets = [
        {
          id: 'field-1',
          title: 'Test ticket',
          description: 'Description text',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      // Test with both fields (default)
      await searchTicketsTool.handler({ query: 'test' })
      expect(mockUseCase.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            searchIn: ['title', 'description'],
          }),
        })
      )

      // Test with empty array (should use default)
      await searchTicketsTool.handler({ query: 'test', searchIn: [] })
      expect(mockUseCase.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            searchIn: [],
          }),
        })
      )

      // Test with both fields explicitly
      await searchTicketsTool.handler({
        query: 'test',
        searchIn: ['title', 'description'],
      })
      expect(mockUseCase.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            searchIn: ['title', 'description'],
          }),
        })
      )
    })

    it('should handle storage errors', async () => {
      const storageError = new Error('Failed to read search index')
      storageError.name = 'StorageError'

      mockUseCase.execute.mockRejectedValue(storageError)

      const result = await searchTicketsTool.handler({ query: 'test' })

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: true,
      })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Failed to read search index')
    })

    it('should handle Unicode and emoji in search', async () => {
      const mockTickets = [
        {
          id: 'unicode-1',
          title: '🚀 Deploy to production',
          description: 'Deploy the new features with 日本語 support',
          status: 'pending',
          priority: 'high',
          type: 'task',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: '🚀' })

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
      expect(response.tickets[0].title).toBe('🚀 Deploy to production')
    })

    it('should handle regex-like patterns safely', async () => {
      const mockTickets = [
        {
          id: 'regex-1',
          title: 'Fix [a-z]+ pattern matching',
          description: 'The regex .* is not working correctly',
          status: 'pending',
          priority: 'medium',
          type: 'bug',
          privacy: 'local-only',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: '[a-z]+' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: '[a-z]+',
          }),
        })
      )

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(1)
    })

    it('should handle whitespace-only queries', async () => {
      const mockTickets = []

      mockUseCase.execute.mockResolvedValue({ tickets: mockTickets })

      const result = await searchTicketsTool.handler({ query: '   ' })

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.objectContaining({
            search: '   ',
          }),
        })
      )

      const response = JSON.parse(result.content[0].text)
      expect(response.success).toBe(true)
      expect(response.tickets).toHaveLength(0)
    })
  })
})
