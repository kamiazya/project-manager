import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { TicketJSON } from '@project-manager/shared'
import {
  ENV_VARS,
  ERROR_MESSAGES,
  FILE_SYSTEM,
  StorageError,
  TicketNotFoundError,
} from '@project-manager/shared'
import { injectable } from 'inversify'
import type { TicketRepository } from '../../application/repositories/ticket-repository.js'
import { Ticket } from '../../domain/entities/ticket.js'
import type { TicketId } from '../../domain/value-objects/ticket-id.js'
import { TicketMapper } from './mappers/ticket-mapper.js'

/**
 * JSON file-based implementation of the ticket repository using DDD principles.
 * This adapter implements the TicketRepository interface using JSON files for persistence.
 *
 * Key improvements:
 * - Uses value objects (TicketId) instead of primitive strings
 * - Delegates mapping logic to TicketMapper
 * - Domain objects remain pure without persistence concerns
 */
@injectable()
export class JsonTicketRepository implements TicketRepository {
  private readonly filePath: string
  private readonly writeLock = new Map<string, Promise<void>>()

  constructor(filePath?: string) {
    this.filePath = filePath || this.getDefaultPath()
  }

  private getDefaultPath(): string {
    return process.env[ENV_VARS.STORAGE_PATH] || FILE_SYSTEM.DEFAULT_TICKETS_FILE
  }

  async save(ticket: Ticket): Promise<void> {
    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()

      // Convert domain object to persistence format
      const ticketJson = TicketMapper.toPersistence(ticket)

      // Add or update ticket
      const existingIndex = tickets.findIndex(t => t.id === ticketJson.id)
      if (existingIndex !== -1) {
        tickets[existingIndex] = ticketJson
      } else {
        tickets.push(ticketJson)
      }

      await this.saveTicketsToFile(tickets)
    })
  }

  async findById(id: TicketId): Promise<Ticket | null> {
    const tickets = await this.loadTicketsFromFile()
    const ticketJson = tickets.find(t => t.id === id.value)

    if (!ticketJson) {
      return null
    }

    // Convert persistence format to domain object
    return TicketMapper.toDomain(ticketJson)
  }

  async findAll(): Promise<Ticket[]> {
    const tickets = await this.loadTicketsFromFile()

    // Convert all persistence objects to domain objects
    return TicketMapper.toDomainList(tickets)
  }

  async delete(id: TicketId): Promise<void> {
    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()
      const filteredTickets = tickets.filter(t => t.id !== id.value)

      if (filteredTickets.length === tickets.length) {
        throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(id.value))
      }

      await this.saveTicketsToFile(filteredTickets)
    })
  }

  private async withFileLock<T>(operation: () => Promise<T>): Promise<T> {
    const lockKey = this.filePath
    const existingLock = this.writeLock.get(lockKey)

    if (existingLock) {
      await existingLock
    }

    let releaseLock: () => void
    const newLock = new Promise<void>(resolve => {
      releaseLock = resolve
    })

    this.writeLock.set(lockKey, newLock)

    try {
      return await operation()
    } finally {
      this.writeLock.delete(lockKey)
      releaseLock!()
    }
  }

  private async loadTicketsFromFile(): Promise<TicketJSON[]> {
    try {
      if (!existsSync(this.filePath)) {
        return []
      }

      const content = await readFile(this.filePath, FILE_SYSTEM.FILE_ENCODING)
      if (!content.trim()) {
        return []
      }

      const data = JSON.parse(content)
      if (!Array.isArray(data)) {
        console.warn('Invalid data format in tickets file, expected array')
        return []
      }

      return data
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('Corrupted tickets file, returning empty array')
        return []
      }
      throw new StorageError(
        `${ERROR_MESSAGES.OPERATION_FAILED.READ} ${this.filePath}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  private async saveTicketsToFile(tickets: TicketJSON[]): Promise<void> {
    try {
      const dir = dirname(this.filePath)
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }

      const content = JSON.stringify(tickets, null, FILE_SYSTEM.JSON_INDENT)
      await writeFile(this.filePath, content, FILE_SYSTEM.FILE_ENCODING)
    } catch (error) {
      throw new StorageError(
        `Failed to write file: ${this.filePath}`,
        error instanceof Error ? error : undefined
      )
    }
  }
}
