/**
 * Tests for SDKContainer
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { SDKContainer } from './sdk-container.ts'

describe('SDKContainer', () => {
  beforeEach(() => {
    SDKContainer.reset()
  })

  it('should create a container with default configuration', async () => {
    const container = await SDKContainer.create()

    expect(container).toBeDefined()
    expect(container.isBound('TicketRepository')).toBe(true)
    expect(container.isBound('UseCaseFactory')).toBe(true)
    expect(container.isBound('CreateTicketUseCase')).toBe(true)
  })

  it('should create a container with custom configuration', async () => {
    const config = {
      environment: 'test' as const,
      storagePath: './custom-storage',
    }

    const container = await SDKContainer.create(config)

    expect(container).toBeDefined()
    expect(container.isBound('TicketRepository')).toBe(true)
  })

  it('should return the same container instance on subsequent calls', async () => {
    const container1 = await SDKContainer.create()
    const container2 = await SDKContainer.create()

    expect(container1).toBe(container2)
  })

  it('should reset container instance', async () => {
    const container1 = await SDKContainer.create()
    SDKContainer.reset()
    const container2 = await SDKContainer.create()

    expect(container1).not.toBe(container2)
  })

  it('should bind all required use cases', async () => {
    const container = await SDKContainer.create()

    const useCaseBindings = [
      'CreateTicketUseCase',
      'GetTicketByIdUseCase',
      'GetAllTicketsUseCase',
      'UpdateTicketUseCase',
      'UpdateTicketStatusUseCase',
      'DeleteTicketUseCase',
      'SearchTicketsUseCase',
      'GetTicketStatsUseCase',
    ]

    for (const binding of useCaseBindings) {
      expect(container.isBound(binding)).toBe(true)
    }
  })

  it('should resolve use cases correctly', async () => {
    const container = await SDKContainer.create()

    const createTicketUseCase = container.get('CreateTicketUseCase') as any
    const getTicketByIdUseCase = container.get('GetTicketByIdUseCase') as any

    expect(createTicketUseCase).toBeDefined()
    expect(getTicketByIdUseCase).toBeDefined()
    expect(typeof createTicketUseCase.execute).toBe('function')
    expect(typeof getTicketByIdUseCase.execute).toBe('function')
  })
})
