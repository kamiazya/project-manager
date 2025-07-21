import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { TicketQueryCriteria, TicketRepository } from '@project-manager/application'
import { PersistenceError, TicketNotFoundError } from '@project-manager/application'
import { Ticket, type TicketId } from '@project-manager/domain'
import type { TicketJSON } from '../types/persistence-types.ts'
import * as TicketMapper from './mappers/ticket-mapper.ts'

/**
 * Simple async mutex for exclusive access to critical sections.
 * Provides atomic lock acquisition and release to prevent race conditions.
 */
class AsyncMutex {
  private locked = false
  private readonly waiters: (() => void)[] = []

  /**
   * Acquires the mutex lock. If the mutex is already locked,
   * the caller will wait until the lock is available.
   */
  async acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this.locked) {
        this.locked = true
        resolve()
      } else {
        this.waiters.push(resolve)
      }
    })
  }

  /**
   * Releases the mutex lock and notifies the next waiter if any.
   */
  release(): void {
    if (this.waiters.length > 0) {
      const nextWaiter = this.waiters.shift()
      if (nextWaiter) {
        nextWaiter()
      }
    } else {
      this.locked = false
    }
  }

  /**
   * Executes a function with exclusive access, automatically
   * acquiring and releasing the lock.
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

/**
 * JSON file-based implementation of the ticket repository using DDD principles.
 * This adapter implements the TicketRepository interface using JSON files for persistence.
 *
 * Key improvements:
 * - Uses value objects (TicketId) instead of primitive strings
 * - Delegates mapping logic to TicketMapper
 * - Domain objects remain pure without persistence concerns
 * - Requires storage path through constructor for explicit dependency management
 * - No infrastructure layer configuration dependencies
 */
export class JsonTicketRepository implements TicketRepository {
  private readonly filePath: string
  private readonly fileMutex = new AsyncMutex()

  constructor(filePath: string) {
    if (!filePath.trim()) {
      throw new Error('filePath is required for JsonTicketRepository')
    }
    this.filePath = filePath.trim()
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

  async queryTickets(criteria: TicketQueryCriteria = {}): Promise<Ticket[]> {
    const tickets = await this.loadTicketsFromFile()

    // Apply filters at the persistence layer for better performance
    let filteredTickets = tickets

    // Filter by status
    if (criteria.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === criteria.status)
    }

    // Filter by priority
    if (criteria.priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === criteria.priority)
    }

    // Filter by type
    if (criteria.type) {
      filteredTickets = filteredTickets.filter(ticket => ticket.type === criteria.type)
    }

    // Filter by text search in title/description
    if (criteria.search && criteria.search.trim() !== '') {
      const searchLower = criteria.search.toLowerCase()
      const searchIn = criteria.searchIn || ['title', 'description'] // Default to both fields

      filteredTickets = filteredTickets.filter(ticket => {
        let hasMatch = false

        // Check title if included in searchIn
        if (searchIn.includes('title')) {
          const titleMatch = ticket.title.toLowerCase().includes(searchLower)
          if (titleMatch) hasMatch = true
        }

        // Check description if included in searchIn
        if (searchIn.includes('description') && ticket.description) {
          const descriptionMatch = ticket.description.toLowerCase().includes(searchLower)
          if (descriptionMatch) hasMatch = true
        }

        return hasMatch
      })
    }

    // Apply pagination: offset first, then limit
    const startIndex = criteria.offset && criteria.offset > 0 ? criteria.offset : 0
    const endIndex =
      criteria.limit && criteria.limit > 0 ? startIndex + criteria.limit : filteredTickets.length

    filteredTickets = filteredTickets.slice(startIndex, endIndex)

    // Convert filtered persistence objects to domain objects
    return TicketMapper.toDomainList(filteredTickets)
  }

  async delete(id: TicketId): Promise<void> {
    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()
      const filteredTickets = tickets.filter(t => t.id !== id.value)

      if (filteredTickets.length === tickets.length) {
        throw new TicketNotFoundError(id.value, 'JsonTicketRepository')
      }

      await this.saveTicketsToFile(filteredTickets)
    })
  }

  private async withFileLock<T>(operation: () => Promise<T>): Promise<T> {
    return this.fileMutex.withLock(operation)
  }

  private async loadTicketsFromFile(): Promise<TicketJSON[]> {
    try {
      // Check if file exists using async access
      try {
        await access(this.filePath, constants.F_OK)
      } catch {
        // File doesn't exist
        return []
      }

      const content = await readFile(this.filePath, 'utf-8')
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
      throw new PersistenceError(
        'read',
        `Failed to read tickets file: ${this.filePath}`,
        'Ticket',
        { filePath: this.filePath },
        error instanceof Error ? error : undefined
      )
    }
  }

  private async saveTicketsToFile(tickets: TicketJSON[]): Promise<void> {
    try {
      const dir = dirname(this.filePath)

      // Check if directory exists using async access
      try {
        await access(dir, constants.F_OK)
      } catch {
        // Directory doesn't exist, create it
        await mkdir(dir, { recursive: true })
      }

      const content = JSON.stringify(tickets, null, 2)
      await writeFile(this.filePath, content, 'utf-8')
    } catch (error) {
      throw new PersistenceError(
        'write',
        `Failed to write tickets file: ${this.filePath}`,
        'Ticket',
        { filePath: this.filePath },
        error instanceof Error ? error : undefined
      )
    }
  }
}
