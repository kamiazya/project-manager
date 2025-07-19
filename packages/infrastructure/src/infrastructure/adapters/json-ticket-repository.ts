import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type {
  TicketQueryFilters,
  TicketRepository,
  TicketSearchCriteria,
} from '@project-manager/application'
import { Ticket, type TicketId } from '@project-manager/domain'
import { StorageError, TicketNotFoundError } from '../errors/infrastructure-errors.ts'
import type { TicketJSON } from '../types/persistence-types.ts'
import * as TicketMapper from './mappers/ticket-mapper.ts'

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
  private isLocked = false
  private readonly waiting: (() => void)[] = []

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

  async findAll(): Promise<Ticket[]> {
    const tickets = await this.loadTicketsFromFile()

    // Convert all persistence objects to domain objects
    return TicketMapper.toDomainList(tickets)
  }

  async findAllWithFilters(filters: TicketQueryFilters): Promise<Ticket[]> {
    const tickets = await this.loadTicketsFromFile()

    // Apply filters at the persistence layer for better performance
    let filteredTickets = tickets

    // Filter by status
    if (filters.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === filters.status)
    }

    // Filter by priority
    if (filters.priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === filters.priority)
    }

    // Filter by type
    if (filters.type) {
      filteredTickets = filteredTickets.filter(ticket => ticket.type === filters.type)
    }

    // Apply limit and offset
    if (filters.offset && filters.offset > 0) {
      filteredTickets = filteredTickets.slice(filters.offset)
    }

    if (filters.limit && filters.limit > 0) {
      filteredTickets = filteredTickets.slice(0, filters.limit)
    }

    // Convert filtered persistence objects to domain objects
    return TicketMapper.toDomainList(filteredTickets)
  }

  async searchTickets(criteria: TicketSearchCriteria): Promise<Ticket[]> {
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

    // Apply limit and offset
    if (criteria.offset && criteria.offset > 0) {
      filteredTickets = filteredTickets.slice(criteria.offset)
    }

    if (criteria.limit && criteria.limit > 0) {
      filteredTickets = filteredTickets.slice(0, criteria.limit)
    }

    // Convert filtered persistence objects to domain objects
    return TicketMapper.toDomainList(filteredTickets)
  }

  async delete(id: TicketId): Promise<void> {
    await this.withFileLock(async () => {
      const tickets = await this.loadTicketsFromFile()
      const filteredTickets = tickets.filter(t => t.id !== id.value)

      if (filteredTickets.length === tickets.length) {
        throw new TicketNotFoundError(`Ticket not found: ${id.value}`, id.value)
      }

      await this.saveTicketsToFile(filteredTickets)
    })
  }

  private async withFileLock<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await operation()
    } finally {
      this.release()
    }
  }

  private acquire(): Promise<void> {
    if (!this.isLocked) {
      this.isLocked = true
      return Promise.resolve()
    }

    return new Promise(resolve => {
      this.waiting.push(resolve)
    })
  }

  private release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()
      if (next) {
        next()
      }
    } else {
      this.isLocked = false
    }
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
      throw new StorageError(
        `Failed to read file: ${this.filePath}`,
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
      throw new StorageError(
        `Failed to write file: ${this.filePath}`,
        error instanceof Error ? error : undefined
      )
    }
  }
}
