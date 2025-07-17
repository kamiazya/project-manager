import { UseCaseFactory, UseCaseFactoryProvider } from '@project-manager/application'
import { getStoragePath } from '@project-manager/shared'
import { McpTicketRepository } from './mcp-ticket-repository.ts'

let useCaseFactory: UseCaseFactory | null = null

function getUseCaseFactory(): UseCaseFactory {
  if (!useCaseFactory) {
    const provider = UseCaseFactoryProvider.getInstance()
    const ticketRepository = new McpTicketRepository(getStoragePath())
    useCaseFactory = provider.createUseCaseFactory({
      ticketRepository,
    })
  }
  return useCaseFactory
}

export function getCreateTicketUseCase() {
  return getUseCaseFactory().createCreateTicketUseCase()
}

export function getUpdateTicketStatusUseCase() {
  return getUseCaseFactory().createUpdateTicketStatusUseCase()
}

export function getGetTicketStatsUseCase() {
  return getUseCaseFactory().createGetTicketStatsUseCase()
}

export function getGetAllTicketsUseCase() {
  return getUseCaseFactory().createGetAllTicketsUseCase()
}

export function getSearchTicketsUseCase() {
  return getUseCaseFactory().createSearchTicketsUseCase()
}

export function getGetTicketByIdUseCase() {
  return getUseCaseFactory().createGetTicketByIdUseCase()
}

// For backward compatibility with tests
export function getContainer() {
  // Create a mock container for tests
  const mockContainer = {
    get: (symbol: any) => {
      // Mock container that returns use cases based on symbol
      if (symbol === 'CreateTicketUseCase') {
        return getCreateTicketUseCase()
      }
      if (symbol === 'UpdateTicketStatusUseCase') {
        return getUpdateTicketStatusUseCase()
      }
      if (symbol === 'GetTicketStatsUseCase') {
        return getGetTicketStatsUseCase()
      }
      if (symbol === 'GetAllTicketsUseCase') {
        return getGetAllTicketsUseCase()
      }
      if (symbol === 'SearchTicketsUseCase') {
        return getSearchTicketsUseCase()
      }
      if (symbol === 'GetTicketByIdUseCase') {
        return getGetTicketByIdUseCase()
      }
      throw new Error(`Unknown symbol: ${symbol}`)
    },
  }
  return mockContainer
}
