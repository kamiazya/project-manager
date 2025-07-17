/**
 * MCP server-specific ticket repository implementation
 * This implements the TicketRepository interface for MCP server usage
 * Following Clean Architecture principles
 */

import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { TicketRepository, TicketStatistics } from '@project-manager/application'
import { Ticket, TicketId, type TicketPrivacy } from '@project-manager/domain'

/**
 * JSON representation of a ticket for persistence
 */
interface TicketJSON {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'archived'
  priority: 'high' | 'medium' | 'low'
  type: 'feature' | 'bug' | 'task'
  privacy: TicketPrivacy
  createdAt: string
  updatedAt: string
}

/**
 * MCP server-specific implementation of TicketRepository
 * Stores tickets in JSON format on the local filesystem
 */
export class McpTicketRepository implements TicketRepository {
  private readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async save(ticket: Ticket): Promise<void> {
    const tickets = await this.loadTickets()
    const ticketJson = this.ticketToJson(ticket)

    const existingIndex = tickets.findIndex(t => t.id === ticketJson.id)
    if (existingIndex >= 0) {
      tickets[existingIndex] = ticketJson
    } else {
      tickets.push(ticketJson)
    }

    await this.saveTickets(tickets)
  }

  async findById(id: TicketId): Promise<Ticket | null> {
    const tickets = await this.loadTickets()
    const ticketJson = tickets.find(t => t.id === id.value)
    return ticketJson ? this.jsonToTicket(ticketJson) : null
  }

  async findAll(): Promise<Ticket[]> {
    const tickets = await this.loadTickets()
    return tickets.map(json => this.jsonToTicket(json))
  }

  async delete(id: TicketId): Promise<void> {
    const tickets = await this.loadTickets()
    const filteredTickets = tickets.filter(t => t.id !== id.value)
    await this.saveTickets(filteredTickets)
  }

  async getStatistics(): Promise<TicketStatistics> {
    const tickets = await this.loadTickets()

    const stats: TicketStatistics = {
      total: tickets.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      byType: { feature: 0, bug: 0, task: 0 },
    }

    for (const ticket of tickets) {
      // Count by status
      switch (ticket.status) {
        case 'pending':
          stats.pending++
          break
        case 'in_progress':
          stats.inProgress++
          break
        case 'completed':
          stats.completed++
          break
        case 'archived':
          stats.archived++
          break
      }

      // Count by priority
      stats.byPriority[ticket.priority]++

      // Count by type
      stats.byType[ticket.type]++
    }

    return stats
  }

  private async loadTickets(): Promise<TicketJSON[]> {
    try {
      await access(this.filePath, constants.F_OK)
      const data = await readFile(this.filePath, 'utf-8')
      return JSON.parse(data) as TicketJSON[]
    } catch (error) {
      // File doesn't exist or is corrupt, return empty array
      return []
    }
  }

  private async saveTickets(tickets: TicketJSON[]): Promise<void> {
    // Ensure directory exists
    const dir = dirname(this.filePath)
    await mkdir(dir, { recursive: true })

    // Write tickets to file
    await writeFile(this.filePath, JSON.stringify(tickets, null, 2), 'utf-8')
  }

  private ticketToJson(ticket: Ticket): TicketJSON {
    return {
      id: ticket.id.value,
      title: ticket.title.value,
      description: ticket.description.value,
      status: ticket.status.value,
      priority: ticket.priority.value,
      type: ticket.type,
      privacy: ticket.privacy,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    }
  }

  private jsonToTicket(json: TicketJSON): Ticket {
    return Ticket.reconstitute({
      id: json.id,
      title: json.title,
      description: json.description,
      status: json.status,
      priority: json.priority,
      type: json.type,
      privacy: json.privacy,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    })
  }
}
