import type { TicketRepository, TicketStatistics } from '@project-manager/core'
import { Ticket, TicketId } from '@project-manager/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CliTicketRepository } from './cli-ticket-repository.ts'

// Create a mock of the core TicketRepository interface
const createMockInnerRepository = (): TicketRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  delete: vi.fn(),
  getStatistics: vi.fn(),
})

describe('CliTicketRepository', () => {
  let mockInnerRepository: TicketRepository
  let cliRepository: CliTicketRepository
  let mockTicket: Ticket
  let mockTicketId: TicketId

  beforeEach(() => {
    mockInnerRepository = createMockInnerRepository()
    cliRepository = new CliTicketRepository(mockInnerRepository)
    mockTicket = Ticket.create({
      title: 'Test Ticket',
      description: 'A description',
      priority: 'medium',
    })
    mockTicketId = mockTicket.id
  })

  it('should call save on the inner repository', async () => {
    await cliRepository.save(mockTicket)
    expect(mockInnerRepository.save).toHaveBeenCalledWith(mockTicket)
    expect(mockInnerRepository.save).toHaveBeenCalledTimes(1)
  })

  it('should call findById on the inner repository and return the result', async () => {
    // Mock the return value
    vi.spyOn(mockInnerRepository, 'findById').mockResolvedValue(mockTicket)

    const result = await cliRepository.findById(mockTicketId)
    expect(mockInnerRepository.findById).toHaveBeenCalledWith(mockTicketId)
    expect(mockInnerRepository.findById).toHaveBeenCalledTimes(1)
    expect(result).toBe(mockTicket)
  })

  it('should call findAll on the inner repository and return the result', async () => {
    const tickets = [mockTicket]
    vi.spyOn(mockInnerRepository, 'findAll').mockResolvedValue(tickets)

    const result = await cliRepository.findAll()
    expect(mockInnerRepository.findAll).toHaveBeenCalledTimes(1)
    expect(result).toBe(tickets)
  })

  it('should call delete on the inner repository', async () => {
    await cliRepository.delete(mockTicketId)
    expect(mockInnerRepository.delete).toHaveBeenCalledWith(mockTicketId)
    expect(mockInnerRepository.delete).toHaveBeenCalledTimes(1)
  })

  it('should call getStatistics on the inner repository and return the result', async () => {
    const stats: TicketStatistics = {
      total: 1,
      pending: 1,
      inProgress: 0,
      completed: 0,
      archived: 0,
      byPriority: { high: 0, medium: 1, low: 0 },
      byType: { feature: 0, bug: 0, task: 1 },
    }
    vi.spyOn(mockInnerRepository, 'getStatistics').mockResolvedValue(stats)

    const result = await cliRepository.getStatistics()
    expect(mockInnerRepository.getStatistics).toHaveBeenCalledTimes(1)
    expect(result).toBe(stats)
  })

  it('should be able to add CLI-specific behavior without affecting the inner repository', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // Imagine the save method was modified to log
    // We can test that logging happens AND the inner method is still called.
    // For this test, we'll just add the log here to demonstrate.
    const originalSave = cliRepository.save
    cliRepository.save = async (ticket: Ticket) => {
      console.log(`Saving ticket: ${ticket.id.value}`)
      await originalSave.call(cliRepository, ticket)
    }

    await cliRepository.save(mockTicket)

    expect(consoleSpy).toHaveBeenCalledWith(`Saving ticket: ${mockTicket.id.value}`)
    expect(mockInnerRepository.save).toHaveBeenCalledWith(mockTicket)

    // Restore original implementation
    consoleSpy.mockRestore()
  })
})
