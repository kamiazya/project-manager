import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api'
import type { TicketQueryCriteria, TicketRepository } from '@project-manager/application'
import { ConfigurationError } from '@project-manager/base'
import type { Logger } from '@project-manager/base/common/logging'
import { Ticket, type TicketId } from '@project-manager/domain'
import type { TicketJSON } from '../types/persistence-types.ts'
import * as TicketMapper from './mappers/ticket-mapper.ts'

/**
 * DuckDB implementation of the TicketRepository
 * Uses DuckDB for efficient querying and ACID compliance
 */
export class DuckDbTicketRepository implements TicketRepository {
  private connection: DuckDBConnection | null = null
  private instance: DuckDBInstance | null = null
  private initialized = false
  private initializationPromise: Promise<void> | null = null
  private readonly logger: Logger
  private readonly dataPath: string

  constructor(dataPath: string, logger: Logger) {
    this.dataPath = dataPath
    this.logger = logger
  }

  /**
   * Initialize the DuckDB connection and create tables if necessary
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure directory exists
      const dir = dirname(this.dataPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      // For file-based database, create instance with config
      // For in-memory database, use default instance
      if (this.dataPath === ':memory:') {
        this.connection = await DuckDBConnection.create()
      } else {
        // Create instance with database file
        this.instance = await DuckDBInstance.create(this.dataPath)
        this.connection = await this.instance.connect()
      }

      // Create tickets table if not exists with more robust handling
      await this.connection.run(`
        CREATE TABLE IF NOT EXISTS tickets (
          id VARCHAR PRIMARY KEY,
          title VARCHAR NOT NULL,
          description VARCHAR,
          status VARCHAR NOT NULL,
          priority VARCHAR NOT NULL,
          type VARCHAR NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `)

      this.initialized = true
    } catch (error) {
      // Reset state if initialization fails
      this.initialized = false
      this.connection = null
      this.instance = null
      throw error
    }
  }

  /**
   * Get the connection, initializing if necessary
   */
  private async getConnection(): Promise<DuckDBConnection> {
    if (!this.initialized) {
      // Ensure only one initialization happens at a time
      if (!this.initializationPromise) {
        this.initializationPromise = this.initialize()
      }
      await this.initializationPromise
    }
    if (!this.connection) {
      throw new ConfigurationError('DuckDB connection not initialized', 'connection')
    }
    return this.connection
  }

  /**
   * Save a ticket to the database
   */
  async save(ticket: Ticket): Promise<void> {
    const connection = await this.getConnection()
    const data = TicketMapper.toPersistence(ticket)

    // Use parameterized queries to prevent SQL injection
    await connection.run(
      `INSERT INTO tickets (id, title, description, status, priority, type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         type = EXCLUDED.type,
         updated_at = EXCLUDED.updated_at`,
      [
        data.id,
        data.title,
        data.description || null,
        data.status,
        data.priority,
        data.type,
        data.createdAt,
        data.updatedAt,
      ]
    )
  }

  /**
   * Find a ticket by its ID
   */
  async findById(id: TicketId): Promise<Ticket | null> {
    const connection = await this.getConnection()

    // Use parameterized query to prevent SQL injection
    const result = await connection.runAndReadAll('SELECT * FROM tickets WHERE id = $1', [id.value])

    const rows = result.getRowObjects()
    if (!rows || rows.length === 0) {
      return null
    }

    const row = rows[0] as any
    const ticketData: TicketJSON = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      type: row.type,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }

    return TicketMapper.toDomain(ticketData)
  }

  /**
   * Query tickets based on criteria
   */
  async queryTickets(criteria: TicketQueryCriteria): Promise<Ticket[]> {
    const connection = await this.getConnection()

    // Build query with parameterized placeholders
    const queryParts: string[] = ['SELECT * FROM tickets WHERE 1=1']
    const params: any[] = []

    // Helper function to get next parameter placeholder
    const getNextParam = () => `$${params.length + 1}`

    // Add filters with parameterized queries
    if (criteria.status) {
      queryParts.push(`AND status = ${getNextParam()}`)
      params.push(criteria.status)
    }

    if (criteria.priority) {
      queryParts.push(`AND priority = ${getNextParam()}`)
      params.push(criteria.priority)
    }

    if (criteria.type) {
      queryParts.push(`AND type = ${getNextParam()}`)
      params.push(criteria.type)
    }

    // Add search with parameterized queries
    if (criteria.search) {
      // Use provided searchIn fields, or default to both title and description
      const searchFields =
        criteria.searchIn && criteria.searchIn.length > 0
          ? criteria.searchIn
          : ['title', 'description']

      const searchConditions: string[] = []
      searchFields.forEach(field => {
        if (field === 'title' || field === 'description') {
          searchConditions.push(`${field} ILIKE ${getNextParam()}`)
          params.push(`%${criteria.search}%`)
        }
      })

      if (searchConditions.length > 0) {
        queryParts.push(`AND (${searchConditions.join(' OR ')})`)
      }
    }

    // Add ordering
    queryParts.push('ORDER BY updated_at DESC')

    // Add limit and offset
    if (criteria.limit) {
      queryParts.push(`LIMIT ${getNextParam()}`)
      params.push(criteria.limit)
    }

    if (criteria.offset) {
      queryParts.push(`OFFSET ${getNextParam()}`)
      params.push(criteria.offset)
    }

    const query = queryParts.join(' ')

    // Use parameterized query to prevent SQL injection
    const result = await connection.runAndReadAll(query, params)

    const rows = result.getRowObjects() as any[]

    // Convert rows to TicketJSON format
    const ticketJsonList = rows.map(row => {
      const ticketData: TicketJSON = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        type: row.type,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      }
      return ticketData
    })

    // Convert filtered persistence objects to domain objects with logger
    return TicketMapper.toDomainList(ticketJsonList, this.logger)
  }

  /**
   * Delete a ticket by its ID
   */
  async delete(id: TicketId): Promise<void> {
    const connection = await this.getConnection()

    // Use parameterized query to prevent SQL injection
    await connection.run('DELETE FROM tickets WHERE id = $1', [id.value])
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      // DuckDBConnection doesn't have a close method, connections auto-disconnect
      this.connection = null
    }
    if (this.instance) {
      // DuckDBInstance also doesn't have a close method, cleanup is automatic
      this.instance = null
    }
    this.initialized = false
    this.initializationPromise = null
  }
}
