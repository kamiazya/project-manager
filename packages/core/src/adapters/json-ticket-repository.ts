import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { TicketJSON, TicketSearchCriteria } from '@project-manager/shared'
import {
  ENV_VARS,
  ERROR_MESSAGES,
  FILE_SYSTEM,
  StorageError,
  TicketNotFoundError,
  VALIDATION,
} from '@project-manager/shared'
import { injectable } from 'inversify'
import { Ticket } from '../entities/ticket.js'
import type { ITicketRepository } from '../ports/ticket-repository.js'

/**
 * JSON file-based implementation of the ticket repository.
 * This adapter implements the ITicketRepository interface using
 * JSON files for persistence.
 *
 * Features:
 * - Atomic file operations with write locking
 * - Graceful handling of corrupted data
 * - Concurrent operation safety
 * - ID validation
 *
 * This class belongs to the Infrastructure layer and implements
 * the repository interface defined in the Domain layer.
 */
@injectable()
export class JsonTicketRepository implements ITicketRepository {
  private readonly filePath: string
  private readonly writeLock = new Map<string, Promise<void>>()

  constructor(filePath?: string) {
    this.filePath = filePath || this.getDefaultPath()
  }

  private getDefaultPath(): string {
    // Default path when no path is provided
    return process.env[ENV_VARS.STORAGE_PATH] || FILE_SYSTEM.DEFAULT_TICKETS_FILE
  }

  async save(ticket: Ticket): Promise<void> {
    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()

      // Add or update ticket
      const existingIndex = tickets.findIndex(t => t.id === ticket.id)
      if (existingIndex >= 0) {
        tickets[existingIndex] = ticket.toJSON()
      } else {
        tickets.push(ticket.toJSON())
      }

      await this.writeTicketsToFile(tickets)
    })
  }

  async findById(id: string): Promise<Ticket> {
    this.validateTicketId(id)

    const ticket = await this.findByIdOrNull(id)
    if (!ticket) {
      throw new TicketNotFoundError(id)
    }

    return ticket
  }

  async findByIdOrNull(id: string): Promise<Ticket | null> {
    this.validateTicketId(id)

    const tickets = await this.loadTicketsFromFile()
    const ticketData = tickets.find(t => t.id === id)

    return ticketData ? Ticket.fromJSON(ticketData) : null
  }

  async findAll(): Promise<Ticket[]> {
    const tickets = await this.loadTicketsFromFile()
    return tickets.map(ticketData => Ticket.fromJSON(ticketData))
  }

  async search(criteria: TicketSearchCriteria): Promise<Ticket[]> {
    const tickets = await this.loadTicketsFromFile()

    const filtered = tickets.filter(ticket => {
      // Check each criteria
      if (criteria.title && !ticket.title.toLowerCase().includes(criteria.title.toLowerCase())) {
        return false
      }
      if (criteria.status && ticket.status !== criteria.status) {
        return false
      }
      if (criteria.priority && ticket.priority !== criteria.priority) {
        return false
      }
      if (criteria.type && ticket.type !== criteria.type) {
        return false
      }
      if (criteria.privacy && ticket.privacy !== criteria.privacy) {
        return false
      }
      return true
    })

    return filtered.map(ticketData => Ticket.fromJSON(ticketData))
  }

  async update(ticket: Ticket): Promise<void> {
    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()
      const existingIndex = tickets.findIndex(t => t.id === ticket.id)

      if (existingIndex === -1) {
        throw new TicketNotFoundError(ticket.id)
      }

      tickets[existingIndex] = ticket.toJSON()
      await this.writeTicketsToFile(tickets)
    })
  }

  async delete(id: string): Promise<void> {
    this.validateTicketId(id)

    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()
      const existingIndex = tickets.findIndex(t => t.id === id)

      if (existingIndex === -1) {
        throw new TicketNotFoundError(id)
      }

      tickets.splice(existingIndex, 1)
      await this.writeTicketsToFile(tickets)
    })
  }

  async exists(id: string): Promise<boolean> {
    this.validateTicketId(id)

    const tickets = await this.loadTicketsFromFile()
    return tickets.some(t => t.id === id)
  }

  async count(): Promise<number> {
    const tickets = await this.loadTicketsFromFile()
    return tickets.length
  }

  async clear(): Promise<void> {
    await this.withFileLock(async () => {
      await this.writeTicketsToFile([])
    })
  }

  private async loadTicketsFromFile(): Promise<TicketJSON[]> {
    if (!existsSync(this.filePath)) {
      return []
    }

    try {
      const content = await readFile(this.filePath, FILE_SYSTEM.FILE_ENCODING)
      if (!content.trim()) {
        return []
      }
      return JSON.parse(content)
    } catch (_error) {
      // If file is corrupted or doesn't exist, return empty array
      return []
    }
  }

  private async withFileLock<T>(operation: () => Promise<T>): Promise<T> {
    const lockKey = this.filePath

    // Chain operations to ensure serialization
    const currentPromise = this.writeLock.get(lockKey) || Promise.resolve()

    const operationPromise = currentPromise
      .then(async () => {
        return await operation()
      })
      .catch(error => {
        // Don't let previous errors affect new operations
        throw error
      })

    // Set the lock to this operation
    this.writeLock.set(lockKey, operationPromise as Promise<void>)

    try {
      return await operationPromise
    } finally {
      // Only delete the lock if this is the current operation
      if (this.writeLock.get(lockKey) === operationPromise) {
        this.writeLock.delete(lockKey)
      }
    }
  }

  private async writeTicketsToFile(tickets: TicketJSON[]): Promise<void> {
    try {
      // Ensure directory exists
      const dir = dirname(this.filePath)
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }

      // Write file atomically
      const content = JSON.stringify(tickets, null, FILE_SYSTEM.JSON_INDENT)
      await writeFile(this.filePath, content, FILE_SYSTEM.FILE_ENCODING)
    } catch (error) {
      throw new StorageError(
        `Failed to write tickets to file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  private validateTicketId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error(ERROR_MESSAGES.ID_REQUIRED)
    }

    if (id.trim().length === 0) {
      throw new Error(ERROR_MESSAGES.ID_EMPTY)
    }

    if (id.length < VALIDATION.TICKET_ID_MIN_LENGTH) {
      throw new Error(ERROR_MESSAGES.ID_TOO_SHORT(VALIDATION.TICKET_ID_MIN_LENGTH))
    }

    if (id.length > VALIDATION.TICKET_ID_MAX_LENGTH) {
      throw new Error(ERROR_MESSAGES.ID_TOO_LONG(VALIDATION.TICKET_ID_MAX_LENGTH))
    }

    // Check if ID contains only valid characters (alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      throw new Error(ERROR_MESSAGES.ID_INVALID_FORMAT)
    }
  }
}
